import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateSchema = z.object({
    customerName: z.string().optional(),
    customerPhone: z.string().optional(),
    customerId: z.string().nullable().optional(),
    serviceName: z.string().optional(),
    serviceId: z.string().optional(),
    staffId: z.string().nullable().optional(),
    storeId: z.string().nullable().optional(),
    date: z.string().optional(),
    startTime: z.string().optional(),
    endTime: z.string().nullable().optional(),
    duration: z.number().int().optional(),
    status: z.enum(["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
    notes: z.string().optional(),
    reminderSent: z.boolean().optional(),
    depositPaid: z.number().optional(),
    totalAmount: z.number().optional(),
    transactionId: z.string().optional(),
});

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: Promise<{ bookingId: string }> }) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const { bookingId } = await params;

        const booking = await db.booking.findFirst({
            where: { id: bookingId,
 },
            include: {
                customer: { select: { id: true, name: true, phone: true, email: true } },
                staff: { select: { id: true, name: true, email: true } },
            },
        });

        if (!booking) return new NextResponse("Not Found", { status: 404 });
        return NextResponse.json(booking);
    } catch (error) {
        console.error("[BOOKING_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ bookingId: string }> }) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

        const body = await req.json();
        const data = updateSchema.parse(body);
        const { bookingId } = await params;

        const existing = await db.booking.findFirst({ where: { id: bookingId } });
        if (!existing) return new NextResponse("Not Found", { status: 404 });

        const updated = await db.booking.update({
            where: { id: bookingId },
            data: {
                ...(data.customerName !== undefined && { customerName: data.customerName }),
                ...(data.customerPhone !== undefined && { customerPhone: data.customerPhone }),
                ...(data.customerId !== undefined && { customerId: data.customerId }),
                ...(data.serviceName !== undefined && { serviceName: data.serviceName }),
                ...(data.serviceId !== undefined && { serviceId: data.serviceId }),
                ...(data.staffId !== undefined && { staffId: data.staffId }),
                ...(data.storeId !== undefined && { storeId: data.storeId }),
                ...(data.date !== undefined && { date: new Date(data.date) }),
                ...(data.startTime !== undefined && { startTime: new Date(data.startTime) }),
                ...(data.endTime !== undefined && { endTime: data.endTime ? new Date(data.endTime) : null }),
                ...(data.duration !== undefined && { duration: data.duration }),
                ...(data.status !== undefined && { status: data.status }),
                ...(data.notes !== undefined && { notes: data.notes }),
                ...(data.reminderSent !== undefined && { reminderSent: data.reminderSent }),
                ...(data.depositPaid !== undefined && { depositPaid: data.depositPaid }),
                ...(data.totalAmount !== undefined && { totalAmount: data.totalAmount }),
                ...(data.transactionId !== undefined && { transactionId: data.transactionId }),
            },
            include: {
                customer: { select: { id: true, name: true, phone: true } },
                staff: { select: { id: true, name: true } },
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        if (error instanceof z.ZodError) return new NextResponse("Invalid Data", { status: 422 });
        console.error("[BOOKING_PUT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ bookingId: string }> }) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const { bookingId } = await params;
        const existing = await db.booking.findFirst({ where: { id: bookingId } });
        if (!existing) return new NextResponse("Not Found", { status: 404 });

        await db.booking.delete({ where: { id: bookingId } });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[BOOKING_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
