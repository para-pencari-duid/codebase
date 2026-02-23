import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const periodSchema = z.object({
    name: z.string().min(1),
    startDate: z.string(),
    endDate: z.string(),
    notes: z.string().optional(),
});

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const periods = await db.payrollPeriod.findMany({
            where: {
 },
            include: { _count: { select: { entries: true } } },
            orderBy: { startDate: "desc" },
        });
        return NextResponse.json(periods);
    } catch (e) { console.error(e); return new NextResponse("Error", { status: 500 }); }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const body = await req.json();
        const data = periodSchema.parse(body);
        // Auto-generate entries from active employees
        const employees = await db.employee.findMany({ where: { isActive: true } });
        const period = await db.payrollPeriod.create({
            data: {
                name: data.name,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                notes: data.notes,
                entries: {
                    create: employees.map(emp => ({
                        employeeId: emp.id,
                        baseSalary: emp.baseSalary,
                        netSalary: emp.baseSalary,
                        bankName: emp.bankName,
                        bankAccount: emp.bankAccount,
                    })),
                },
            },
            include: { entries: { include: { employee: { select: { name: true, employeeNo: true } } } } },
        });
        return NextResponse.json(period);
    } catch (e) {
        if (e instanceof z.ZodError) return new NextResponse("Invalid", { status: 422 });
        console.error(e); return new NextResponse("Error", { status: 500 });
    }
}
