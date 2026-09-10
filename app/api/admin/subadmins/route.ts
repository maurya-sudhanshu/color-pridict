import { hashPassword, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createSubAdminSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  canCreate: z.boolean().default(false),
  canView: z.boolean().default(true),
  canUpdate: z.boolean().default(false),
  canDelete: z.boolean().default(false),
});

const updatePermissionSchema = z.object({
  subAdminId: z.string().uuid("Invalid sub-admin ID"),
  canCreate: z.boolean(),
  canView: z.boolean(),
  canUpdate: z.boolean(),
  canDelete: z.boolean(),
});

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, "VIEW");

    const subAdmins = await prisma.user.findMany({
      where: { role: "SUB_ADMIN" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        adminPermission: true,
      },
    });

    return NextResponse.json({ subAdmins, currentAdminRole: admin.role });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, "CREATE");
    const body = await req.json();
    const parsed = createSubAdminSchema.parse(body);

    const existing = await prisma.user.findUnique({
      where: { email: parsed.email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
    }

    const passwordHash = await hashPassword(parsed.password);

    const subAdmin = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: parsed.email.toLowerCase(),
          passwordHash,
          role: "SUB_ADMIN",
        },
      });

      await tx.wallet.create({
        data: { userId: user.id, balance: 0.0 },
      });

      const permission = await tx.adminPermission.create({
        data: {
          userId: user.id,
          canCreate: parsed.canCreate,
          canView: parsed.canView,
          canUpdate: parsed.canUpdate,
          canDelete: parsed.canDelete,
        },
      });

      return { ...user, adminPermission: permission };
    });

    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: "CREATE_SUB_ADMIN",
        details: `Created sub-admin '${subAdmin.email}' with permissions: Create=${parsed.canCreate}, View=${parsed.canView}, Update=${parsed.canUpdate}, Delete=${parsed.canDelete}`,
      },
    });

    return NextResponse.json({ success: true, subAdmin });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create sub-admin" }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, "UPDATE");
    const body = await req.json();
    const parsed = updatePermissionSchema.parse(body);

    const updatedPermission = await prisma.adminPermission.upsert({
      where: { userId: parsed.subAdminId },
      update: {
        canCreate: parsed.canCreate,
        canView: parsed.canView,
        canUpdate: parsed.canUpdate,
        canDelete: parsed.canDelete,
      },
      create: {
        userId: parsed.subAdminId,
        canCreate: parsed.canCreate,
        canView: parsed.canView,
        canUpdate: parsed.canUpdate,
        canDelete: parsed.canDelete,
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: "UPDATE_SUB_ADMIN_PERMISSIONS",
        details: `Updated permissions for sub-admin ID '${parsed.subAdminId}': Create=${parsed.canCreate}, View=${parsed.canView}, Update=${parsed.canUpdate}, Delete=${parsed.canDelete}`,
      },
    });

    return NextResponse.json({ success: true, updatedPermission });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update permissions" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, "DELETE");
    const { searchParams } = new URL(req.url);
    const subAdminId = searchParams.get("subAdminId");

    if (!subAdminId) {
      return NextResponse.json({ error: "Sub-admin ID is required" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: subAdminId },
    });

    if (!targetUser || targetUser.role !== "SUB_ADMIN") {
      return NextResponse.json({ error: "Sub-admin user not found" }, { status: 404 });
    }

    await prisma.user.delete({
      where: { id: subAdminId },
    });

    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: "DELETE_SUB_ADMIN",
        details: `Deleted sub-admin account '${targetUser.email}'`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete sub-admin" }, { status: 400 });
  }
}
