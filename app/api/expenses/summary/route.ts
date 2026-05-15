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
    const previousRange =
      range === "month"
        ? getPreviousMonthRange(dateRange.from)
        : getPreviousPeriodRange(dateRange.from, dateRange.to);

    const [expenses, previousExpenses] = await Promise.all([
      prisma.expense.findMany({
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
      }),
      prisma.expense.findMany({
        where: {
          date: {
            gte: previousRange.from,
            lte: previousRange.to,
          },
        },
        select: {
          amount: true,
          category: true,
          date: true,
        },
      }),
    ]);

    const currentSummary = summarizeExpenses(expenses);
    const previousSummary = summarizeExpenses(previousExpenses);
    const totalExpenses = currentSummary.total;
    const previousTotal = previousSummary.total;

    const changePercentage =
      previousTotal > 0
        ? ((totalExpenses - previousTotal) / previousTotal) * 100
        : totalExpenses > 0
        ? 100
        : 0;
    const changeAmount = totalExpenses - previousTotal;

    const allCategories = new Set([
      ...Object.keys(currentSummary.byCategory),
      ...Object.keys(previousSummary.byCategory),
    ]);

    const categoryBreakdown = Array.from(allCategories)
      .map((category) => {
        const current = currentSummary.byCategory[category] || {
          amount: 0,
          count: 0,
        };
        const previous = previousSummary.byCategory[category] || {
          amount: 0,
          count: 0,
        };
        const categoryChange = current.amount - previous.amount;

        return {
          category,
          amount: current.amount,
          count: current.count,
          previousAmount: previous.amount,
          previousCount: previous.count,
          changeAmount: categoryChange,
          changePercentage:
            previous.amount > 0
              ? (categoryChange / previous.amount) * 100
              : current.amount > 0
                ? 100
                : 0,
          percentage:
            totalExpenses > 0 ? (current.amount / totalExpenses) * 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    const topCategory = categoryBreakdown[0] || null;
    const largestIncrease =
      categoryBreakdown
        .filter((category) => category.changeAmount > 0)
        .sort((a, b) => b.changeAmount - a.changeAmount)[0] || null;
    const biggestSaving =
      categoryBreakdown
        .filter((category) => category.changeAmount < 0)
        .sort((a, b) => a.changeAmount - b.changeAmount)[0] || null;

    return NextResponse.json({
      totalExpenses,
      totalCount: currentSummary.count,
      currentTotal: totalExpenses,
      currentCount: currentSummary.count,
      categoryBreakdown,
      previousTotal,
      previousCount: previousSummary.count,
      changeAmount,
      changePercentage,
      currentLabel: formatMonthLabel(dateRange.from),
      previousLabel: formatMonthLabel(previousRange.from),
      insights: {
        topCategory,
        largestIncrease,
        biggestSaving,
        trend:
          changeAmount > 0 ? "up" : changeAmount < 0 ? "down" : "flat",
      },
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

function getPreviousMonthRange(currentMonthStart: Date) {
  return {
    from: new Date(
      currentMonthStart.getFullYear(),
      currentMonthStart.getMonth() - 1,
      1,
    ),
    to: new Date(
      currentMonthStart.getFullYear(),
      currentMonthStart.getMonth(),
      0,
      23,
      59,
      59,
      999,
    ),
  };
}

function summarizeExpenses(
  expenses: { amount: unknown; category: string }[],
) {
  const byCategory: Record<string, { amount: number; count: number }> = {};
  const total = expenses.reduce((sum, expense) => {
    const amount = Number(expense.amount);
    if (!byCategory[expense.category]) {
      byCategory[expense.category] = { amount: 0, count: 0 };
    }
    byCategory[expense.category].amount += amount;
    byCategory[expense.category].count += 1;
    return sum + amount;
  }, 0);

  return {
    total,
    count: expenses.length,
    byCategory,
  };
}

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
}
