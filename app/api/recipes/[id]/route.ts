export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

/**
 * GET /api/recipes/[id]
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
    const recipe = await prisma.recipe.findUnique({
      where: { id },
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
        },
      },
    });

    if (!recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    return NextResponse.json(recipe);
  } catch (error) {
    console.error("Failed to fetch recipe:", error);
    return NextResponse.json(
      { error: "Failed to fetch recipe" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/recipes/[id]
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
    const { notes, yield: recipeYield, yieldUnit, prepTime, cookTime, ingredients, isActive } = body;

    // Check if recipe exists
    const existing = await prisma.recipe.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    // Update recipe and ingredients
    const recipe = await prisma.recipe.update({
      where: { id },
      data: {
        ...(notes !== undefined && { notes }),
        ...(recipeYield !== undefined && { yield: parseFloat(recipeYield) }),
        ...(yieldUnit && { yieldUnit }),
        ...(prepTime !== undefined && { prepTime: prepTime ? parseInt(prepTime) : null }),
        ...(cookTime !== undefined && { cookTime: cookTime ? parseInt(cookTime) : null }),
        ...(isActive !== undefined && { isActive }),
        ...(ingredients && {
          ingredients: {
            deleteMany: {},
            create: ingredients.map((ing: any) => ({
              materialId: ing.materialId,
              quantity: parseFloat(ing.quantity),
              unit: ing.unit,
              notes: ing.notes || null,
            })),
          },
        }),
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

    return NextResponse.json(recipe);
  } catch (error) {
    console.error("Failed to update recipe:", error);
    return NextResponse.json(
      { error: "Failed to update recipe" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/recipes/[id]
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

    // Check if recipe exists
    const recipe = await prisma.recipe.findUnique({
      where: { id },
    });

    if (!recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    await prisma.recipe.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Recipe deleted successfully" });
  } catch (error) {
    console.error("Failed to delete recipe:", error);
    return NextResponse.json(
      { error: "Failed to delete recipe" },
      { status: 500 }
    );
  }
}
