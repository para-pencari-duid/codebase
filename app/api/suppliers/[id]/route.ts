export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        purchases: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: {
          select: { purchases: true },
        },
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(supplier);
  } catch (error) {
    console.error("Error fetching supplier:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, phone, email, address, contactName, notes, isActive } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Nama supplier wajib diisi" },
        { status: 400 }
      );
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name,
        phone,
        email,
        address,
        contactName,
        notes,
        isActive,
      },
    });

    return NextResponse.json(supplier);
  } catch (error) {
    console.error("Error updating supplier:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if supplier has purchases
    const purchaseCount = await prisma.purchase.count({
      where: { supplierId: id },
    });

    if (purchaseCount > 0) {
      // Soft delete - just mark as inactive
      await prisma.supplier.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({ message: "Supplier dinonaktifkan karena memiliki riwayat pembelian" });
    }

    await prisma.supplier.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Supplier berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting supplier:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
