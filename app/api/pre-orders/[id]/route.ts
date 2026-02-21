export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { sendWhatsAppNotification } from "@/lib/whatsapp";

// GET /api/pre-orders/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const preOrder = await prisma.preOrder.findUnique({
      where: { id },
      include: {
        createdByUser: { select: { id: true, name: true } },
      },
    });

    if (!preOrder) {
      return NextResponse.json({ error: "Pre-order tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(preOrder);
  } catch (error) {
    console.error("Error fetching pre-order:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/pre-orders/[id]
// Actions: update_status | pay_remaining | edit | cancel
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const data = await req.json();
    const { action } = data;

    const preOrder = await prisma.preOrder.findUnique({ where: { id } });
    if (!preOrder) {
      return NextResponse.json({ error: "Pre-order tidak ditemukan" }, { status: 404 });
    }

    const settings = await prisma.settings.findFirst();

    // ── ACTION: update_status ─────────────────────────────
    if (action === "update_status") {
      const { status } = data;
      const validStatuses = ["PENDING", "CONFIRMED", "IN_PRODUCTION", "READY", "COMPLETED", "CANCELLED"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
      }

      const updated = await prisma.preOrder.update({
        where: { id },
        data: { status },
      });

      // Kirim WA kalau status jadi READY
      if (status === "READY" && preOrder.customerPhone) {
        try {
          if (settings?.whatsappEnabled) {
            const fmt = (n: number) =>
              new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
            const fmtDate = (d: Date) =>
              new Intl.DateTimeFormat("id-ID", { dateStyle: "full", timeStyle: "short" }).format(new Date(d));

            const message = `
╔═══════════════════════════════════╗
  ${settings.businessName?.toUpperCase() || "TOKO ROTI"}
╚═══════════════════════════════════╝

🎉 PESANAN ANDA SUDAH SIAP!

Halo ${preOrder.customerName}! 👋

Pre-order Anda sudah selesai dibuat
dan siap untuk diambil/dikirim.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
No. Order  : ${preOrder.orderNo}
Produk     : ${preOrder.productName}
Jumlah     : ${preOrder.quantity} pcs

Jadwal     : ${fmtDate(preOrder.pickupDate)}
Tipe       : ${preOrder.deliveryType === "PICKUP" ? "Ambil di toko" : "Delivery"}
${Number(preOrder.remainingAmount) > 0 ? `\nSisa Bayar : ${fmt(Number(preOrder.remainingAmount))}\n(Mohon siapkan pembayaran)` : "\nStatus    : LUNAS ✅"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Terima kasih sudah memesan! 🎂
Sampai jumpa di toko ya!

~ ${settings.businessName || "Toko Roti"} ~
`.trim();

            await sendWhatsAppNotification(preOrder.customerPhone, "preorder_ready", message);
          }
        } catch (waError) {
          console.error("[PreOrder] WA ready notification failed:", waError);
        }
      }

      return NextResponse.json(updated);
    }

    // ── ACTION: pay_remaining ─────────────────────────────
    if (action === "pay_remaining") {
      const { payMethod, payAmount } = data;

      if (!payMethod) {
        return NextResponse.json({ error: "Metode bayar wajib diisi" }, { status: 400 });
      }
      if (Number(preOrder.remainingAmount) <= 0) {
        return NextResponse.json({ error: "Pesanan sudah lunas" }, { status: 400 });
      }

      const updated = await prisma.preOrder.update({
        where: { id },
        data: {
          finalPayMethod: payMethod,
          finalPaidAt: new Date(),
          remainingAmount: 0,
          status: preOrder.status === "READY" ? "COMPLETED" : preOrder.status,
        },
      });

      return NextResponse.json(updated);
    }

    // ── ACTION: cancel ─────────────────────────────────────
    if (action === "cancel") {
      const { cancelReason } = data;

      if (["COMPLETED"].includes(preOrder.status)) {
        return NextResponse.json({ error: "Pesanan yang sudah selesai tidak bisa dibatalkan" }, { status: 400 });
      }

      const updated = await prisma.preOrder.update({
        where: { id },
        data: {
          status: "CANCELLED",
          cancelReason: cancelReason || "Dibatalkan",
        },
      });

      // Kirim WA notif cancel
      try {
        if (settings?.whatsappEnabled && preOrder.customerPhone) {
          const message = `
Halo ${preOrder.customerName},

Mohon maaf, pre-order Anda dengan
No. Order ${preOrder.orderNo} telah
dibatalkan.

${cancelReason ? "Alasan: " + cancelReason : ""}

Silakan hubungi kami untuk informasi
lebih lanjut.

~ ${settings.businessName || "Toko Roti"} ~
`.trim();
          await sendWhatsAppNotification(preOrder.customerPhone, "preorder_cancel", message);
        }
      } catch {
        // non-blocking
      }

      return NextResponse.json(updated);
    }

    // ── ACTION: edit ───────────────────────────────────────
    if (action === "edit") {
      const {
        customerName, customerPhone, customerAddress,
        productName, description, quantity, unitPrice,
        notes, pickupDate, deliveryType,
      } = data;

      if (["COMPLETED", "CANCELLED"].includes(preOrder.status)) {
        return NextResponse.json({ error: "Pesanan selesai/batal tidak bisa diedit" }, { status: 400 });
      }

      const qty = parseInt(quantity) || Number(preOrder.quantity);
      const price = parseFloat(unitPrice) || Number(preOrder.unitPrice);
      const total = price * qty;
      const dp = Number(preOrder.dpAmount);
      const remaining = Math.max(0, total - dp);

      const updated = await prisma.preOrder.update({
        where: { id },
        data: {
          customerName: customerName?.trim() || preOrder.customerName,
          customerPhone: customerPhone?.trim() || preOrder.customerPhone,
          customerAddress: customerAddress?.trim() || preOrder.customerAddress,
          productName: productName?.trim() || preOrder.productName,
          description: description?.trim() || preOrder.description,
          quantity: qty,
          unitPrice: price,
          totalPrice: total,
          notes: notes?.trim() || preOrder.notes,
          pickupDate: pickupDate ? new Date(pickupDate) : preOrder.pickupDate,
          deliveryType: deliveryType || preOrder.deliveryType,
          remainingAmount: remaining,
        },
      });

      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Action tidak valid" }, { status: 400 });
  } catch (error) {
    console.error("Error updating pre-order:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/pre-orders/[id] - hard delete (hanya PENDING atau CANCELLED)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const preOrder = await prisma.preOrder.findUnique({ where: { id } });
    if (!preOrder) {
      return NextResponse.json({ error: "Pre-order tidak ditemukan" }, { status: 404 });
    }

    await prisma.preOrder.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting pre-order:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
