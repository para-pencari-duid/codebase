"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
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
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Transaksi</h2>
                    <p className="text-sm text-muted-foreground">
                        Riwayat transaksi ({filtered.length} transaksi) - Total: {formatCurrency(totalRevenue)}
                    </p>
                </div>
            </div>
            <Separator />

            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cari nomor transaksi / pelanggan..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={filterPayment} onValueChange={setFilterPayment}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Payment" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua</SelectItem>
                        {Object.entries(paymentMethodLabels).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua</SelectItem>
                        <SelectItem value="COMPLETED">Selesai</SelectItem>
                        <SelectItem value="VOID">Void</SelectItem>
                        <SelectItem value="REFUNDED">Refund</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>No. Transaksi</TableHead>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Kasir</TableHead>
                            <TableHead>Item</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead>Bayar</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map((t) => (
                            <TableRow key={t.id}>
                                <TableCell className="font-mono text-sm">{t.transactionNo}</TableCell>
                                <TableCell className="text-sm">{formatDateTime(t.createdAt)}</TableCell>
                                <TableCell>{t.customerName}</TableCell>
                                <TableCell>{t.cashierName}</TableCell>
                                <TableCell>{t.itemCount} item</TableCell>
                                <TableCell className="text-right font-bold">{formatCurrency(t.total)}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{paymentMethodLabels[t.paymentMethod] || t.paymentMethod}</Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={statusLabels[t.status]?.variant || "default"}>
                                        {statusLabels[t.status]?.label || t.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(t)}>
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openReceipt(t)}>
                                            <Printer className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filtered.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                    Tidak ada transaksi ditemukan
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Detail Dialog */}
            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Detail Transaksi</DialogTitle>
                    </DialogHeader>
                    {selectedTransaction && (
                        <div className="space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-2 bg-slate-50 rounded-lg p-3">
                                <div><span className="text-muted-foreground">No:</span> {selectedTransaction.transactionNo}</div>
                                <div><span className="text-muted-foreground">Tanggal:</span> {formatDateTime(selectedTransaction.createdAt)}</div>
                                <div><span className="text-muted-foreground">Kasir:</span> {selectedTransaction.cashierName}</div>
                                <div><span className="text-muted-foreground">Customer:</span> {selectedTransaction.customerName}</div>
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
                    discount: selectedTransaction.discount,
                    total: selectedTransaction.total,
                    paymentMethod: selectedTransaction.paymentMethod,
                    paymentAmount: selectedTransaction.paymentAmount,
                    changeAmount: selectedTransaction.changeAmount,
                } : null}
            />
        </>
    );
};
