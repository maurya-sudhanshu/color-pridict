import { getUserFromRequest, requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const messageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ messages: [] });
    }

    // Mark admin messages as read for this user
    await prisma.supportChatMessage.updateMany({
      where: { userId: user.id, sender: "ADMIN", isRead: false },
      data: { isRead: true },
    });

    const messages = await prisma.supportChatMessage.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ messages, userId: user.id });
  } catch {
    return NextResponse.json({ messages: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const parsed = messageSchema.parse(body);

    const chatMsg = await prisma.supportChatMessage.create({
      data: {
        userId: user.id,
        sender: "USER",
        message: parsed.message,
        isRead: false,
      },
    });

    return NextResponse.json({ success: true, message: chatMsg });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to send message" }, { status: 400 });
  }
}
