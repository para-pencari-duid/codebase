import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const createSchema = z.object({
    customerName: z.string().min(1),
    customerPhone: z.string().optional(),
    customerId: z.string().optional(),
    serviceName: z.string().min(1),
    serviceId: z.string().optional(),
    staffId: z.string().optional(),
    storeId: z.string().optional(),
    date: z.string(), // ISO date string
    startTime: z.string(), // ISO datetime
    endTime: z.string().optional(),
    duration: z.number().int().min(1).optional(),
    notes: z.string().optional(),
    depositPaid: z.number().optional(),
    totalAmount: z.number().optional(),
});

export const runtime = "nodejs";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

        const { searchParams } = new URL(req.url);
        const date = searchParams.get("date");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const status = searchParams.get("status");
        const staffId = searchParams.get("staffId");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");

        const where: any = {
 };

        if (date) {
            const d = new Date(date);
            const next = new Date(d);
            next.setDate(d.getDate() + 1);
            where.date = { gte: d, lt: next };
        } else if (startDate && endDate) {
            where.date = { gte: new Date(startDate), lte: new Date(endDate + "T23:59:59Z") };
        }

        if (status) where.status = status;
        if (staffId) where.staffId = staffId;

        const [bookings, total] = await Promise.all([
            db.booking.findMany({
                where,
                include: {
                    customer: { select: { id: true, name: true, phone: true } },
                    staff: { select: { id: true, name: true } },
                },
                orderBy: [{ date: "asc" }, { startTime: "asc" }],
                skip: (page - 1) * limit,
                take: limit,
            }),
            db.booking.count({ where }),
        ]);

        return NextResponse.json({ data: bookings, total, page, limit });
    } catch (error) {
        console.error("[BOOKINGS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

        const body = await req.json();
        const data = createSchema.parse(body);

        const count = await db.booking.count({ where: {} });
        const bookingNo = `BK-${Date.now().toString().slice(-6)}-${(count + 1).toString().padStart(4, "0")}`;

        const booking = await db.booking.create({
            data: {
                bookingNo,
                customerName: data.customerName,
                customerPhone: data.customerPhone,
                customerId: data.customerId,
                serviceName: data.serviceName,
                serviceId: data.serviceId,
                staffId: data.staffId,
                storeId: data.storeId,
                date: new Date(data.date),
                startTime: new Date(data.startTime),
                endTime: data.endTime ? new Date(data.endTime) : null,
                duration: data.duration,
                notes: data.notes,
                depositPaid: data.depositPaid,
                totalAmount: data.totalAmount,
            },
            include: {
                customer: { select: { id: true, name: true, phone: true } },
                staff: { select: { id: true, name: true } },
            },
        });

        return NextResponse.json(booking);
    } catch (error) {
        if (error instanceof z.ZodError) return new NextResponse("Invalid Data", { status: 422 });
        console.error("[BOOKINGS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
