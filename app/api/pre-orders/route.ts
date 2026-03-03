export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";

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
    const date = searchParams.get("date"); // YYYY-MM-DD — filter by dueDate
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: any = {};
    if (status && status !== "ALL") where.status = status;
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      where.dueDate = { gte: start, lte: end };
    }
    if (search) {
      where.OR = [
        { ticketNo: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { customerPhone: { contains: search, mode: "insensitive" } },
        { title: { contains: search, mode: "insensitive" } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.jobTicket.findMany({
        where,
        include: {
          createdByUser: {
            select: { id: true, name: true },
          },
          items: {
            select: { id: true, name: true, quantity: true, unitPrice: true, subtotal: true, notes: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.jobTicket.count({ where }),
    ]);

    // Map DB field names to frontend interface names
    const mappedOrders = orders.map((o) => ({
      ...o,
      orderNo: o.ticketNo,
      productName: o.items.length > 0 ? o.items.map((i) => i.name).join(", ") : o.title,
      pickupDate: o.dueDate,
    }));

    return NextResponse.json({
      orders: mappedOrders,
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
      customerId,
      items,          // Array<{name,quantity,unitPrice,notes?}>
      notes,
      referenceImages,
      dpAmount,
      dpMethod,
      pickupDate,
      deliveryType,
    } = data;

    // Validasi wajib
    if (!customerName || !customerPhone || !pickupDate) {
      return NextResponse.json(
        { error: "customerName, customerPhone, pickupDate wajib diisi" },
        { status: 400 }
      );
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Minimal 1 item pesanan wajib diisi" }, { status: 400 });
    }

    type RawItem = { name: string; quantity?: number | string; unitPrice: number | string; notes?: string };
    const parsedItems = (items as RawItem[]).map((it) => ({
      name: String(it.name || "").trim(),
      quantity: parseInt(String(it.quantity)) || 1,
      unitPrice: parseFloat(String(it.unitPrice)) || 0,
      notes: it.notes?.trim() || null,
    }));

    if (parsedItems.some((it) => !it.name || it.unitPrice <= 0)) {
      return NextResponse.json({ error: "Setiap item harus ada nama dan harga satuan" }, { status: 400 });
    }

    const total = parsedItems.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
    const dp = parseFloat(dpAmount) || 0;
    const remaining = total - dp;

    // Use first item as primary label for backward-compat legacy fields
    const firstItem = parsedItems[0];

    // Resolve or create Customer record
    let resolvedCustomerId: string | null = customerId || null;

    if (!resolvedCustomerId && customerPhone) {
      // Try to find existing customer by phone, or create a new one
      try {
        const existingCustomer = await prisma.customer.findUnique({
          where: { phone: customerPhone.trim() },
        });

        if (existingCustomer) {
          resolvedCustomerId = existingCustomer.id;
          // Update name if changed
          if (existingCustomer.name !== customerName.trim()) {
            await prisma.customer.update({
              where: { id: existingCustomer.id },
              data: {
                name: customerName.trim(),
                ...(customerAddress?.trim() && { address: customerAddress.trim() }),
              },
            });
          }
        } else {
          const newCustomer = await prisma.customer.create({
            data: {
              name: customerName.trim(),
              phone: customerPhone.trim(),
              address: customerAddress?.trim() || null,
              isActive: true,
            },
          });
          resolvedCustomerId = newCustomer.id;
        }
      } catch (customerErr) {
        console.error("[pre-orders POST] Failed to upsert customer:", customerErr);
        // Non-blocking: continue without customerId if upsert fails
      }
    }

    // Generate nomor tiket
    let ticketNo = generateTicketNo();
    const existing = await prisma.jobTicket.findFirst({ where: { ticketNo } });
    if (existing) {
      ticketNo = generateTicketNo();
    }

    const jobTicket = await prisma.jobTicket.create({
      data: {
        ticketNo,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress?.trim() || null,
        title: firstItem.name,
        description: null,
        quantity: firstItem.quantity,
        unitPrice: firstItem.unitPrice,
        totalPrice: total,
        notes: notes?.trim() || null,
        referenceImages: referenceImages || [],
        dpAmount: dp,
        dpMethod: dp > 0 ? dpMethod : null,
        dpPaidAt: dp > 0 ? new Date() : null,
        remainingAmount: remaining,
        dueDate: new Date(pickupDate),
        deliveryType: deliveryType || "PICKUP",
        status: "PENDING",
        createdBy: session.user.id,
        customerId: resolvedCustomerId,
        items: {
          create: parsedItems.map((it) => ({
            name: it.name,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            subtotal: it.quantity * it.unitPrice,
            notes: it.notes,
          })),
        },
      },
      include: {
        createdByUser: { select: { id: true, name: true } },
        items: true,
      },
    });

    // Jika sudah lunas saat pembuatan (remaining = 0), buat Transaction record
    if (remaining <= 0 && dp > 0) {
      try {
        await prisma.transaction.create({
          data: {
            transactionNo: jobTicket.ticketNo,
            type: "B2B_INVOICE",
            customerId: customerId || null,
            userId: session.user.id,
            subtotal: total,
            tax: 0,
            discount: 0,
            total,
            paymentMethod: (dpMethod as any) || "CASH",
            paymentAmount: total,
            changeAmount: 0,
            paymentStatus: "PAID",
            status: "COMPLETED",
            notes: `Pre-Order: ${jobTicket.title} (${jobTicket.ticketNo})`,
            payments: {
              create: [{
                method: (dpMethod as any) || "CASH",
                amount: total,
                reference: `Lunas - ${jobTicket.ticketNo}`,
              }],
            },
          },
        });
      } catch (txErr) {
        console.error("[pre-orders POST] Failed to create Transaction record:", txErr);
      }
    }

    return NextResponse.json(jobTicket, { status: 201 });
  } catch (error) {
    console.error("Error creating job ticket:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
