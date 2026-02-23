import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const createSchema = z.object({
    tableOrderId: z.string().optional(),
    tableNumber: z.string().optional(),
    source: z.enum(["TABLE", "POS", "SELF_ORDER"]).default("POS"),
    notes: z.string().optional(),
    priority: z.number().int().default(0),
    items: z.array(z.object({
        variantId: z.string().optional(),
        itemName: z.string(),
        quantity: z.number().int().min(1),
        notes: z.string().optional(),
    })),
});

export const runtime = "nodejs";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");

        const tickets = await db.kitchenTicket.findMany({
            where: {
                status: status
                    ? (status as any)
                    : { in: ["PENDING", "PREPARING", "READY"] },
            },
            include: { items: true },
            orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
        });

        return NextResponse.json(tickets);
    } catch (error) {
        console.error("[KITCHEN_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

        const body = await req.json();
        const data = createSchema.parse(body);

        const count = await db.kitchenTicket.count({ where: {} });
        const ticketNo = `KTV-${(count + 1).toString().padStart(5, "0")}`;

        const ticket = await db.kitchenTicket.create({
            data: {
                ticketNo,
                tableOrderId: data.tableOrderId,
                tableNumber: data.tableNumber,
                source: data.source,
                notes: data.notes,
                priority: data.priority,
                items: {
                    create: data.items,
                },
            },
            include: { items: true },
        });

        return NextResponse.json(ticket);
    } catch (error) {
        if (error instanceof z.ZodError) return new NextResponse("Invalid Data", { status: 422 });
        console.error("[KITCHEN_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
