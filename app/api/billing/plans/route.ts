import db from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Public endpoint — no auth required
export async function GET() {
    try {
        const plans = await db.subscriptionPlan.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
        });
        return NextResponse.json(plans);
    } catch (e) { console.error(e); return new NextResponse("Error", { status: 500 }); }
}
