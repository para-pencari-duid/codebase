export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { getDateRange, getPreviousPeriodRange, calculatePercentageChange } from "@/lib/dashboard-utils";

/**
 * GET /api/dashboard/stats
 * Get quick stats: today's revenue, transactions, customers, etc.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get today's range
    const todayRange = getDateRange("today");
    const yesterdayRange = getPreviousPeriodRange(todayRange);

    // Today's transactions
    const todayTransactions = await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: todayRange.from,
          lte: todayRange.to,
        },
        status: "COMPLETED",
      },
      include: {
        items: true,
        customer: true,
      },
    });

    // Yesterday's transactions (for comparison)
    const yesterdayTransactions = await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: yesterdayRange.from,
          lte: yesterdayRange.to,
        },
        status: "COMPLETED",
      },
    });

    // Calculate today's metrics
    const todayRevenue = todayTransactions.reduce((sum, t) => sum + Number(t.total), 0);
    const todayCount = todayTransactions.length;
    const todayCustomers = new Set(
      todayTransactions.filter((t) => t.customerId).map((t) => t.customerId)
    ).size;

    // Calculate yesterday's metrics (for comparison)
    const yesterdayRevenue = yesterdayTransactions.reduce((sum, t) => sum + Number(t.total), 0);
    const yesterdayCount = yesterdayTransactions.length;
    const yesterdayCustomers = new Set(
      yesterdayTransactions.filter((t) => t.customerId).map((t) => t.customerId)
    ).size;

    // Low stock products count
    const lowStockCount = await prisma.product.count({
      where: {
        stock: {
          lte: prisma.product.fields.minStock,
        },
        isActive: true,
      },
    });

    // Best selling product today
    const productSales: Map<string, { name: string; quantity: number }> = new Map();
    
    todayTransactions.forEach((transaction) => {
      transaction.items.forEach((item) => {
        const existing = productSales.get(item.productId) || {
          name: item.productName,
          quantity: 0,
        };
        productSales.set(item.productId, {
          name: item.productName,
          quantity: existing.quantity + item.quantity,
        });
      });
    });

    const bestSellingProduct = Array.from(productSales.values())
      .sort((a, b) => b.quantity - a.quantity)[0] || null;

    // Calculate percentage changes
    const revenueChange = calculatePercentageChange(todayRevenue, yesterdayRevenue);
    const transactionsChange = calculatePercentageChange(todayCount, yesterdayCount);
    const customersChange = calculatePercentageChange(todayCustomers, yesterdayCustomers);

    return NextResponse.json({
      todayRevenue,
      todayTransactions: todayCount,
      todayCustomers,
      lowStockCount,
      revenueChange,
      transactionsChange,
      customersChange,
      bestSellingProduct,
    });
  } catch (error) {
    console.error("[DASHBOARD_STATS_GET]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
