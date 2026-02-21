export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

/**
 * GET /api/recipes
 * List all recipes with product info
 */
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    const where: any = {};
    if (productId) {
      where.productId = productId;
    }

    const recipes = await prisma.recipe.findMany({
      where,
      include: {
        product: {
          include: {
            category: true,
          },
        },
        ingredients: {
          include: {
            material: true,
          },
          orderBy: {
            material: {
              name: "asc",
            },
          },
        },
      },
      orderBy: {
        product: {
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
 * Create a new recipe with ingredients
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { productId, notes, yield: recipeYield, yieldUnit, prepTime, cookTime, ingredients } = body;

    if (!productId || !ingredients || ingredients.length === 0) {
      return NextResponse.json(
        { error: "Product ID and at least one ingredient are required" },
        { status: 400 }
      );
    }

    // Check if recipe already exists for this product
    const existing = await prisma.recipe.findUnique({
      where: { productId },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Recipe already exists for this product" },
        { status: 400 }
      );
    }

    // Create recipe with ingredients
    const recipe = await prisma.recipe.create({
      data: {
        productId,
        notes: notes || null,
        yield: recipeYield ? parseFloat(recipeYield) : 1,
        yieldUnit: yieldUnit || "pcs",
        prepTime: prepTime ? parseInt(prepTime) : null,
        cookTime: cookTime ? parseInt(cookTime) : null,
        ingredients: {
          create: ingredients.map((ing: any) => ({
            materialId: ing.materialId,
            quantity: parseFloat(ing.quantity),
            unit: ing.unit,
            notes: ing.notes || null,
          })),
        },
      },
      include: {
        product: true,
        ingredients: {
          include: {
            material: true,
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
