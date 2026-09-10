import { requireAuth } from "@/lib/auth";
import { CATEGORY_CONFIG, GameCategory, getCurrentOrNewRound } from "@/lib/game-engine";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const betSchema = z.object({
  category: z.enum(["30s", "1min", "3min"]).optional(),
  betType: z.enum(["NUMBER", "COLOR"]),
  selection: z.string(),
  amount: z.number().min(10, "Minimum bet amount is ₹10"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const parsed = betSchema.parse(body);
    const category: GameCategory = parsed.category || "3min";

    const config = CATEGORY_CONFIG[category];

    if (parsed.betType === "NUMBER") {
      const num = parseInt(parsed.selection, 10);
      if (isNaN(num) || num < 0 || num > 9) {
        return NextResponse.json({ error: "Invalid number selection (0-9)" }, { status: 400 });
      }
    } else if (parsed.betType === "COLOR") {
      const col = parsed.selection.toUpperCase();
      if (!["RED", "GREEN", "VIOLET"].includes(col)) {
        return NextResponse.json({ error: "Invalid color selection" }, { status: 400 });
      }
    }

    const activeRound = await getCurrentOrNewRound(category);
    if (!activeRound) {
      return NextResponse.json({ error: "Active round unavailable" }, { status: 400 });
    }

    const now = new Date();
    const lockTime = new Date(new Date(activeRound.closesAt).getTime() - config.lockSeconds * 1000);
    if (now >= lockTime) {
      return NextResponse.json(
        { error: `Betting locked for this ${config.name} round. Please wait for the next round.` },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId: user.id },
      });

      if (!wallet || wallet.balance < parsed.amount) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      const updatedWallet = await tx.wallet.update({
        where: { userId: user.id },
        data: { balance: wallet.balance - parsed.amount },
      });

      const bet = await tx.bet.create({
        data: {
          userId: user.id,
          sessionId: user.currentSessionId || null,
          roundId: activeRound.id,
          betType: parsed.betType,
          selection: parsed.selection,
          amount: parsed.amount,
          status: "PENDING",
        },
      });

      await tx.transaction.create({
        data: {
          userId: user.id,
          sessionId: user.currentSessionId || null,
          type: "BET_PLACED",
          amount: -parsed.amount,
          balanceAfter: updatedWallet.balance,
          referenceId: bet.id,
        },
      });

      return { bet, newBalance: updatedWallet.balance };
    });

    return NextResponse.json({
      success: true,
      bet: result.bet,
      newBalance: result.newBalance,
    });
  } catch (error: any) {
    if (error.message === "INSUFFICIENT_BALANCE") {
      return NextResponse.json({ error: "Insufficient wallet balance" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Failed to place bet" }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const categoryParam = searchParams.get("category");
    const sessionFilter = searchParams.get("session");

    const whereClause: any = { userId: user.id };
    if (categoryParam && ["30s", "1min", "3min"].includes(categoryParam)) {
      whereClause.round = { category: categoryParam };
    }
    if (sessionFilter === "current" && user.currentSessionId) {
      whereClause.sessionId = user.currentSessionId;
    }

    const bets = await prisma.bet.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        round: {
          include: { result: true },
        },
      },
    });

    return NextResponse.json({ bets });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status: 401 });
  }
}
