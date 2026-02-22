import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({
    consignerName: z.string().min(1),
    consignerPhone: z.string().optional(),
    supplierId: z.string().optional(),
    startDate: z.string(),
    endDate: z.string().optional(),
    commission: z.number().min(0).max(100).optional(),
    notes: z.string().optional(),
    items: z.array(z.object({
        variantId: z.string(),
        itemName: z.string(),
        variantName: z.string(),
        consignedQty: z.number().int().min(1),
        consignPrice: z.number(),
        salePrice: z.number(),
    })).optional(),
});

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");
        const consignments = await db.consignment.findMany({
            where: { tenantId: session.user.tenantId!, ...(status ? { status } as any : {}) },
            include: { items: true },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(consignments);
    } catch (e) { console.error(e); return new NextResponse("Error", { status: 500 }); }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const body = await req.json();
        const data = schema.parse(body);
        const tenantId = session.user.tenantId!;
        const count = await db.consignment.count({ where: { tenantId } });
        const consignNo = `CSG-${Date.now().toString().slice(-6)}-${(count + 1).toString().padStart(3, "0")}`;
        const consignment = await db.consignment.create({
            data: {
                tenantId,
                consignNo,
                consignerName: data.consignerName,
                consignerPhone: data.consignerPhone,
                supplierId: data.supplierId,
                startDate: new Date(data.startDate),
                endDate: data.endDate ? new Date(data.endDate) : null,
                commission: data.commission ?? 0,
                notes: data.notes,
                items: data.items ? { create: data.items } : undefined,
            },
            include: { items: true },
        });
        return NextResponse.json(consignment);
    } catch (e) {
        if (e instanceof z.ZodError) return new NextResponse("Invalid", { status: 422 });
        console.error(e); return new NextResponse("Error", { status: 500 });
    }
}
