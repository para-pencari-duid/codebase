"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { alertSuccess, alertError } from "@/lib/swal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Package, AlertTriangle, XCircle, DollarSign, Search, Plus, Minus, RefreshCw, Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface InventoryProduct {
    id: string;
    name: string;
    sku: string;
    category: string;
    stock: number;
    minStock: number;
    unit: string;
    price: number;
    cost: number;
    isActive: boolean;
    stockValue: number;
}

interface InventoryClientProps {
    data: InventoryProduct[];
    lowStockCount: number;
    outOfStockCount: number;
    totalStockValue: number;
}

const adjustmentReasons = [
    "Stok Masuk (Pembelian/Produksi)",
    "Hilang",
    "Rusak",
    "Expired/Kadaluarsa",
    "Salah Hitung",
    "Sample/Tester",
    "Konsumsi Staff",
    "Lainnya",
];

export const InventoryClient: React.FC<InventoryClientProps> = ({
    data,
    lowStockCount,
    outOfStockCount,
    totalStockValue,
}) => {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [adjustOpen, setAdjustOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null);
    const [adjustType, setAdjustType] = useState<"IN" | "OUT" | "ADJUSTMENT">("IN");
    const [adjustQty, setAdjustQty] = useState<number>(0);
    const [adjustReason, setAdjustReason] = useState("");
    const [adjustNotes, setAdjustNotes] = useState("");
    const [loading, setLoading] = useState(false);

    const filteredData = data.filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.sku.toLowerCase().includes(search.toLowerCase());
        if (filterStatus === "low") return matchesSearch && p.stock <= p.minStock && p.stock > 0;
        if (filterStatus === "out") return matchesSearch && p.stock === 0;
        if (filterStatus === "ok") return matchesSearch && p.stock > p.minStock;
        return matchesSearch;
    });

    const openAdjust = (product: InventoryProduct) => {
        setSelectedProduct(product);
        setAdjustType("IN");
        setAdjustQty(0);
        setAdjustReason("");
        setAdjustNotes("");
        setAdjustOpen(true);
    };

    const handleAdjust = async () => {
        if (!selectedProduct || !adjustReason) {
            alertError("Pilih alasan koreksi");
                return;
            }
            if (adjustType !== "ADJUSTMENT" && adjustQty <= 0) {
                alertError("Jumlah harus lebih dari 0");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("/api/inventory", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId: selectedProduct.id,
                    type: adjustType,
                    quantity: adjustType === "ADJUSTMENT" ? adjustQty : adjustQty,
                    reason: adjustReason,
                    notes: adjustNotes,
                }),
            });

            if (!response.ok) {
                const err = await response.text();
                alertError(err);
                return;
            }

            alertSuccess("Stok berhasil diupdate");
            setAdjustOpen(false);
            router.refresh();
        } catch {
            alertError("Gagal mengupdate stok");
        } finally {
            setLoading(false);
        }
    };

    const getStockBadge = (product: InventoryProduct) => {
        if (product.stock === 0) return <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: "oklch(0.94 0.08 20)", color: "oklch(0.45 0.16 20)" }}>Habis</span>;
        if (product.stock <= product.minStock) return <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: "oklch(0.96 0.06 80)", color: "oklch(0.50 0.14 70)" }}>Menipis</span>;
        return <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: "oklch(0.94 0.06 145)", color: "oklch(0.40 0.10 145)" }}>Aman</span>;
    };

    return (
        <div className="space-y-5">
            {/* ── Header ── */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Inventory</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Kelola stok produk</p>
                </div>
                <Link href="/inventory/batches">
                    <Button variant="outline">
                        <Calendar className="mr-2 h-4 w-4" />
                        Batch Management
                    </Button>
                </Link>
            </div>

            {/* ── Stats ── */}
            <div className="grid gap-3 md:grid-cols-4">
                {[
                    { label: "Total Produk",  value: data.length,             icon: Package,       text: "oklch(0.40 0.14 240)", bg: "oklch(0.95 0.05 240)" },
                    { label: "Stok Menipis",  value: lowStockCount,           icon: AlertTriangle,  text: "oklch(0.50 0.14 70)",  bg: "oklch(0.97 0.06 80)" },
                    { label: "Stok Habis",    value: outOfStockCount,         icon: XCircle,       text: "oklch(0.45 0.16 20)",  bg: "oklch(0.94 0.08 20)" },
                    { label: "Nilai Stok",    value: formatCurrency(totalStockValue), icon: DollarSign, text: "oklch(0.40 0.10 145)", bg: "oklch(0.94 0.06 145)" },
                ].map((s) => (
                    <div key={s.label} className="rounded-xl p-4 flex items-center justify-between bg-white" style={{ border: "1px solid var(--border)", boxShadow: "0 1px 3px oklch(0 0 0 / 5%)" }}>
                        <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">{s.label}</p>
                            <p className="text-2xl font-bold" style={{ color: s.text }}>{s.value}</p>
                        </div>
                        <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: s.bg }}>
                            <s.icon className="h-5 w-5" style={{ color: s.text }} />
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Filters ── */}
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Cari produk..."
                        className="pl-9 h-9 bg-white border-gray-200 text-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="h-9 w-44 text-sm border-gray-200 bg-white">
                        <SelectValue placeholder="Filter Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua</SelectItem>
                        <SelectItem value="ok">Stok Aman</SelectItem>
                        <SelectItem value="low">Stok Menipis</SelectItem>
                        <SelectItem value="out">Stok Habis</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* ── Table ── */}
            <div className="rounded-xl border overflow-hidden" style={{ boxShadow: "0 1px 3px oklch(0 0 0 / 5%)" }}>
                <Table>
                    <TableHeader>
                        <TableRow style={{ background: "oklch(0.97 0.002 80)" }}>
                            <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Produk</TableHead>
                            <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">SKU</TableHead>
                            <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Kategori</TableHead>
                            <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Stok</TableHead>
                            <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Min</TableHead>
                            <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Unit</TableHead>
                            <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</TableHead>
                            <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Nilai</TableHead>
                            <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.map((product) => (
                            <TableRow key={product.id} className="hover:bg-gray-50/60 transition-colors">
                                <TableCell className="font-medium text-gray-900">{product.name}</TableCell>
                                <TableCell className="text-gray-400 font-mono text-xs">{product.sku}</TableCell>
                                <TableCell>{product.category}</TableCell>
                                <TableCell className="text-right font-bold">{product.stock}</TableCell>
                                <TableCell className="text-right text-muted-foreground">{product.minStock}</TableCell>
                                <TableCell>{product.unit}</TableCell>
                                <TableCell>{getStockBadge(product)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(product.stockValue)}</TableCell>
                                <TableCell>
                                    <Button variant="outline" size="sm" onClick={() => openAdjust(product)}>
                                        <RefreshCw className="mr-1 h-3 w-3" />
                                        Koreksi
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredData.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center py-10 text-gray-400">
                                    Tidak ada produk ditemukan
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Stock Adjustment Dialog */}
            <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Koreksi Stok - {selectedProduct?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="rounded-lg p-3 text-sm" style={{ background: "oklch(0.97 0.002 80)" }}>
                            <div className="flex justify-between">
                                <span>Stok Saat Ini:</span>
                                <span className="font-bold">{selectedProduct?.stock} {selectedProduct?.unit}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Tipe Koreksi</Label>
                            <div className="grid grid-cols-3 gap-2">
                                <Button
                                    variant={adjustType === "IN" ? "default" : "outline"}
                                    onClick={() => setAdjustType("IN")}
                                    className="gap-1"
                                    type="button"
                                >
                                    <Plus className="h-4 w-4" />
                                    Masuk
                                </Button>
                                <Button
                                    variant={adjustType === "OUT" ? "default" : "outline"}
                                    onClick={() => setAdjustType("OUT")}
                                    className="gap-1"
                                    type="button"
                                >
                                    <Minus className="h-4 w-4" />
                                    Keluar
                                </Button>
                                <Button
                                    variant={adjustType === "ADJUSTMENT" ? "default" : "outline"}
                                    onClick={() => setAdjustType("ADJUSTMENT")}
                                    className="gap-1"
                                    type="button"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Set
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>
                                {adjustType === "ADJUSTMENT" ? "Stok Baru" : "Jumlah"}
                            </Label>
                            <Input
                                type="number"
                                min={0}
                                value={adjustQty}
                                onChange={(e) => setAdjustQty(Number(e.target.value))}
                            />
                            {adjustType !== "ADJUSTMENT" && selectedProduct && (
                                <p className="text-xs text-muted-foreground">
                                    Stok setelah koreksi: {adjustType === "IN"
                                        ? selectedProduct.stock + adjustQty
                                        : selectedProduct.stock - adjustQty} {selectedProduct.unit}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Alasan *</Label>
                            <Select value={adjustReason} onValueChange={setAdjustReason}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih alasan" />
                                </SelectTrigger>
                                <SelectContent>
                                    {adjustmentReasons.map((r) => (
                                        <SelectItem key={r} value={r}>{r}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Catatan (opsional)</Label>
                            <Textarea
                                value={adjustNotes}
                                onChange={(e) => setAdjustNotes(e.target.value)}
                                placeholder="Catatan tambahan..."
                                rows={2}
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={() => setAdjustOpen(false)}>
                                Batal
                            </Button>
                            <Button className="flex-1" disabled={loading} onClick={handleAdjust}>
                                Simpan
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
