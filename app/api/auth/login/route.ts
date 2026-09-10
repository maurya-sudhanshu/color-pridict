import crypto from "crypto";
import { signToken, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: parsed.email },
      include: { wallet: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const isValid = await verifyPassword(parsed.password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (user.isBlocked) {
      return NextResponse.json(
        { error: "Your account has been blocked by the admin. Please contact support." },
        { status: 403 }
      );
    }

    // Create a new UserSession record in MySQL
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "Browser";

    const userSession = await prisma.userSession.create({
      data: {
        userId: user.id,
        sessionToken,
        ipAddress,
        userAgent,
        isActive: true,
      },
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId: userSession.id,
    });

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isBlocked: user.isBlocked,
        wallet: user.wallet,
        sessionId: userSession.id,
      },
      token,
    });

    res.cookies.set("token", token, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Login failed" }, { status: 400 });
  }
}
