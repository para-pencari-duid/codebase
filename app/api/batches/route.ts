import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";

// GET /api/batches - List item batches
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const variantId = searchParams.get("variantId") || searchParams.get("productId");
    const status = searchParams.get("status"); // active, expired, near-expiry
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const tenantId = session.user.tenantId!;

    const where: Prisma.ItemBatchWhereInput = {
      tenantId,
      isActive: true,
    };

    if (variantId) {
      where.variantId = variantId;
    }

    // Filter by status
    const now = new Date();
    if (status === "expired") {
      where.expiryDate = { lt: now };
    } else if (status === "near-expiry") {
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      where.expiryDate = {
        gte: now,
        lte: sevenDaysFromNow,
      };
    } else if (status === "active") {
      where.expiryDate = { gte: now };
      where.remainingQty = { gt: 0 };
    }

    const [batches, total] = await Promise.all([
      prisma.itemBatch.findMany({
        where,
        include: {
          variant: {
            include: {
              item: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  basePrice: true,
                  unit: true,
                },
              },
            },
          },
        },
        orderBy: { expiryDate: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.itemBatch.count({ where }),
    ]);

    // Calculate days until expiry and auto-discount for each batch
    const batchesWithDiscount = batches.map((batch) => {
      const daysUntilExpiry = Math.ceil(
        (batch.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      let autoDiscount = 0;
      if (daysUntilExpiry <= 0) {
        autoDiscount = 50;
      } else if (daysUntilExpiry <= 2) {
        autoDiscount = 30;
      } else if (daysUntilExpiry <= 5) {
        autoDiscount = 20;
      } else if (daysUntilExpiry <= 7) {
        autoDiscount = 10;
      }

      return {
        ...batch,
        daysUntilExpiry,
        autoDiscount: Math.max(autoDiscount, Number(batch.discountRate)),
      };
    });

    return NextResponse.json({
      batches: batchesWithDiscount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching batches:", error);
    return NextResponse.json(
      { error: "Failed to fetch batches" },
      { status: 500 }
    );
  }
}

// POST /api/batches - Create new item batch
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const {
      variantId,
      batchNo,
      quantity,
      manufactureDate,
      expiryDate,
      cost,
      supplier,
      notes,
    } = data;

    if (!variantId || !batchNo || !quantity || !expiryDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const tenantId = session.user.tenantId!;

    // Check if batch number already exists for this tenant
    const existingBatch = await prisma.itemBatch.findFirst({
      where: { batchNo, tenantId },
    });

    if (existingBatch) {
      return NextResponse.json(
        { error: "Batch number already exists" },
        { status: 400 }
      );
    }

    const qty = parseInt(quantity);

    // Create batch
    const batch = await prisma.itemBatch.create({
      data: {
        tenantId,
        variantId,
        batchNo,
        quantity: qty,
        remainingQty: qty,
        manufactureDate: manufactureDate ? new Date(manufactureDate) : new Date(),
        expiryDate: new Date(expiryDate),
        cost: parseFloat(cost || 0),
        supplier,
        notes,
      },
      include: {
        variant: {
          include: { item: true },
        },
      },
    });

    // Update variant stock
    await prisma.itemVariant.update({
      where: { id: variantId },
      data: {
        stock: { increment: qty },
      },
    });

    // Create stock movement record
    await prisma.stockMovement.create({
      data: {
        tenantId,
        variantId,
        type: "IN",
        quantity: qty,
        reference: batchNo,
        reason: "Batch received",
        notes: `Batch ${batchNo} - Expiry: ${new Date(expiryDate).toLocaleDateString()}`,
        userId: session.user.id,
      },
    });

    return NextResponse.json(batch, { status: 201 });
  } catch (error) {
    console.error("Error creating batch:", error);
    return NextResponse.json(
      { error: "Failed to create batch" },
      { status: 500 }
    );
  }
}

