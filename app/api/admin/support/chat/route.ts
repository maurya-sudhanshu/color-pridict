import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const adminReplySchema = z.object({
  targetUserId: z.string(),
  message: z.string().min(1, "Message cannot be empty"),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req, "VIEW");
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("targetUserId");

    // Fetch list of distinct users who have chat messages
    const distinctUserIds = await prisma.supportChatMessage.groupBy({
      by: ["userId"],
      _max: { createdAt: true },
      orderBy: { _max: { createdAt: "desc" } },
    });

    const conversations = await Promise.all(
      distinctUserIds.map(async (item) => {
        const user = await prisma.user.findUnique({
          where: { id: item.userId },
          select: { id: true, email: true, phone: true },
        });

        const latestMsg = await prisma.supportChatMessage.findFirst({
          where: { userId: item.userId },
          orderBy: { createdAt: "desc" },
        });

        const unreadCount = await prisma.supportChatMessage.count({
          where: { userId: item.userId, sender: "USER", isRead: false },
        });

        return {
          user,
          latestMessage: latestMsg?.message || "",
          lastTime: latestMsg?.createdAt || item._max.createdAt,
          unreadCount,
        };
      })
    );

    let activeMessages: any[] = [];
    if (targetUserId) {
      // Mark user messages as read by admin
      await prisma.supportChatMessage.updateMany({
        where: { userId: targetUserId, sender: "USER", isRead: false },
        data: { isRead: true },
      });

      activeMessages = await prisma.supportChatMessage.findMany({
        where: { userId: targetUserId },
        orderBy: { createdAt: "asc" },
      });
    }

    return NextResponse.json({ conversations, activeMessages });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Forbidden" }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, "UPDATE");
    const body = await req.json();
    const parsed = adminReplySchema.parse(body);

    const chatMsg = await prisma.supportChatMessage.create({
      data: {
        userId: parsed.targetUserId,
        sender: "ADMIN",
        message: parsed.message,
        isRead: false,
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: "LIVE_CHAT_REPLY",
        details: `Sent live chat reply to user ${parsed.targetUserId}`,
      },
    });

    return NextResponse.json({ success: true, message: chatMsg });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to send chat reply" }, { status: 400 });
  }
}
