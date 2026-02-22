import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({
    name: z.string().min(1),
    code: z.string().min(1),
    rate: z.number().min(0).max(100),
    isDefault: z.boolean().optional(),
    isInclusive: z.boolean().optional(),
    isActive: z.boolean().optional(),
});

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const rates = await db.taxRate.findMany({
            where: { tenantId: session.user.tenantId! },
            orderBy: { rate: "asc" },
        });
        return NextResponse.json(rates);
    } catch (e) { console.error(e); return new NextResponse("Error", { status: 500 }); }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const body = await req.json();
        const data = schema.parse(body);
        const tenantId = session.user.tenantId!;
        if (data.isDefault) {
            await db.taxRate.updateMany({ where: { tenantId, isDefault: true }, data: { isDefault: false } });
        }
        const rate = await db.taxRate.create({ data: { tenantId, ...data } });
        return NextResponse.json(rate);
    } catch (e) {
        if (e instanceof z.ZodError) return new NextResponse("Invalid", { status: 422 });
        console.error(e); return new NextResponse("Error", { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const body = await req.json();
        const { id, ...rest } = body;
        if (!id) return new NextResponse("ID required", { status: 400 });
        const tenantId = session.user.tenantId!;
        const existing = await db.taxRate.findFirst({ where: { id, tenantId } });
        if (!existing) return new NextResponse("Not Found", { status: 404 });
        if (rest.isDefault) {
            await db.taxRate.updateMany({ where: { tenantId, isDefault: true, id: { not: id } }, data: { isDefault: false } });
        }
        const updated = await db.taxRate.update({ where: { id }, data: rest });
        return NextResponse.json(updated);
    } catch (e) { console.error(e); return new NextResponse("Error", { status: 500 }); }
}
