import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req, "VIEW");

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const trendStart = new Date(today);
    trendStart.setUTCDate(trendStart.getUTCDate() - 6);

    const [
      totalUsers,
      pendingDepositsCount,
      pendingWithdrawalsCount,
      totalBetsCount,
      approvedDepositsSum,
      approvedWithdrawalsSum,
      betsRevenueSum,
      userPayoutsSum,
      activeRound,
      activeSessionsCount,
      todayDeposits,
      todayWithdrawals,
      roundsSettledToday,
      todayBets,
      todayPayouts,
      recentActivity,
      depositTrend,
      withdrawalTrend,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "USER" } }),
      prisma.deposit.count({ where: { status: "PENDING" } }),
      prisma.withdrawal.count({ where: { status: "PENDING" } }),
      prisma.bet.count(),
      prisma.deposit.aggregate({ where: { status: "APPROVED" }, _sum: { amount: true } }),
      prisma.withdrawal.aggregate({ where: { status: "APPROVED" }, _sum: { amount: true } }),
      prisma.bet.aggregate({ _sum: { amount: true } }),
      prisma.bet.aggregate({ where: { status: "WON" }, _sum: { payoutAmount: true } }),
      prisma.gameRound.findFirst({ where: { status: "ACTIVE" }, orderBy: { roundNumber: "desc" } }),
      prisma.userSession.count({ where: { isActive: true } }),
      prisma.deposit.aggregate({
        where: { createdAt: { gte: today }, status: "APPROVED" },
        _sum: { amount: true },
      }),
      prisma.withdrawal.aggregate({
        where: { createdAt: { gte: today }, status: "APPROVED" },
        _sum: { amount: true },
      }),
      prisma.gameResult.count({ where: { generatedAt: { gte: today } } }),
      prisma.bet.aggregate({ where: { createdAt: { gte: today } }, _sum: { amount: true } }),
      prisma.bet.aggregate({
        where: { createdAt: { gte: today }, status: "WON" },
        _sum: { payoutAmount: true },
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { admin: { select: { email: true } } },
      }),
      prisma.deposit.findMany({
        where: { createdAt: { gte: trendStart }, status: "APPROVED" },
        select: { amount: true, createdAt: true },
      }),
      prisma.withdrawal.findMany({
        where: { createdAt: { gte: trendStart }, status: "APPROVED" },
        select: { amount: true, createdAt: true },
      }),
    ]);

    const totalBetsAmount = betsRevenueSum._sum.amount || 0.0;
    const totalUserPayouts = userPayoutsSum._sum.payoutAmount || 0.0;
    const houseNetProfit = totalBetsAmount - totalUserPayouts;
    const profitMargin = totalBetsAmount > 0 ? (houseNetProfit / totalBetsAmount) * 100 : 0.0;

    const totalDepositsAmount = approvedDepositsSum._sum.amount || 0.0;
    const totalWithdrawalsAmount = approvedWithdrawalsSum._sum.amount || 0.0;
    const netCashflow = totalDepositsAmount - totalWithdrawalsAmount;

    const dailyAmounts = (items: { amount: number; createdAt: Date }[]) =>
      Array.from({ length: 7 }, (_, index) => {
        const date = new Date(trendStart);
        date.setUTCDate(date.getUTCDate() + index);
        const nextDate = new Date(date);
        nextDate.setUTCDate(nextDate.getUTCDate() + 1);
        return {
          date: date.toISOString().slice(0, 10),
          amount: items
            .filter((item) => item.createdAt >= date && item.createdAt < nextDate)
            .reduce((sum, item) => sum + item.amount, 0),
        };
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
        activeSessionsCount,
        todayDepositAmount: todayDeposits._sum.amount || 0,
        todayWithdrawalAmount: todayWithdrawals._sum.amount || 0,
        roundsSettledToday,
        todayHouseNetProfit: (todayBets._sum.amount || 0) - (todayPayouts._sum.payoutAmount || 0),
        recentActivity,
        depositTrend: dailyAmounts(depositTrend),
        withdrawalTrend: dailyAmounts(withdrawalTrend),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Forbidden" }, { status: 403 });
  }
}
