import { NextResponse } from "next/server";
import db from "@/lib/db";

export const runtime = "nodejs";

/**
 * Health check endpoint — also used as cron ping to prevent
 * Supabase free tier auto-pause after 7 days of inactivity.
 *
 * Setup free cron at cron-job.org pointing to:
 *   GET https://your-app.vercel.app/api/health
 * Schedule: daily at 07:00
 */
export async function GET() {
    try {
        await db.$queryRaw`SELECT 1`;
        return NextResponse.json({
            status: "ok",
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("[Health] DB error:", error);
        return NextResponse.json(
            { status: "error", message: "Database unreachable" },
            { status: 500 }
        );
    }
}
