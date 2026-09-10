import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateDepositSchema = z.object({
  depositId: z.string(),
  status: z.enum(["APPROVED", "REJECTED"]),
  rejectReason: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req, "VIEW");

    const deposits = await prisma.deposit.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, email: true, phone: true },
        },
      },
    });

    return NextResponse.json({ deposits });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Forbidden" }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, "UPDATE");
    const body = await req.json();
    const parsed = updateDepositSchema.parse(body);

    const deposit = await prisma.deposit.findUnique({
      where: { id: parsed.depositId },
    });

    if (!deposit) {
      return NextResponse.json({ error: "Deposit request not found" }, { status: 404 });
    }

    if (deposit.status !== "PENDING") {
      return NextResponse.json({ error: "Deposit already processed" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.deposit.update({
        where: { id: deposit.id },
        data: {
          status: parsed.status,
          rejectReason: parsed.rejectReason || null,
        },
      });

      if (parsed.status === "APPROVED") {
        const wallet = await tx.wallet.update({
          where: { userId: deposit.userId },
          data: {
            balance: { increment: deposit.amount },
          },
        });

        await tx.transaction.create({
          data: {
            userId: deposit.userId,
            type: "DEPOSIT",
            amount: deposit.amount,
            balanceAfter: wallet.balance,
            referenceId: deposit.id,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          adminId: admin.id,
          action: `DEPOSIT_${parsed.status}`,
          details: `Processed deposit #${deposit.id} of ₹${deposit.amount} for user ${deposit.userId}`,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update deposit" }, { status: 400 });
  }
}
