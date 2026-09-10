import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const replySchema = z.object({
  ticketId: z.string(),
  adminReply: z.string().optional(),
  status: z.enum(["OPEN", "RESOLVED"]).optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req, "VIEW");

    const tickets = await prisma.supportTicket.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({ tickets });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Forbidden" }, { status: 403 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, "UPDATE");
    const body = await req.json();
    const parsed = replySchema.parse(body);

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: parsed.ticketId },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const updated = await prisma.supportTicket.update({
      where: { id: parsed.ticketId },
      data: {
        ...(parsed.adminReply !== undefined && { adminReply: parsed.adminReply }),
        ...(parsed.status !== undefined && { status: parsed.status }),
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: "REPLY_SUPPORT_TICKET",
        details: `Updated support ticket ${ticket.id} status: ${parsed.status || ticket.status}`,
      },
    });

    return NextResponse.json({ success: true, ticket: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update ticket" }, { status: 400 });
  }
}
