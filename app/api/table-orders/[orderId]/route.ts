import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateSchema = z.object({
    status: z.enum(["OPEN", "BILL_REQUESTED", "PAID", "CANCELLED"]).optional(),
    guestName: z.string().optional(),
    guestCount: z.number().int().min(1).optional(),
    notes: z.string().optional(),
});

const addItemSchema = z.object({
    variantId: z.string(),
    quantity: z.number().int().min(1),
    notes: z.string().optional(),
    sendToKitchen: z.boolean().default(false),
});

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ orderId: string }> }) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const { orderId } = await params;

        const order = await db.tableOrder.findFirst({
            where: { id: orderId,
 },
            include: {
                table: true,
                items: { orderBy: { createdAt: "asc" } },
                kitchenTickets: { include: { items: true } },
            },
        });

        if (!order) return new NextResponse("Not Found", { status: 404 });
        return NextResponse.json(order);
    } catch (error) {
        console.error("[TABLE_ORDER_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const { orderId } = await params;
        const body = await req.json();

        // Check if adding an item
        if (body.action === "add_item") {
            const itemData = addItemSchema.parse(body);

            const variant = await db.itemVariant.findFirst({
                where: { id: itemData.variantId },
                include: { item: true },
            });
            if (!variant) return new NextResponse("Variant not found", { status: 404 });

            const order = await db.tableOrder.findFirst({
                where: { id: orderId,
 },
                include: { table: true },
            });
            if (!order) return new NextResponse("Order not found", { status: 404 });

            const item = await db.tableOrderItem.create({
                data: {
                    tableOrderId: orderId,
                    variantId: itemData.variantId,
                    itemName: variant.item.name,
                    variantName: variant.name,
                    quantity: itemData.quantity,
                    price: variant.price,
                    notes: itemData.notes,
                    sentAt: itemData.sendToKitchen ? new Date() : null,
                },
            });

            // Send to kitchen if requested
            if (itemData.sendToKitchen) {
                const ticketCount = await db.kitchenTicket.count({ where: {
 } });
                const ticketNo = `KTV-${(ticketCount + 1).toString().padStart(5, "0")}`;

                await db.kitchenTicket.create({
                    data: {
                        ticketNo,
                        tableOrderId: orderId,
                        tableNumber: order.table.number,
                        source: "TABLE",
                        items: {
                            create: [{
                                variantId: itemData.variantId,
                                itemName: variant.item.name,
                                quantity: itemData.quantity,
                                notes: itemData.notes,
                            }],
                        },
                    },
                });
            }

            return NextResponse.json(item);
        }

        // Regular status update
        const data = updateSchema.parse(body);

        const order = await db.$transaction(async (prisma) => {
            const updated = await prisma.tableOrder.update({
                where: { id: orderId },
                data: {
                    ...data,
                    ...(data.status === "PAID" || data.status === "CANCELLED"
                        ? { closedAt: new Date() }
                        : {}),
                },
                include: { table: true, items: true },
            });

            // Free table when order is closed
            if (data.status === "PAID" || data.status === "CANCELLED") {
                await prisma.table.update({
                    where: { id: updated.tableId },
                    data: { status: "CLEANING" },
                });
            }

            return updated;
        });

        return NextResponse.json(order);
    } catch (error) {
        if (error instanceof z.ZodError) return new NextResponse("Invalid Data", { status: 422 });
        console.error("[TABLE_ORDER_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ orderId: string }> }) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const { orderId } = await params;

        const order = await db.tableOrder.findFirst({
            where: { id: orderId,
 },
        });
        if (!order) return new NextResponse("Not Found", { status: 404 });

        await db.$transaction(async (prisma) => {
            await prisma.tableOrder.delete({ where: { id: orderId } });
            await prisma.table.update({
                where: { id: order.tableId },
                data: { status: "AVAILABLE" },
            });
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[TABLE_ORDER_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
