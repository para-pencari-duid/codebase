export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { getDateRange, generateDateArray } from "@/lib/dashboard-utils";
import type { DateRangeOption } from "@/lib/types/dashboard";

/**
 * GET /api/dashboard/revenue?range=week
 * Get revenue time-series data for charts
 */
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId!;

    const { searchParams } = new URL(req.url);
    const range = (searchParams.get("range") as DateRangeOption) || "week";

    const dateRange = getDateRange(range);

    // Get all transactions in range
    const transactions = await prisma.transaction.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: dateRange.from,
          lte: dateRange.to,
        },
        status: "COMPLETED",
      },
      select: {
        createdAt: true,
        total: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Determine interval based on range
    let interval: "day" | "week" | "month" = "day";
    if (range === "year") {
      interval = "month";
    } else if (range === "month") {
      interval = "week";
    } else {
      interval = "day";
    }

    // Generate date array for the range
    const dates = generateDateArray(dateRange.from, dateRange.to, interval);

    // Aggregate data by date
    const revenueData = dates.map((date) => {
      const dateStr = date.toISOString().split("T")[0];
      
      // Filter transactions for this date (considering interval)
      const dayTransactions = transactions.filter((t) => {
        const tDate = new Date(t.createdAt);
        
        if (interval === "month") {
          return tDate.getMonth() === date.getMonth() && 
                 tDate.getFullYear() === date.getFullYear();
        } else if (interval === "week") {
          // Check if transaction is in the same week
          const weekStart = new Date(date);
          const weekEnd = new Date(date);
          weekEnd.setDate(weekEnd.getDate() + 6);
          return tDate >= weekStart && tDate <= weekEnd;
        } else {
          // Day
          return tDate.toISOString().split("T")[0] === dateStr;
        }
      });

      const revenue = dayTransactions.reduce((sum, t) => sum + Number(t.total), 0);
      const count = dayTransactions.length;

      return {
        date: dateStr,
        revenue,
        transactions: count,
      };
    });

    return NextResponse.json({
      data: revenueData,
      range,
      from: dateRange.from.toISOString(),
      to: dateRange.to.toISOString(),
    });
  } catch (error) {
    console.error("[DASHBOARD_REVENUE_GET]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
