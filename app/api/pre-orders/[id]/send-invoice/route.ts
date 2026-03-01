export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { sendWhatsAppNotification } from "@/lib/whatsapp";
import { formatCurrency } from "@/lib/utils";

// POST /api/pre-orders/[id]/send-invoice
// Manual trigger: kirim invoice via WA ke pelanggan
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const ticket = await prisma.jobTicket.findUnique({
      where: { id },
      include: {
        items: true,
        createdByUser: { select: { name: true } },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
    }

    if (!ticket.customerPhone) {
      return NextResponse.json({ error: "Pelanggan tidak memiliki nomor HP" }, { status: 400 });
    }

    const settings = await prisma.settings.findFirst();
    const storeName = settings?.businessName ?? "Toko";

    const isPaid = ticket.status === "COMPLETED" || Number(ticket.remainingAmount) === 0;

    // Format item list — simple, no price per item
    const itemLines = ticket.items.length > 0
      ? ticket.items.map(it => `- ${it.name} x${it.quantity}`).join("\n")
      : `- ${ticket.title} x${ticket.quantity}`;

    const statusLine = isPaid ? `Status: PAID ✅` : `Status: BELUM LUNAS ⏳`;

    const message = [
      `INVOICE ${storeName.toUpperCase()}`,
      ``,
      `Nama: ${ticket.customerName}`,
      `No HP: ${ticket.customerPhone}`,
      ``,
      `Pesanan:`,
      itemLines,
      ``,
      `Total: ${formatCurrency(Number(ticket.totalPrice))}`,
      statusLine,
    ]
      .join("\n");

    const sent = await sendWhatsAppNotification(
      ticket.customerPhone,
      `Invoice ${ticket.ticketNo}`,
      message,
      true // bypass rate limit (manual trigger by staff)
    );

    if (!sent) {
      return NextResponse.json(
        { error: "Gagal kirim WA. Pastikan WhatsApp sudah terhubung di Pengaturan." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Invoice terkirim!" });
  } catch (error) {
    console.error("[SEND_INVOICE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
