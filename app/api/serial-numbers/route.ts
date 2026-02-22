import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const { searchParams } = new URL(req.url);
        const variantId = searchParams.get("variantId");
        const status = searchParams.get("status");
        const q = searchParams.get("q");
        const serials = await db.serialNumber.findMany({
            where: {
                tenantId: session.user.tenantId!,
                ...(variantId ? { variantId } : {}),
                ...(status ? { status } as any : {}),
                ...(q ? { serialNo: { contains: q, mode: "insensitive" } } : {}),
            },
            include: { variant: { include: { item: { select: { name: true } } } } },
            orderBy: { createdAt: "desc" },
            take: 100,
        });
        return NextResponse.json(serials);
    } catch (e) { console.error(e); return new NextResponse("Error", { status: 500 }); }
}

const schema = z.object({
    variantId: z.string(),
    serialNos: z.array(z.string().min(1)).min(1), // Bulk import
    purchaseRef: z.string().optional(),
    notes: z.string().optional(),
});

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const body = await req.json();
        const data = schema.parse(body);
        const tenantId = session.user.tenantId!;
        await db.serialNumber.createMany({
            data: data.serialNos.map(sn => ({
                tenantId,
                variantId: data.variantId,
                serialNo: sn,
                purchaseRef: data.purchaseRef,
                notes: data.notes,
            })),
            skipDuplicates: true,
        });
        return NextResponse.json({ created: data.serialNos.length });
    } catch (e) {
        if (e instanceof z.ZodError) return new NextResponse("Invalid", { status: 422 });
        console.error(e); return new NextResponse("Error", { status: 500 });
    }
}
