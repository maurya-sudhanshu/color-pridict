import crypto from "crypto";
import { prisma } from "./prisma";

export interface ColorMapping {
  number: number;
  primaryColor: "RED" | "GREEN" | "VIOLET";
  secondaryColor?: "RED" | "GREEN";
}

export const NUMBER_COLOR_MAP: Record<number, ColorMapping> = {
  0: { number: 0, primaryColor: "VIOLET", secondaryColor: "RED" },
  1: { number: 1, primaryColor: "GREEN" },
  2: { number: 2, primaryColor: "RED" },
  3: { number: 3, primaryColor: "GREEN" },
  4: { number: 4, primaryColor: "RED" },
  5: { number: 5, primaryColor: "VIOLET", secondaryColor: "GREEN" },
  6: { number: 6, primaryColor: "RED" },
  7: { number: 7, primaryColor: "GREEN" },
  8: { number: 8, primaryColor: "RED" },
  9: { number: 9, primaryColor: "GREEN" },
};

export type GameCategory = "30s" | "1min" | "3min";
export type ResultStrategy = "FAIR_RNG" | "LOWEST_WINNING_PAYOUT" | "MAX_HOUSE_PROFIT";

export const CATEGORY_CONFIG: Record<
  GameCategory,
  { durationSeconds: number; lockSeconds: number; initialRoundOffset: number; name: string }
> = {
  "30s": { durationSeconds: 30, lockSeconds: 5, initialRoundOffset: 300000, name: "30s Parity" },
  "1min": { durationSeconds: 60, lockSeconds: 10, initialRoundOffset: 100000, name: "1-Min Sapre" },
  "3min": { durationSeconds: 180, lockSeconds: 30, initialRoundOffset: 500000, name: "3-Min Bcone" },
};

export function getISOWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Universal Global Clock Synchronizer:
 * Calculates deterministic round number, session index, day, dayOfWeek, weekOfYear, month, and year.
 */
export function getDeterministicRoundInfo(category: GameCategory = "3min") {
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG["3min"];
  const durationMs = config.durationSeconds * 1000;
  const nowMs = Date.now();

  const currentIntervalIndex = Math.floor(nowMs / durationMs);
  const startsAtMs = currentIntervalIndex * durationMs;
  const closesAtMs = (currentIntervalIndex + 1) * durationMs;

  const startsAt = new Date(startsAtMs);
  const closesAt = new Date(closesAtMs);

  const year = startsAt.getFullYear();
  const month = startsAt.getMonth() + 1; // 1-12
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthName = monthNames[startsAt.getMonth()];
  const day = startsAt.getDate();

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayOfWeek = dayNames[startsAt.getDay()];
  const dayOfWeekNumber = startsAt.getDay() === 0 ? 7 : startsAt.getDay();
  const weekOfYear = getISOWeekNumber(startsAt);

  const startOfYear = new Date(year, 0, 1).getTime();
  const dayOfYear = Math.floor((startsAtMs - startOfYear) / 86400000) + 1;

  const midnightMs = new Date(year, startsAt.getMonth(), day).getTime();
  const sessionIndex = Math.floor((startsAtMs - midnightMs) / durationMs) + 1;

  const catMultiplier = category === "30s" ? 30000 : category === "1min" ? 10000 : 50000;

  // Max integer ~36,652,880, easily fits in MySQL INT max (2,147,483,647)
  const roundNumber = dayOfYear * 100000 + catMultiplier + sessionIndex;

  return {
    roundNumber,
    startsAt,
    closesAt,
    year,
    month,
    monthName,
    day,
    dayOfWeek,
    dayOfWeekNumber,
    weekOfYear,
    sessionIndex,
  };
}

/**
 * Generate an independent, non-manipulated random result (0-9).
 */
export function generateFairResult(): { number: number; color: string } {
  const randomNumber = crypto.randomInt(0, 10);
  const mapping = NUMBER_COLOR_MAP[randomNumber];
  return {
    number: randomNumber,
    color: mapping.primaryColor,
  };
}

/**
 * Calculate bet win/loss status and multiplier for a given winning number.
 */
