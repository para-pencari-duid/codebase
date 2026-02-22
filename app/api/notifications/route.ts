export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { sendNotificationIfEnabled, createLowStockMessage } from "@/lib/whatsapp";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};

    if (unreadOnly) {
      where.isRead = false;
    }

    if (type) {
      where.type = type;
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.notification.count({
        where: { isRead: false },
      }),
    ]);

    return NextResponse.json({
      data: notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
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
    const { action } = body;

    const tenantId = session.user.tenantId!;

    // Mark all as read
    if (action === "markAllRead") {
      await prisma.notification.updateMany({
        where: { isRead: false, tenantId },
        data: { isRead: true },
      });
      return NextResponse.json({ message: "Semua notifikasi telah dibaca" });
    }

    // Check low stock and create notifications
    if (action === "checkLowStock") {
      // Query ItemVariants with low stock
      const allVariants = await prisma.itemVariant.findMany({
        where: { isActive: true, item: { isActive: true, type: "GOODS", tenantId } },
        select: { id: true, stock: true, minStock: true, item: { select: { id: true, name: true } } },
      });
      const lowStockProducts = allVariants
        .filter((v) => Number(v.stock) <= Number(v.minStock))
        .map((v) => ({
          id: v.id,
          itemId: v.item.id,
          name: v.item.name,
          stock: Number(v.stock),
          minStock: Number(v.minStock),
        }));

      const notifications = [];

      for (const product of lowStockProducts) {
        // Check if notification already exists for this product today
        const existingNotification = await prisma.notification.findFirst({
          where: {
            tenantId,
            type: product.stock === 0 ? "OUT_OF_STOCK" : "LOW_STOCK",
            data: { contains: product.id },
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        });

        if (!existingNotification) {
          const notification = await prisma.notification.create({
            data: {
              tenantId,
              type: product.stock === 0 ? "OUT_OF_STOCK" : "LOW_STOCK",
              title: product.stock === 0 ? "Stok Habis" : "Stok Rendah",
              message: product.stock === 0
                ? `${product.name} sudah habis!`
                : `${product.name} tersisa ${product.stock} unit (minimum: ${product.minStock})`,
              data: JSON.stringify({ variantId: product.id, itemId: product.itemId, stock: product.stock, minStock: product.minStock }),
            },
          });
          notifications.push(notification);
        }
      }

      // Send WhatsApp notification if there are low stock products
      if (notifications.length > 0) {
        const settings = await prisma.settings.findFirst();
        if (settings?.ownerPhone) {
          const productsToNotify = lowStockProducts.slice(0, 5); // Limit to 5 products in message
          const message = createLowStockMessage(
            productsToNotify.map((p) => ({ name: p.name, stock: p.stock }))
          );

          sendNotificationIfEnabled(settings.ownerPhone, message, "lowstock", tenantId).catch(
            (err) => console.error("[WA] Failed to send low stock alert:", err)
          );
        }
      }

      return NextResponse.json({
        message: `${notifications.length} notifikasi baru dibuat`,
        notifications,
      });
    }

    return NextResponse.json({ error: "Action tidak valid" }, { status: 400 });
  } catch (error) {
    console.error("Error with notification action:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
