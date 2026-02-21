export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/db";

/**
 * GET /api/debug/settings
 * Debug endpoint to check settings table
 */
export async function GET() {
  try {
    const settings = await prisma.settings.findMany();
    
    return NextResponse.json({
      total: settings.length,
      records: settings.map(s => ({
        id: s.id,
        businessName: s.businessName,
        taxRate: s.taxRate,
        whatsappTenantId: s.whatsappTenantId,
        whatsappConnected: s.whatsappConnected,
        whatsappEnabled: s.whatsappEnabled,
        ownerPhone: s.ownerPhone,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