export function evaluateBet(
  betType: string,
  selection: string,
  winningNumber: number,
  betAmount: number
): { isWin: boolean; multiplier: number; payoutAmount: number } {
  const mapping = NUMBER_COLOR_MAP[winningNumber];

  if (betType === "NUMBER") {
    const selectedNum = parseInt(selection, 10);
    if (selectedNum === winningNumber) {
      return { isWin: true, multiplier: 9.0, payoutAmount: betAmount * 9.0 };
    }
    return { isWin: false, multiplier: 0, payoutAmount: 0 };
  }

  if (betType === "COLOR") {
    const sel = selection.toUpperCase();
    if (sel === "VIOLET" && mapping.primaryColor === "VIOLET") {
      return { isWin: true, multiplier: 4.0, payoutAmount: betAmount * 4.0 };
    }
    if (sel === "GREEN" && (mapping.primaryColor === "GREEN" || mapping.secondaryColor === "GREEN")) {
      const mult = winningNumber === 5 ? 1.5 : 2.0;
      return { isWin: true, multiplier: mult, payoutAmount: betAmount * mult };
    }
    if (sel === "RED" && (mapping.primaryColor === "RED" || mapping.secondaryColor === "RED")) {
      const mult = winningNumber === 0 ? 1.5 : 2.0;
      return { isWin: true, multiplier: mult, payoutAmount: betAmount * mult };
    }
  }

  return { isWin: false, multiplier: 0, payoutAmount: 0 };
}

/**
 * Simulate expected user payouts across all numbers 0-9 for active bets.
 */
export function simulatePoolPayouts(bets: Array<{ betType: string; selection: string; amount: number }>) {
  const totalBetsAmount = bets.reduce((sum, b) => sum + b.amount, 0);

  const simulation = Array.from({ length: 10 }, (_, num) => {
    let totalUserPayout = 0;

    for (const bet of bets) {
      const res = evaluateBet(bet.betType, bet.selection, num, bet.amount);
      totalUserPayout += res.payoutAmount;
    }

    const houseProfit = totalBetsAmount - totalUserPayout;

    return {
      number: num,
      color: NUMBER_COLOR_MAP[num].primaryColor,
      totalUserPayout,
      houseProfit,
    };
  });

  return { totalBetsAmount, simulation };
}

/**
 * Generate game outcome according to chosen strategy (FAIR_RNG, LOWEST_WINNING_PAYOUT, MAX_HOUSE_PROFIT).
 */
export function generateResultByStrategy(
  bets: Array<{ betType: string; selection: string; amount: number }>,
  strategy: ResultStrategy = "FAIR_RNG"
): { number: number; color: string } {
  if (strategy === "FAIR_RNG" || bets.length === 0) {
    return generateFairResult();
  }

  const { simulation } = simulatePoolPayouts(bets);

  if (strategy === "LOWEST_WINNING_PAYOUT") {
    const winningCandidates = simulation.filter((s) => s.totalUserPayout > 0);

    if (winningCandidates.length > 0) {
      const minPayout = Math.min(...winningCandidates.map((c) => c.totalUserPayout));
      const bestCandidates = winningCandidates.filter((c) => c.totalUserPayout === minPayout);
      const selectedIndex = crypto.randomInt(0, bestCandidates.length);
      const chosen = bestCandidates[selectedIndex];
      return { number: chosen.number, color: chosen.color };
    }
    return generateFairResult();
  }

  if (strategy === "MAX_HOUSE_PROFIT") {
    const minPayout = Math.min(...simulation.map((s) => s.totalUserPayout));
    const bestCandidates = simulation.filter((s) => s.totalUserPayout === minPayout);
    const selectedIndex = crypto.randomInt(0, bestCandidates.length);
    const chosen = bestCandidates[selectedIndex];
    return { number: chosen.number, color: chosen.color };
  }

  return generateFairResult();
}

/**
 * Settle round results and execute user payouts atomically with Day of Week, Week of Year, Month & Session tagging.
 */
