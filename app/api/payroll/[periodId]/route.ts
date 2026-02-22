import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ periodId: string }> }) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const { periodId } = await params;
        const period = await db.payrollPeriod.findFirst({
            where: { id: periodId, tenantId: session.user.tenantId! },
            include: { entries: { include: { employee: { select: { name: true, employeeNo: true, position: true } } } } },
        });
        if (!period) return new NextResponse("Not Found", { status: 404 });
        return NextResponse.json(period);
    } catch (e) { console.error(e); return new NextResponse("Error", { status: 500 }); }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ periodId: string }> }) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const { periodId } = await params;
        const { action, entries } = await req.json();
        const tenantId = session.user.tenantId!;

        const period = await db.payrollPeriod.findFirst({ where: { id: periodId, tenantId } });
        if (!period) return new NextResponse("Not Found", { status: 404 });

        if (action === "process") {
            // Update individual entry adjustments if provided
            const updateOps = (entries as Array<{ id: string; allowances?: number; deductions?: number; notes?: string }> | undefined) ?? [];
            await Promise.all(updateOps.map(e => db.payrollEntry.update({
                where: { id: e.id },
                data: {
                    allowances: e.allowances ?? 0,
                    deductions: e.deductions ?? 0,
                    notes: e.notes,
                    netSalary: { set: 0 },
                },
            })));
            // Recompute net for all entries
            const allEntries = await db.payrollEntry.findMany({ where: { periodId } });
            await Promise.all(allEntries.map(e => db.payrollEntry.update({
                where: { id: e.id },
                data: { netSalary: Number(e.baseSalary) + Number(e.allowances ?? 0) - Number(e.deductions ?? 0), status: "PROCESSED" },
            })));
            const updated = await db.payrollPeriod.update({
                where: { id: periodId },
                data: { status: "PROCESSED", processedBy: session.user.id, processedAt: new Date() },
                include: { entries: { include: { employee: { select: { name: true, employeeNo: true } } } } },
            });
            return NextResponse.json(updated);
        }

        if (action === "pay") {
            await db.payrollEntry.updateMany({ where: { periodId }, data: { status: "PAID", paidAt: new Date() } });
            const updated = await db.payrollPeriod.update({
                where: { id: periodId },
                data: { status: "PAID" },
                include: { entries: { include: { employee: { select: { name: true, employeeNo: true } } } } },
            });
            return NextResponse.json(updated);
        }

        return new NextResponse("Invalid action", { status: 400 });
    } catch (e) { console.error(e); return new NextResponse("Error", { status: 500 }); }
}
