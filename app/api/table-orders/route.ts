import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const createSchema = z.object({
    tableId: z.string(),
    guestName: z.string().optional(),
    guestCount: z.number().int().min(1).default(1),
    notes: z.string().optional(),
});

export const runtime = "nodejs";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");

        const orders = await db.tableOrder.findMany({
            where: {
                ...(status ? { status: status as any } : { status: { in: ["OPEN", "BILL_REQUESTED"] } }),
            },
            include: {
                table: true,
                items: { orderBy: { createdAt: "asc" } },
                kitchenTickets: { select: { id: true, status: true, ticketNo: true } },
            },
            orderBy: { openedAt: "asc" },
        });

        return NextResponse.json(orders);
    } catch (error) {
        console.error("[TABLE_ORDERS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

        const body = await req.json();
        const data = createSchema.parse(body);

        // Check table exists and is available
        const table = await db.table.findFirst({
            where: { id: data.tableId },
        });
        if (!table) return new NextResponse("Table not found", { status: 404 });
        if (table.status === "OCCUPIED") {
            return NextResponse.json({ error: "Meja sedang terisi" }, { status: 400 });
        }

        // Generate order number
        const count = await db.tableOrder.count({ where: {} });
        const orderNo = `ORD-${Date.now().toString().slice(-6)}-${(count + 1).toString().padStart(3, "0")}`;

        const order = await db.$transaction(async (prisma) => {
            const newOrder = await prisma.tableOrder.create({
                data: {
                    tableId: data.tableId,
                    orderNo,
                    guestName: data.guestName,
                    guestCount: data.guestCount,
                    notes: data.notes,
                    openedBy: session.user!.id,
                },
                include: { table: true, items: true },
            });

            // Update table status to OCCUPIED
            await prisma.table.update({
                where: { id: data.tableId },
                data: { status: "OCCUPIED" },
            });

            return newOrder;
        });

        return NextResponse.json(order);
    } catch (error) {
        if (error instanceof z.ZodError) return new NextResponse("Invalid Data", { status: 422 });
        console.error("[TABLE_ORDERS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
