export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { getDateRange } from "@/lib/dashboard-utils";
import type { DateRangeOption } from "@/lib/types/dashboard";

/**
 * GET /api/dashboard/top-products?range=month&limit=10
 * Get top selling products by quantity and revenue
 */
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const range = (searchParams.get("range") as DateRangeOption) || "month";
    const limit = parseInt(searchParams.get("limit") || "10");

    const dateRange = getDateRange(range);

    // Get all transaction items in range with product info
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
      },
    });

    // Aggregate by product
    const productMap = new Map<
      string,
      {
        id: string;
        name: string;
        category: string;
        quantitySold: number;
        revenue: number;
      }
    >();

    items.forEach((item) => {
      const existing = productMap.get(item.productId);
      const revenue = Number(item.subtotal);

      if (existing) {
        existing.quantitySold += item.quantity;
        existing.revenue += revenue;
      } else {
        productMap.set(item.productId, {
          id: item.productId,
          name: item.productName,
          category: item.product?.category?.name || "Uncategorized",
          quantitySold: item.quantity,
          revenue,
        });
      }
    });

    // Sort by quantity sold and get top N
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, limit);

    return NextResponse.json({
      data: topProducts,
      range,
      total: productMap.size,
    });
  } catch (error) {
    console.error("[DASHBOARD_TOP_PRODUCTS_GET]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
