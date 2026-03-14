"use client";

import { useCallback, useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
    CalendarIcon,
    Download,
    FileSpreadsheet,
    TrendingUp,
    Package,
    Users,
    Warehouse,
    FileText,
    ChevronDown,
    BarChart3,
    PieChart,
    Receipt,
    DollarSign,
} from "lucide-react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { alertSuccess, alertError } from "@/lib/swal";

type DateRange = { from: Date | undefined; to: Date | undefined };

/* eslint-disable @typescript-eslint/no-explicit-any */
export function ReportsClient() {
    const [activeTab, setActiveTab] = useState("sales");
    const [dateRange, setDateRange] = useState<DateRange>({
        from: new Date(new Date().setDate(new Date().getDate() - 30)),
        to: new Date(),
    });
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [reportData, setReportData] = useState<any>(null);

    const fetchReport = useCallback(async (type: string) => {
        try {
            setLoading(true);
            const params = new URLSearchParams({ type });
            if (dateRange.from) params.set("startDate", dateRange.from.toISOString());
            if (dateRange.to) params.set("endDate", dateRange.to.toISOString());

            const res = await fetch(`/api/reports?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch report");
            const data = await res.json();
            setReportData(data);
        } catch {
            alertError("Gagal memuat laporan");
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        fetchReport(tab);
    };

    // New: Download comprehensive Excel report via API
    const downloadExcelReport = useCallback(async (reportType: string) => {
        try {
            setExporting(true);
            const params = new URLSearchParams({ type: reportType });
            if (dateRange.from) params.set("startDate", dateRange.from.toISOString());
            if (dateRange.to) params.set("endDate", dateRange.to.toISOString());
            params.set("date", new Date().toISOString());

            const res = await fetch(`/api/reports/export?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to generate report");

            const blob = await res.blob();
            const filename = res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] || "laporan.xlsx";

            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            alertSuccess("Laporan berhasil diunduh");
        } catch (error) {
            console.error(error);
            alertError("Gagal mengunduh laporan");
        } finally {
            setExporting(false);
        }
    }, [dateRange]);

    const downloadComplexForActiveTab = useCallback(() => {
        const typeMap: Record<string, string> = {
            sales: "sales",
            products: "products",
            cashier: "cashier",
            stock: "stock",
            profitloss: "profitloss",
            preorders: "preorders",
        };

        const reportType = typeMap[activeTab] || "sales";
        downloadExcelReport(reportType);
    }, [activeTab, downloadExcelReport]);

    const exportToExcel = () => {
        if (!reportData) return;

        let data: Record<string, unknown>[] = [];
        let sheetName = "Report";

        switch (reportData.type) {
            case "sales":
                sheetName = "Laporan Penjualan";
                data = (reportData.transactions || []).map((t: any) => ({
                    "No. Transaksi": t.transactionNo,
                    Tanggal: format(new Date(t.createdAt), "dd/MM/yyyy HH:mm"),
                    Kasir: t.user?.name || "-",
                    Pelanggan: t.customer?.name || "Umum",
                    Subtotal: Number(t.subtotal),
                    Pajak: Number(t.tax),
                    Diskon: Number(t.discount),
                    Total: Number(t.total),
                    "Metode Bayar": t.paymentMethod,
                    Status: t.status,
                }));
                break;
            case "products":
                sheetName = "Laporan Produk";
                data = (reportData.products || []).map((p: any) => ({
                    SKU: p.sku,
                    "Nama Produk": p.name,
                    Kategori: p.category,
                    "Qty Terjual": p.quantitySold,
                    Pendapatan: p.revenue,
                }));
                break;
            case "cashier":
                sheetName = "Laporan Kasir";
                data = (reportData.cashiers || []).map((c: any) => ({
                    Nama: c.name,
                    Email: c.email,
                    "Jumlah Transaksi": c.transactionCount,
                    "Total Pendapatan": c.totalRevenue,
                    "Total Item": c.totalItems,
                }));
                break;
            case "stock":
                sheetName = "Laporan Stok";
                data = (reportData.products || []).map((p: any) => ({
                    SKU: p.sku,
                    "Nama Produk": p.name,
                    Kategori: p.category,
                    Stok: p.stock,
                    "Min Stok": p.minStock,
                    Satuan: p.unit,
                    "Harga Jual": p.price,
                    "Harga Modal": p.cost,
                    "Nilai Stok": p.stockValue,
                    Status: p.status === "OUT_OF_STOCK" ? "Habis" : p.status === "LOW_STOCK" ? "Rendah" : "OK",
                }));
                break;
            case "preorders":
                sheetName = "Laporan Pre-Order";
                data = (reportData.tickets || []).map((t: any) => ({
                    "No. Order": t.ticketNo,
                    Pelanggan: t.customerName,
                    "No. HP": t.customerPhone,
                    Produk: t.title,
                    Qty: t.quantity,
                    Total: Number(t.totalPrice),
                    DP: Number(t.dpAmount),
                    "Metode DP": t.dpMethod ?? "-",
                    "Metode Lunas": t.finalPayMethod ?? "-",
                    "Tgl. Lunas": t.finalPaidAt ? format(new Date(t.finalPaidAt), "dd/MM/yyyy HH:mm") : "-",
                    Status: t.status,
                }));
                break;
        }

        if (data.length === 0) {
            alertError("Tidak ada data untuk diekspor");
            return;
        }

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, `${sheetName}_${format(new Date(), "yyyyMMdd")}.xlsx`);
        alertSuccess("Berhasil mengekspor ke Excel");
    };

    const exportToPDF = () => {
        if (!reportData) return;

        const doc = new jsPDF();
        let title = "Laporan";
        let headers: string[] = [];
        let rows: (string | number)[][] = [];

        switch (reportData.type) {
            case "sales":
                title = "Laporan Penjualan";
                headers = ["No. Transaksi", "Tanggal", "Kasir", "Pelanggan", "Total", "Status"];
                rows = (reportData.transactions || []).map((t: any) => [
                    t.transactionNo,
                    format(new Date(t.createdAt), "dd/MM/yyyy HH:mm"),
                    t.user?.name || "-",
                    t.customer?.name || "Umum",
                    formatCurrency(Number(t.total)),
                    t.status,
                ]);
                break;
            case "products":
                title = "Laporan Produk Terlaris";
                headers = ["SKU", "Nama Produk", "Kategori", "Qty Terjual", "Pendapatan"];
                rows = (reportData.products || []).map((p: any) => [
                    p.sku,
                    p.name,
                    p.category,
                    p.quantitySold,
                    formatCurrency(p.revenue),
                ]);
                break;
            case "cashier":
                title = "Laporan Kasir";
                headers = ["Nama", "Email", "Jml Transaksi", "Total Pendapatan", "Total Item"];
                rows = (reportData.cashiers || []).map((c: any) => [
                    c.name,
                    c.email,
                    c.transactionCount,
                    formatCurrency(c.totalRevenue),
                    c.totalItems,
                ]);
                break;
            case "stock":
                title = "Laporan Stok Barang";
                headers = ["SKU", "Nama Produk", "Kategori", "Stok", "Min Stok", "Status"];
                rows = (reportData.products || []).map((p: any) => [
                    p.sku,
                    p.name,
                    p.category,
                    p.stock,
                    p.minStock,
                    p.status === "OUT_OF_STOCK" ? "Habis" : p.status === "LOW_STOCK" ? "Rendah" : "OK",
                ]);
                break;
        }

        if (rows.length === 0) {
            alertError("Tidak ada data untuk diekspor");
            return;
        }

        // Add title
        doc.setFontSize(16);
        doc.text(title, 14, 15);

        // Add date range
        doc.setFontSize(10);
        const dateText = dateRange.from && dateRange.to
            ? `Periode: ${format(dateRange.from, "dd MMM yyyy")} - ${format(dateRange.to, "dd MMM yyyy")}`
            : `Tanggal: ${format(new Date(), "dd MMM yyyy")}`;
        doc.text(dateText, 14, 22);

        // Add table
        autoTable(doc, {
            head: [headers],
            body: rows,
            startY: 28,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [66, 66, 66] },
        });

        doc.save(`${title}_${format(new Date(), "yyyyMMdd")}.pdf`);
        alertSuccess("Berhasil mengekspor ke PDF");
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Laporan</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Analisis data penjualan dan inventori</p>
                </div>
                <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("justify-start text-left font-normal", !dateRange.from && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange.from ? (
                                    dateRange.to ? (
                                        `${format(dateRange.from, "dd MMM", { locale: localeId })} - ${format(dateRange.to, "dd MMM yyyy", { locale: localeId })}`
                                    ) : (
                                        format(dateRange.from, "dd MMM yyyy", { locale: localeId })
                                    )
                                ) : (
                                    "Pilih tanggal"
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                mode="range"
                                selected={dateRange}
                                onSelect={(range) => {
                                    if (range) setDateRange({ from: range.from, to: range.to });
                                }}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>
                    <Button variant="outline" onClick={() => fetchReport(activeTab)} disabled={loading}>
                        {loading ? "Memuat..." : "Tampilkan"}
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="default" disabled={exporting}>
                                <Download className="mr-2 h-4 w-4" />
                                {exporting ? "Mengunduh..." : "Export Excel"}
                                <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>📊 Laporan Penjualan</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => downloadExcelReport("daily")}>
                                <Receipt className="mr-2 h-4 w-4" />
                                Harian (Hari Ini)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => downloadExcelReport("weekly")}>
                                <BarChart3 className="mr-2 h-4 w-4" />
                                Mingguan
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => downloadExcelReport("monthly")}>
                                <TrendingUp className="mr-2 h-4 w-4" />
                                Bulanan
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => downloadExcelReport("custom")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                Custom Range
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>📦 Laporan Lainnya</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => downloadExcelReport("products")}>
                                <Package className="mr-2 h-4 w-4" />
                                Analisis Produk
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => downloadExcelReport("cashier")}>
                                <Users className="mr-2 h-4 w-4" />
                                Analisis Kasir
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => downloadExcelReport("inventory")}>
                                <Warehouse className="mr-2 h-4 w-4" />
                                Inventory (Stok)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => downloadExcelReport("preorders")}>
                                <FileText className="mr-2 h-4 w-4" />
                                Analisis Pre-Order
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => downloadExcelReport("customers")}>
                                <Users className="mr-2 h-4 w-4" />
                                Analisis Pelanggan
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>💰 Laporan Keuangan</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => downloadExcelReport("profitloss")}>
                                <DollarSign className="mr-2 h-4 w-4" />
                                Laba Rugi (P&L)
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="default" onClick={downloadComplexForActiveTab} disabled={exporting}>
                        <Download className="mr-2 h-4 w-4" />
                        Export Kompleks (Tab Aktif)
                    </Button>
                    <Button variant="outline" onClick={exportToExcel} disabled={!reportData}>
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        Quick Excel
                    </Button>
                    <Button variant="outline" onClick={exportToPDF} disabled={!reportData}>
                        <FileText className="mr-2 h-4 w-4" />
                        PDF
                    </Button>
                </div>
            </div>
            <Separator />

            {/* Advanced Export Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => downloadExcelReport("daily")}>
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Receipt className="h-5 w-5 text-primary" />
                            </div>
                            <CardTitle className="text-base">Harian</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <CardDescription>Penjualan per jam, top produk, kasir</CardDescription>
                    </CardContent>
                </Card>
                <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => downloadExcelReport("products")}>
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-orange-500/10 rounded-lg">
                                <PieChart className="h-5 w-5 text-orange-500" />
                            </div>
                            <CardTitle className="text-base">Produk</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <CardDescription>Best sellers, slow moving, margin</CardDescription>
                    </CardContent>
                </Card>
                <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => downloadExcelReport("customers")}>
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <Users className="h-5 w-5 text-blue-500" />
                            </div>
                            <CardTitle className="text-base">Pelanggan</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <CardDescription>Segmentasi, LTV, top customers</CardDescription>
                    </CardContent>
                </Card>
                <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => downloadExcelReport("profitloss")}>
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-green-500/10 rounded-lg">
                                <DollarSign className="h-5 w-5 text-green-500" />
                            </div>
                            <CardTitle className="text-base">Laba Rugi</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <CardDescription>Revenue, expenses, net profit</CardDescription>
                    </CardContent>
                </Card>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="sales" className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" /> Penjualan
                    </TabsTrigger>
                    <TabsTrigger value="products" className="flex items-center gap-2">
                        <Package className="h-4 w-4" /> Produk
                    </TabsTrigger>
                    <TabsTrigger value="cashier" className="flex items-center gap-2">
                        <Users className="h-4 w-4" /> Kasir
                    </TabsTrigger>
                    <TabsTrigger value="stock" className="flex items-center gap-2">
                        <Warehouse className="h-4 w-4" /> Stok
                    </TabsTrigger>
                    <TabsTrigger value="profitloss" className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" /> Laba Rugi
                    </TabsTrigger>
                    <TabsTrigger value="preorders" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Pre-Order
                    </TabsTrigger>
                </TabsList>

                {/* Sales Report */}
                <TabsContent value="sales" className="space-y-4">
                    {reportData?.type === "sales" ? (
                        <>
                            <div className="grid gap-4 md:grid-cols-4">
                                <SummaryCard title="Total Transaksi" value={reportData.summary.totalTransactions.toString()} icon={<FileSpreadsheet className="h-4 w-4 text-muted-foreground" />} />
                                <SummaryCard title="Total Pendapatan" value={formatCurrency(reportData.summary.totalRevenue)} icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />} />
                                <SummaryCard title="Total Diskon" value={formatCurrency(reportData.summary.totalDiscount)} icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />} />
                                <SummaryCard title="Rata-rata / Transaksi" value={formatCurrency(reportData.summary.avgTransactionValue)} icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />} />
                            </div>

                            {/* Daily breakdown */}
                            {reportData.summary.dailySales?.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Penjualan Harian</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Tanggal</TableHead>
                                                    <TableHead>Jumlah Transaksi</TableHead>
                                                    <TableHead className="text-right">Pendapatan</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {reportData.summary.dailySales.map((day: any) => (
                                                    <TableRow key={day.date}>
                                                        <TableCell>{format(new Date(day.date), "dd MMM yyyy", { locale: localeId })}</TableCell>
                                                        <TableCell>{day.count}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(day.revenue)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Payment breakdown */}
                            {reportData.summary.paymentBreakdown?.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Breakdown Metode Pembayaran</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Metode</TableHead>
                                                    <TableHead className="text-right">Total</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {reportData.summary.paymentBreakdown.map((p: any) => (
                                                    <TableRow key={p.method}>
                                                        <TableCell>
                                                            <Badge variant="outline">{p.method}</Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right">{formatCurrency(p.amount)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    ) : (
                        <EmptyState message="Klik 'Tampilkan' untuk memuat laporan penjualan" />
                    )}
                </TabsContent>

                {/* Products Report */}
                <TabsContent value="products" className="space-y-4">
                    {reportData?.type === "products" ? (
                        <>
                            <div className="grid gap-4 md:grid-cols-5">
                                <SummaryCard title="Produk Terjual" value={reportData.summary.totalProducts.toString()} icon={<Package className="h-4 w-4 text-muted-foreground" />} />
                                <SummaryCard title="Total Qty" value={reportData.summary.totalQuantitySold.toString()} icon={<Package className="h-4 w-4 text-muted-foreground" />} />
                                <SummaryCard title="Total Pendapatan" value={formatCurrency(reportData.summary.totalRevenue)} icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />} />
                                <SummaryCard title="Ready Stock" value={(reportData.summary.readyStockCount || 0).toString()} icon={<Warehouse className="h-4 w-4 text-green-600" />} />
                                <SummaryCard title="Pre-Order" value={(reportData.summary.preOrderCount || 0).toString()} icon={<FileText className="h-4 w-4 text-amber-600" />} />
                            </div>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Detail Produk Terjual</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>SKU</TableHead>
                                                <TableHead>Produk</TableHead>
                                                <TableHead>Kategori</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Qty Terjual</TableHead>
                                                <TableHead className="text-right">Pendapatan</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {reportData.products.map((p: any) => (
                                                <TableRow key={p.id}>
                                                    <TableCell className="font-mono text-sm">{p.sku}</TableCell>
                                                    <TableCell className="font-medium">{p.name}</TableCell>
                                                    <TableCell>{p.category}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={p.orderType === "PRE_ORDER" ? "secondary" : "default"}>
                                                            {p.orderType === "PRE_ORDER" ? "Pre-Order" : "Ready Stock"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">{p.quantitySold}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(p.revenue)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <EmptyState message="Klik 'Tampilkan' untuk memuat laporan produk" />
                    )}
                </TabsContent>

                {/* Cashier Report */}
                <TabsContent value="cashier" className="space-y-4">
                    {reportData?.type === "cashier" ? (
                        <Card>
                            <CardHeader>
                                <CardTitle>Performa Kasir</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nama</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead className="text-right">Transaksi</TableHead>
                                            <TableHead className="text-right">Total Item</TableHead>
                                            <TableHead className="text-right">Total Pendapatan</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {reportData.cashiers.map((c: any) => (
                                            <TableRow key={c.id}>
                                                <TableCell className="font-medium">{c.name}</TableCell>
                                                <TableCell>{c.email}</TableCell>
                                                <TableCell className="text-right">{c.transactionCount}</TableCell>
                                                <TableCell className="text-right">{c.totalItems}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(c.totalRevenue)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    ) : (
                        <EmptyState message="Klik 'Tampilkan' untuk memuat laporan kasir" />
                    )}
                </TabsContent>

                {/* Stock Report */}
                <TabsContent value="stock" className="space-y-4">
                    {reportData?.type === "stock" ? (
                        <>
                            <div className="grid gap-4 md:grid-cols-4">
                                <SummaryCard title="Total Produk" value={reportData.summary.totalProducts.toString()} icon={<Package className="h-4 w-4 text-muted-foreground" />} />
                                <SummaryCard title="Nilai Stok" value={formatCurrency(reportData.summary.totalStockValue)} icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />} />
                                <SummaryCard title="Stok Rendah" value={reportData.summary.lowStock.toString()} icon={<Warehouse className="h-4 w-4 text-orange-500" />} />
                                <SummaryCard title="Stok Habis" value={reportData.summary.outOfStock.toString()} icon={<Warehouse className="h-4 w-4 text-red-500" />} />
                            </div>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Detail Stok</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>SKU</TableHead>
                                                <TableHead>Produk</TableHead>
                                                <TableHead>Kategori</TableHead>
                                                <TableHead className="text-right">Stok</TableHead>
                                                <TableHead className="text-right">Min</TableHead>
                                                <TableHead>Satuan</TableHead>
                                                <TableHead className="text-right">Nilai Stok</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {reportData.products.map((p: any) => (
                                                <TableRow key={p.id}>
                                                    <TableCell className="font-mono text-sm">{p.sku}</TableCell>
                                                    <TableCell className="font-medium">{p.name}</TableCell>
                                                    <TableCell>{p.category}</TableCell>
                                                    <TableCell className="text-right">{p.stock}</TableCell>
                                                    <TableCell className="text-right">{p.minStock}</TableCell>
                                                    <TableCell>{p.unit}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(p.stockValue)}</TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={
                                                                p.status === "OUT_OF_STOCK"
                                                                    ? "destructive"
                                                                    : p.status === "LOW_STOCK"
                                                                      ? "secondary"
                                                                      : "default"
                                                            }
                                                        >
                                                            {p.status === "OUT_OF_STOCK"
                                                                ? "Habis"
                                                                : p.status === "LOW_STOCK"
                                                                  ? "Rendah"
                                                                  : "OK"}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <EmptyState message="Klik 'Tampilkan' untuk memuat laporan stok" />
                    )}
                </TabsContent>

                {/* Profit/Loss Report */}
                <TabsContent value="profitloss" className="space-y-4">
                    {reportData?.type === "profitloss" ? (
                        <>
                            <div className="grid gap-4 md:grid-cols-4">
                                <SummaryCard title="Total Pendapatan" value={formatCurrency(reportData.revenue.total)} icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />} />
                                <SummaryCard title="Gross Profit" value={formatCurrency(reportData.grossProfit)} icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />} />
                                <SummaryCard title="Total Opex" value={formatCurrency(reportData.totalOperationalExpenses)} icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />} />
                                <SummaryCard title="Net Profit" value={formatCurrency(reportData.netProfit)} icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />} />
                            </div>

                            {reportData.operationalExpenses?.length > 0 && (
                                <Card>
                                    <CardHeader><CardTitle>Biaya Operasional</CardTitle></CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Nama</TableHead>
                                                    <TableHead className="text-right">Jumlah</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {reportData.operationalExpenses.map((e: any, idx: number) => (
                                                    <TableRow key={idx}>
                                                        <TableCell>{e.name}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(e.amount)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    ) : (
                        <EmptyState message="Klik 'Tampilkan' untuk memuat laporan laba rugi" />
                    )}
                </TabsContent>

                {/* Pre-Orders Report */}
                <TabsContent value="preorders" className="space-y-4">
                    {reportData?.type === "preorders" ? (
                        <>
                            <div className="grid gap-4 md:grid-cols-3">
                                <SummaryCard title="Total Pre-Order Lunas" value={reportData.summary.totalOrders.toString()} icon={<FileText className="h-4 w-4 text-muted-foreground" />} />
                                <SummaryCard title="Total Pendapatan" value={formatCurrency(reportData.summary.totalRevenue)} icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />} />
                                <SummaryCard title="Total DP Diterima" value={formatCurrency(reportData.summary.totalDP)} icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} />
                            </div>
                            {reportData.summary.paymentBreakdown?.length > 0 && (
                                <Card>
                                    <CardHeader><CardTitle>Breakdown Metode Pembayaran</CardTitle></CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Metode</TableHead>
                                                    <TableHead className="text-right">Total</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {reportData.summary.paymentBreakdown.map((p: any) => (
                                                    <TableRow key={p.method}>
                                                        <TableCell><Badge variant="outline">{p.method}</Badge></TableCell>
                                                        <TableCell className="text-right">{formatCurrency(p.amount)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            )}
                            <Card>
                                <CardHeader><CardTitle>Daftar Pre-Order Lunas</CardTitle></CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>No. Order</TableHead>
                                                <TableHead>Pelanggan</TableHead>
                                                <TableHead>HP</TableHead>
                                                <TableHead>Produk</TableHead>
                                                <TableHead>Tgl. Lunas</TableHead>
                                                <TableHead>Metode</TableHead>
                                                <TableHead className="text-right">Total</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {reportData.tickets.map((t: any) => (
                                                <TableRow key={t.id}>
                                                    <TableCell className="font-mono text-sm">{t.ticketNo}</TableCell>
                                                    <TableCell className="font-medium">{t.customerName}</TableCell>
                                                    <TableCell>{t.customerPhone}</TableCell>
                                                    <TableCell>{t.title}</TableCell>
                                                    <TableCell>{t.finalPaidAt ? format(new Date(t.finalPaidAt), "dd MMM yyyy HH:mm", { locale: localeId }) : "-"}</TableCell>
                                                    <TableCell><Badge variant="outline">{t.finalPayMethod ?? t.dpMethod ?? "-"}</Badge></TableCell>
                                                    <TableCell className="text-right">{formatCurrency(Number(t.totalPrice))}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <EmptyState message="Klik 'Tampilkan' untuk memuat laporan pre-order" />
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

function SummaryCard({
    title,
    value,
    icon,
}: {
    title: string;
    value: string;
    icon: React.ReactNode;
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <Card>
            <CardContent className="flex items-center justify-center py-16">
                <p className="text-muted-foreground">{message}</p>
            </CardContent>
        </Card>
    );
}
