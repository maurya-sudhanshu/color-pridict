import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const settingsSchema = z.object({
  deposit_upi_id: z.string().min(3),
  deposit_qr_url: z.string().optional(),
  min_deposit_amount: z.string().optional(),
  min_withdrawal_amount: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req, "VIEW");

    const settings = await prisma.systemSetting.findMany();

    const settingsMap: Record<string, string> = {
      deposit_upi_id: "colorwin@upi",
      deposit_qr_url: "",
      min_deposit_amount: "100",
      min_withdrawal_amount: "200",
    };

    for (const setting of settings) {
      settingsMap[setting.key] = setting.value;
    }

    return NextResponse.json({ settings: settingsMap });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Forbidden" }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, "UPDATE");
    const body = await req.json();
    const parsed = settingsSchema.parse(body);

    await prisma.$transaction(async (tx) => {
      for (const [key, value] of Object.entries(parsed)) {
        if (value !== undefined) {
          await tx.systemSetting.upsert({
            where: { key },
            update: { value },
            create: { key, value },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          adminId: admin.id,
          action: "UPDATE_SYSTEM_SETTINGS",
          details: `Updated deposit settings. UPI ID: ${parsed.deposit_upi_id}`,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to save settings" }, { status: 400 });
  }
}
