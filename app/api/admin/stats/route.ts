import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const totalUsers = await prisma.user.count({ where: { role: "USER" } });
    const pendingDepositsCount = await prisma.deposit.count({ where: { status: "PENDING" } });
    const pendingWithdrawalsCount = await prisma.withdrawal.count({ where: { status: "PENDING" } });
    const totalBetsCount = await prisma.bet.count();

    const approvedDepositsSum = await prisma.deposit.aggregate({
      where: { status: "APPROVED" },
      _sum: { amount: true },
    });

    const approvedWithdrawalsSum = await prisma.withdrawal.aggregate({
      where: { status: "APPROVED" },
      _sum: { amount: true },
    });

    // Compute Total Bets Revenue vs Total User Winnings Payouts
    const betsRevenueSum = await prisma.bet.aggregate({
      _sum: { amount: true },
    });

    const userPayoutsSum = await prisma.bet.aggregate({
      where: { status: "WON" },
      _sum: { payoutAmount: true },
    });

    const totalBetsAmount = betsRevenueSum._sum.amount || 0.0;
    const totalUserPayouts = userPayoutsSum._sum.payoutAmount || 0.0;
    const houseNetProfit = totalBetsAmount - totalUserPayouts;
    const profitMargin = totalBetsAmount > 0 ? (houseNetProfit / totalBetsAmount) * 100 : 0.0;

    const totalDepositsAmount = approvedDepositsSum._sum.amount || 0.0;
    const totalWithdrawalsAmount = approvedWithdrawalsSum._sum.amount || 0.0;
    const netCashflow = totalDepositsAmount - totalWithdrawalsAmount;

    const activeRound = await prisma.gameRound.findFirst({
      where: { status: "ACTIVE" },
      orderBy: { roundNumber: "desc" },
    });

    return NextResponse.json({
      stats: {
        totalUsers,
        pendingDepositsCount,
        pendingWithdrawalsCount,
        totalBetsCount,
        totalDepositAmount: totalDepositsAmount,
        totalWithdrawalAmount: totalWithdrawalsAmount,
        netCashflow,
        totalBetsAmount,
        totalUserPayouts,
        houseNetProfit,
        profitMargin,
        activeRoundNumber: activeRound?.roundNumber || 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Forbidden" }, { status: 403 });
  }
}
