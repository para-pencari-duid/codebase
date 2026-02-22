import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";

// GET /api/shifts - List shifts
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Prisma.ShiftWhereInput = {};

    if (status) {
      where.status = status as "OPEN" | "CLOSED";
    }

    if (userId) {
      where.userId = userId;
    }

    const [shifts, total] = await Promise.all([
      prisma.shift.findMany({
        where,
        include: {
          transactions: {
            select: {
              id: true,
              transactionNo: true,
              total: true,
              paymentMethod: true,
            },
          },
        },
        orderBy: { openedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.shift.count({ where }),
    ]);

    return NextResponse.json({
      shifts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching shifts:", error);
    return NextResponse.json(
      { error: "Failed to fetch shifts" },
      { status: 500 }
    );
  }
}

// POST /api/shifts - Create (open) new shift
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { openingBalance, notes } = data;

    // Check if user already has an open shift
    const existingShift = await prisma.shift.findFirst({
      where: {
        userId: session.user.id,
        status: "OPEN",
      },
    });

    if (existingShift) {
      return NextResponse.json(
        { error: "You already have an open shift. Please close it first." },
        { status: 400 }
      );
    }

    // Generate shift number
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
    const lastShift = await prisma.shift.findFirst({
      where: {
        shiftNo: {
          startsWith: `SHIFT-${dateStr}`,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let shiftNo = `SHIFT-${dateStr}-001`;
    if (lastShift) {
      const lastNum = parseInt(lastShift.shiftNo.split("-")[2]);
      const nextNum = (lastNum + 1).toString().padStart(3, "0");
      shiftNo = `SHIFT-${dateStr}-${nextNum}`;
    }

    // Create shift
    const tenantId = session.user.tenantId!;
    const shift = await prisma.shift.create({
      data: {
        tenantId,
        shiftNo,
        userId: session.user.id,
        openingBalance: parseFloat(openingBalance || 0),
        status: "OPEN",
        notes,
      },
    });

    return NextResponse.json(shift, { status: 201 });
  } catch (error) {
    console.error("Error creating shift:", error);
    return NextResponse.json(
      { error: "Failed to create shift" },
      { status: 500 }
    );
  }
}
