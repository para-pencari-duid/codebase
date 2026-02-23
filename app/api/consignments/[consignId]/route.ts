import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ consignId: string }> }) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const { consignId } = await params;
        const c = await db.consignment.findFirst({
            where: { id: consignId,
 },
            include: { items: true },
        });
        if (!c) return new NextResponse("Not Found", { status: 404 });
        return NextResponse.json(c);
    } catch (e) { console.error(e); return new NextResponse("Error", { status: 500 }); }
}

const updateSchema = z.object({
    status: z.enum(["ACTIVE", "SETTLED", "RETURNED", "CANCELLED"]).optional(),
    notes: z.string().optional(),
    endDate: z.string().optional(),
    commission: z.number().optional(),
});

export async function PUT(req: Request, { params }: { params: Promise<{ consignId: string }> }) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const { consignId } = await params;
        const body = await req.json();
        const data = updateSchema.parse(body);
        const existing = await db.consignment.findFirst({ where: { id: consignId,
 } });
        if (!existing) return new NextResponse("Not Found", { status: 404 });
        const updated = await db.consignment.update({
            where: { id: consignId },
            data: {
                ...(data.status && { status: data.status }),
                ...(data.notes !== undefined && { notes: data.notes }),
                ...(data.endDate && { endDate: new Date(data.endDate) }),
                ...(data.commission !== undefined && { commission: data.commission }),
            },
            include: { items: true },
        });
        return NextResponse.json(updated);
    } catch (e) {
        if (e instanceof z.ZodError) return new NextResponse("Invalid", { status: 422 });
        console.error(e); return new NextResponse("Error", { status: 500 });
    }
}
