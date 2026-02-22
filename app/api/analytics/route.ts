import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const tenantId = session.user.tenantId!;
        const { searchParams } = new URL(req.url);
        const range = searchParams.get("range") ?? "30"; // days
        const days = parseInt(range);
        const since = new Date(Date.now() - days * 24 * 3600 * 1000);

        const [transactions, feedbacks, customers, topVariants] = await Promise.all([
            db.transaction.findMany({
                where: { tenantId, createdAt: { gte: since }, status: "COMPLETED" },
                select: { total: true, createdAt: true },
            }),
            db.customerFeedback.findMany({ where: { tenantId, createdAt: { gte: since } }, select: { rating: true } }),
            db.customer.findMany({ where: { tenantId }, select: { id: true, segment: true, createdAt: true } }),
            db.transactionItem.groupBy({
                by: ["variantId"],
                where: { transaction: { tenantId, createdAt: { gte: since }, status: "COMPLETED" } },
                _sum: { quantity: true, subtotal: true },
                orderBy: { _sum: { subtotal: "desc" } },
                take: 10,
            }),
        ]);

        const revenue = transactions.reduce((sum, t) => sum + Number(t.total), 0);
        const txCount = transactions.length;
        const avgOrder = txCount > 0 ? revenue / txCount : 0;

        const npsTotal = feedbacks.length;
        const promoters = feedbacks.filter(f => f.rating >= 4).length;
        const detractors = feedbacks.filter(f => f.rating <= 2).length;
        const nps = npsTotal > 0 ? Math.round(((promoters - detractors) / npsTotal) * 100) : 0;

        const segments = customers.reduce<Record<string, number>>((acc, c) => {
            const seg = c.segment ?? "General";
            acc[seg] = (acc[seg] ?? 0) + 1;
            return acc;
        }, {});

        const variantIds = topVariants.map(t => t.variantId);
        const variants = await db.itemVariant.findMany({ where: { id: { in: variantIds } }, select: { id: true, name: true, item: { select: { name: true } } } });
        const variantMap = Object.fromEntries(variants.map(v => [v.id, `${v.item.name} - ${v.name}`]));
        const topItemsData = topVariants.map(t => ({
            variantId: t.variantId, name: variantMap[t.variantId] ?? t.variantId,
            qty: t._sum?.quantity, revenue: t._sum?.subtotal ? Number(t._sum.subtotal) : 0,
        }));

        // Revenue by day
        const revenueByDay: Record<string, number> = {};
        for (const tx of transactions) {
            const day = tx.createdAt.toISOString().slice(0, 10);
            revenueByDay[day] = (revenueByDay[day] ?? 0) + Number(tx.total);
        }

        return NextResponse.json({ revenue, txCount, avgOrder, nps, npsTotal, segments, topItems: topItemsData, revenueByDay });
    } catch (e) { console.error(e); return new NextResponse("Error", { status: 500 }); }
}
