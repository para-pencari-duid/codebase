import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const { id } = await params;
        const integration = await db.marketplaceIntegration.findFirst({
            where: { id,
 },
            include: { orders: { orderBy: { syncedAt: "desc" }, take: 50 } },
        });
        if (!integration) return new NextResponse("Not Found", { status: 404 });
        return NextResponse.json(integration);
    } catch (e) { console.error(e); return new NextResponse("Error", { status: 500 }); }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const { id } = await params;
        const body = await req.json();

        if (body.action === "toggle") {
            const updated = await db.marketplaceIntegration.updateMany({
                where: { id },
                data: { isActive: body.isActive },
            });
            return NextResponse.json(updated);
        }

        if (body.action === "sync") {
            // Mock sync — update lastSyncAt and syncStatus
            const updated = await db.marketplaceIntegration.updateMany({
                where: { id },
                data: { lastSyncAt: new Date(), syncStatus: "synced" },
            });
            return NextResponse.json(updated);
        }

        const updated = await db.marketplaceIntegration.updateMany({
            where: { id },
            data: { shopName: body.shopName, apiKey: body.apiKey, apiSecret: body.apiSecret, accessToken: body.accessToken },
        });
        return NextResponse.json(updated);
    } catch (e) { console.error(e); return new NextResponse("Error", { status: 500 }); }
}
