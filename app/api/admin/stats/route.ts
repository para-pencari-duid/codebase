import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const adminEmail = process.env.PLATFORM_ADMIN_EMAIL;
        if (!adminEmail || session.user.email !== adminEmail) {
            return new NextResponse("Forbidden", { status: 403 });
        }
        const [tenantCount, userCount, activeSubCount, monthRevenue] = await Promise.all([
            db.tenant.count(),
            db.user.count(),
            db.tenantSubscription.count({ where: { status: "ACTIVE" } }),
            db.billingInvoice.aggregate({
                where: { status: "PAID", paidAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
                _sum: { amount: true },
            }),
        ]);
        return NextResponse.json({ tenantCount, userCount, activeSubCount, monthRevenue: monthRevenue._sum.amount ?? 0 });
    } catch (e) { console.error(e); return new NextResponse("Error", { status: 500 }); }
}
