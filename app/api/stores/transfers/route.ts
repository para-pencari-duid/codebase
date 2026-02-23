import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

// GET /api/stores/transfers - List store transfers
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");
    const status = searchParams.get("status");

    const where: any = {};

    if (storeId) {
      where.OR = [
        { fromStoreId: storeId },
        { toStoreId: storeId },
      ];
    }

    if (status) {
      where.status = status;
    }

    const transfers = await prisma.storeTransfer.findMany({
      where,
      include: {
        fromStore: true,
        toStore: true,
        items: true,
      },
      orderBy: { requestedAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ transfers });
  } catch (error) {
    console.error("Error fetching transfers:", error);
    return NextResponse.json(
      { error: "Failed to fetch transfers" },
      { status: 500 }
    );
  }
}

// POST /api/stores/transfers - Create new transfer
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { fromStoreId, toStoreId, items, notes } = data;

    // Generate transfer number
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
    const lastTransfer = await prisma.storeTransfer.findFirst({
      where: {
        transferNo: {
          startsWith: `TRF-${dateStr}`,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let transferNo = `TRF-${dateStr}-001`;
    if (lastTransfer) {
      const lastNum = parseInt(lastTransfer.transferNo.split("-")[2]);
      const nextNum = (lastNum + 1).toString().padStart(3, "0");
      transferNo = `TRF-${dateStr}-${nextNum}`;
    }

    // Create transfer
    const transfer = await prisma.storeTransfer.create({
      data: {
        transferNo,
        fromStoreId,
        toStoreId,
        status: "PENDING",
        requestedBy: session.user.id,
        notes,
        items: {
          create: items.map((item: any) => ({
            variantId: item.variantId,
            itemName: item.itemName,
            variantName: item.variantName || "",
            quantity: item.quantity,
          })),
        },
      },
      include: {
        fromStore: true,
        toStore: true,
        items: true,
      },
    });

    return NextResponse.json(transfer, { status: 201 });
  } catch (error) {
    console.error("Error creating transfer:", error);
    return NextResponse.json(
      { error: "Failed to create transfer" },
      { status: 500 }
    );
  }
}
