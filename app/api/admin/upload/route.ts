import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid image format. Use PNG, JPEG, WEBP, or GIF." }, { status: 400 });
    }

    // Convert file buffer to base64 Data URL or save to public/uploads
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Create base64 Data URL for zero-dependency instant rendering
    const base64Image = `data:${file.type};base64,${buffer.toString("base64")}`;

    // Also attempt to save locally to public/uploads for persistent URI
    let fileUrl = base64Image;
    try {
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      await fs.mkdir(uploadsDir, { recursive: true });
      const filename = `deposit-qr-${Date.now()}.${file.type.split("/")[1] || "png"}`;
      const filePath = path.join(uploadsDir, filename);
      await fs.writeFile(filePath, buffer);
      fileUrl = `/uploads/${filename}`;
    } catch {
      // Fallback to base64 Data URL if local disk write fails
      fileUrl = base64Image;
    }

    // Save to SystemSetting table
    await prisma.systemSetting.upsert({
      where: { key: "deposit_qr_url" },
      update: { value: fileUrl },
      create: { key: "deposit_qr_url", value: fileUrl },
    });

    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: "UPLOAD_DEPOSIT_QR",
        details: "Uploaded custom Deposit QR Code image file.",
      },
    });

    return NextResponse.json({ success: true, qrUrl: fileUrl });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "File upload failed" }, { status: 400 });
  }
}
