import db from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

// GET /api/self-order/[token] — public, returns table info + menu
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
    try {
        const { token } = await params;
        const table = await db.table.findUnique({
            where: { qrToken: token },
            include: {
                tenant: { select: { id: true, name: true } },
                activeOrder: { include: { items: true } },
            },
        });

        if (!table || !table.isActive) return new NextResponse("Not Found", { status: 404 });

        // Fetch active categories + items for this tenant
        const categories = await db.itemCategory.findMany({
            where: { tenantId: table.tenantId, isActive: true },
            include: {
                items: {
                    where: { isActive: true, type: "GOODS" },
                    include: {
                        variants: {
                            where: { isActive: true },
                            select: { id: true, name: true, price: true, stock: true },
                        },
                    },
                },
            },
            orderBy: { name: "asc" },
        });

        return NextResponse.json({
            table: {
                id: table.id,
                number: table.number,
                name: table.name,
                capacity: table.capacity,
                status: table.status,
                activeOrder: table.activeOrder,
            },
            tenant: table.tenant,
            menu: categories,
        });
    } catch (error) {
        console.error("[SELF_ORDER_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

const orderSchema = z.object({
    guestName: z.string().optional(),
    guestCount: z.number().int().min(1).default(1),
    items: z
        .array(
            z.object({
                variantId: z.string(),
                itemName: z.string(),
                variantName: z.string(),
                quantity: z.number().int().min(1),
                price: z.number(),
                notes: z.string().optional(),
            })
        )
        .min(1),
    notes: z.string().optional(),
});

// POST /api/self-order/[token] — public, creates or appends to table order
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
    try {
        const { token } = await params;
        const table = await db.table.findUnique({
            where: { qrToken: token },
            include: { activeOrder: true },
        });

        if (!table || !table.isActive) return new NextResponse("Not Found", { status: 404 });

        const body = await req.json();
        const data = orderSchema.parse(body);
        const tenantId = table.tenantId;

        let order = table.activeOrder;

        if (!order) {
            if (table.status === "OCCUPIED") {
                return new NextResponse("Table occupied — ask staff", { status: 409 });
            }

            const count = await db.tableOrder.count({ where: { tenantId } });
            const orderNo = `ORD-${Date.now()}-${count + 1}`;

            order = await db.$transaction(async (prisma) => {
                const newOrder = await prisma.tableOrder.create({
                    data: {
                        tenantId,
                        tableId: table.id,
                        orderNo,
                        guestName: data.guestName,
                        guestCount: data.guestCount,
                        notes: data.notes,
                        openedBy: "self-order",
                        items: {
                            create: data.items.map((item) => ({
                                variantId: item.variantId,
                                itemName: item.itemName,
                                variantName: item.variantName,
                                quantity: item.quantity,
                                price: item.price,
                                notes: item.notes,
                                sentAt: new Date(),
                            })),
                        },
                    },
                    include: { items: true },
                });
                await prisma.table.update({ where: { id: table.id }, data: { status: "OCCUPIED" } });
                return newOrder;
            });
        } else {
            await db.tableOrderItem.createMany({
                data: data.items.map((item) => ({
                    tableOrderId: order!.id,
                    variantId: item.variantId,
                    itemName: item.itemName,
                    variantName: item.variantName,
                    quantity: item.quantity,
                    price: item.price,
                    notes: item.notes,
                    sentAt: new Date(),
                })),
            });
        }

        // Auto-create kitchen ticket
        const kitchenCount = await db.kitchenTicket.count({ where: { tenantId } });
        const ticketNo = `KTV-${(kitchenCount + 1).toString().padStart(4, "0")}`;

        await db.kitchenTicket.create({
            data: {
                tenantId,
                ticketNo,
                tableOrderId: order.id,
                tableNumber: table.number,
                source: "SELF_ORDER",
                items: {
                    create: data.items.map((item) => ({
                        itemName: `${item.itemName}${item.variantName !== item.itemName ? ` (${item.variantName})` : ""}`,
                        quantity: item.quantity,
                        notes: item.notes,
                    })),
                },
            },
        });

        return NextResponse.json({ orderId: order.id, orderNo: order.orderNo, message: "Order sent to kitchen" });
    } catch (error) {
        if (error instanceof z.ZodError) return new NextResponse("Invalid Data", { status: 422 });
        console.error("[SELF_ORDER_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
