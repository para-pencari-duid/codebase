export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

/**
 * GET /api/recipes
 * List all bills of material with item info
 */
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("productId") || searchParams.get("itemId");

    const where: any = {};
    if (itemId) {
      where.itemId = itemId;
    }

    const recipes = await prisma.billOfMaterial.findMany({
      where,
      include: {
        item: {
          include: {
            category: true,
          },
        },
        components: {
          include: {
            componentItem: true,
          },
          orderBy: {
            componentItem: {
              name: "asc",
            },
          },
        },
      },
      orderBy: {
        item: {
          name: "asc",
        },
      },
    });

    return NextResponse.json(recipes);
  } catch (error) {
    console.error("Failed to fetch recipes:", error);
    return NextResponse.json(
      { error: "Failed to fetch recipes" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/recipes
 * Create a new bill of material with components
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { itemId, productId, notes, yield: recipeYield, yieldUnit, prepTime, cookTime, ingredients } = body;

    const resolvedItemId = itemId || productId;

    if (!resolvedItemId || !ingredients || ingredients.length === 0) {
      return NextResponse.json(
        { error: "Item ID and at least one ingredient are required" },
        { status: 400 }
      );
    }

    // Check if BOM already exists for this item
    const existing = await prisma.billOfMaterial.findUnique({
      where: { itemId: resolvedItemId },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Recipe already exists for this item" },
        { status: 400 }
      );
    }

    // Create BOM with components
    const recipe = await prisma.billOfMaterial.create({
      data: {
        itemId: resolvedItemId,
        notes: notes || null,
        yield: recipeYield ? parseFloat(recipeYield) : 1,
        yieldUnit: yieldUnit || "pcs",
        prepTime: prepTime ? parseInt(prepTime) : null,
        cookTime: cookTime ? parseInt(cookTime) : null,
        components: {
          create: ingredients.map((ing: any) => ({
            componentItemId: ing.materialId || ing.componentItemId,
            quantity: parseFloat(ing.quantity),
            unit: ing.unit,
            notes: ing.notes || null,
          })),
        },
      },
      include: {
        item: true,
        components: {
          include: {
            componentItem: true,
          },
        },
      },
    });

    return NextResponse.json(recipe, { status: 201 });
  } catch (error) {
    console.error("Failed to create recipe:", error);
    return NextResponse.json(
      { error: "Failed to create recipe" },
      { status: 500 }
    );
  }
}
