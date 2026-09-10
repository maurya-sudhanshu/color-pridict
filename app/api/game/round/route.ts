import { CATEGORY_CONFIG, GameCategory, getCurrentOrNewRound } from "@/lib/game-engine";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryParam = (searchParams.get("category") || "3min") as GameCategory;
    const category: GameCategory = ["30s", "1min", "3min"].includes(categoryParam) ? categoryParam : "3min";

    const config = CATEGORY_CONFIG[category];
    const activeRound = await getCurrentOrNewRound(category);

    if (!activeRound) {
      return NextResponse.json({ error: "Active round unavailable" }, { status: 404 });
    }

    const now = new Date();
    const closesAtDate = activeRound.closesAt ? new Date(activeRound.closesAt) : new Date(now.getTime() + config.durationSeconds * 1000);
    
    const remainingSeconds = Math.max(
      0,
      Math.floor((closesAtDate.getTime() - now.getTime()) / 1000)
    );

    const recentResults = await prisma.gameRound.findMany({
      where: { category, status: "COMPLETED", result: { isNot: null } },
      orderBy: { roundNumber: "desc" },
      take: 25,
      include: { result: true },
    });

    return NextResponse.json({
      category,
      categoryName: config.name,
      durationSeconds: config.durationSeconds,
      fitLockSeconds: config.lockSeconds,
      round: {
        id: activeRound.id,
        category: activeRound.category,
        roundNumber: activeRound.roundNumber,
        sessionIndex: activeRound.sessionIndex,
        day: activeRound.day,
        dayOfWeek: activeRound.dayOfWeek,
        dayOfWeekNumber: activeRound.dayOfWeekNumber,
        weekOfYear: activeRound.weekOfYear,
        month: activeRound.month,
        monthName: activeRound.monthName,
        year: activeRound.year,
        startsAt: activeRound.startsAt,
        closesAt: closesAtDate.toISOString(),
        status: activeRound.status,
        remainingSeconds,
      },
      recentResults: recentResults.map((r) => ({
        id: r.id,
        roundNumber: r.roundNumber,
        sessionIndex: r.sessionIndex,
        day: r.day,
        dayOfWeek: r.dayOfWeek,
        dayOfWeekNumber: r.dayOfWeekNumber,
        weekOfYear: r.weekOfYear,
        month: r.month,
        monthName: r.monthName,
        year: r.year,
        number: r.result?.number,
        color: r.result?.color,
        generatedAt: r.result?.generatedAt,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch round" }, { status: 500 });
  }
}
