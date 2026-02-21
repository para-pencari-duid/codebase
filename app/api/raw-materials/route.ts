export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

/**
 * GET /api/raw-materials
 * List all raw materials
 */
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const isActive = searchParams.get("isActive");

    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    const materials = await prisma.rawMaterial.findMany({
      where,
      orderBy: { name: "asc" },
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
 * Create a new raw material
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

    // Check if SKU already exists
    if (sku) {
      const existing = await prisma.rawMaterial.findUnique({
        where: { sku },
      });
      if (existing) {
        return NextResponse.json(
          { error: "SKU already exists" },
          { status: 400 }
        );
      }
    }

    const material = await prisma.rawMaterial.create({
      data: {
        name,
        sku: sku || null,
        unit,
        stock: stock ? parseFloat(stock) : 0,
        minStock: minStock ? parseFloat(minStock) : 1,
        cost: cost ? parseFloat(cost) : 0,
        supplier: supplier || null,
        notes: notes || null,
      },
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
