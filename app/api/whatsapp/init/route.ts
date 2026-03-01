export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { getFonnteQRCode } from "@/lib/whatsapp";

/**
 * POST /api/whatsapp/init
 * Get Fonnte QR code for connecting WhatsApp
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session || session.user.role === "KASIR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await getFonnteQRCode();

    if (!result.status) {
      return NextResponse.json(
        { error: result.error || "Gagal mengambil QR code dari Fonnte" },
        { status: 503 }
      );
    }

    if (result.alreadyConnected) {
      // Device already linked — update DB
      const settings = await prisma.settings.findFirst();
      if (settings) {
        await prisma.settings.update({
          where: { id: settings.id },
          data: { whatsappConnected: true, whatsappEnabled: true, whatsappLastConnected: new Date() },
        });
      }
      return NextResponse.json({ success: true, connected: true, message: "WhatsApp sudah terhubung" });
    }

    // Mark as enabling (not yet connected until user scans)
    const settings = await prisma.settings.findFirst();
    if (settings) {
      await prisma.settings.update({
        where: { id: settings.id },
        data: { whatsappEnabled: true },
      });
    }

    return NextResponse.json({
      success: true,
      qrCode: result.qrBase64,
      message: "Scan QR code dengan WhatsApp Anda",
    });
  } catch (error) {
    console.error("WhatsApp init error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 503 }
    );
  }
}
