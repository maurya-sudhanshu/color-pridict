import { hashPassword, signToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const registerSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(10).optional(),
  password: z.string().min(6),
  role: z.enum(["USER", "ADMIN"]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.parse(body);

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: parsed.email },
          ...(parsed.phone ? [{ phone: parsed.phone }] : []),
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email or phone already exists" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(parsed.password);

    const user = await prisma.user.create({
      data: {
        email: parsed.email,
        phone: parsed.phone,
        passwordHash,
        role: parsed.role || "USER",
        wallet: {
          create: {
            balance: 500.0,
          },
        },
      },
      include: { wallet: true },
    });

    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "DEPOSIT",
        amount: 500.0,
        balanceAfter: 500.0,
        referenceId: "WELCOME_BONUS",
      },
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        wallet: user.wallet,
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
    return NextResponse.json({ error: error.message || "Registration failed" }, { status: 400 });
  }
}
