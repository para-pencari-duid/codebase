import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    isDefault: z.boolean().optional(),
    isActive: z.boolean().optional(),
    minOrderQty: z.number().int().min(1).optional(),
    items: z.array(z.object({
        variantId: z.string(),
        price: z.number(),
        minQty: z.number().int().min(1).optional(),
    })).optional(),
});

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const lists = await db.priceList.findMany({
            where: { tenantId: session.user.tenantId! },
            include: { items: { include: { variant: { include: { item: true } } } } },
            orderBy: { name: "asc" },
        });
        return NextResponse.json(lists);
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
            await db.priceList.updateMany({ where: { tenantId, isDefault: true }, data: { isDefault: false } });
        }
        const list = await db.priceList.create({
            data: {
                tenantId,
                name: data.name,
                description: data.description,
                isDefault: data.isDefault ?? false,
                isActive: data.isActive ?? true,
                minOrderQty: data.minOrderQty ?? 1,
                items: data.items ? {
                    create: data.items.map(i => ({ variantId: i.variantId, price: i.price, minQty: i.minQty ?? 1 }))
                } : undefined,
            },
            include: { items: true },
        });
        return NextResponse.json(list);
    } catch (e) {
        if (e instanceof z.ZodError) return new NextResponse("Invalid", { status: 422 });
        console.error(e); return new NextResponse("Error", { status: 500 });
    }
}
