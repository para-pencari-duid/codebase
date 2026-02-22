import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

// GET /api/shifts/[id]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const shift = await prisma.shift.findUnique({
      where: { id },
      include: {
        transactions: {
          select: {
            id: true,
            transactionNo: true,
            total: true,
            paymentMethod: true,
            createdAt: true,
            items: {
              select: {
                itemName: true,
                quantity: true,
                price: true,
                subtotal: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!shift) {
      return NextResponse.json({ error: "Shift not found" }, { status: 404 });
    }

    return NextResponse.json(shift);
  } catch (error) {
    console.error("Error fetching shift:", error);
    return NextResponse.json(
      { error: "Failed to fetch shift" },
      { status: 500 }
    );
  }
}

// PUT /api/shifts/[id] - Close shift
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const data = await req.json();
    const { action, actualCash, notes } = data;

    if (action !== "close") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Get shift with transactions
    const shift = await prisma.shift.findUnique({
      where: { id },
      include: {
        transactions: true,
      },
    });

    if (!shift) {
      return NextResponse.json({ error: "Shift not found" }, { status: 404 });
    }

    if (shift.status === "CLOSED") {
      return NextResponse.json(
        { error: "Shift is already closed" },
        { status: 400 }
      );
    }

    if (shift.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only close your own shift" },
        { status: 403 }
      );
    }

    // Calculate totals from transactions
    const transactions = shift.transactions;
    
    const totalSales = transactions.reduce(
      (sum, t) => sum + Number(t.total),
      0
    );

    const totalCash = transactions
      .filter((t) => t.paymentMethod === "CASH")
      .reduce((sum, t) => sum + Number(t.total), 0);

    const totalTransfer = transactions
      .filter((t) => t.paymentMethod === "TRANSFER")
      .reduce((sum, t) => sum + Number(t.total), 0);

    const totalQris = transactions
      .filter((t) => t.paymentMethod === "QRIS")
      .reduce((sum, t) => sum + Number(t.total), 0);

    const totalCard = transactions
      .filter((t) => t.paymentMethod !== null && ["DEBIT_CARD", "CREDIT_CARD"].includes(t.paymentMethod))
      .reduce((sum, t) => sum + Number(t.total), 0);

    // Calculate expected closing balance (opening + cash sales)
    const closingBalance = Number(shift.openingBalance) + totalCash;
    const actualCashAmount = parseFloat(actualCash || closingBalance);
    const variance = actualCashAmount - closingBalance;

    // Update shift
    const updatedShift = await prisma.shift.update({
      where: { id },
      data: {
        status: "CLOSED",
        closedAt: new Date(),
        closingBalance,
        actualCash: actualCashAmount,
        variance,
        totalSales,
        totalCash,
        totalTransfer,
        totalQris,
        totalCard,
        transactionCount: transactions.length,
        notes: notes || shift.notes,
      },
      include: {
        transactions: {
          select: {
            id: true,
            transactionNo: true,
            total: true,
            paymentMethod: true,
          },
        },
      },
    });

    return NextResponse.json(updatedShift);
  } catch (error) {
    console.error("Error closing shift:", error);
    return NextResponse.json(
      { error: "Failed to close shift" },
      { status: 500 }
    );
  }
}
