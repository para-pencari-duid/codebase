export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { sendWhatsAppNotification } from "@/lib/whatsapp";

function generateTicketNo(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `TKT-${year}${month}${day}-${random}`;
}

// GET /api/pre-orders
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: any = {};
    if (status && status !== "ALL") where.status = status;
    if (search) {
      where.OR = [
        { ticketNo: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { customerPhone: { contains: search, mode: "insensitive" } },
        { title: { contains: search, mode: "insensitive" } },
      ];
    }

    const tenantId = session.user.tenantId!;
    where.tenantId = tenantId;

    const [orders, total] = await Promise.all([
      prisma.jobTicket.findMany({
        where,
        include: {
          createdByUser: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.jobTicket.count({ where }),
    ]);

    return NextResponse.json({
      orders,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching job tickets:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/pre-orders
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const {
      customerName,
      customerPhone,
      customerAddress,
      productName,
      description,
      quantity,
      unitPrice,
      notes,
      referenceImages,
      dpAmount,
      dpMethod,
      pickupDate,
      deliveryType,
    } = data;

    // Validasi wajib
    if (!customerName || !customerPhone || !productName || !unitPrice || !pickupDate) {
      return NextResponse.json(
        { error: "customerName, customerPhone, productName, unitPrice, pickupDate wajib diisi" },
        { status: 400 }
      );
    }

    const tenantId = session.user.tenantId!;

    const qty = parseInt(quantity) || 1;
    const price = parseFloat(unitPrice);
    const total = price * qty;
    const dp = parseFloat(dpAmount) || 0;
    const remaining = total - dp;

    // Generate nomor tiket
    let ticketNo = generateTicketNo();
    const existing = await prisma.jobTicket.findFirst({ where: { ticketNo, tenantId } });
    if (existing) {
      ticketNo = generateTicketNo();
    }

    const jobTicket = await prisma.jobTicket.create({
      data: {
        tenantId,
        ticketNo,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress?.trim() || null,
        title: productName.trim(),
        description: description?.trim() || null,
        quantity: qty,
        unitPrice: price,
        totalPrice: total,
        notes: notes?.trim() || null,
        referenceImages: referenceImages || [],
        dpAmount: dp,
        dpMethod: dp > 0 ? dpMethod : null,
        dpPaidAt: dp > 0 ? new Date() : null,
        remainingAmount: remaining,
        dueDate: new Date(pickupDate),
        deliveryType: deliveryType || "PICKUP",
        status: "CONFIRMED",
        createdBy: session.user.id,
      },
      include: {
        createdByUser: {
          select: { id: true, name: true },
        },
      },
    });

    // Kirim WhatsApp konfirmasi ke customer
    try {
      const settings = await prisma.settings.findFirst({ where: { tenantId } });
      if (settings?.whatsappEnabled && customerPhone) {
        await sendWhatsAppNotification(
          customerPhone,
          "preorder_confirm",
          createPreOrderConfirmMessage({
            orderNo: jobTicket.ticketNo,
            customerName: jobTicket.customerName,
            productName: jobTicket.title,
            description: jobTicket.description || "",
            quantity: jobTicket.quantity,
            totalPrice: Number(jobTicket.totalPrice),
            dpAmount: Number(jobTicket.dpAmount),
            remainingAmount: Number(jobTicket.remainingAmount),
            pickupDate: jobTicket.dueDate,
            deliveryType: jobTicket.deliveryType,
            businessName: settings.businessName || "Toko",
            businessPhone: settings.businessPhone || "",
          }),
          tenantId
        );
      }
    } catch (waError) {
      console.error("[JobTicket] WA notification failed (non-blocking):", waError);
    }

    return NextResponse.json(jobTicket, { status: 201 });
  } catch (error) {
    console.error("Error creating job ticket:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function createPreOrderConfirmMessage(data: {
  orderNo: string;
  customerName: string;
  productName: string;
  description: string;
  quantity: number;
  totalPrice: number;
  dpAmount: number;
  remainingAmount: number;
  pickupDate: Date;
  deliveryType: string;
  businessName: string;
  businessPhone: string;
}): string {
  const fmt = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
  const fmtDate = (d: Date) =>
    new Intl.DateTimeFormat("id-ID", { dateStyle: "full", timeStyle: "short" }).format(new Date(d));

  return `
╔═══════════════════════════════════╗
  ${data.businessName.toUpperCase()}
  ${data.businessPhone}
╚═══════════════════════════════════╝

✅ PRE-ORDER DIKONFIRMASI!

Halo ${data.customerName}! 👋
Pesanan Anda telah diterima.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 DETAIL PESANAN

No. Order  : ${data.orderNo}
Produk     : ${data.productName}${data.description ? "\nDetail     : " + data.description : ""}
Jumlah     : ${data.quantity} pcs

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 PEMBAYARAN

Total      : ${fmt(data.totalPrice)}
DP Dibayar : ${fmt(data.dpAmount)}
Sisa Bayar : ${fmt(data.remainingAmount)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 JADWAL

Waktu      : ${fmtDate(data.pickupDate)}
Tipe       : ${data.deliveryType === "PICKUP" ? "Ambil di toko" : "Delivery ke alamat"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Kami akan menghubungi Anda ketika
pesanan sudah siap. Terima kasih! 🎂

~ ${data.businessName} ~
`.trim();
}
