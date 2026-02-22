import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const adminEmail = process.env.PLATFORM_ADMIN_EMAIL;
        if (!adminEmail || session.user.email !== adminEmail) {
            return new NextResponse("Forbidden", { status: 403 });
        }
        const tenants = await db.tenant.findMany({
            include: {
                _count: { select: { users: true, items: true, transactions: true } },
                subscription: { include: { plan: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(tenants);
    } catch (e) { console.error(e); return new NextResponse("Error", { status: 500 }); }
}

export async function PATCH(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const adminEmail = process.env.PLATFORM_ADMIN_EMAIL;
        if (!adminEmail || session.user.email !== adminEmail) {
            return new NextResponse("Forbidden", { status: 403 });
        }
        const { tenantId, isActive } = await req.json();
        if (!tenantId) return new NextResponse("tenantId required", { status: 400 });
        const updated = await db.tenant.update({
            where: { id: tenantId },
            data: { isActive },
        });
        return NextResponse.json(updated);
    } catch (e) { console.error(e); return new NextResponse("Error", { status: 500 }); }
}
