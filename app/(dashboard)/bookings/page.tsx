import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { BookingClient } from "@/components/bookings/booking-client";

export default async function BookingsPage() {
    const session = await auth();
    if (!session) redirect("/login");
    const tenantId = session.user.tenantId!;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next7 = new Date(today);
    next7.setDate(today.getDate() + 7);

    const [bookings, staff] = await Promise.all([
        db.booking.findMany({
            where: { tenantId, date: { gte: today, lte: next7 } },
            include: {
                customer: { select: { id: true, name: true, phone: true } },
                staff: { select: { id: true, name: true } },
            },
            orderBy: [{ date: "asc" }, { startTime: "asc" }],
        }),
        db.user.findMany({
            where: { tenantId, isActive: true },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
        }),
    ]);

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <BookingClient initialBookings={bookings as any} staff={staff.map(s => ({ id: s.id, name: s.name ?? "" }))} />
            </div>
        </div>
    );
}
