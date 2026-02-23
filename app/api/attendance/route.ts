import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({
    employeeId: z.string(),
    date: z.string(),
    checkIn: z.string().optional(),
    checkOut: z.string().optional(),
    status: z.enum(["PRESENT", "ABSENT", "LATE", "HALF_DAY", "HOLIDAY", "LEAVE"]).optional(),
    notes: z.string().optional(),
});

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const { searchParams } = new URL(req.url);
        const employeeId = searchParams.get("employeeId");
        const date = searchParams.get("date");
        const month = searchParams.get("month"); // YYYY-MM
        let dateFilter: any = {};
        if (date) { const d = new Date(date); const next = new Date(d); next.setDate(d.getDate() + 1); dateFilter = { gte: d, lt: next }; }
        else if (month) { const [yr, mo] = month.split("-").map(Number); dateFilter = { gte: new Date(yr, mo - 1, 1), lt: new Date(yr, mo, 1) }; }
        const records = await db.attendance.findMany({
            where: { ...(employeeId ? { employeeId } : {}), ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}) },
            include: { employee: { select: { name: true, employeeNo: true } } },
            orderBy: [{ date: "desc" }, { employee: { name: "asc" } }],
        });
        return NextResponse.json(records);
    } catch (e) { console.error(e); return new NextResponse("Error", { status: 500 }); }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const body = await req.json();
        const data = schema.parse(body);
        const record = await db.attendance.upsert({
            where: { employeeId_date: { employeeId: data.employeeId, date: new Date(data.date) } },
            create: {
                employeeId: data.employeeId,
                date: new Date(data.date),
                checkIn: data.checkIn ? new Date(data.checkIn) : null,
                checkOut: data.checkOut ? new Date(data.checkOut) : null,
                status: (data.status as any) ?? "PRESENT",
                notes: data.notes,
            },
            update: {
                checkIn: data.checkIn ? new Date(data.checkIn) : null,
                checkOut: data.checkOut ? new Date(data.checkOut) : null,
                status: (data.status as any) ?? "PRESENT",
                notes: data.notes,
            },
        });
        return NextResponse.json(record);
    } catch (e) {
        if (e instanceof z.ZodError) return new NextResponse("Invalid", { status: 422 });
        console.error(e); return new NextResponse("Error", { status: 500 });
    }
}
