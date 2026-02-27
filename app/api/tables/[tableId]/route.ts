import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateSchema = z.object({
    number: z.union([z.string().min(1), z.number().int().min(1)]).transform(String).optional(),
    name: z.string().optional(),
    capacity: z.number().int().min(1).optional(),
    floor: z.string().optional(),
    status: z.enum(["AVAILABLE", "OCCUPIED", "RESERVED", "CLEANING"]).optional(),
    isActive: z.boolean().optional(),
});

export async function GET(_: Request, { params }: { params: Promise<{ tableId: string }> }) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const { tableId } = await params;

        const table = await db.table.findFirst({
            where: { id: tableId,
 },
            include: {
                activeOrder: { include: { items: true, kitchenTickets: true } },
            },
        });

        if (!table) return new NextResponse("Not Found", { status: 404 });
        return NextResponse.json(table);
    } catch (error) {
        console.error("[TABLE_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ tableId: string }> }) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const { tableId } = await params;
        const body = await req.json();
        const data = updateSchema.parse(body);

        const table = await db.table.update({
            where: { id: tableId,
 },
            data,
        });

        return NextResponse.json(table);
    } catch (error) {
        if (error instanceof z.ZodError) return new NextResponse("Invalid Data", { status: 422 });
        console.error("[TABLE_PUT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ tableId: string }> }) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const { tableId } = await params;

        await db.table.delete({
            where: { id: tableId,
 },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[TABLE_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
