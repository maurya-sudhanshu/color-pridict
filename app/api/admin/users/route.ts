import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const adjustBalanceSchema = z.object({
  userId: z.string(),
  amount: z.number(),
  type: z.enum(["CREDIT", "DEBIT"]),
  reason: z.string().optional(),
});

const toggleBlockSchema = z.object({
  userId: z.string(),
  isBlocked: z.boolean(),
});

const updateRoleSchema = z.object({
  userId: z.string(),
  role: z.enum(["USER", "ADMIN"]),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req, "VIEW");

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        isBlocked: true,
        createdAt: true,
        wallet: true,
      },
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Forbidden" }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, "UPDATE");
    const body = await req.json();
    const parsed = adjustBalanceSchema.parse(body);

    const updatedWallet = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId: parsed.userId },
      });

      if (!wallet) throw new Error("Wallet not found");

      const delta = parsed.type === "CREDIT" ? parsed.amount : -parsed.amount;
      const newBalance = wallet.balance + delta;

      if (newBalance < 0) {
        throw new Error("Balance cannot be negative");
      }

      const updated = await tx.wallet.update({
        where: { userId: parsed.userId },
        data: { balance: newBalance },
      });

      await tx.transaction.create({
        data: {
          userId: parsed.userId,
          type: parsed.type === "CREDIT" ? "ADMIN_CREDIT" : "ADMIN_DEBIT",
          amount: delta,
          balanceAfter: newBalance,
          referenceId: `ADMIN_${admin.id}`,
        },
      });

      await tx.auditLog.create({
        data: {
          adminId: admin.id,
          action: `BALANCE_ADJUSTMENT_${parsed.type}`,
          details: `Adjusted user ${parsed.userId} balance by ₹${delta}. Reason: ${parsed.reason || "Manual adjustment"}`,
        },
      });

      return updated;
    });

    return NextResponse.json({ success: true, wallet: updatedWallet });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to adjust balance" }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, "UPDATE");
    const body = await req.json();
    const parsed = toggleBlockSchema.parse(body);

    const targetUser = await prisma.user.findUnique({
      where: { id: parsed.userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetUser.role === "ADMIN" || targetUser.role === "SUPER_ADMIN") {
      return NextResponse.json({ error: "Main admin accounts cannot be blocked" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: parsed.userId },
      data: { isBlocked: parsed.isBlocked },
    });

    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: parsed.isBlocked ? "BLOCK_USER" : "UNBLOCK_USER",
        details: `${parsed.isBlocked ? "Blocked" : "Unblocked"} user account '${targetUser.email}'`,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to toggle block status" }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, "UPDATE");
    if (admin.role === "SUB_ADMIN") {
      return NextResponse.json({ error: "Only a full administrator can change administrator roles" }, { status: 403 });
    }

    const parsed = updateRoleSchema.parse(await req.json());
    const targetUser = await prisma.user.findUnique({
      where: { id: parsed.userId },
      select: { id: true, email: true, role: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetUser.role === "SUPER_ADMIN" || targetUser.role === "SUB_ADMIN") {
      return NextResponse.json({ error: "Sub-admin and super-admin roles must be managed in their dedicated controls" }, { status: 400 });
    }

    if (targetUser.role === parsed.role) {
      return NextResponse.json({ error: "User already has this role" }, { status: 400 });
    }

    if (targetUser.id === admin.id && parsed.role === "USER") {
      return NextResponse.json({ error: "You cannot demote your own account" }, { status: 400 });
    }

    if (parsed.role === "USER") {
      const administratorCount = await prisma.user.count({
        where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
      });
      if (administratorCount <= 1) {
        return NextResponse.json({ error: "The last administrator cannot be demoted" }, { status: 400 });
      }
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: targetUser.id },
        data: { role: parsed.role },
        select: { id: true, email: true, role: true },
      });
      await tx.auditLog.create({
        data: {
          adminId: admin.id,
          action: parsed.role === "ADMIN" ? "PROMOTE_USER_TO_ADMIN" : "DEMOTE_ADMIN_TO_USER",
          details: `Changed ${targetUser.email} role from ${targetUser.role} to ${parsed.role}`,
        },
      });
      return user;
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update user role" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, "DELETE");
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetUser.role === "ADMIN" || targetUser.role === "SUPER_ADMIN") {
      return NextResponse.json({ error: "Main admin accounts cannot be deleted" }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: "DELETE_USER",
        details: `Deleted user account '${targetUser.email}'`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete user" }, { status: 400 });
  }
}
