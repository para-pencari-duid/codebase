import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ employeeId: string }> }) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const { employeeId } = await params;
        const emp = await db.employee.findFirst({
            where: { id: employeeId, tenantId: session.user.tenantId! },
            include: { attendances: { orderBy: { date: "desc" }, take: 30 } },
        });
        if (!emp) return new NextResponse("Not Found", { status: 404 });
        return NextResponse.json(emp);
    } catch (e) { console.error(e); return new NextResponse("Error", { status: 500 }); }
}

const schema = z.object({
    name: z.string().optional(),
    position: z.string().optional(),
    department: z.string().optional(),
    baseSalary: z.number().optional(),
    bankName: z.string().optional(),
    bankAccount: z.string().optional(),
    bankHolder: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    isActive: z.boolean().optional(),
    notes: z.string().optional(),
});

export async function PUT(req: Request, { params }: { params: Promise<{ employeeId: string }> }) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const { employeeId } = await params;
        const body = await req.json();
        const data = schema.parse(body);
        const existing = await db.employee.findFirst({ where: { id: employeeId, tenantId: session.user.tenantId! } });
        if (!existing) return new NextResponse("Not Found", { status: 404 });
        const updated = await db.employee.update({ where: { id: employeeId }, data });
        return NextResponse.json(updated);
    } catch (e) {
        if (e instanceof z.ZodError) return new NextResponse("Invalid", { status: 422 });
        console.error(e); return new NextResponse("Error", { status: 500 });
    }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ employeeId: string }> }) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const { employeeId } = await params;
        const existing = await db.employee.findFirst({ where: { id: employeeId, tenantId: session.user.tenantId! } });
        if (!existing) return new NextResponse("Not Found", { status: 404 });
        await db.employee.update({ where: { id: employeeId }, data: { isActive: false } });
        return new NextResponse(null, { status: 204 });
    } catch (e) { console.error(e); return new NextResponse("Error", { status: 500 }); }
}
