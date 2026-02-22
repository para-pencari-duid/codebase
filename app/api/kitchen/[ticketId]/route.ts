import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const patchSchema = z.object({
    status: z.enum(["PENDING", "PREPARING", "READY", "SERVED", "CANCELLED"]).optional(),
    // Optionally update a single item's status
    itemId: z.string().optional(),
    itemStatus: z.enum(["PENDING", "PREPARING", "READY", "SERVED", "CANCELLED"]).optional(),
});

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: Promise<{ ticketId: string }> }) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const { ticketId } = await params;
        const body = await req.json();
        const data = patchSchema.parse(body);

        const now = new Date();

        // If updating a single item
        if (data.itemId && data.itemStatus) {
            const item = await db.kitchenTicketItem.update({
                where: { id: data.itemId },
                data: {
                    status: data.itemStatus,
                    completedAt: ["READY", "SERVED", "CANCELLED"].includes(data.itemStatus) ? now : null,
                },
            });

            // Auto-advance ticket status if all items are ready/served
            const ticket = await db.kitchenTicket.findFirst({
                where: { id: ticketId },
                include: { items: true },
            });

            if (ticket) {
                const allDone = ticket.items.every((i) =>
                    ["READY", "SERVED", "CANCELLED"].includes(
                        i.id === data.itemId ? data.itemStatus! : i.status
                    )
                );
                if (allDone && ticket.status === "PREPARING") {
                    await db.kitchenTicket.update({
                        where: { id: ticketId },
                        data: { status: "READY", readyAt: now },
                    });
                }
            }

            return NextResponse.json(item);
        }

        // Update ticket status
        const statusTimestamps: Record<string, object> = {
            PREPARING: { startedAt: now },
            READY: { readyAt: now },
            SERVED: { servedAt: now },
        };

        const ticket = await db.kitchenTicket.update({
            where: { id: ticketId, tenantId: session.user.tenantId! },
            data: {
                ...(data.status ? { status: data.status } : {}),
                ...(data.status && statusTimestamps[data.status] ? statusTimestamps[data.status] : {}),
            },
            include: { items: true },
        });

        // When ticket moves to PREPARING, move all PENDING items too
        if (data.status === "PREPARING") {
            await db.kitchenTicketItem.updateMany({
                where: { ticketId, status: "PENDING" },
                data: { status: "PREPARING" },
            });
        }

        return NextResponse.json(ticket);
    } catch (error) {
        if (error instanceof z.ZodError) return new NextResponse("Invalid Data", { status: 422 });
        console.error("[KITCHEN_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ ticketId: string }> }) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const { ticketId } = await params;

        await db.kitchenTicket.delete({
            where: { id: ticketId, tenantId: session.user.tenantId! },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[KITCHEN_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
