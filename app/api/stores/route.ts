import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

// GET /api/stores - List stores
export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stores = await prisma.store.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ stores });
  } catch (error) {
    console.error("Error fetching stores:", error);
    return NextResponse.json(
      { error: "Failed to fetch stores" },
      { status: 500 }
    );
  }
}

// POST /api/stores - Create new store
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { code, name, address, phone, email, manager, isMainStore } = data;

    const tenantId = session.user.tenantId!;

    // Check if code exists
    const existing = await prisma.store.findFirst({
      where: { tenantId, code },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Store code already exists" },
        { status: 400 }
      );
    }

    // If this is main store, unset other main stores
    if (isMainStore) {
      await prisma.store.updateMany({
        where: { tenantId, isMainStore: true },
        data: { isMainStore: false },
      });
    }

    const store = await prisma.store.create({
      data: {
        tenantId,
        code,
        name,
        address,
        phone,
        email,
        manager,
        isMainStore: isMainStore || false,
      },
    });

    return NextResponse.json(store, { status: 201 });
  } catch (error) {
    console.error("Error creating store:", error);
    return NextResponse.json(
      { error: "Failed to create store" },
      { status: 500 }
    );
  }
}
