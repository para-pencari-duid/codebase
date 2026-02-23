import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";

// GET /api/stock-opname - List stock opnames
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Prisma.StockOpnameWhereInput = {};

    if (status) {
      where.status = status as any;
    }

    const [opnames, total] = await Promise.all([
      prisma.stockOpname.findMany({
        where,
        include: {
          items: true,
        },
        orderBy: { scheduledDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.stockOpname.count({ where }),
    ]);

    return NextResponse.json({
      opnames,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching stock opnames:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock opnames" },
      { status: 500 }
    );
  }
}

// POST /api/stock-opname - Create new stock opname
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { scheduledDate, variants } = data;

    // Generate opname number
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
    const lastOpname = await prisma.stockOpname.findFirst({
      where: {
        opnameNo: {
          startsWith: `OPN-${dateStr}`,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let opnameNo = `OPN-${dateStr}-001`;
    if (lastOpname) {
      const lastNum = parseInt(lastOpname.opnameNo.split("-")[2]);
      const nextNum = (lastNum + 1).toString().padStart(3, "0");
      opnameNo = `OPN-${dateStr}-${nextNum}`;
    }

    // Get variants to audit
    const variantList = variants && variants.length > 0
      ? await prisma.itemVariant.findMany({
          where: { id: { in: variants } },
          include: { item: { select: { name: true } } },
        })
      : await prisma.itemVariant.findMany({
          where: { item: { isActive: true, type: "GOODS" } },
          include: { item: { select: { name: true } } },
        });

    // Create opname with items
    const opname = await prisma.stockOpname.create({
      data: {
        opnameNo,
        scheduledDate: new Date(scheduledDate),
        status: "SCHEDULED",
        totalItems: variantList.length,
        items: {
          create: variantList.map((variant) => ({
            variantId: variant.id,
            itemName: variant.item.name,
            variantName: variant.name,
            systemStock: variant.stock,
            countedStock: 0,
            variance: 0,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json(opname, { status: 201 });
  } catch (error) {
    console.error("Error creating stock opname:", error);
    return NextResponse.json(
      { error: "Failed to create stock opname" },
      { status: 500 }
    );
  }
}
