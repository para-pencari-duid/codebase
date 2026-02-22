export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { disconnectWhatsApp } from "@/lib/whatsapp";

/**
 * POST /api/whatsapp/reset
 * Full reset: disconnect + clear tenant ID + reset all WA settings
 * Use this for fresh start, changing phone, or fixing session errors
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const erpTenantId = session.user.tenantId!;
    const settings = await prisma.settings.findFirst({ where: { tenantId: erpTenantId } });
    
    if (!settings) {
      return NextResponse.json(
        { error: "Settings tidak ditemukan" },
        { status: 404 }
      );
    }

    // Disconnect from WA Gateway if connected
    if (settings.whatsappTenantId) {
      try {
        console.log(`[WA Reset] Disconnecting tenant: ${settings.whatsappTenantId}`);
        await disconnectWhatsApp(settings.whatsappTenantId);
      } catch (error) {
        console.error("[WA Reset] Error disconnecting:", error);
        // Continue with reset even if disconnect fails
      }
    }

    // Clear ALL WhatsApp settings
    await prisma.settings.update({
      where: { id: settings.id },
      data: {
        whatsappConnected: false,
        whatsappEnabled: false,
        whatsappTenantId: null, // Clear tenant ID - will generate new on next connect
        whatsappLastConnected: null,
        notifyOnTransaction: false,
        notifyOnLowStock: false,
        notifyOnBackup: false,
        notifyDailyReport: false,
        ownerPhone: null, // Optional: clear owner phone too
      },
    });

    console.log("[WA Reset] Full reset complete - tenant ID cleared");

    return NextResponse.json({
      success: true,
      message: "WhatsApp telah di-reset. Tenant ID baru akan dibuat saat connect lagi.",
    });
  } catch (error) {
    console.error("[WA Reset] Error:", error);
    return NextResponse.json(
      {
        error: "Gagal reset WhatsApp",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
