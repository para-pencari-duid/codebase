"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
import { Search, Eye, Receipt, Printer } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { ReceiptDialog } from "@/components/pos/receipt-dialog";

interface TransactionItem {
    productName: string;
    quantity: number;
    price: number;
    discount: number;
    subtotal: number;
}

interface Transaction {
    id: string;
    transactionNo: string;
    customerName: string;
    cashierName: string;
    itemCount: number;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    paymentMethod: string;
    paymentAmount: number;
    changeAmount: number;
    deliveryType?: string | null;
    deliveryAddress?: string | null;
    status: string;
    notes: string | null;
    createdAt: string;
    items: TransactionItem[];
}

const paymentMethodLabels: Record<string, string> = {
    CASH: "Tunai",
    TRANSFER: "Transfer",
    QRIS: "QRIS",
    DEBIT_CARD: "Debit",
    CREDIT_CARD: "Kredit",
    EWALLET: "E-Wallet",
};

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
    COMPLETED: { label: "Selesai", variant: "default" },
    VOID: { label: "Void", variant: "destructive" },
    REFUNDED: { label: "Refund", variant: "secondary" },
};

interface TransactionClientProps {
    data: Transaction[];
}

export const TransactionClient: React.FC<TransactionClientProps> = ({ data }) => {
    const [search, setSearch] = useState("");
    const [filterPayment, setFilterPayment] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [detailOpen, setDetailOpen] = useState(false);
    const [receiptOpen, setReceiptOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

    const filtered = data.filter((t) => {
        const matchesSearch = t.transactionNo.toLowerCase().includes(search.toLowerCase()) ||
            t.customerName.toLowerCase().includes(search.toLowerCase());
        const matchesPayment = filterPayment === "all" || t.paymentMethod === filterPayment;
        const matchesStatus = filterStatus === "all" || t.status === filterStatus;
        return matchesSearch && matchesPayment && matchesStatus;
    });

    const totalRevenue = filtered.reduce((sum, t) => sum + (t.status === "COMPLETED" ? t.total : 0), 0);

    const openDetail = (t: Transaction) => {
        setSelectedTransaction(t);
        setDetailOpen(true);
    };

    const openReceipt = (t: Transaction) => {
        setSelectedTransaction(t);
        setReceiptOpen(true);
    };

    return (
        <>
            {/* ── Page header ── */}
            <div className="p-5 lg:p-7">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Transaksi</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {filtered.length} transaksi &middot; Total:{" "}
                            <span className="font-semibold" style={{ color: "var(--brand, oklch(0.68 0.16 55))" }}>{formatCurrency(totalRevenue)}</span>
                        </p>
                    </div>
                </div>

                {/* ── Filter bar ── */}
                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Cari nomor transaksi / pelanggan..."
                            className="pl-9 h-9 bg-white border-gray-200 text-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Select value={filterPayment} onValueChange={setFilterPayment}>
                        <SelectTrigger className="h-9 w-full sm:w-37.5 text-sm border-gray-200 bg-white">
                            <SelectValue placeholder="Metode Bayar" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Metode</SelectItem>
                            {Object.entries(paymentMethodLabels).map(([k, v]) => (
                                <SelectItem key={k} value={k}>{v}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="h-9 w-full sm:w-32.5 text-sm border-gray-200 bg-white">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Status</SelectItem>
                            <SelectItem value="COMPLETED">Selesai</SelectItem>
                            <SelectItem value="VOID">Void</SelectItem>
                            <SelectItem value="REFUNDED">Refund</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* ── Table ── */}
            <div className="px-5 lg:px-7 pb-8">
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                <Table>
                    <TableHeader>
                        <TableRow style={{ background: "oklch(0.97 0.002 80)" }}>
                            <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">No. Transaksi</TableHead>
                            <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tanggal</TableHead>
                            <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</TableHead>
                            <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Kasir</TableHead>
                            <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Item</TableHead>
                            <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Total</TableHead>
                            <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bayar</TableHead>
                            <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</TableHead>
                            <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map((t) => (
                            <TableRow key={t.id} className="hover:bg-gray-50/60 transition-colors">
                                <TableCell className="font-mono text-xs text-gray-600">{t.transactionNo}</TableCell>
                                <TableCell className="text-sm text-gray-600">{formatDateTime(t.createdAt)}</TableCell>
                                <TableCell className="text-sm font-medium text-gray-800">
                                    <div>{t.customerName}</div>
                                    <div className="text-xs text-gray-500">
                                        {t.deliveryType === "DELIVERY" ? "Diantar" : "Ambil di Toko"}
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm text-gray-600">{t.cashierName}</TableCell>
                                <TableCell className="text-sm text-gray-600">{t.itemCount} item</TableCell>
                                <TableCell className="text-right font-bold text-gray-900">{formatCurrency(t.total)}</TableCell>
                                <TableCell>
                                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                                          style={{ background: "oklch(0.96 0.002 80)", color: "oklch(0.4 0 0)" }}>
                                        {paymentMethodLabels[t.paymentMethod] || t.paymentMethod}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <span
                                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                                      style={{
                                        background:
                                          t.status === "COMPLETED" ? "oklch(0.94 0.06 145)" :
                                          t.status === "VOID"      ? "oklch(0.94 0.05 25)"  :
                                                                      "oklch(0.96 0.002 80)",
                                        color:
                                          t.status === "COMPLETED" ? "oklch(0.38 0.1 145)"  :
                                          t.status === "VOID"      ? "oklch(0.48 0.15 25)"  :
                                                                      "oklch(0.45 0 0)",
                                      }}
                                    >
                                        {statusLabels[t.status]?.label || t.status}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-800" onClick={() => openDetail(t)}>
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-800" onClick={() => openReceipt(t)}>
                                            <Printer className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filtered.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center py-14 text-gray-400 text-sm">
                                    Tidak ada transaksi ditemukan
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            </div>

            {/* Detail Dialog */}
            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">Detail Transaksi</DialogTitle>
                    </DialogHeader>
                    {selectedTransaction && (
                        <div className="space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-2 rounded-lg p-3" style={{ background: "oklch(0.97 0.002 80)" }}>
                                <div><span className="text-gray-500">No:</span> <span className="font-mono font-semibold text-gray-800">{selectedTransaction.transactionNo}</span></div>
                                <div><span className="text-gray-500">Tanggal:</span> <span className="text-gray-700">{formatDateTime(selectedTransaction.createdAt)}</span></div>
                                <div><span className="text-gray-500">Kasir:</span> <span className="text-gray-700">{selectedTransaction.cashierName}</span></div>
                                <div><span className="text-gray-500">Customer:</span> <span className="text-gray-700">{selectedTransaction.customerName}</span></div>
                                <div><span className="text-gray-500">Tipe:</span> <span className="text-gray-700">{selectedTransaction.deliveryType === "DELIVERY" ? "Diantar" : "Ambil di Toko"}</span></div>
                                {selectedTransaction.deliveryType === "DELIVERY" && selectedTransaction.deliveryAddress && (
                                    <div className="col-span-2"><span className="text-gray-500">Alamat:</span> <span className="text-gray-700">{selectedTransaction.deliveryAddress}</span></div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-semibold">Item:</h4>
                                {selectedTransaction.items.map((item, i) => (
                                    <div key={i} className="flex justify-between">
                                        <span>{item.quantity}x {item.productName}</span>
                                        <span>{formatCurrency(item.subtotal)}</span>
                                    </div>
                                ))}
                            </div>

                            <Separator />

                            <div className="space-y-1">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(selectedTransaction.subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Pajak</span>
                                    <span>{formatCurrency(selectedTransaction.tax)}</span>
                                </div>
                                {selectedTransaction.discount > 0 && (
                                    <div className="flex justify-between text-red-500">
                                        <span>Diskon</span>
                                        <span>-{formatCurrency(selectedTransaction.discount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span>{formatCurrency(selectedTransaction.total)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Bayar ({paymentMethodLabels[selectedTransaction.paymentMethod]})</span>
                                    <span>{formatCurrency(selectedTransaction.paymentAmount)}</span>
                                </div>
                                {selectedTransaction.changeAmount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Kembalian</span>
                                        <span>{formatCurrency(selectedTransaction.changeAmount)}</span>
                                    </div>
                                )}
                            </div>

                            {selectedTransaction.notes && (
                                <>
                                    <Separator />
                                    <div>
                                        <span className="text-muted-foreground">Catatan:</span> {selectedTransaction.notes}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Receipt Dialog */}
            <ReceiptDialog
                open={receiptOpen}
                onOpenChange={setReceiptOpen}
                data={selectedTransaction ? {
                    transactionNo: selectedTransaction.transactionNo,
                    createdAt: selectedTransaction.createdAt,
                    cashierName: selectedTransaction.cashierName,
                    customerName: selectedTransaction.customerName !== "Walk-in" ? selectedTransaction.customerName : undefined,
                    items: selectedTransaction.items,
                    subtotal: selectedTransaction.subtotal,
                    tax: selectedTransaction.tax,
                    taxRate: selectedTransaction.tax > 0 ? Math.round((selectedTransaction.tax / selectedTransaction.subtotal) * 100) : 0,
                    taxIncluded: selectedTransaction.tax > 0,
                    discount: selectedTransaction.discount,
                    total: selectedTransaction.total,
                    paymentMethod: selectedTransaction.paymentMethod,
                    paymentAmount: selectedTransaction.paymentAmount,
                    changeAmount: selectedTransaction.changeAmount,
                    deliveryType: selectedTransaction.deliveryType,
                    deliveryAddress: selectedTransaction.deliveryAddress,
                    businessName: "",
                } : null}
            />
        </>
    );
};
