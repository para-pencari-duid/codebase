import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    isDefault: z.boolean().optional(),
    isActive: z.boolean().optional(),
    minOrderQty: z.number().int().min(1).optional(),
});

export async function GET(_: Request, { params }: { params: Promise<{ listId: string }> }) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const { listId } = await params;
        const list = await db.priceList.findFirst({
            where: { id: listId,
 },
            include: { items: { include: { variant: { select: { id: true, name: true, sku: true, price: true, item: { select: { name: true } } } } } } },
        });
        if (!list) return new NextResponse("Not Found", { status: 404 });
        return NextResponse.json(list);
    } catch (e) { console.error(e); return new NextResponse("Error", { status: 500 }); }
}

export async function PUT(req: Request, { params }: { params: Promise<{ listId: string }> }) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const { listId } = await params;
        const body = await req.json();
        const data = schema.parse(body);
        const existing = await db.priceList.findFirst({ where: { id: listId } });
        if (!existing) return new NextResponse("Not Found", { status: 404 });
        if (data.isDefault) {
            await db.priceList.updateMany({ where: { isDefault: true, id: { not: listId } }, data: { isDefault: false } });
        }
        const updated = await db.priceList.update({ where: { id: listId }, data });
        return NextResponse.json(updated);
    } catch (e) {
        if (e instanceof z.ZodError) return new NextResponse("Invalid", { status: 422 });
        console.error(e); return new NextResponse("Error", { status: 500 });
    }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ listId: string }> }) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const { listId } = await params;
        const existing = await db.priceList.findFirst({ where: { id: listId } });
        if (!existing) return new NextResponse("Not Found", { status: 404 });
        await db.priceList.delete({ where: { id: listId } });
        return new NextResponse(null, { status: 204 });
    } catch (e) { console.error(e); return new NextResponse("Error", { status: 500 }); }
}
