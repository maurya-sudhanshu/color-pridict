import { requireAdmin } from "@/lib/auth";
import { GameCategory, getCurrentOrNewRound, NUMBER_COLOR_MAP, ResultStrategy, settleRound, simulatePoolPayouts } from "@/lib/game-engine";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req, "VIEW");
    const { searchParams } = new URL(req.url);
    const categoryParam = (searchParams.get("category") || "3min") as GameCategory;
    const category: GameCategory = ["30s", "1min", "3min"].includes(categoryParam) ? categoryParam : "3min";

    const activeRound = await getCurrentOrNewRound(category);
    if (!activeRound) {
      return NextResponse.json({ error: "Active round not found" }, { status: 404 });
    }

    const bets = await prisma.bet.findMany({
      where: { roundId: activeRound.id, status: "PENDING" },
    });

    const simulation = simulatePoolPayouts(bets);

    return NextResponse.json({
      category,
      roundNumber: activeRound.roundNumber,
      totalBetsCount: bets.length,
      ...simulation,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Forbidden" }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, "CREATE");
    const body = await req.json().catch(() => ({}));
    const category: GameCategory = body.category || "3min";
    const strategy: ResultStrategy = body.strategy || "FAIR_RNG";
    const forcedNumber: number | undefined = typeof body.forcedNumber === "number" ? body.forcedNumber : undefined;

    const activeRound = await getCurrentOrNewRound(category);
    if (!activeRound) {
      return NextResponse.json({ error: "Active round not found" }, { status: 404 });
    }

    // If admin requested a forced manual winning number (0-9)
    if (forcedNumber !== undefined && forcedNumber >= 0 && forcedNumber <= 9) {
      const mapping = NUMBER_COLOR_MAP[forcedNumber];

      // Create result explicitly with forced number & color
      await prisma.gameResult.create({
        data: {
          roundId: activeRound.id,
          number: forcedNumber,
          color: mapping.primaryColor,
        },
      });
    }

    // 1. Close current round
    await prisma.gameRound.update({
      where: { id: activeRound.id },
      data: { status: "CLOSED" },
    });

    // 2. Settle round using strategy or pre-generated forced result
    const settledRound = await settleRound(activeRound.id, strategy);

    // 3. Log audit action
    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: `MANUAL_ROUND_ADVANCE_${category}_${forcedNumber !== undefined ? "FORCED_NUM_" + forcedNumber : strategy}`,
        details: `Manually advanced ${category} round #${activeRound.roundNumber} using ${
          forcedNumber !== undefined ? "forced number " + forcedNumber : "strategy '" + strategy + "'"
        }. Outcome: Number ${settledRound?.result?.number} (${settledRound?.result?.color})`,
      },
    });

    // 4. Create new round immediately for category
    const newRound = await getCurrentOrNewRound(category, "FAIR_RNG");

    return NextResponse.json({
      success: true,
      category,
      strategyUsed: forcedNumber !== undefined ? `MANUAL_OVERRIDE_${forcedNumber}` : strategy,
      settledRound,
      newRound,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to advance round" }, { status: 400 });
  }
}
