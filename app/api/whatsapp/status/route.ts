export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { checkWhatsAppStatus } from "@/lib/whatsapp";

/**
 * GET /api/whatsapp/status?tenantId=xxx (optional)
 * Check WhatsApp connection status
 */
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get tenant ID from query param (for polling during QR scan)
    // or from database (for regular status check)
    const { searchParams } = new URL(request.url);
    const queryTenantId = searchParams.get("tenantId");

    const settings = await prisma.settings.findFirst();

    // Use query tenant ID if provided, otherwise use DB tenant ID
    const tenantId = queryTenantId || settings?.whatsappTenantId;

    if (!tenantId) {
      return NextResponse.json({
        connected: false,
        enabled: false,
        message: "WhatsApp belum dikonfigurasi",
      });
    }

    console.log(`[WA API] Checking status for tenant: ${tenantId}${queryTenantId ? ' (from query)' : ' (from DB)'}`);

    // Check actual connection status from WA service
    const status = await checkWhatsAppStatus(tenantId);
    const isConnected = status.status === "connected";

    console.log(`[WA API] Status response: ${status.status}, connected: ${isConnected}`);

    // Update database if status changed (only if we have settings)
    if (settings && settings.whatsappConnected !== isConnected) {
      console.log(`[WA API] Updating database connection status to: ${isConnected}`);
      await prisma.settings.update({
        where: { id: settings.id },
        data: {
          whatsappConnected: isConnected,
          // Don't update tenantId - it's set during init only
          ...(isConnected ? { whatsappLastConnected: new Date() } : {}),
        },
      });
    }

    return NextResponse.json({
      connected: isConnected,
      tenantId: tenantId,
      enabled: settings?.whatsappEnabled || false,
      lastConnected: settings?.whatsappLastConnected,
      notifications: {
        onTransaction: settings?.notifyOnTransaction || false,
        onLowStock: settings?.notifyOnLowStock || false,
        onBackup: settings?.notifyOnBackup || false,
        dailyReport: settings?.notifyDailyReport || false,
      },
    });
  } catch (error) {
    console.error("WhatsApp status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
