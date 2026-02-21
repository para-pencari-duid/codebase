import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";

// GET /api/returns - List returns
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Prisma.ReturnWhereInput = {};

    if (status) {
      where.status = status as any;
    }

    const [returns, total] = await Promise.all([
      prisma.return.findMany({
        where,
        include: {
          items: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.return.count({ where }),
    ]);

    return NextResponse.json({
      returns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching returns:", error);
    return NextResponse.json(
      { error: "Failed to fetch returns" },
      { status: 500 }
    );
  }
}

// POST /api/returns - Create new return
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { transactionId, reason, items, refundMethod } = data;

    // Validate transaction exists
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        items: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Calculate return totals
    const subtotal = items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    );

    // Generate return number
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
    const lastReturn = await prisma.return.findFirst({
      where: {
        returnNo: {
          startsWith: `RET-${dateStr}`,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let returnNo = `RET-${dateStr}-001`;
    if (lastReturn) {
      const lastNum = parseInt(lastReturn.returnNo.split("-")[2]);
      const nextNum = (lastNum + 1).toString().padStart(3, "0");
      returnNo = `RET-${dateStr}-${nextNum}`;
    }

    // Create return
    const returnRecord = await prisma.return.create({
      data: {
        returnNo,
        transactionId,
        transactionNo: transaction.transactionNo,
        customerId: transaction.customerId,
        userId: session.user.id,
        reason,
        status: "PENDING",
        subtotal,
        refundAmount: subtotal,
        refundMethod: refundMethod || transaction.paymentMethod,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.price * item.quantity,
            returnToStock: item.returnToStock !== false,
            condition: item.condition || "GOOD",
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json(returnRecord, { status: 201 });
  } catch (error) {
    console.error("Error creating return:", error);
    return NextResponse.json(
      { error: "Failed to create return" },
      { status: 500 }
    );
  }
}
