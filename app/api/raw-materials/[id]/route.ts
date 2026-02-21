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
    const material = await prisma.rawMaterial.findUnique({
      where: { id },
      include: {
        recipes: {
          include: {
            recipe: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!material) {
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
    const { name, sku, unit, stock, minStock, cost, supplier, notes, isActive } = body;

    // Check if material exists
    const existing = await prisma.rawMaterial.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Raw material not found" },
        { status: 404 }
      );
    }

    // Check if SKU is being changed and if it already exists
    if (sku && sku !== existing.sku) {
      const skuExists = await prisma.rawMaterial.findUnique({
        where: { sku },
      });
      if (skuExists) {
        return NextResponse.json(
          { error: "SKU already exists" },
          { status: 400 }
        );
      }
    }

    const material = await prisma.rawMaterial.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(sku !== undefined && { sku: sku || null }),
        ...(unit && { unit }),
        ...(stock !== undefined && { stock: parseFloat(stock) }),
        ...(minStock !== undefined && { minStock: parseFloat(minStock) }),
        ...(cost !== undefined && { cost: parseFloat(cost) }),
        ...(supplier !== undefined && { supplier: supplier || null }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(material);
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
    const material = await prisma.rawMaterial.findUnique({
      where: { id },
      include: {
        recipes: true,
      },
    });

    if (!material) {
      return NextResponse.json(
        { error: "Raw material not found" },
        { status: 404 }
      );
    }

    // Check if material is used in recipes
    if (material.recipes.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete material that is used in recipes" },
        { status: 400 }
      );
    }

    await prisma.rawMaterial.delete({
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
