export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";
import { sendNotificationIfEnabled, createBackupSuccessMessage } from "@/lib/whatsapp";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Export all data for backup
    const [
      users,
      categories,
      products,
      customers,
      transactions,
      transactionItems,
      stockMovements,
      discounts,
      loyaltyPoints,
      pointHistory,
      suppliers,
      purchases,
      purchaseItems,
      settings,
    ] = await Promise.all([
      prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, createdAt: true } }),
      prisma.category.findMany(),
      prisma.product.findMany(),
      prisma.customer.findMany(),
      prisma.transaction.findMany(),
      prisma.transactionItem.findMany(),
      prisma.stockMovement.findMany(),
      prisma.discount.findMany(),
      prisma.loyaltyPoint.findMany(),
      prisma.pointHistory.findMany(),
      prisma.supplier.findMany(),
      prisma.purchase.findMany(),
      prisma.purchaseItem.findMany(),
      prisma.settings.findMany(),
    ]);

    const backupData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      data: {
        users,
        categories,
        products,
        customers,
        transactions,
        transactionItems,
        stockMovements,
        discounts,
        loyaltyPoints,
        pointHistory,
        suppliers,
        purchases,
        purchaseItems,
        settings,
      },
    };

    const fileName = `backup_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;

    // Send WhatsApp notification (async, fire and forget)
    const waSettings = await prisma.settings.findFirst();
    if (waSettings?.ownerPhone) {
      const fileSize = (JSON.stringify(backupData).length / 1024).toFixed(2) + " KB";
      const message = createBackupSuccessMessage(fileName, fileSize);
      
      sendNotificationIfEnabled(waSettings.ownerPhone, message, "backup").catch(
        (err) => console.error("[WA] Failed to send backup notification:", err)
      );
    }

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

    const body = await req.json();
    const { data, options } = body;

    if (!data || !data.version) {
      return NextResponse.json(
        { error: "Format backup tidak valid" },
        { status: 400 }
      );
    }

    const restoreOptions = options || {
      categories: true,
      products: true,
      customers: true,
      suppliers: true,
      settings: true,
    };

    const results: Record<string, number> = {};

    // Restore in correct order to maintain foreign key relationships
    if (restoreOptions.categories && data.data.categories) {
      for (const category of data.data.categories) {
        await prisma.category.upsert({
          where: { id: category.id },
          create: category,
          update: category,
        });
      }
      results.categories = data.data.categories.length;
    }

    if (restoreOptions.products && data.data.products) {
      for (const product of data.data.products) {
        await prisma.product.upsert({
          where: { id: product.id },
          create: product,
          update: product,
        });
      }
      results.products = data.data.products.length;
    }

    if (restoreOptions.customers && data.data.customers) {
      for (const customer of data.data.customers) {
        await prisma.customer.upsert({
          where: { id: customer.id },
          create: customer,
          update: customer,
        });
      }
      results.customers = data.data.customers.length;
    }

    if (restoreOptions.suppliers && data.data.suppliers) {
      for (const supplier of data.data.suppliers) {
        await prisma.supplier.upsert({
          where: { id: supplier.id },
          create: supplier,
          update: supplier,
        });
      }
      results.suppliers = data.data.suppliers.length;
    }

    if (restoreOptions.settings && data.data.settings) {
      for (const setting of data.data.settings) {
        await prisma.settings.upsert({
          where: { id: setting.id },
          create: setting,
          update: setting,
        });
      }
      results.settings = data.data.settings.length;
    }

    return NextResponse.json({
      message: "Data berhasil di-restore",
      results,
    });
  } catch (error) {
    console.error("Error restoring backup:", error);
    return NextResponse.json(
      { error: "Gagal restore data: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    );
  }
}
