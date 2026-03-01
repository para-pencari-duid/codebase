export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";

// GET /api/pre-orders/recap?date=2026-03-01
// Returns all orders with pickupDate on a given date (default: tomorrow)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");

    // Default: tomorrow
    const target = dateParam ? new Date(dateParam) : (() => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d;
    })();

    // Start and end of target day
    const start = new Date(target);
    start.setHours(0, 0, 0, 0);
    const end = new Date(target);
    end.setHours(23, 59, 59, 999);

    const orders = await prisma.jobTicket.findMany({
      where: {
        dueDate: { gte: start, lte: end },
        status: { notIn: ["CANCELLED"] },
      },
      include: {
        items: true,
        createdByUser: { select: { name: true } },
      },
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json({ orders, date: start.toISOString(), total: orders.length });
  } catch (error) {
    console.error("[RECAP]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
