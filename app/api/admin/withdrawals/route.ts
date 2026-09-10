import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateWithdrawalSchema = z.object({
  withdrawalId: z.string(),
  status: z.enum(["APPROVED", "REJECTED"]),
  rejectReason: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req, "VIEW");

    const withdrawals = await prisma.withdrawal.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, email: true, phone: true } },
        bankAccount: true,
      },
    });

    return NextResponse.json({ withdrawals });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Forbidden" }, { status: 403 });
  }
}

/**
 * Process Admin Approval/Rejection with Atomic Conditional Lock.
 * Solves race condition: If User cancels at the exact same millisecond, only ONE transaction succeeds!
 */
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, "UPDATE");
    const body = await req.json();
    const parsed = updateWithdrawalSchema.parse(body);

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: parsed.withdrawalId },
    });

    if (!withdrawal) {
      return NextResponse.json({ error: "Withdrawal request not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // ATOMIC CONDITIONAL UPDATE: Lock row ONLY IF status is still PENDING
      const updateResult = await tx.withdrawal.updateMany({
        where: {
          id: withdrawal.id,
          status: "PENDING", // Strict atomic condition
        },
        data: {
          status: parsed.status,
          rejectReason: parsed.rejectReason || null,
        },
      });

      // If count is 0, User already cancelled this withdrawal request simultaneously!
      if (updateResult.count === 0) {
        throw new Error("Withdrawal request was already cancelled by the user or processed.");
      }

      // 2. If REJECTED, refund held amount back to user's wallet balance
      if (parsed.status === "REJECTED") {
        const updatedWallet = await tx.wallet.update({
          where: { userId: withdrawal.userId },
          data: {
            balance: { increment: withdrawal.amount },
          },
        });

        await tx.transaction.create({
          data: {
            userId: withdrawal.userId,
            type: "WITHDRAWAL_REJECTED",
            amount: withdrawal.amount,
            balanceAfter: updatedWallet.balance,
            referenceId: withdrawal.id,
          },
        });
      }

      // 3. Create Audit Log
      await tx.auditLog.create({
        data: {
          adminId: admin.id,
          action: `WITHDRAWAL_${parsed.status}`,
          details: `Processed withdrawal #${withdrawal.id} of ₹${withdrawal.amount} for user ${withdrawal.userId}`,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update withdrawal" }, { status: 400 });
  }
}
