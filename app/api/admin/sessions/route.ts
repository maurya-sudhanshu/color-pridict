import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req, "VIEW");

    const sessions = await prisma.userSession.findMany({
      orderBy: { loginAt: "desc" },
      take: 100,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        _count: {
          select: {
            bets: true,
            deposits: true,
            withdrawals: true,
          },
        },
      },
    });

    return NextResponse.json({ sessions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Forbidden" }, { status: 403 });
  }
}
