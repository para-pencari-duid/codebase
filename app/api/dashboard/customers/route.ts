export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { getDateRange } from "@/lib/dashboard-utils";
import type { DateRangeOption } from "@/lib/types/dashboard";

/**
 * GET /api/dashboard/customers?range=month
 * Get customer analytics and insights
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

    // Total customers (all time)
    const totalCustomers = await prisma.customer.count();

    // New customers in range
    const newCustomers = await prisma.customer.count({
      where: {
        createdAt: {
          gte: dateRange.from,
          lte: dateRange.to,
        },
      },
    });

    // Transactions in range with customer info
    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: dateRange.from,
          lte: dateRange.to,
        },
        status: "COMPLETED",
        customerId: {
          not: null,
        },
      },
      include: {
        customer: true,
      },
    });

    // Calculate returning customers (customers with 2+ transactions in range)
    const customerTransactionCounts = new Map<string, number>();
    transactions.forEach((t) => {
      if (t.customerId) {
        const count = customerTransactionCounts.get(t.customerId) || 0;
        customerTransactionCounts.set(t.customerId, count + 1);
      }
    });

    const returningCustomers = Array.from(customerTransactionCounts.values()).filter(
      (count) => count >= 2
    ).length;

    // Calculate average order value
    const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.total), 0);
    const averageOrderValue = transactions.length > 0 ? totalRevenue / transactions.length : 0;

    // Get top customers by spending
    const customerSpending = new Map<
      string,
      {
        id: string;
        name: string;
        phone: string | null;
        totalSpent: number;
        orderCount: number;
      }
    >();

    transactions.forEach((t) => {
      if (t.customer) {
        const existing = customerSpending.get(t.customer.id);
        const amount = Number(t.total);

        if (existing) {
          existing.totalSpent += amount;
          existing.orderCount += 1;
        } else {
          customerSpending.set(t.customer.id, {
            id: t.customer.id,
            name: t.customer.name,
            phone: t.customer.phone,
            totalSpent: amount,
            orderCount: 1,
          });
        }
      }
    });

    const topCustomers = Array.from(customerSpending.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    return NextResponse.json({
      totalCustomers,
      newCustomers,
      returningCustomers,
      averageOrderValue,
      topCustomers,
      range,
    });
  } catch (error) {
    console.error("[DASHBOARD_CUSTOMERS_GET]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
