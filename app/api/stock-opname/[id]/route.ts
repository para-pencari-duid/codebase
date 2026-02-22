import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

// GET /api/stock-opname/[id]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const opname = await prisma.stockOpname.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!opname) {
      return NextResponse.json(
        { error: "Stock opname not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(opname);
  } catch (error) {
    console.error("Error fetching stock opname:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock opname" },
      { status: 500 }
    );
  }
}

// PUT /api/stock-opname/[id] - Start, Update counts, or Complete
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const data = await req.json();
    const { action, items } = data;

    const opname = await prisma.stockOpname.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!opname) {
      return NextResponse.json(
        { error: "Stock opname not found" },
        { status: 404 }
      );
    }

    if (action === "start") {
      // Start the stock opname
      const updated = await prisma.stockOpname.update({
        where: { id },
        data: {
          status: "IN_PROGRESS",
          startedAt: new Date(),
          countedBy: session.user.id,
        },
        include: {
          items: true,
        },
      });

      return NextResponse.json(updated);
    } else if (action === "update") {
      // Update counted stocks
      if (!items || items.length === 0) {
        return NextResponse.json(
          { error: "No items to update" },
          { status: 400 }
        );
      }

      for (const item of items) {
        const variance = item.countedStock - item.systemStock;
        await prisma.stockOpnameItem.update({
          where: { id: item.id },
          data: {
            countedStock: item.countedStock,
            variance,
            reason: item.reason,
            condition: item.condition,
          },
        });
      }

      const updated = await prisma.stockOpname.findUnique({
        where: { id },
        include: {
          items: true,
        },
      });

      return NextResponse.json(updated);
    } else if (action === "complete") {
      // Complete and adjust stock
      if (opname.status !== "IN_PROGRESS") {
        return NextResponse.json(
          { error: "Stock opname must be in progress" },
          { status: 400 }
        );
      }

      await prisma.$transaction(async (tx) => {
        // Adjust stock for all items with variance
        for (const item of opname.items) {
          if (item.variance !== 0 && !item.adjusted) {
            await tx.itemVariant.update({
              where: { id: item.variantId },
              data: {
                stock: item.countedStock,
              },
            });

            // Create stock movement
            await tx.stockMovement.create({
              data: {
                tenantId: opname.tenantId,
                variantId: item.variantId,
                type: "ADJUSTMENT",
                quantity: Math.abs(item.variance),
                reference: opname.opnameNo,
                reason: `Stock Opname Adjustment${item.reason ? ` - ${item.reason}` : ""}`,
                notes: `System: ${item.systemStock}, Counted: ${item.countedStock}, Variance: ${item.variance}`,
                userId: session.user.id,
              },
            });

            // Mark item as adjusted
            await tx.stockOpnameItem.update({
              where: { id: item.id },
              data: { adjusted: true },
            });
          }
        }

        // Calculate total variance
        const totalVariance = opname.items.reduce(
          (sum, item) => sum + Math.abs(item.variance),
          0
        );

        // Update opname status
        await tx.stockOpname.update({
          where: { id },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
            verifiedBy: session.user.id,
            totalVariance,
          },
        });
      });

      const updated = await prisma.stockOpname.findUnique({
        where: { id },
        include: {
          items: true,
        },
      });

      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating stock opname:", error);
    return NextResponse.json(
      { error: "Failed to update stock opname" },
      { status: 500 }
    );
  }
}
