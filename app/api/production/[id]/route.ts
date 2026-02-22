export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

/**
 * GET /api/production/[id]
 */
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
    const production = await prisma.productionOrder.findUnique({
      where: { id },
      include: {
        items: true,
        materials: true,
      },
    });

    if (!production) {
      return NextResponse.json(
        { error: "Production order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(production);
  } catch (error) {
    console.error("Failed to fetch production order:", error);
    return NextResponse.json(
      { error: "Failed to fetch production order" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/production/[id]
 * Update production order or change status
 */
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
    const body = await req.json();
    const { action, notes, items } = body;

    const tenantId = session.user.tenantId!;

    // Check if production exists
    const existing = await prisma.productionOrder.findUnique({
      where: { id },
      include: {
        items: true,
        materials: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Production order not found" },
        { status: 404 }
      );
    }

    // Handle different actions
    if (action === "start") {
      if (existing.status !== "PLANNED") {
        return NextResponse.json(
          { error: "Can only start planned production orders" },
          { status: 400 }
        );
      }

      // Check variant availability
      for (const material of existing.materials) {
        const variant = await prisma.itemVariant.findUnique({
          where: { id: material.variantId },
        });

        if (!variant) {
          return NextResponse.json(
            { error: `Material variant for ${material.materialName} not found` },
            { status: 400 }
          );
        }

        if (Number(variant.stock) < Number(material.quantity)) {
          return NextResponse.json(
            { error: `Insufficient stock for ${material.materialName}. Required: ${material.quantity} ${material.unit}, Available: ${variant.stock}` },
            { status: 400 }
          );
        }
      }

      // Deduct variant stock
      for (const material of existing.materials) {
        await prisma.itemVariant.update({
          where: { id: material.variantId },
          data: {
            stock: {
              decrement: Number(material.quantity),
            },
          },
        });
      }

      // Update status to IN_PROGRESS
      const production = await prisma.productionOrder.update({
        where: { id },
        data: {
          status: "IN_PROGRESS",
          startedAt: new Date(),
        },
        include: {
          items: true,
          materials: true,
        },
      });

      return NextResponse.json(production);
    } else if (action === "complete") {
      if (existing.status !== "IN_PROGRESS") {
        return NextResponse.json(
          { error: "Can only complete in-progress production orders" },
          { status: 400 }
        );
      }

      if (!items || items.length === 0) {
        return NextResponse.json(
          { error: "Production quantities are required" },
          { status: 400 }
        );
      }

      // Update item quantities and add to variant stock
      for (const itemUpdate of items) {
        const item = existing.items.find((i) => i.id === itemUpdate.id);
        if (!item) continue;

        // Update production item
        await prisma.productionOrderItem.update({
          where: { id: itemUpdate.id },
          data: {
            producedQuantity: parseInt(itemUpdate.producedQuantity),
            wasteQuantity: parseInt(itemUpdate.wasteQuantity || 0),
          },
        });

        // Add produced quantity to variant stock
        await prisma.itemVariant.update({
          where: { id: item.variantId },
          data: {
            stock: {
              increment: parseInt(itemUpdate.producedQuantity),
            },
          },
        });

        // Create stock movement for tracking
        await prisma.stockMovement.create({
          data: {
            tenantId,
            variantId: item.variantId,
            type: "IN",
            quantity: parseInt(itemUpdate.producedQuantity),
            reference: existing.orderNo,
            reason: "Production",
            notes: `Production order ${existing.orderNo} completed`,
            userId: session.user?.id || "",
          },
        });
      }

      // Update status to COMPLETED
      const production = await prisma.productionOrder.update({
        where: { id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
        include: {
          items: true,
          materials: true,
        },
      });

      return NextResponse.json(production);
    } else if (action === "cancel") {
      if (existing.status === "COMPLETED" || existing.status === "CANCELLED") {
        return NextResponse.json(
          { error: "Cannot cancel completed or already cancelled orders" },
          { status: 400 }
        );
      }

      // If production was started, return materials to stock
      if (existing.status === "IN_PROGRESS") {
        for (const material of existing.materials) {
          await prisma.itemVariant.update({
            where: { id: material.variantId },
            data: {
              stock: {
                increment: Number(material.quantity),
              },
            },
          });
        }
      }

      // Update status to CANCELLED
      const production = await prisma.productionOrder.update({
        where: { id },
        data: {
          status: "CANCELLED",
        },
        include: {
          items: true,
          materials: true,
        },
      });

      return NextResponse.json(production);
    } else {
      // Simple update
      const production = await prisma.productionOrder.update({
        where: { id },
        data: {
          ...(notes !== undefined && { notes }),
        },
        include: {
          items: true,
          materials: true,
        },
      });

      return NextResponse.json(production);
    }
  } catch (error) {
    console.error("Failed to update production order:", error);
    return NextResponse.json(
      { error: "Failed to update production order" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/production/[id]
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if production exists
    const production = await prisma.productionOrder.findUnique({
      where: { id },
    });

    if (!production) {
      return NextResponse.json(
        { error: "Production order not found" },
        { status: 404 }
      );
    }

    // Only allow deletion of planned orders
    if (production.status !== "PLANNED") {
      return NextResponse.json(
        { error: "Can only delete planned production orders" },
        { status: 400 }
      );
    }

    await prisma.productionOrder.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Production order deleted successfully" });
  } catch (error) {
    console.error("Failed to delete production order:", error);
    return NextResponse.json(
      { error: "Failed to delete production order" },
      { status: 500 }
    );
  }
}
