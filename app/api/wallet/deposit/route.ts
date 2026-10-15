import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const depositSchema = z.object({
  amount: z.number().min(100, "Minimum deposit amount is ₹100"),
  txId: z.string().min(4, "Transaction ID / UTR required"),
  screenshotUrl: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, "user");
    const body = await req.json();
    const parsed = depositSchema.parse(body);

    const deposit = await prisma.deposit.create({
      data: {
        userId: user.id,
        sessionId: user.currentSessionId || null,
        amount: parsed.amount,
        txId: parsed.txId,
        screenshotUrl: parsed.screenshotUrl || null,
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true, deposit });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to process deposit request" }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, "user");

    const deposits = await prisma.deposit.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ deposits });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status: 401 });
  }
}
