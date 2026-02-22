import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

// GET /api/shifts/current - Get current open shift for the user
export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const shift = await prisma.shift.findFirst({
      where: {
        userId: session.user.id,
        status: "OPEN",
      },
      include: {
        transactions: {
          select: {
            id: true,
            transactionNo: true,
            total: true,
            paymentMethod: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!shift) {
      return NextResponse.json({ shift: null });
    }

    // Calculate real-time totals from transactions
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

    return NextResponse.json({
      shift: {
        ...shift,
        totalSales,
        totalCash,
        totalTransfer,
        totalQris,
        totalCard,
        transactionCount: transactions.length,
      },
    });
  } catch (error) {
    console.error("Error fetching current shift:", error);
    return NextResponse.json(
      { error: "Failed to fetch current shift" },
      { status: 500 }
    );
  }
}
