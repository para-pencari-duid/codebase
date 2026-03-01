export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

/**
 * POST /api/whatsapp/disconnect
 * Disable WhatsApp in DB (Fonnte device stays paired).
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session || session.user.role === "KASIR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.settings.findFirst();
    if (!settings) {
      return NextResponse.json({ error: "Settings not found" }, { status: 400 });
    }

    await prisma.settings.update({
      where: { id: settings.id },
      data: { whatsappConnected: false, whatsappEnabled: false },
    });

    return NextResponse.json({ success: true, message: "WhatsApp dinonaktifkan" });
  } catch (error) {
    console.error("WhatsApp disconnect error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
