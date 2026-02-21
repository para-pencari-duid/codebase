export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

/**
 * GET /api/production
 * List all production orders
 */
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (from || to) {
      where.scheduledDate = {};
      if (from) where.scheduledDate.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.scheduledDate.lte = toDate;
      }
    }

    const productions = await prisma.productionOrder.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                unit: true,
              },
            },
          },
        },
        materials: {
          include: {
            material: {
              select: {
                id: true,
                name: true,
                unit: true,
              },
            },
          },
        },
      },
      orderBy: { scheduledDate: "desc" },
    });

    return NextResponse.json(productions);
  } catch (error) {
    console.error("Failed to fetch production orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch production orders" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/production
 * Create a new production order
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { scheduledDate, notes, items } = body;

    if (!scheduledDate || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Scheduled date and at least one item are required" },
        { status: 400 }
      );
    }

    // Generate order number
    const count = await prisma.productionOrder.count();
    const orderNo = `PROD-${String(count + 1).padStart(6, "0")}`;

    // Calculate required materials from recipes
    const materials: { materialId: string; materialName: string; quantity: number; unit: string; cost: number }[] = [];
    
    for (const item of items) {
      const recipe = await prisma.recipe.findUnique({
        where: { productId: item.productId },
        include: {
          ingredients: {
            include: {
              material: true,
            },
          },
        },
      });

      if (!recipe) {
        return NextResponse.json(
          { error: `Recipe not found for product ${item.productId}` },
          { status: 400 }
        );
      }

      // Calculate material quantities based on target quantity and recipe yield
      const batches = Math.ceil(item.targetQuantity / Number(recipe.yield));
      
      for (const ingredient of recipe.ingredients) {
        const existingMaterial = materials.find(m => m.materialId === ingredient.materialId);
        const quantity = Number(ingredient.quantity) * batches;
        const cost = Number(ingredient.material.cost) * quantity;

        if (existingMaterial) {
          existingMaterial.quantity += quantity;
          existingMaterial.cost += cost;
        } else {
          materials.push({
            materialId: ingredient.materialId,
            materialName: ingredient.material.name,
            quantity,
            unit: ingredient.unit,
            cost,
          });
        }
      }
    }

    // Calculate total cost
    const totalCost = materials.reduce((sum, m) => sum + m.cost, 0);

    // Create production order
    const production = await prisma.productionOrder.create({
      data: {
        orderNo,
        scheduledDate: new Date(scheduledDate),
        status: "PLANNED",
        notes: notes || null,
        totalCost,
        userId: session.user.id,
        items: {
          create: items.map((item: any) => {
            // Get product name synchronously since we need it
            return {
              productId: item.productId,
              productName: item.productName || "",
              targetQuantity: parseInt(item.targetQuantity),
            };
          }),
        },
        materials: {
          create: materials.map(m => ({
            materialId: m.materialId,
            materialName: m.materialName,
            quantity: m.quantity,
            unit: m.unit,
            cost: m.cost,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        materials: {
          include: {
            material: true,
          },
        },
      },
    });

    return NextResponse.json(production, { status: 201 });
  } catch (error) {
    console.error("Failed to create production order:", error);
    return NextResponse.json(
      { error: "Failed to create production order" },
      { status: 500 }
    );
  }
}
