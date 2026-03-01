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
    const jobTicket = await prisma.jobTicket.findUnique({
      where: { id },
      include: {
        items: true,
        createdByUser: { select: { id: true, name: true } },
      },
    });

    if (!jobTicket) {
      return NextResponse.json({ error: "Pre-order tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(jobTicket);
  } catch (error) {
    console.error("Error fetching job ticket:", error);
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

    const jobTicket = await prisma.jobTicket.findUnique({ where: { id } });
    if (!jobTicket) {
      return NextResponse.json({ error: "Pre-order tidak ditemukan" }, { status: 404 });
    }
    const settings = await prisma.settings.findFirst({ where: {} });

    // ── ACTION: update_status ─────────────────────────────
    if (action === "update_status") {
      const { status } = data;
      const validStatuses = ["PENDING", "CONFIRMED", "PROCESSING", "READY", "COMPLETED", "CANCELLED"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
      }

      const updated = await prisma.jobTicket.update({
        where: { id },
        data: { status },
      });

      // Kirim WA kalau status jadi READY
      if (status === "READY" && jobTicket.customerPhone) {
        try {
          if (settings?.whatsappEnabled) {
            const fmt = (n: number) =>
              new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
            const fmtDate = (d: Date) =>
              new Intl.DateTimeFormat("id-ID", { dateStyle: "full", timeStyle: "short" }).format(new Date(d));

            const message = `
╔═══════════════════════════════════╗
  ${settings.businessName?.toUpperCase() || "TOKO"}
╚═══════════════════════════════════╝

🎉 PESANAN ANDA SUDAH SIAP!

Halo ${jobTicket.customerName}! 👋

Pre-order Anda sudah selesai dibuat
dan siap untuk diambil/dikirim.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
No. Order  : ${jobTicket.ticketNo}
Produk     : ${jobTicket.title}
Jumlah     : ${jobTicket.quantity} pcs

Jadwal     : ${fmtDate(jobTicket.dueDate)}
Tipe       : ${jobTicket.deliveryType === "PICKUP" ? "Ambil di toko" : "Delivery"}
${Number(jobTicket.remainingAmount) > 0 ? `\nSisa Bayar : ${fmt(Number(jobTicket.remainingAmount))}\n(Mohon siapkan pembayaran)` : "\nStatus    : LUNAS ✅"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Terima kasih sudah memesan! 🎂
Sampai jumpa di toko ya!

~ ${settings.businessName || "Toko"} ~
`.trim();

            await sendWhatsAppNotification(jobTicket.customerPhone, "preorder_ready", message);
          }
        } catch (waError) {
          console.error("[JobTicket] WA ready notification failed:", waError);
        }
      }

      return NextResponse.json(updated);
    }

    // ── ACTION: pay_remaining ─────────────────────────────
    if (action === "pay_remaining") {
      const { payMethod } = data;

      if (!payMethod) {
        return NextResponse.json({ error: "Metode bayar wajib diisi" }, { status: 400 });
      }
      if (Number(jobTicket.remainingAmount) <= 0) {
        return NextResponse.json({ error: "Pesanan sudah lunas" }, { status: 400 });
      }

      const updated = await prisma.jobTicket.update({
        where: { id },
        include: { items: true },
        data: {
          finalPayMethod: payMethod,
          finalPaidAt: new Date(),
          remainingAmount: 0,
          status: jobTicket.status === "READY" ? "COMPLETED" : jobTicket.status,
        },
      });

      // Create Transaction record so pre-order shows in /transactions + customer stats
      try {
        const dpPayments: Array<{ method: string; amount: number; reference: string }> = [];
        if (Number(updated.dpAmount) > 0 && updated.dpMethod) {
          dpPayments.push({
            method: updated.dpMethod,
            amount: Number(updated.dpAmount),
            reference: `DP - ${updated.ticketNo}`,
          });
        }

        await prisma.transaction.create({
          data: {
            transactionNo: updated.ticketNo,
            type: "B2B_INVOICE",
            customerId: updated.customerId ?? null,
            userId: session.user?.id as string,
            subtotal: updated.totalPrice,
            tax: 0,
            discount: 0,
            total: updated.totalPrice,
            paymentMethod: payMethod as any,
            paymentAmount: updated.totalPrice,
            changeAmount: 0,
            paymentStatus: "PAID",
            status: "COMPLETED",
            notes: `Pre-Order: ${updated.title} (${updated.ticketNo})`,
            payments: {
              create: [
                ...dpPayments.map((p) => ({
                  method: p.method as any,
                  amount: p.amount,
                  reference: p.reference,
                })),
                {
                  method: payMethod as any,
                  amount: Number(jobTicket.remainingAmount),
                  reference: `Pelunasan - ${updated.ticketNo}`,
                },
              ],
            },
          },
        });
      } catch (txErr) {
        console.error("[pay_remaining] Failed to create Transaction record:", txErr);
        // non-blocking
      }

      // Auto-send WA invoice when marked as paid
      try {
        if (settings?.whatsappEnabled && updated.customerPhone) {
          const fmt = (n: number) =>
            new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
          const fmtD = (d: Date) =>
            new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short" }).format(new Date(d));

          const itemLines = updated.items.length > 0
            ? updated.items.map(it => `  - ${it.name} x${it.quantity} = ${fmt(Number(it.subtotal))}`).join("\n")
            : `  - ${updated.title} x${updated.quantity} = ${fmt(Number(updated.totalPrice))}`;

          const message = [
            `🧾 *INVOICE PELUNASAN*`,
            `━━━━━━━━━━━━━━━━━`,
            ``,
            `Halo ${updated.customerName}! 👋`,
            `Pembayaran Anda telah kami terima. Terima kasih! 🙏`,
            ``,
            `*No. Order:* ${updated.ticketNo}`,
            `*Produk:* ${updated.title}`,
            ``,
            `📋 *RINCIAN*`,
            itemLines,
            ``,
            `💰 *PEMBAYARAN*`,
            `Total: *${fmt(Number(updated.totalPrice))}*`,
            Number(updated.dpAmount) > 0 ? `DP: ${fmt(Number(updated.dpAmount))} ✅` : null,
            `Pelunasan: *${fmt(Number(jobTicket.remainingAmount))}* (${payMethod})`,
            `Status: *LUNAS ✅*`,
            ``,
            updated.dueDate
              ? (updated.deliveryType === "DELIVERY"
                  ? `🚚 *Pengiriman* ke: ${updated.customerAddress ?? "-"}`
                  : `🏪 *Ambil di toko:* ${fmtD(updated.dueDate)}`)
              : null,
            ``,
            `~ ${settings?.businessName || "Toko"} ~`,
          ].filter(Boolean).join("\n");

          await sendWhatsAppNotification(updated.customerPhone, "preorder_paid", message);
        }
      } catch (waErr) {
        console.error("[pay_remaining] WA send failed:", waErr);
        // non-blocking
      }

      return NextResponse.json(updated);
    }

    // ── ACTION: cancel ─────────────────────────────────────
    if (action === "cancel") {
      const { cancelReason } = data;

      if (["COMPLETED"].includes(jobTicket.status)) {
        return NextResponse.json({ error: "Pesanan yang sudah selesai tidak bisa dibatalkan" }, { status: 400 });
      }

      const updated = await prisma.jobTicket.update({
        where: { id },
        data: {
          status: "CANCELLED",
          cancelReason: cancelReason || "Dibatalkan",
        },
      });

      // Kirim WA notif cancel
      try {
        if (settings?.whatsappEnabled && jobTicket.customerPhone) {
          const message = `
Halo ${jobTicket.customerName},

Mohon maaf, pre-order Anda dengan
No. Order ${jobTicket.ticketNo} telah
dibatalkan.

${cancelReason ? "Alasan: " + cancelReason : ""}

Silakan hubungi kami untuk informasi
lebih lanjut.

~ ${settings.businessName || "Toko"} ~
`.trim();
          await sendWhatsAppNotification(jobTicket.customerPhone, "preorder_cancel", message);
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

      if (["COMPLETED", "CANCELLED"].includes(jobTicket.status)) {
        return NextResponse.json({ error: "Pesanan selesai/batal tidak bisa diedit" }, { status: 400 });
      }

      const qty = parseInt(quantity) || Number(jobTicket.quantity);
      const price = parseFloat(unitPrice) || Number(jobTicket.unitPrice);
      const total = price * qty;
      const dp = Number(jobTicket.dpAmount);
      const remaining = Math.max(0, total - dp);

      const updated = await prisma.jobTicket.update({
        where: { id },
        data: {
          customerName: customerName?.trim() || jobTicket.customerName,
          customerPhone: customerPhone?.trim() || jobTicket.customerPhone,
          customerAddress: customerAddress?.trim() || jobTicket.customerAddress,
          title: productName?.trim() || jobTicket.title,
          description: description?.trim() || jobTicket.description,
          quantity: qty,
          unitPrice: price,
          totalPrice: total,
          notes: notes?.trim() || jobTicket.notes,
          dueDate: pickupDate ? new Date(pickupDate) : jobTicket.dueDate,
          deliveryType: deliveryType || jobTicket.deliveryType,
          remainingAmount: remaining,
        },
      });

      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Action tidak valid" }, { status: 400 });
  } catch (error) {
    console.error("Error updating job ticket:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/pre-orders/[id]
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
    const jobTicket = await prisma.jobTicket.findUnique({ where: { id } });
    if (!jobTicket) {
      return NextResponse.json({ error: "Pre-order tidak ditemukan" }, { status: 404 });
    }

    await prisma.jobTicket.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting job ticket:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
