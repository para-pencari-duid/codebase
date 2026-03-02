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
            ? updated.items.map(it => `  ${it.name} x${it.quantity}  ${fmt(Number(it.subtotal))}`).join("\n")
            : `  ${updated.title} x${updated.quantity}  ${fmt(Number(updated.totalPrice))}`;

          const pickupLine = updated.dueDate
            ? (updated.deliveryType === "DELIVERY"
                ? `Pengiriman ke: ${updated.customerAddress ?? "-"}`
                : `Jadwal ambil: ${fmtD(updated.dueDate)}`)
            : null;

          const message = [
            `*${settings?.businessName || "Toko"}*`,
            ``,
            `Kepada Yth. ${updated.customerName},`,
            ``,
            `Pembayaran Anda telah kami terima.`,
            ``,
            `No. Order : ${updated.ticketNo}`,
            ``,
            `Rincian pesanan:`,
            itemLines,
            ``,
            `Total          : ${fmt(Number(updated.totalPrice))}`,
            Number(updated.dpAmount) > 0 ? `DP terbayar    : ${fmt(Number(updated.dpAmount))}` : null,
            `Pelunasan      : ${fmt(Number(jobTicket.remainingAmount))} (${payMethod})`,
            `Status         : Lunas`,
            ``,
            pickupLine,
            ``,
            `Terima kasih.`,
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

      return NextResponse.json(updated);
    }

    // ── ACTION: edit ───────────────────────────────────────
    if (action === "edit") {
      const {
        customerName, customerPhone, customerAddress,
        items,          // Array<{name,quantity,unitPrice,notes?}>
        notes, pickupDate, deliveryType,
      } = data;

      if (["COMPLETED", "CANCELLED"].includes(jobTicket.status)) {
        return NextResponse.json({ error: "Pesanan selesai/batal tidak bisa diedit" }, { status: 400 });
      }

      type RawItem = { name: string; quantity?: number | string; unitPrice: number | string; notes?: string };
      const parsedItems: Array<{ name: string; quantity: number; unitPrice: number; subtotal: number; notes: string | null }> | null =
        items && Array.isArray(items) && items.length > 0
          ? (items as RawItem[]).map((it) => {
              const qty = parseInt(String(it.quantity)) || 1;
              const price = parseFloat(String(it.unitPrice)) || 0;
              return {
                name: String(it.name || "").trim(),
                quantity: qty,
                unitPrice: price,
                subtotal: qty * price,
                notes: it.notes?.trim() || null,
              };
            })
          : null;

      const total = parsedItems
        ? parsedItems.reduce((sum, it) => sum + it.subtotal, 0)
        : Number(jobTicket.totalPrice);
      const dp = Number(jobTicket.dpAmount);
      const remaining = Math.max(0, total - dp);

      const firstItem = parsedItems?.[0];

      const updated = await prisma.jobTicket.update({
        where: { id },
        data: {
          customerName: customerName?.trim() || jobTicket.customerName,
          customerPhone: customerPhone?.trim() || jobTicket.customerPhone,
          customerAddress: customerAddress?.trim() || jobTicket.customerAddress,
          ...(firstItem && {
            title: firstItem.name,
            quantity: firstItem.quantity,
            unitPrice: firstItem.unitPrice,
          }),
          totalPrice: total,
          notes: notes?.trim() ?? jobTicket.notes,
          dueDate: pickupDate ? new Date(pickupDate) : jobTicket.dueDate,
          deliveryType: deliveryType || jobTicket.deliveryType,
          remainingAmount: remaining,
          ...(parsedItems && {
            items: {
              deleteMany: {},
              create: parsedItems.map((it) => ({
                name: it.name,
                quantity: it.quantity,
                unitPrice: it.unitPrice,
                subtotal: it.subtotal,
                notes: it.notes,
              })),
            },
          }),
        },
        include: { items: true },
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
