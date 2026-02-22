import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

// GET /api/batches/[id]
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

    const batch = await prisma.itemBatch.findUnique({
      where: { id },
      include: {
        variant: {
          include: { item: true },
        },
      },
    });

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    return NextResponse.json(batch);
  } catch (error) {
    console.error("Error fetching batch:", error);
    return NextResponse.json(
      { error: "Failed to fetch batch" },
      { status: 500 }
    );
  }
}

// PUT /api/batches/[id]
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

    const data = await req.json();
    const { discountRate, notes, isActive } = data;

    const batch = await prisma.itemBatch.update({
      where: { id },
      data: {
        discountRate: discountRate !== undefined ? parseFloat(discountRate) : undefined,
        notes,
        isActive,
      },
      include: {
        variant: {
          include: { item: true },
        },
      },
    });

    return NextResponse.json(batch);
  } catch (error) {
    console.error("Error updating batch:", error);
    return NextResponse.json(
      { error: "Failed to update batch" },
      { status: 500 }
    );
  }
}

// DELETE /api/batches/[id]
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

    const batch = await prisma.itemBatch.findUnique({
      where: { id },
    });

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    if (batch.remainingQty > 0) {
      return NextResponse.json(
        { error: "Cannot delete batch with remaining quantity" },
        { status: 400 }
      );
    }

    await prisma.itemBatch.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting batch:", error);
    return NextResponse.json(
      { error: "Failed to delete batch" },
      { status: 500 }
    );
  }
}
