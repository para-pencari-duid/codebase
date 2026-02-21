"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
    DollarSign,
    ShoppingCart,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Package,
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

const paymentMethodLabels: Record<string, string> = {
    CASH: "Tunai",
    TRANSFER: "Transfer",
    QRIS: "QRIS",
    DEBIT_CARD: "Debit",
    CREDIT_CARD: "Kredit",
    EWALLET: "E-Wallet",
};

interface DashboardClientProps {
    todaySales: number;
    todayTransactionCount: number;
    salesGrowth: number;
    lowStockCount: number;
    lowStockProducts: { id: string; name: string; stock: number; minStock: number; unit: string }[];
    topProducts: { name: string; qty: number; revenue: number }[];
    dailySales: { date: string; total: number; count: number }[];
    recentTransactions: {
        id: string;
        transactionNo: string;
        customerName: string;
        total: number;
        paymentMethod: string;
        createdAt: string;
    }[];
    paymentBreakdown: Record<string, number>;
}

export const DashboardClient: React.FC<DashboardClientProps> = ({
    todaySales,
    todayTransactionCount,
    salesGrowth,
    lowStockCount,
    lowStockProducts,
    topProducts,
    dailySales,
    recentTransactions,
    paymentBreakdown,
}) => {
    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Penjualan Hari Ini</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(todaySales)}</div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            {salesGrowth >= 0 ? (
                                <TrendingUp className="h-3 w-3 text-green-500" />
                            ) : (
                                <TrendingDown className="h-3 w-3 text-red-500" />
                            )}
                            <span className={salesGrowth >= 0 ? "text-green-500" : "text-red-500"}>
                                {salesGrowth >= 0 ? "+" : ""}{salesGrowth.toFixed(1)}%
                            </span>
                            dari kemarin
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Transaksi</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{todayTransactionCount}</div>
                        <p className="text-xs text-muted-foreground">
                            {todayTransactionCount > 0
                                ? `Rata-rata ${formatCurrency(todaySales / todayTransactionCount)}/trx`
                                : "Belum ada transaksi"}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Produk Terlaris</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {topProducts.length > 0 ? topProducts[0].name : "-"}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {topProducts.length > 0 ? `${topProducts[0].qty} terjual` : "Belum ada data"}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Stok Menipis</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${lowStockCount > 0 ? "text-yellow-600" : ""}`}>
                            {lowStockCount}
                        </div>
                        <p className="text-xs text-muted-foreground">Item perlu restock</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts & Lists */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Sales Chart */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Penjualan 7 Hari Terakhir</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dailySales}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" fontSize={12} />
                                    <YAxis
                                        fontSize={12}
                                        tickFormatter={(value) =>
                                            value >= 1000000
                                                ? `${(value / 1000000).toFixed(1)}jt`
                                                : value >= 1000
                                                    ? `${(value / 1000).toFixed(0)}rb`
                                                    : value
                                        }
                                    />
                                    <Tooltip
                                        formatter={(value) => [formatCurrency(Number(value)), "Penjualan"]}
                                    />
                                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Transactions */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Transaksi Terakhir</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {recentTransactions.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Belum ada transaksi</p>
                        ) : (
                            recentTransactions.map((t) => (
                                <div key={t.id} className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium">{t.customerName}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {t.transactionNo} - {paymentMethodLabels[t.paymentMethod] || t.paymentMethod}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold">{formatCurrency(t.total)}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(t.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Top Products */}
                <Card>
                    <CardHeader>
                        <CardTitle>Produk Terlaris Hari Ini</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {topProducts.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Belum ada data</p>
                        ) : (
                            topProducts.map((p, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-muted-foreground w-4">{i + 1}.</span>
                                        <span className="text-sm">{p.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant="outline">{p.qty} terjual</Badge>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Payment Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle>Metode Pembayaran</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {Object.keys(paymentBreakdown).length === 0 ? (
                            <p className="text-sm text-muted-foreground">Belum ada data</p>
                        ) : (
                            Object.entries(paymentBreakdown)
                                .sort((a, b) => b[1] - a[1])
                                .map(([method, amount]) => (
                                    <div key={method} className="flex items-center justify-between">
                                        <span className="text-sm">{paymentMethodLabels[method] || method}</span>
                                        <div className="text-right">
                                            <span className="text-sm font-bold">{formatCurrency(amount)}</span>
                                            <span className="text-xs text-muted-foreground ml-2">
                                                ({todaySales > 0 ? ((amount / todaySales) * 100).toFixed(0) : 0}%)
                                            </span>
                                        </div>
                                    </div>
                                ))
                        )}
                    </CardContent>
                </Card>

                {/* Low Stock */}
                <Card>
                    <CardHeader>
                        <CardTitle>Stok Menipis</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {lowStockProducts.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-green-600">Semua stok aman!</p>
                        ) : (
                            lowStockProducts.map((p) => (
                                <div key={p.id} className="flex items-center justify-between">
                                    <span className="text-sm">{p.name}</span>
                                    <Badge variant={p.stock === 0 ? "destructive" : "secondary"}>
                                        {p.stock} {p.unit}
                                    </Badge>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
