export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { getDateRange } from "@/lib/dashboard-utils";
import type { DateRangeOption } from "@/lib/types/dashboard";

/**
 * GET /api/dashboard/sales-by-category?range=month
 * Get sales breakdown by product category
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

    // Get all transaction items in range with category info
    const items = await prisma.transactionItem.findMany({
      where: {
        transaction: {
          createdAt: {
            gte: dateRange.from,
            lte: dateRange.to,
          },
          status: "COMPLETED",
        },
      },
      include: {
        product: {
          include: {
            category: true,
          },
        },
        transaction: true,
      },
    });

    // Aggregate by category
    const categoryMap = new Map<
      string,
      {
        category: string;
        revenue: number;
        transactions: Set<string>;
        color?: string;
      }
    >();

    items.forEach((item) => {
      const categoryName = item.product?.category?.name || "Uncategorized";
      const categoryId = item.product?.category?.id || "uncategorized";
      const revenue = Number(item.subtotal);
      const transactionId = item.transactionId;

      const existing = categoryMap.get(categoryId);

      if (existing) {
        existing.revenue += revenue;
        existing.transactions.add(transactionId);
      } else {
        categoryMap.set(categoryId, {
          category: categoryName,
          revenue,
          transactions: new Set([transactionId]),
          color: item.product?.category?.color || undefined,
        });
      }
    });

    // Calculate total revenue for percentage
    const totalRevenue = Array.from(categoryMap.values()).reduce(
      (sum, cat) => sum + cat.revenue,
      0
    );

    // Format data with percentages
    const salesByCategory = Array.from(categoryMap.values())
      .map((cat) => ({
        category: cat.category,
        revenue: cat.revenue,
        transactions: cat.transactions.size,
        percentage: totalRevenue > 0 ? (cat.revenue / totalRevenue) * 100 : 0,
        color: cat.color,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return NextResponse.json({
      data: salesByCategory,
      range,
      totalRevenue,
    });
  } catch (error) {
    console.error("[DASHBOARD_SALES_BY_CATEGORY_GET]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
