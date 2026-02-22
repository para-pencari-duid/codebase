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

    const tenantId = session.user.tenantId!;

    // Get today's range
    const todayRange = getDateRange("today");
    const yesterdayRange = getPreviousPeriodRange(todayRange);

    // Today's transactions
    const todayTransactions = await prisma.transaction.findMany({
      where: {
        tenantId,
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
        tenantId,
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

    // Low stock items count (check via variants)
    const allVariants = await prisma.itemVariant.findMany({
      where: { isActive: true, item: { tenantId, isActive: true, type: "GOODS" } },
      select: { stock: true, minStock: true },
    });
    const lowStockCount = allVariants.filter(v => v.stock <= v.minStock).length;

    // Best selling product today
    const productSales: Map<string, { name: string; quantity: number }> = new Map();
    
    todayTransactions.forEach((transaction) => {
      transaction.items.forEach((item) => {
        const existing = productSales.get(item.variantId) || {
          name: item.itemName,
          quantity: 0,
        };
        productSales.set(item.variantId, {
          name: item.itemName,
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
