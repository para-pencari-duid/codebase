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

    const tenantId = session.user.tenantId!;

    const where: any = { tenantId };

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
        items: true,
        materials: true,
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

    const tenantId = session.user.tenantId!;

    // Generate order number
    const count = await prisma.productionOrder.count({ where: { tenantId } });
    const orderNo = `PROD-${String(count + 1).padStart(6, "0")}`;

    // Calculate required materials from BOM
    const materialsMap = new Map<string, {
      variantId: string;
      materialName: string;
      quantity: number;
      unit: string;
      cost: number;
    }>();

    for (const item of items) {
      // Look up Item from variant
      const variant = await prisma.itemVariant.findUnique({
        where: { id: item.variantId },
        select: { itemId: true },
      });

      if (!variant) {
        return NextResponse.json(
          { error: `Variant ${item.variantId} not found` },
          { status: 400 }
        );
      }

      const bom = await prisma.billOfMaterial.findUnique({
        where: { itemId: variant.itemId },
        include: {
          components: {
            include: {
              componentItem: { select: { id: true, name: true, unit: true } },
              variant: { select: { id: true, cost: true } },
            },
          },
        },
      });

      if (!bom) {
        return NextResponse.json(
          { error: `Bill of Materials not found for item variant ${item.variantId}` },
          { status: 400 }
        );
      }

      const batches = Math.ceil(item.targetQuantity / Number(bom.yield || 1));

      for (const component of bom.components) {
        // Resolve variant ID for the component
        let resolvedVariantId: string;
        let variantCost = 0;

        if (component.variantId && component.variant) {
          resolvedVariantId = component.variantId;
          variantCost = Number(component.variant.cost ?? 0);
        } else {
          const defaultVariant = await prisma.itemVariant.findFirst({
            where: { itemId: component.componentItemId, isActive: true },
            select: { id: true, cost: true },
          });
          if (!defaultVariant) continue;
          resolvedVariantId = defaultVariant.id;
          variantCost = Number(defaultVariant.cost ?? 0);
        }

        const quantity = Number(component.quantity) * batches;
        const cost = variantCost * quantity;

        const existing = materialsMap.get(resolvedVariantId);
        if (existing) {
          existing.quantity += quantity;
          existing.cost += cost;
        } else {
          materialsMap.set(resolvedVariantId, {
            variantId: resolvedVariantId,
            materialName: component.componentItem.name,
            quantity,
            unit: component.unit,
            cost,
          });
        }
      }
    }

    const materials = Array.from(materialsMap.values());
    const totalCost = materials.reduce((sum, m) => sum + m.cost, 0);

    // Create production order
    const production = await prisma.productionOrder.create({
      data: {
        tenantId,
        orderNo,
        scheduledDate: new Date(scheduledDate),
        status: "PLANNED",
        notes: notes || null,
        totalCost,
        userId: session.user.id,
        items: {
          create: items.map((item: any) => ({
            variantId: item.variantId,
            itemName: item.itemName || "",
            variantName: item.variantName || "Default",
            targetQuantity: parseInt(item.targetQuantity),
          })),
        },
        materials: {
          create: materials.map((m) => ({
            variantId: m.variantId,
            materialName: m.materialName,
            quantity: m.quantity,
            unit: m.unit,
            cost: m.cost,
          })),
        },
      },
      include: {
        items: true,
        materials: true,
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
