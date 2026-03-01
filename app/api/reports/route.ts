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
                                const method = t.paymentMethod || "CASH";
                                acc[method] = (acc[method] || 0) + Number(t.total);
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
                        variant: {
                            include: {
                                item: {
                                    select: { id: true, name: true, sku: true, category: { select: { name: true } } },
                                },
                            },
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
                    const vid = item.variantId;
                    if (!productMap[vid]) {
                        productMap[vid] = {
                            id: vid,
                            name: item.variant?.item?.name || item.itemName,
                            sku: item.variant?.item?.sku || "",
                            category: item.variant?.item?.category?.name || "Uncategorized",
                            quantitySold: 0,
                            revenue: 0,
                        };
                    }
                    productMap[vid].quantitySold += item.quantity;
                    productMap[vid].revenue += Number(item.subtotal);
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
                const variants = await db.itemVariant.findMany({
                    where: { item: { type: "GOODS", isActive: true } },
                    include: {
                        item: { include: { category: true } },
                    },
                    orderBy: { stock: "asc" },
                });

                const stockData = variants.map((v) => ({
                    id: v.id,
                    name: v.item.name,
                    sku: v.sku,
                    category: v.item.category?.name || "Uncategorized",
                    stock: v.stock,
                    minStock: v.minStock,
                    unit: v.item.unit,
                    cost: Number(v.cost || 0),
                    price: Number(v.price),
                    stockValue: v.stock * Number(v.cost || 0),
                    status:
                        v.stock === 0
                            ? "OUT_OF_STOCK"
                            : v.stock <= v.minStock
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

            case "preorders": {
                const poWhere: Record<string, unknown> = {
                    status: { not: "CANCELLED" },
                    remainingAmount: 0,
                };
                if (startDate || endDate) {
                    poWhere.finalPaidAt = dateFilter;
                }

                const tickets = await db.jobTicket.findMany({
                    where: poWhere,
                    include: { items: true },
                    orderBy: { finalPaidAt: "desc" },
                });

                const summary = {
                    totalOrders: tickets.length,
                    totalRevenue: tickets.reduce((s, t) => s + Number(t.totalPrice), 0),
                    totalDP: tickets.reduce((s, t) => s + Number(t.dpAmount), 0),
                    paymentBreakdown: Object.entries(
                        tickets.reduce((acc, t) => {
                            const m = t.finalPayMethod ?? t.dpMethod ?? "CASH";
                            acc[m] = (acc[m] || 0) + Number(t.totalPrice);
                            return acc;
                        }, {} as Record<string, number>)
                    ).map(([method, amount]) => ({ method, amount })),
                };

                return NextResponse.json({ type: "preorders", summary, tickets });
            }

            default:
                return new NextResponse("Invalid report type", { status: 400 });
        }
    } catch (error) {
        console.log("[REPORTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
