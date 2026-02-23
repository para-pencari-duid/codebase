export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { getOrCreateTenantId, initWhatsAppSession } from "@/lib/whatsapp";

/**
 * POST /api/whatsapp/init
 * Initialize WhatsApp session and get QR code
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session || session.user.role === "KASIR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create WhatsApp session ID
    const tenantId = await getOrCreateTenantId();

    // Initialize session with WA service
    const result = await initWhatsAppSession(tenantId);

    if (result.status === "qr_ready" && result.qr_code) {
      // Update settings - mark as connecting
      const settings = await prisma.settings.findFirst();
      if (settings) {
        await prisma.settings.update({
          where: { id: settings.id },
          data: {
            whatsappTenantId: tenantId,
            whatsappEnabled: true,
          },
        });
      }

      return NextResponse.json({
        success: true,
        qrCode: result.qr_code,
        tenantId,
        message: "Scan QR code dengan WhatsApp Anda",
      });
    }

    if (result.status === "connected") {
      // Already connected
      const settings = await prisma.settings.findFirst();
      if (settings) {
        await prisma.settings.update({
          where: { id: settings.id },
          data: {
            whatsappConnected: true,
            whatsappLastConnected: new Date(),
          },
        });
      }

      return NextResponse.json({
        success: true,
        connected: true,
        message: "WhatsApp sudah terhubung",
      });
    }

    return NextResponse.json(
      { error: result.error || "Failed to initialize WhatsApp" },
      { status: 500 }
    );
  } catch (error) {
    console.error("WhatsApp init error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
