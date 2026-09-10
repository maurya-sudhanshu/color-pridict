import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (user?.currentSessionId) {
      await prisma.userSession.update({
        where: { id: user.currentSessionId },
        data: { isActive: false, logoutAt: new Date() },
      }).catch(() => {});
    }
  } catch {}

  const res = NextResponse.json({ success: true });
  res.cookies.set("token", "", { maxAge: 0, path: "/" });
  return res;
}
