export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { getDateRange } from "@/lib/dashboard-utils";
import type { DateRangeOption } from "@/lib/types/dashboard";

/**
 * GET /api/expenses/summary?range=month
 * Get expense summary and analytics
 */
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const range = (searchParams.get("range") as DateRangeOption) || "month";

    const dateRange = getDateRange(range);

    // Get total expenses
    const expenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: dateRange.from,
          lte: dateRange.to,
        },
      },
      select: {
        amount: true,
        category: true,
        date: true,
      },
    });

    const totalExpenses = expenses.reduce(
      (sum, exp) => sum + Number(exp.amount),
      0
    );

    // Group by category
    const byCategory: Record<string, { amount: number; count: number }> = {};
    expenses.forEach((exp) => {
      if (!byCategory[exp.category]) {
        byCategory[exp.category] = { amount: 0, count: 0 };
      }
      byCategory[exp.category].amount += Number(exp.amount);
      byCategory[exp.category].count += 1;
    });

    // Convert to array and sort by amount
    const categoryBreakdown = Object.entries(byCategory)
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        count: data.count,
        percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Get comparison with previous period
    const previousRange = getPreviousPeriodRange(dateRange.from, dateRange.to);
    const previousExpenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: previousRange.from,
          lte: previousRange.to,
        },
      },
      select: {
        amount: true,
      },
    });

    const previousTotal = previousExpenses.reduce(
      (sum, exp) => sum + Number(exp.amount),
      0
    );

    const changePercentage =
      previousTotal > 0
        ? ((totalExpenses - previousTotal) / previousTotal) * 100
        : totalExpenses > 0
        ? 100
        : 0;

    return NextResponse.json({
      totalExpenses,
      totalCount: expenses.length,
      categoryBreakdown,
      previousTotal,
      changePercentage,
      range,
    });
  } catch (error) {
    console.error("Failed to fetch expense summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch expense summary" },
      { status: 500 }
    );
  }
}

// Helper function to get previous period range
function getPreviousPeriodRange(from: Date, to: Date) {
  const duration = to.getTime() - from.getTime();
  return {
    from: new Date(from.getTime() - duration),
    to: new Date(to.getTime() - duration),
  };
}
