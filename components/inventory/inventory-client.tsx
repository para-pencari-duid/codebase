"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
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
            toast.error("Pilih alasan koreksi");
            return;
        }
        if (adjustType !== "ADJUSTMENT" && adjustQty <= 0) {
            toast.error("Jumlah harus lebih dari 0");
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
                toast.error(err);
                return;
            }

            toast.success("Stok berhasil diupdate");
            setAdjustOpen(false);
            router.refresh();
        } catch {
            toast.error("Gagal mengupdate stok");
        } finally {
            setLoading(false);
        }
    };

    const getStockBadge = (product: InventoryProduct) => {
        if (product.stock === 0) return <Badge variant="destructive">Habis</Badge>;
        if (product.stock <= product.minStock) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Menipis</Badge>;
        return <Badge variant="outline" className="text-green-600">Aman</Badge>;
    };

    return (
        <>
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
                    <p className="text-sm text-muted-foreground">Kelola stok produk</p>
                </div>
                <Link href="/inventory/batches">
                    <Button variant="outline">
                        <Calendar className="mr-2 h-4 w-4" />
                        Batch Management
                    </Button>
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Stok Menipis</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{lowStockCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Stok Habis</CardTitle>
                        <XCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{outOfStockCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Nilai Stok</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalStockValue)}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cari produk..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[180px]">
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

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Produk</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Kategori</TableHead>
                            <TableHead className="text-right">Stok</TableHead>
                            <TableHead className="text-right">Min. Stok</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Nilai</TableHead>
                            <TableHead>Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.map((product) => (
                            <TableRow key={product.id}>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell className="text-muted-foreground">{product.sku}</TableCell>
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
                                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
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
                        <div className="bg-slate-50 rounded-lg p-3 text-sm">
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
        </>
    );
};
