import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const integrationSchema = z.object({
    platform: z.string().min(1),
    shopId: z.string().optional(),
    shopName: z.string().optional(),
    apiKey: z.string().optional(),
    apiSecret: z.string().optional(),
    accessToken: z.string().optional(),
});

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const integrations = await db.marketplaceIntegration.findMany({
            where: { tenantId: session.user.tenantId! },
            include: { _count: { select: { orders: true } } },
        });
        return NextResponse.json(integrations);
    } catch (e) { console.error(e); return new NextResponse("Error", { status: 500 }); }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const body = await req.json();
        const data = integrationSchema.parse(body);
        const integration = await db.marketplaceIntegration.upsert({
            where: { tenantId_platform: { tenantId: session.user.tenantId!, platform: data.platform } },
            create: { ...data, tenantId: session.user.tenantId!, isActive: true },
            update: { ...data, isActive: true },
        });
        return NextResponse.json(integration);
    } catch (e) {
        if (e instanceof z.ZodError) return new NextResponse("Invalid", { status: 422 });
        console.error(e); return new NextResponse("Error", { status: 500 });
    }
}
