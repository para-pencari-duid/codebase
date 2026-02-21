export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

/**
 * POST /api/debug/merge-settings
 * Merge duplicate settings records - keep the newest one
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session || session.user.role === "KASIR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allSettings = await prisma.settings.findMany({
      orderBy: { id: 'desc' } // Newest first
    });

    if (allSettings.length === 0) {
      return NextResponse.json({ message: "No settings found" });
    }

    if (allSettings.length === 1) {
      return NextResponse.json({ 
        message: "Only 1 settings record - no merge needed",
        settings: allSettings[0]
      });
    }

    console.log(`[Fix] Found ${allSettings.length} settings records`);

    // Keep the newest one (first in array)
    const keeper = allSettings[0];
    const toDelete = allSettings.slice(1);

    console.log(`[Fix] Keeping: ${keeper.id} (tenant: ${keeper.whatsappTenantId})`);
    console.log(`[Fix] Deleting: ${toDelete.map(s => `${s.id} (tenant: ${s.whatsappTenantId})`).join(', ')}`);

    // Delete old records
    for (const old of toDelete) {
      await prisma.settings.delete({
        where: { id: old.id }
      });
      console.log(`[Fix] Deleted settings: ${old.id}`);
    }

    return NextResponse.json({
      success: true,
      message: `Merged ${allSettings.length} settings into 1`,
      kept: {
        id: keeper.id,
        businessName: keeper.businessName,
        whatsappTenantId: keeper.whatsappTenantId,
        whatsappConnected: keeper.whatsappConnected,
      },
      deleted: toDelete.length,
    });
  } catch (error) {
    console.error("[Fix] Error merging settings:", error);
    return NextResponse.json(
      { 
        error: "Failed to merge settings",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
