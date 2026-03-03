export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

/**
 * GET /api/raw-materials
 * List all raw materials (Items with type=RAW_MATERIAL)
 */
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const isActiveParam = searchParams.get("isActive");

    const where: any = {
      type: "RAW_MATERIAL",
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }

    if (isActiveParam !== null && isActiveParam !== undefined) {
      where.isActive = isActiveParam === "true";
    }

    const rawMaterials = await prisma.item.findMany({
      where,
      include: { variants: true },
      orderBy: { name: "asc" },
    });

    // Flatten first variant fields so UI gets stock/minStock/cost directly
    const materials = rawMaterials.map((item) => {
      const variant = item.variants[0];
      return {
        id: item.id,
        name: item.name,
        sku: item.sku,
        unit: item.unit,
        isActive: item.isActive,
        supplier: item.description ?? null, // description is repurposed as supplier notes
        stock: variant ? Number(variant.stock) : 0,
        minStock: variant ? Number(variant.minStock) : 0,
        cost: variant ? Number(variant.cost ?? 0) : 0,
      };
    });

    return NextResponse.json(materials);
  } catch (error) {
    console.error("Failed to fetch raw materials:", error);
    return NextResponse.json(
      { error: "Failed to fetch raw materials" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/raw-materials
 * Create a new raw material (Item with type=RAW_MATERIAL + default variant)
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, sku, unit, stock, minStock, cost, supplier, notes } = body;

    if (!name || !unit) {
      return NextResponse.json(
        { error: "Name and unit are required" },
        { status: 400 }
      );
    }

    // Check if SKU already exists for this tenant
    if (sku) {
      const existing = await prisma.item.findFirst({
        where: { sku },
      });
      if (existing) {
        return NextResponse.json(
          { error: "SKU already exists" },
          { status: 400 }
        );
      }
    }

    const generatedSku = sku || `RM-${Date.now()}`;

    const material = await prisma.item.create({
      data: {
        name,
        sku: generatedSku,
        unit,
        type: "RAW_MATERIAL",
        basePrice: 0,
        baseCost: cost ? parseFloat(cost) : 0,
        description: notes || null,
        isActive: true,
        variants: {
          create: {
            sku: `${generatedSku}-DEFAULT`,
            name: "Default",
            price: 0,
            cost: cost ? parseFloat(cost) : 0,
            stock: stock ? parseFloat(stock) : 0,
            minStock: minStock ? parseFloat(minStock) : 1,
            isActive: true,
          },
        },
      },
      include: { variants: true },
    });

    return NextResponse.json(material, { status: 201 });
  } catch (error) {
    console.error("Failed to create raw material:", error);
    return NextResponse.json(
      { error: "Failed to create raw material" },
      { status: 500 }
    );
  }
}
