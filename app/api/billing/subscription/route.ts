import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const subscribeSchema = z.object({
    planId: z.string(),
    interval: z.enum(["MONTHLY", "ANNUAL"]),
});

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const subscription = await db.tenantSubscription.findUnique({
            where: { tenantId: session.user.tenantId! },
            include: { plan: true, invoices: { orderBy: { createdAt: "desc" }, take: 12 } },
        });
        return NextResponse.json(subscription);
    } catch (e) { console.error(e); return new NextResponse("Error", { status: 500 }); }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const body = await req.json();
        const data = subscribeSchema.parse(body);
        const tenantId = session.user.tenantId!;

        const plan = await db.subscriptionPlan.findUnique({ where: { id: data.planId } });
        if (!plan) return new NextResponse("Plan not found", { status: 404 });

        const startDate = new Date();
        const endDate = new Date(startDate);
        if (data.interval === "MONTHLY") endDate.setMonth(endDate.getMonth() + 1);
        else endDate.setFullYear(endDate.getFullYear() + 1);

        const amount = data.interval === "MONTHLY" ? plan.priceMonthly : plan.priceAnnual;

        const sub = await db.tenantSubscription.upsert({
            where: { tenantId },
            create: {
                tenantId, planId: data.planId, interval: data.interval,
                status: "ACTIVE", startDate, endDate, nextBillingDate: endDate,
                invoices: {
                    create: {
                        tenantId,
                        invoiceNo: `INV-${Date.now()}`,
                        amount,
                        status: "UNPAID",
                        dueDate: endDate,
                    },
                },
            },
            update: {
                planId: data.planId, interval: data.interval,
                status: "ACTIVE", startDate, endDate, nextBillingDate: endDate,
            },
            include: { plan: true },
        });
        return NextResponse.json(sub);
    } catch (e) {
        if (e instanceof z.ZodError) return new NextResponse("Invalid", { status: 422 });
        console.error(e); return new NextResponse("Error", { status: 500 });
    }
}
