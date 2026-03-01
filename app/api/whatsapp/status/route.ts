export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { checkWhatsAppStatus } from "@/lib/whatsapp";

/**
 * GET /api/whatsapp/status
 * Check WhatsApp connection status via Fonnte
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.settings.findFirst();

    // Ask Fonnte for live device status
    const status = await checkWhatsAppStatus();
    const isConnected = status.connected;

    // Sync DB if changed
    if (settings && settings.whatsappConnected !== isConnected) {
      await prisma.settings.update({
        where: { id: settings.id },
        data: {
          whatsappConnected: isConnected,
          ...(isConnected ? { whatsappLastConnected: new Date() } : {}),
        },
      });
    }

    return NextResponse.json({
      connected: isConnected,
      enabled: settings?.whatsappEnabled || false,
      device: status.device || null,
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
