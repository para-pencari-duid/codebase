import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

// GET /api/batches/alerts - Get near-expiry and expired batches
export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Get expired batches
    const expired = await prisma.itemBatch.findMany({
      where: {
        expiryDate: { lt: now },
        remainingQty: { gt: 0 },
        isActive: true,
      },
      include: {
        variant: {
          include: {
            item: {
              select: {
                id: true,
                name: true,
                sku: true,
                basePrice: true,
              },
            },
          },
        },
      },
      orderBy: { expiryDate: "desc" },
      take: 20,
    });

    // Get near-expiry batches (within 7 days)
    const nearExpiry = await prisma.itemBatch.findMany({
      where: {
        expiryDate: {
          gte: now,
          lte: sevenDaysFromNow,
        },
        remainingQty: { gt: 0 },
        isActive: true,
      },
      include: {
        variant: {
          include: {
            item: {
              select: {
                id: true,
                name: true,
                sku: true,
                basePrice: true,
              },
            },
          },
        },
      },
      orderBy: { expiryDate: "asc" },
      take: 20,
    });

    // Calculate recommended discounts
    const enrichedExpired = expired.map((batch) => {
      const daysExpired = Math.ceil(
        (now.getTime() - batch.expiryDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        ...batch,
        daysUntilExpiry: -daysExpired,
        recommendedDiscount: 50,
        urgency: "critical" as const,
      };
    });

    const enrichedNearExpiry = nearExpiry.map((batch) => {
      const daysUntilExpiry = Math.ceil(
        (batch.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      let recommendedDiscount = 0;
      let urgency: "high" | "medium" | "low" = "low";
      
      if (daysUntilExpiry <= 2) {
        recommendedDiscount = 30;
        urgency = "high";
      } else if (daysUntilExpiry <= 5) {
        recommendedDiscount = 20;
        urgency = "medium";
      } else {
        recommendedDiscount = 10;
        urgency = "low";
      }

      return {
        ...batch,
        daysUntilExpiry,
        recommendedDiscount: Math.max(recommendedDiscount, Number(batch.discountRate)),
        urgency,
      };
    });

    return NextResponse.json({
      expired: enrichedExpired,
      nearExpiry: enrichedNearExpiry,
      summary: {
        totalExpired: expired.length,
        totalNearExpiry: nearExpiry.length,
        totalAlerts: expired.length + nearExpiry.length,
      },
    });
  } catch (error) {
    console.error("Error fetching batch alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch batch alerts" },
      { status: 500 }
    );
  }
}
