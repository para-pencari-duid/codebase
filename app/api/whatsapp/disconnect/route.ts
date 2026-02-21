export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { disconnectWhatsApp } from "@/lib/whatsapp";

/**
 * POST /api/whatsapp/disconnect
 * Disconnect WhatsApp session
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session || session.user.role === "KASIR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.settings.findFirst();

    if (!settings?.whatsappTenantId) {
      return NextResponse.json(
        { error: "WhatsApp not configured" },
        { status: 400 }
      );
    }

    // Disconnect from WA service
    await disconnectWhatsApp(settings.whatsappTenantId);

    // Update database
    await prisma.settings.update({
      where: { id: settings.id },
      data: {
        whatsappConnected: false,
        whatsappEnabled: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "WhatsApp disconnected successfully",
    });
  } catch (error) {
    console.error("WhatsApp disconnect error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
