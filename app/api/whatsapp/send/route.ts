export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

/**
 * POST /api/whatsapp/send
 * Send WhatsApp message (manual/testing)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role === "KASIR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { phone, message } = body;

    if (!phone || !message) {
      return NextResponse.json(
        { error: "Phone and message are required" },
        { status: 400 }
      );
    }

    const settings = await prisma.settings.findFirst();

    if (!settings?.whatsappTenantId || !settings?.whatsappEnabled) {
      return NextResponse.json(
        { error: "WhatsApp not configured or not enabled" },
        { status: 400 }
      );
    }

    // Send message
    const result = await sendWhatsAppMessage(
      settings.whatsappTenantId,
      phone,
      message
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Message sent successfully",
      });
    } else {
      return NextResponse.json(
        {
          error: result.error,
          rateLimitReset: result.rateLimitReset,
        },
        { status: 429 }
      );
    }
  } catch (error) {
    console.error("WhatsApp send error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
