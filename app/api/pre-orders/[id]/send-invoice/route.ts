export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { sendWhatsAppNotification } from "@/lib/whatsapp";
import { formatCurrency } from "@/lib/utils";

function fmtDate(d: Date | string) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
}

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
    const storePhone = settings?.businessPhone ?? "";

    const isPaid = ticket.status === "COMPLETED" || Number(ticket.remainingAmount) === 0;
    const isDP = Number(ticket.dpAmount) > 0 && Number(ticket.remainingAmount) > 0;

    // Format item list
    const itemLines = ticket.items.length > 0
      ? ticket.items.map(it => `  - ${it.name} x${it.quantity} = ${formatCurrency(Number(it.subtotal))}`).join("\n")
      : `  - ${ticket.title} x${ticket.quantity} = ${formatCurrency(Number(ticket.totalPrice))}`;

    const message = [
      `🧾 *INVOICE PESANAN*`,
      `━━━━━━━━━━━━━━━━━`,
      ``,
      `*No. Order:* ${ticket.ticketNo}`,
      `*Produk:* ${ticket.title}`,
      ``,
      `📋 *RINCIAN PESANAN*`,
      itemLines,
      ``,
      `💰 *PEMBAYARAN*`,
      `Total: *${formatCurrency(Number(ticket.totalPrice))}*`,
      Number(ticket.dpAmount) > 0 ? `DP: ${formatCurrency(Number(ticket.dpAmount))} ✅` : null,
      Number(ticket.remainingAmount) > 0 ? `Sisa: *${formatCurrency(Number(ticket.remainingAmount))}*` : null,
      isPaid ? `Status: *LUNAS* ✅` : isDP ? `Status: *DP DITERIMA* — Sisa dilunasi saat ambil` : `Status: *BELUM BAYAR*`,
      ``,
      ticket.deliveryType === "DELIVERY"
        ? `🚚 *Pengiriman* ke: ${ticket.customerAddress ?? "-"}`
        : `🏪 *Ambil di toko*`,
      `📅 *Tanggal:* ${fmtDate(ticket.dueDate)}`,
      ``,
      ticket.notes ? `📝 Catatan: ${ticket.notes}` : null,
      ``,
      `━━━━━━━━━━━━━━━━━`,
      `🏪 *${storeName}*`,
      storePhone ? `📞 ${storePhone}` : null,
      ``,
      `Terima kasih atas pesanannya! 🙏`,
    ]
      .filter((l) => l !== null)
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
