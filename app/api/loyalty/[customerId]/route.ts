import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/loyalty/[customerId]
 * Returns current points balance and settings for UI display.
 */
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ customerId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

        const { customerId } = await params;
        const tenantId = session.user.tenantId!;

        const [settings, loyaltyPoint, recentHistory] = await Promise.all([
            db.settings.findFirst({
                where: { tenantId },
                select: {
                    loyaltyEnabled: true,
                    loyaltyPointsPerRupiah: true,
                    loyaltyPointValue: true,
                },
            }),
            db.loyaltyPoint.findUnique({
                where: { customerId },
            }),
            db.pointHistory.findMany({
                where: { customerId, tenantId },
                orderBy: { createdAt: "desc" },
                take: 10,
            }),
        ]);

        return NextResponse.json({
            enabled: settings?.loyaltyEnabled ?? false,
            pointsPerRupiah: settings?.loyaltyPointsPerRupiah ?? 1000,
            pointValue: settings?.loyaltyPointValue ?? 1,
            points: loyaltyPoint?.points ?? 0,
            totalEarned: loyaltyPoint?.totalEarned ?? 0,
            totalSpent: loyaltyPoint?.totalSpent ?? 0,
            history: recentHistory,
        });
    } catch (error) {
        console.error("[LOYALTY_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