export async function settleRound(roundId: string, strategy: ResultStrategy = "FAIR_RNG") {
  const round = await prisma.gameRound.findUnique({
    where: { id: roundId },
    include: { result: true, bets: true },
  });

  if (!round) throw new Error("ROUND_NOT_FOUND");
  if (round.status === "COMPLETED") return round;

  let result = round.result;
  if (!result) {
    const roundInfo = getDeterministicRoundInfo(round.category as any);
    const outcome = generateResultByStrategy(round.bets, strategy);
    result = await prisma.gameResult.create({
      data: {
        roundId: round.id,
        number: outcome.number,
        color: outcome.color,
        sessionIndex: round.sessionIndex || roundInfo.sessionIndex,
        day: round.day || roundInfo.day,
        dayOfWeek: round.dayOfWeek || roundInfo.dayOfWeek,
        dayOfWeekNumber: round.dayOfWeekNumber || roundInfo.dayOfWeekNumber,
        weekOfYear: round.weekOfYear || roundInfo.weekOfYear,
        month: round.month || roundInfo.month,
        monthName: round.monthName || roundInfo.monthName,
        year: round.year || roundInfo.year,
      },
    });
  }

  const winningNumber = result.number;

  const pendingBets = await prisma.bet.findMany({
    where: { roundId: round.id, status: "PENDING" },
  });

  await prisma.$transaction(async (tx) => {
    for (const bet of pendingBets) {
      const { isWin, multiplier, payoutAmount } = evaluateBet(
        bet.betType,
        bet.selection,
        winningNumber,
        bet.amount
      );
      const status = isWin ? "WON" : "LOST";

      await tx.bet.update({
        where: { id: bet.id },
        data: {
          status,
          payoutMultiplier: multiplier,
          payoutAmount,
        },
      });

      if (isWin && payoutAmount > 0) {
        const wallet = await tx.wallet.update({
          where: { userId: bet.userId },
          data: {
            balance: { increment: payoutAmount },
          },
        });

        await tx.transaction.create({
          data: {
            userId: bet.userId,
            sessionId: bet.sessionId || null,
            type: "BET_WON",
            amount: payoutAmount,
            balanceAfter: wallet.balance,
            referenceId: bet.id,
          },
        });
      }
    }

    await tx.gameRound.update({
      where: { id: round.id },
      data: {
        status: "COMPLETED",
        resultId: result!.id,
      },
    });
  });

  return prisma.gameRound.findUnique({
    where: { id: round.id },
    include: { result: true },
  });
}

/**
 * Global Clock Synchronized Round Provider:
 * Guarantees that activeRound is NEVER null and ALWAYS returns valid closesAt with Day of Week, Week of Year, Month & Session Index.
 */
export async function getCurrentOrNewRound(
  category: GameCategory = "3min",
  strategy: ResultStrategy = "FAIR_RNG"
) {
  const {
    roundNumber,
    startsAt,
    closesAt,
    year,
    month,
    monthName,
    day,
    dayOfWeek,
    dayOfWeekNumber,
    weekOfYear,
    sessionIndex,
  } = getDeterministicRoundInfo(category);

  // 1. Auto-settle any older expired active rounds for this category
  try {
    const expiredRounds = await prisma.gameRound.findMany({
      where: {
        category,
        status: "ACTIVE",
        roundNumber: { lt: roundNumber },
      },
    });

    for (const expRound of expiredRounds) {
      await prisma.gameRound.update({
        where: { id: expRound.id },
        data: { status: "CLOSED" },
      });
      await settleRound(expRound.id, strategy);
    }
  } catch (e) {
    console.error("Error settling expired rounds", e);
  }

  // 2. Fetch or atomically create current deterministic round
  let activeRound = await prisma.gameRound.findFirst({
    where: {
      category,
      roundNumber,
    },
    include: { result: true, bets: true },
  });

  if (!activeRound) {
    try {
      activeRound = await prisma.gameRound.create({
        data: {
          category,
          roundNumber,
          sessionIndex,
          day,
          dayOfWeek,
          dayOfWeekNumber,
          weekOfYear,
          month,
          monthName,
          year,
          startsAt,
          closesAt,
          status: "ACTIVE",
        },
        include: { result: true, bets: true },
      });
    } catch (e) {
      activeRound = await prisma.gameRound.findFirst({
        where: {
          category,
          roundNumber,
        },
        include: { result: true, bets: true },
      });
    }
  }

  // Fail-safe guarantee: If still null for any reason, construct valid in-memory activeRound object
  if (!activeRound) {
    activeRound = {
      id: `fallback-${roundNumber}`,
      category,
      roundNumber,
      sessionIndex,
      day,
      dayOfWeek,
      dayOfWeekNumber,
      weekOfYear,
      month,
      monthName,
      year,
      startsAt,
      closesAt,
      status: "ACTIVE",
      resultId: null,
      createdAt: new Date(),
      result: null,
      bets: [],
    } as any;
  }

  return activeRound;
}
