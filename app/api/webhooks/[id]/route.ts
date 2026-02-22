import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const { id } = await params;
        const endpoint = await db.webhookEndpoint.findFirst({
            where: { id, tenantId: session.user.tenantId! },
            include: { logs: { orderBy: { createdAt: "desc" }, take: 50 } },
        });
        if (!endpoint) return new NextResponse("Not Found", { status: 404 });
        return NextResponse.json(endpoint);
    } catch (e) { console.error(e); return new NextResponse("Error", { status: 500 }); }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const { id } = await params;
        const body = await req.json();
        const updated = await db.webhookEndpoint.updateMany({
            where: { id, tenantId: session.user.tenantId! },
            data: { url: body.url, description: body.description, events: body.events, isActive: body.isActive },
        });
        return NextResponse.json(updated);
    } catch (e) { console.error(e); return new NextResponse("Error", { status: 500 }); }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const { id } = await params;
        await db.webhookEndpoint.deleteMany({ where: { id, tenantId: session.user.tenantId! } });
        return new NextResponse(null, { status: 204 });
    } catch (e) { console.error(e); return new NextResponse("Error", { status: 500 }); }
}
