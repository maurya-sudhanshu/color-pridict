import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const withdrawSchema = z.object({
  amount: z.number().min(200, "Minimum withdrawal is ₹200"),
  bankName: z.string().min(2),
  accountNumber: z.string().min(6),
  ifscCode: z.string().min(4),
  holderName: z.string().min(2),
});

const cancelWithdrawSchema = z.object({
  withdrawalId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const parsed = withdrawSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId: user.id },
      });

      if (!wallet || wallet.balance < parsed.amount) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      // 1. Immediately HOLD / Deduct requested amount from user's wallet balance
      const updatedWallet = await tx.wallet.update({
        where: { userId: user.id },
        data: {
          balance: { decrement: parsed.amount },
        },
      });

      // 2. Find or create bank account
      let bankAcc = await tx.bankAccount.findFirst({
        where: { userId: user.id, accountNumber: parsed.accountNumber },
      });

      if (!bankAcc) {
        bankAcc = await tx.bankAccount.create({
          data: {
            userId: user.id,
            bankName: parsed.bankName,
            accountNumber: parsed.accountNumber,
            ifscCode: parsed.ifscCode,
            holderName: parsed.holderName,
            isVerified: true,
          },
        });
      }

      // 3. Create PENDING withdrawal entry
      const withdrawal = await tx.withdrawal.create({
        data: {
          userId: user.id,
          sessionId: user.currentSessionId || null,
          bankAccountId: bankAcc.id,
          amount: parsed.amount,
          status: "PENDING",
        },
      });

      // 4. Log transaction record for held amount
      await tx.transaction.create({
        data: {
          userId: user.id,
          sessionId: user.currentSessionId || null,
          type: "WITHDRAWAL_REQUEST",
          amount: -parsed.amount,
          balanceAfter: updatedWallet.balance,
          referenceId: withdrawal.id,
        },
      });

      return { withdrawal, newBalance: updatedWallet.balance };
    });

    return NextResponse.json({ success: true, withdrawal: result.withdrawal, newBalance: result.newBalance });
  } catch (error: any) {
    if (error.message === "INSUFFICIENT_BALANCE") {
      return NextResponse.json({ error: "Insufficient wallet balance for withdrawal" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Failed to process withdrawal" }, { status: 400 });
  }
}

/**
 * Cancel PENDING withdrawal request using Atomic Conditional Lock.
 * Solves race condition: If Admin approves/rejects at the same millisecond, only ONE transaction succeeds!
 */
export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const parsed = cancelWithdrawSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      // Fetch withdrawal record to verify amount & owner
      const withdrawal = await tx.withdrawal.findFirst({
        where: { id: parsed.withdrawalId, userId: user.id },
      });

      if (!withdrawal) {
        throw new Error("Withdrawal request not found");
      }

      // ATOMIC CONDITIONAL UPDATE: Lock row ONLY IF status is still PENDING
      const updateResult = await tx.withdrawal.updateMany({
        where: {
          id: withdrawal.id,
          userId: user.id,
          status: "PENDING", // Strict atomic condition
        },
        data: {
          status: "CANCELLED",
        },
      });

      // If count is 0, Admin already approved/rejected this request simultaneously!
      if (updateResult.count === 0) {
        throw new Error("Withdrawal request was already processed or approved by Admin.");
      }

      // 2. Automatically REFUND held amount back to user wallet balance
      const updatedWallet = await tx.wallet.update({
        where: { userId: user.id },
        data: {
          balance: { increment: withdrawal.amount },
        },
      });

      // 3. Log refund transaction record
      await tx.transaction.create({
        data: {
          userId: user.id,
          sessionId: user.currentSessionId || null,
          type: "WITHDRAWAL_CANCELLED",
          amount: withdrawal.amount,
          balanceAfter: updatedWallet.balance,
          referenceId: withdrawal.id,
        },
      });

      return { amount: withdrawal.amount, newBalance: updatedWallet.balance };
    });

    return NextResponse.json({
      success: true,
      message: `Withdrawal request cancelled. ₹${result.amount} refunded to your wallet!`,
      newBalance: result.newBalance,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to cancel withdrawal" }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const withdrawals = await prisma.withdrawal.findMany({
      where: { userId: user.id },
      include: { bankAccount: true },
      orderBy: { createdAt: "desc" },
    });

    const bankAccounts = await prisma.bankAccount.findMany({
      where: { userId: user.id },
    });

    return NextResponse.json({ withdrawals, bankAccounts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status: 401 });
  }
}
