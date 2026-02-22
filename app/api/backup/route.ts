export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";

// TODO: Rewrite backup/restore for Universal ERP schema.
// The old models (Category, Product, LoyaltyPoint, PointHistory, Purchase, PurchaseItem)
// no longer exist. Implement a proper backup against the new schema when needed.

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [users, customers, transactions, settings] = await Promise.all([
      prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, createdAt: true } }),
      prisma.customer.findMany(),
      prisma.transaction.findMany(),
      prisma.settings.findMany(),
    ]);

    const backupData = {
      version: "2.0",
      exportedAt: new Date().toISOString(),
      data: {
        users,
        customers,
        transactions,
        settings,
      },
    };

    const fileName = `backup_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Error creating backup:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Implement restore for Universal ERP schema
    return NextResponse.json({
      message: "Restore berhasil (stub – implementasi penuh belum tersedia)",
      results: {},
    });
  } catch (error) {
    console.error("Error restoring backup:", error);
    return NextResponse.json(
      { error: "Gagal restore data: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    );
  }
}
