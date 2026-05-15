export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

type ProductionWithItems = Awaited<
  ReturnType<typeof prisma.productionOrder.findMany>
>[number] & {
  items: {
    targetQuantity: number;
    producedQuantity: number;
    wasteQuantity: number;
  }[];
};

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const month = parseMonth(searchParams.get("month"));

    return NextResponse.json(await getProductionTargetSummary(month));
  } catch (error) {
    console.error("[PRODUCTION_TARGET_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch production target" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  return upsertProductionTarget(req);
}

export async function PUT(req: Request) {
  return upsertProductionTarget(req);
}

async function upsertProductionTarget(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role === "KASIR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const month = parseMonth(body.month);
    const targetQuantity = Math.max(
      0,
      Number.parseInt(String(body.targetQuantity ?? 0), 10) || 0,
    );
    const notes =
      typeof body.notes === "string" && body.notes.trim()
        ? body.notes.trim()
        : null;

    await prisma.productionTarget.upsert({
      where: { month },
      create: {
        month,
        targetQuantity,
        notes,
        createdBy: session.user.id,
      },
      update: {
        targetQuantity,
        notes,
      },
    });

    return NextResponse.json(await getProductionTargetSummary(month));
  } catch (error) {
    console.error("[PRODUCTION_TARGET_UPSERT]", error);
    return NextResponse.json(
      { error: "Failed to save production target" },
      { status: 500 },
    );
  }
}

async function getProductionTargetSummary(month: Date) {
  const { from, to } = getMonthRange(month);

  const [target, productions] = await Promise.all([
    prisma.productionTarget.findUnique({ where: { month } }),
    prisma.productionOrder.findMany({
      where: {
        scheduledDate: {
          gte: from,
          lte: to,
        },
      },
      include: {
        items: {
          select: {
            targetQuantity: true,
            producedQuantity: true,
            wasteQuantity: true,
          },
        },
      },
    }),
  ]);

  const totals = productions.reduce(
    (acc, production: ProductionWithItems) => {
      acc.totalOrders += 1;
      acc.statusCounts[production.status] =
        (acc.statusCounts[production.status] || 0) + 1;

      production.items.forEach((item) => {
        acc.plannedQuantity += item.targetQuantity;
        acc.producedQuantity += item.producedQuantity;
        acc.wasteQuantity += item.wasteQuantity;
      });

      return acc;
    },
    {
      plannedQuantity: 0,
      producedQuantity: 0,
      wasteQuantity: 0,
      totalOrders: 0,
      statusCounts: {} as Record<string, number>,
    },
  );

  const targetQuantity = target?.targetQuantity ?? 0;
  const progressPercentage =
    targetQuantity > 0
      ? Math.min(100, (totals.producedQuantity / targetQuantity) * 100)
      : 0;

  return {
    month: month.toISOString(),
    monthLabel: formatMonthLabel(month),
    targetQuantity,
    notes: target?.notes ?? "",
    plannedQuantity: totals.plannedQuantity,
    producedQuantity: totals.producedQuantity,
    wasteQuantity: totals.wasteQuantity,
    remainingQuantity: Math.max(0, targetQuantity - totals.producedQuantity),
    progressPercentage,
    totalOrders: totals.totalOrders,
    completedOrders: totals.statusCounts.COMPLETED || 0,
    statusCounts: totals.statusCounts,
  };
}

function parseMonth(value: unknown) {
  if (typeof value === "string" && /^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split("-").map(Number);
    return new Date(year, month - 1, 1);
  }

  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function getMonthRange(month: Date) {
  return {
    from: new Date(month.getFullYear(), month.getMonth(), 1),
    to: new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59, 999),
  };
}

function formatMonthLabel(month: Date) {
  return month.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
}
