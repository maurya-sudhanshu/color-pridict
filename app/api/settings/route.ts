import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
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
    return NextResponse.json(
      {
        settings: {
          deposit_upi_id: "colorwin@upi",
          deposit_qr_url: "",
          min_deposit_amount: "100",
          min_withdrawal_amount: "200",
        },
      },
      { status: 200 }
    );
  }
}
