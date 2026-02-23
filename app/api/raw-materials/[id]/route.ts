export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

/**
 * GET /api/raw-materials/[id]
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
    const material = await prisma.item.findUnique({
      where: { id },
      include: { variants: true },
    });

    if (!material || material.type !== "RAW_MATERIAL") {
      return NextResponse.json(
        { error: "Raw material not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(material);
  } catch (error) {
    console.error("Failed to fetch raw material:", error);
    return NextResponse.json(
      { error: "Failed to fetch raw material" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/raw-materials/[id]
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
    const { name, sku, unit, stock, minStock, cost, isActive } = body;

    // Check if material exists
    const existing = await prisma.item.findUnique({
      where: { id },
    });

    if (!existing || existing.type !== "RAW_MATERIAL") {
      return NextResponse.json(
        { error: "Raw material not found" },
        { status: 404 }
      );
    }

    // Check if SKU is being changed and if it already exists
    if (sku && sku !== existing.sku) {
      const skuExists = await prisma.item.findFirst({
        where: { sku },
      });
      if (skuExists) {
        return NextResponse.json(
          { error: "SKU already exists" },
          { status: 400 }
        );
      }
    }

    // Update item
    const material = await prisma.item.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(sku !== undefined && { sku: sku || existing.sku }),
        ...(unit && { unit }),
        ...(cost !== undefined && { baseCost: parseFloat(cost) }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    // Update default variant stock/minStock/cost
    const variant = await prisma.itemVariant.findFirst({ where: { itemId: id } });
    if (variant) {
      await prisma.itemVariant.update({
        where: { id: variant.id },
        data: {
          ...(stock !== undefined && { stock: parseFloat(stock) }),
          ...(minStock !== undefined && { minStock: parseFloat(minStock) }),
          ...(cost !== undefined && { cost: parseFloat(cost) }),
        },
      });
    }

    const result = await prisma.item.findUnique({
      where: { id },
      include: { variants: true },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to update raw material:", error);
    return NextResponse.json(
      { error: "Failed to update raw material" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/raw-materials/[id]
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

    // Check if material exists
    const material = await prisma.item.findUnique({
      where: { id },
    });

    if (!material || material.type !== "RAW_MATERIAL") {
      return NextResponse.json(
        { error: "Raw material not found" },
        { status: 404 }
      );
    }

    // Check if material is used in any BOM
    const usageCount = await prisma.bomItem.count({
      where: { componentItemId: id },
    });

    if (usageCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete material that is used in recipes" },
        { status: 400 }
      );
    }

    await prisma.item.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Raw material deleted successfully" });
  } catch (error) {
    console.error("Failed to delete raw material:", error);
    return NextResponse.json(
      { error: "Failed to delete raw material" },
      { status: 500 }
    );
  }
}
