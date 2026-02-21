import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session) return new NextResponse("Unauthorized", { status: 401 });
        if (session.user.role === "KASIR") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type") || "sales"; // sales | products | cashier | stock
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        const dateFilter: Record<string, unknown> = {};
        if (startDate) dateFilter.gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            dateFilter.lte = end;
        }

        const where: Record<string, unknown> = { status: "COMPLETED" };
        if (startDate || endDate) {
            where.createdAt = dateFilter;
        }

        switch (type) {
            case "sales": {
                const transactions = await db.transaction.findMany({
                    where,
                    include: {
                        items: true,
                        user: { select: { name: true } },
                        customer: { select: { name: true } },
                    },
                    orderBy: { createdAt: "desc" },
                });

                const summary = {
                    totalTransactions: transactions.length,
                    totalRevenue: transactions.reduce((sum, t) => sum + Number(t.total), 0),
                    totalDiscount: transactions.reduce((sum, t) => sum + Number(t.discount), 0),
                    totalTax: transactions.reduce((sum, t) => sum + Number(t.tax), 0),
                    totalItems: transactions.reduce(
                        (sum, t) => sum + t.items.reduce((s, i) => s + i.quantity, 0),
                        0
                    ),
                    avgTransactionValue:
                        transactions.length > 0
                            ? transactions.reduce((sum, t) => sum + Number(t.total), 0) /
                              transactions.length
                            : 0,
                    paymentBreakdown: Object.entries(
                        transactions.reduce(
                            (acc, t) => {
                                acc[t.paymentMethod] = (acc[t.paymentMethod] || 0) + Number(t.total);
                                return acc;
                            },
                            {} as Record<string, number>
                        )
                    ).map(([method, amount]) => ({ method, amount })),
                    // Daily breakdown
                    dailySales: Object.entries(
                        transactions.reduce(
                            (acc, t) => {
                                const day = t.createdAt.toISOString().split("T")[0];
                                if (!acc[day]) acc[day] = { date: day, revenue: 0, count: 0 };
                                acc[day].revenue += Number(t.total);
                                acc[day].count += 1;
                                return acc;
                            },
                            {} as Record<string, { date: string; revenue: number; count: number }>
                        )
                    )
                        .map(([, v]) => v)
                        .sort((a, b) => a.date.localeCompare(b.date)),
                };

                return NextResponse.json({ type: "sales", summary, transactions });
            }

            case "products": {
                const items = await db.transactionItem.findMany({
                    where: {
                        transaction: where,
                    },
                    include: {
                        product: {
                            select: { id: true, name: true, sku: true, category: { select: { name: true } } },
                        },
                    },
                });

                const productMap: Record<
                    string,
                    {
                        id: string;
                        name: string;
                        sku: string;
                        category: string;
                        quantitySold: number;
                        revenue: number;
                    }
                > = {};

                for (const item of items) {
                    const pid = item.productId;
                    if (!productMap[pid]) {
                        productMap[pid] = {
                            id: pid,
                            name: item.product.name,
                            sku: item.product.sku,
                            category: item.product.category.name,
                            quantitySold: 0,
                            revenue: 0,
                        };
                    }
                    productMap[pid].quantitySold += item.quantity;
                    productMap[pid].revenue += Number(item.subtotal);
                }

                const products = Object.values(productMap).sort(
                    (a, b) => b.revenue - a.revenue
                );

                const summary = {
                    totalProducts: products.length,
                    totalQuantitySold: products.reduce((s, p) => s + p.quantitySold, 0),
                    totalRevenue: products.reduce((s, p) => s + p.revenue, 0),
                };

                return NextResponse.json({ type: "products", summary, products });
            }

            case "cashier": {
                const transactions = await db.transaction.findMany({
                    where,
                    include: {
                        user: { select: { id: true, name: true, email: true } },
                        items: true,
                    },
                });

                const cashierMap: Record<
                    string,
                    {
                        id: string;
                        name: string;
                        email: string;
                        transactionCount: number;
                        totalRevenue: number;
                        totalItems: number;
                    }
                > = {};

                for (const tx of transactions) {
                    const uid = tx.userId;
                    if (!cashierMap[uid]) {
                        cashierMap[uid] = {
                            id: uid,
                            name: tx.user.name || "-",
                            email: tx.user.email,
                            transactionCount: 0,
                            totalRevenue: 0,
                            totalItems: 0,
                        };
                    }
                    cashierMap[uid].transactionCount += 1;
                    cashierMap[uid].totalRevenue += Number(tx.total);
                    cashierMap[uid].totalItems += tx.items.reduce((s, i) => s + i.quantity, 0);
                }

                const cashiers = Object.values(cashierMap).sort(
                    (a, b) => b.totalRevenue - a.totalRevenue
                );

                return NextResponse.json({ type: "cashier", cashiers });
            }

            case "stock": {
                const products = await db.product.findMany({
                    where: { isActive: true },
                    include: {
                        category: { select: { name: true } },
                    },
                    orderBy: { stock: "asc" },
                });

                const stockData = products.map((p) => ({
                    id: p.id,
                    name: p.name,
                    sku: p.sku,
                    category: p.category.name,
                    stock: p.stock,
                    minStock: p.minStock,
                    unit: p.unit,
                    cost: Number(p.cost || 0),
                    price: Number(p.price),
                    stockValue: p.stock * Number(p.cost || 0),
                    status:
                        p.stock === 0
                            ? "OUT_OF_STOCK"
                            : p.stock <= p.minStock
                              ? "LOW_STOCK"
                              : "OK",
                }));

                const summary = {
                    totalProducts: stockData.length,
                    totalStockValue: stockData.reduce((s, p) => s + p.stockValue, 0),
                    outOfStock: stockData.filter((p) => p.status === "OUT_OF_STOCK").length,
                    lowStock: stockData.filter((p) => p.status === "LOW_STOCK").length,
                };

                return NextResponse.json({ type: "stock", summary, products: stockData });
            }

            default:
                return new NextResponse("Invalid report type", { status: 400 });
        }
    } catch (error) {
        console.log("[REPORTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
