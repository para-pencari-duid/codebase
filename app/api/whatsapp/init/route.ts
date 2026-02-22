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

    const erpTenantId = session.user.tenantId!;

    // Get or create tenant ID scoped to this tenant
    const tenantId = await getOrCreateTenantId(erpTenantId);

    // Initialize session with WA service
    const result = await initWhatsAppSession(tenantId);

    if (result.status === "qr_ready" && result.qr_code) {
      // Update settings - mark as connecting
      const settings = await prisma.settings.findFirst({ where: { tenantId: erpTenantId } });
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
      const settings = await prisma.settings.findFirst({ where: { tenantId: erpTenantId } });
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
