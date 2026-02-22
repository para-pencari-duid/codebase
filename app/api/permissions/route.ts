import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { Role } from "@prisma/client";

export const runtime = "nodejs";

const permSchema = z.object({
    role: z.string().optional(),
    userId: z.string().optional(),
    resource: z.string(),
    actions: z.array(z.string()),
});

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const perms = await db.rolePermission.findMany({
            where: { tenantId: session.user.tenantId! },
            orderBy: [{ role: "asc" }, { resource: "asc" }],
        });
        return NextResponse.json(perms);
    } catch (e) { console.error(e); return new NextResponse("Error", { status: 500 }); }
}

export async function PUT(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const body = await req.json();
        const data = permSchema.parse(body);
        const tenantId = session.user.tenantId!;
        const role = (data.role ?? null) as Role | null;
        // Find existing
        const existing = await db.rolePermission.findFirst({ where: { tenantId, role, resource: data.resource } });
        let perm;
        if (existing) {
            perm = await db.rolePermission.update({ where: { id: existing.id }, data: { actions: data.actions } });
        } else {
            perm = await db.rolePermission.create({ data: { tenantId, role, userId: data.userId, resource: data.resource, actions: data.actions } });
        }
        return NextResponse.json(perm);
    } catch (e) {
        if (e instanceof z.ZodError) return new NextResponse("Invalid", { status: 422 });
        console.error(e); return new NextResponse("Error", { status: 500 });
    }
}
