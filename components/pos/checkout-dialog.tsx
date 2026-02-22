"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, cn } from "@/lib/utils";
import { CartItem } from "@/hooks/use-cart";
import {
    Banknote,
    Building2,
    QrCode,
    CreditCard,
    Wallet,
    Loader2,
    Tag,
    X,
    CheckCircle,
    User,
    Phone,
    Search,
    Check,
    ChevronsUpDown,
    UserPlus,
    Plus,
    Trash2,
    Gift,
    SplitSquareVertical,
} from "lucide-react";
import { toast } from "sonner";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaymentLine {
    id: string;
    method: string;
    amount: number;
    qrCode?: string;
    qrLoading?: boolean;
}

export interface CheckoutData {
    payments: PaymentLine[];
    discount: number;
    notes: string;
    customerId?: string;
    discountId?: string;
    pointsRedeemed: number;
}

interface CheckoutDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    items: CartItem[];
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    onConfirm: (data: CheckoutData) => Promise<void>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAYMENT_METHODS = [
    { value: "CASH",        label: "Tunai",    icon: Banknote },
    { value: "TRANSFER",    label: "Transfer", icon: Building2 },
    { value: "QRIS",        label: "QRIS",     icon: QrCode },
    { value: "DEBIT_CARD",  label: "Debit",    icon: CreditCard },
    { value: "CREDIT_CARD", label: "Kredit",   icon: CreditCard },
    { value: "EWALLET",     label: "E-Wallet", icon: Wallet },
];

const QUICK_CASH = [50000, 100000, 150000, 200000, 300000, 500000];

interface AppliedPromo {
    id: string;
    name: string;
    type: "PERCENTAGE" | "FIXED";
    value: number;
    discountAmount: number;
}

interface LoyaltyInfo {
    enabled: boolean;
    points: number;
    pointValue: number;
    pointsPerRupiah: number;
}

export function CheckoutDialog({
    open,
    onOpenChange,
    items,
    subtotal,
    tax,
    discount,
    total,
    onConfirm,
}: CheckoutDialogProps) {
    // ── Customer ─────────────────────────────────────────────────────────────
    const [customerOpen, setCustomerOpen] = useState(false);
    const [customerQuery, setCustomerQuery] = useState("");
    const [customers, setCustomers] = useState<any[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [showAddNew, setShowAddNew] = useState(false);
    const [newCustomerName, setNewCustomerName] = useState("");
    const [newCustomerPhone, setNewCustomerPhone] = useState("");
    const [addNewLoading, setAddNewLoading] = useState(false);

    // ── Promo ─────────────────────────────────────────────────────────────────
    const [promoCode, setPromoCode] = useState("");
    const [promoLoading, setPromoLoading] = useState(false);
    const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);
    const [discountInput, setDiscountInput] = useState<number>(discount);
    const [discountType, setDiscountType] = useState<"amount" | "percent">("amount");

    // ── Loyalty ───────────────────────────────────────────────────────────────
    const [loyaltyInfo, setLoyaltyInfo] = useState<LoyaltyInfo | null>(null);
    const [usePoints, setUsePoints] = useState(false);
    const [pointsToRedeem, setPointsToRedeem] = useState(0);

    // ── Payments (split bill) ─────────────────────────────────────────────────
    const [splitMode, setSplitMode] = useState(false);
    const [payments, setPayments] = useState<PaymentLine[]>([
        { id: "1", method: "CASH", amount: 0 },
    ]);

    // ── Misc ──────────────────────────────────────────────────────────────────
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);

    // ─── Calculated values ────────────────────────────────────────────────────
    const manualDiscount = discountType === "percent"
        ? (subtotal * discountInput) / 100
        : discountInput;
    const calculatedDiscount = appliedPromo ? appliedPromo.discountAmount : manualDiscount;
    const pointsRedemptionAmount = usePoints
        ? Math.min(pointsToRedeem * (loyaltyInfo?.pointValue ?? 1), subtotal + tax - calculatedDiscount)
        : 0;
    const finalTotal = Math.max(0, subtotal + tax - calculatedDiscount - pointsRedemptionAmount);
    const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0);
    const cashPaid = payments.filter(p => p.method === "CASH").reduce((s, p) => s + p.amount, 0);
    const changeAmount = Math.max(0, cashPaid - (finalTotal - (totalPaid - cashPaid)));
    const overpaid = totalPaid >= finalTotal;
    const canPay = overpaid && !!selectedCustomer;

    // ─── Reset on open ────────────────────────────────────────────────────────
    useEffect(() => {
        if (open) {
            setPayments([{ id: "1", method: "CASH", amount: 0 }]);
            setSplitMode(false);
            setNotes("");
            setDiscountInput(discount);
            setAppliedPromo(null);
            setPromoCode("");
            setSelectedCustomer(null);
            setCustomerQuery("");
            setShowAddNew(false);
            setUsePoints(false);
            setPointsToRedeem(0);
            setLoyaltyInfo(null);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // ─── Load loyalty when customer selected ─────────────────────────────────
    useEffect(() => {
        if (!selectedCustomer) { setLoyaltyInfo(null); setUsePoints(false); return; }
        fetch(`/api/loyalty/${selectedCustomer.id}`)
            .then(r => r.json())
            .then((d) => setLoyaltyInfo({ enabled: d.enabled, points: d.points, pointValue: d.pointValue, pointsPerRupiah: d.pointsPerRupiah }))
            .catch(() => { /* ignore */ });
    }, [selectedCustomer]);

    // ─── Auto-fill single payment amount ─────────────────────────────────────
    useEffect(() => {
        if (!splitMode) {
            setPayments(prev => [{ ...prev[0], amount: finalTotal }]);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [finalTotal, splitMode]);

    // Debounced customer search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (customerQuery.trim().length >= 2) {
                searchCustomers(customerQuery);
            } else {
                setCustomers([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [customerQuery]);

    const searchCustomers = async (query: string) => {
        setSearchLoading(true);
        try {
            const res = await fetch(`/api/customers?search=${encodeURIComponent(query)}`);
            const data = await res.json();
            setCustomers(data.slice(0, 20));
        } catch { /* ignore */ }
        finally { setSearchLoading(false); }
    };

    const handleAddNewCustomer = async () => {
        if (!newCustomerName.trim() || !newCustomerPhone.trim()) { toast.error("Nama dan nomor HP wajib diisi"); return; }
        setAddNewLoading(true);
        try {
            const res = await fetch("/api/customers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newCustomerName.trim(), phone: newCustomerPhone.trim() }),
            });
            if (!res.ok) throw new Error();
            const c = await res.json();
            setSelectedCustomer(c);
            setShowAddNew(false);
            setNewCustomerName("");
            setNewCustomerPhone("");
            setCustomerOpen(false);
            toast.success(`Pelanggan "${c.name}" berhasil ditambahkan`);
        } catch { toast.error("Gagal menambahkan pelanggan"); }
        finally { setAddNewLoading(false); }
    };

    const handleApplyPromo = async () => {
        if (!promoCode.trim()) { toast.error("Masukkan kode promo"); return; }
        setPromoLoading(true);
        try {
            const res = await fetch("/api/discounts/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: promoCode.trim(), subtotal }),
            });
            if (!res.ok) { toast.error("Gagal memvalidasi kode promo"); return; }
            const data = await res.json();
            if (data.valid) {
                setAppliedPromo({ id: data.discount.id, name: data.discount.name, type: data.discount.type, value: data.discount.value, discountAmount: data.discount.discountAmount });
                setDiscountInput(0);
                toast.success(`Promo "${data.discount.name}" berhasil diterapkan!`);
            } else {
                toast.error(data.message || "Kode promo tidak valid");
            }
        } catch { toast.error("Terjadi kesalahan saat validasi promo"); }
        finally { setPromoLoading(false); }
    };

    // ─── QRIS helpers ─────────────────────────────────────────────────────────
    const generateQrForLine = useCallback(async (lineId: string, amount: number) => {
        if (amount <= 0) return;
        setPayments(prev => prev.map(p => p.id === lineId ? { ...p, qrLoading: true, qrCode: undefined } : p));
        try {
            const res = await fetch("/api/qris/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                toast.error((err as any).error || "QRIS belum diatur di Pengaturan");
                setPayments(prev => prev.map(p => p.id === lineId ? { ...p, qrLoading: false } : p));
                return;
            }
            const data = await res.json();
            setPayments(prev => prev.map(p => p.id === lineId ? { ...p, qrCode: data.qrCode, qrLoading: false } : p));
        } catch {
            setPayments(prev => prev.map(p => p.id === lineId ? { ...p, qrLoading: false } : p));
        }
    }, []);

    // ─── Payment-line helpers ─────────────────────────────────────────────────
    const updatePaymentMethod = (lineId: string, method: string) => {
        setPayments(prev => prev.map(p => p.id !== lineId ? p : { ...p, method, qrCode: undefined, qrLoading: false }));
    };
    const updatePaymentAmount = (lineId: string, amount: number) => {
        setPayments(prev => prev.map(p => p.id === lineId ? { ...p, amount } : p));
    };
    const addPaymentLine = () => {
        const remaining = Math.max(0, finalTotal - totalPaid);
        setPayments(prev => [...prev, { id: Date.now().toString(), method: "CASH", amount: remaining }]);
    };
    const removePaymentLine = (lineId: string) => {
        setPayments(prev => prev.filter(p => p.id !== lineId));
    };

    const handleConfirm = async () => {
        if (!canPay || !selectedCustomer) return;
        setLoading(true);
        try {
            await onConfirm({
                payments: payments.map(p => ({ id: p.id, method: p.method, amount: p.amount })),
                discount: calculatedDiscount,
                notes,
                customerId: selectedCustomer.id,
                discountId: appliedPromo?.id,
                pointsRedeemed: usePoints ? pointsToRedeem : 0,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">Pembayaran</DialogTitle>
                </DialogHeader>

                {/* Order Summary */}
                <div className="space-y-2 text-sm">
                    <h3 className="font-semibold">Ringkasan Pesanan</h3>
                    <div className="bg-slate-50 rounded-lg p-3 space-y-1 max-h-32 overflow-y-auto">
                        {items.map((item) => (
                            <div key={item.id} className="flex justify-between">
                                <span>{item.quantity}x {item.name}</span>
                                <span>{formatCurrency(item.price * item.quantity)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <Separator />

                {/* Customer Selection (Required) */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-red-500" />
                        <Label className="font-semibold">Pilih Pelanggan *</Label>
                        <Badge variant="destructive" className="text-[10px]">Wajib</Badge>
                    </div>

                    {/* Customer Combobox */}
                    {!selectedCustomer && !showAddNew && (
                        <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={customerOpen}
                                    className="w-full justify-between"
                                >
                                    <span className="flex items-center gap-2">
                                        <Search className="h-4 w-4 text-muted-foreground" />
                                        Cari nama atau nomor HP...
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" align="start">
                                <Command shouldFilter={false}>
                                    <CommandInput 
                                        placeholder="Ketik nama atau nomor HP..." 
                                        value={customerQuery}
                                        onValueChange={setCustomerQuery}
                                    />
                                    <CommandList>
                                        {searchLoading ? (
                                            <div className="py-6 text-center text-sm">
                                                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                                            </div>
                                        ) : customers.length === 0 && customerQuery.length >= 2 ? (
                                            <CommandEmpty>Pelanggan tidak ditemukan</CommandEmpty>
                                        ) : null}
                                        
                                        {customers.length > 0 && (
                                            <CommandGroup heading="Pelanggan Terdaftar">
                                                {customers.map((customer) => (
                                                    <CommandItem
                                                        key={customer.id}
                                                        value={customer.id}
                                                        onSelect={() => {
                                                            setSelectedCustomer(customer);
                                                            setCustomerOpen(false);
                                                        }}
                                                    >
                                                        <User className="mr-2 h-4 w-4" />
                                                        <div className="flex-1">
                                                            <p className="font-medium">{customer.name}</p>
                                                            <p className="text-xs text-muted-foreground">{customer.phone || "No phone"}</p>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        )}
                                        
                                        {customerQuery.trim().length >= 2 && (
                                            <CommandGroup>
                                                <CommandItem
                                                    onSelect={() => {
                                                        setShowAddNew(true);
                                                        setNewCustomerName(customerQuery);
                                                        setCustomerOpen(false);
                                                    }}
                                                    className="text-primary"
                                                >
                                                    <UserPlus className="mr-2 h-4 w-4" />
                                                    Tambah pelanggan baru "{customerQuery}"
                                                </CommandItem>
                                            </CommandGroup>
                                        )}
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    )}

                    {/* Selected Customer Display */}
                    {selectedCustomer && (
                        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                            <div className="flex-1">
                                <p className="font-medium text-green-900">{selectedCustomer.name}</p>
                                <p className="text-xs text-green-700">{selectedCustomer.phone}</p>
                                {loyaltyInfo?.enabled && loyaltyInfo.points > 0 && (
                                    <p className="text-xs text-green-700 font-semibold mt-0.5">
                                        <Gift className="inline h-3 w-3 mr-1" />
                                        {loyaltyInfo.points.toLocaleString("id-ID")} poin
                                        (= {formatCurrency(loyaltyInfo.points * loyaltyInfo.pointValue)})
                                    </p>
                                )}
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-green-700 hover:text-red-600 hover:bg-red-50"
                                onClick={() => { setSelectedCustomer(null); setUsePoints(false); }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    {/* Add New Customer Form */}
                    {showAddNew && (
                        <div className="space-y-3 p-4 border-2 border-dashed border-primary/30 rounded-lg bg-primary/5">
                            <div className="flex items-center justify-between">
                                <Label className="font-semibold flex items-center gap-2">
                                    <UserPlus className="h-4 w-4" />
                                    Tambah Pelanggan Baru
                                </Label>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setShowAddNew(false);
                                        setNewCustomerName("");
                                        setNewCustomerPhone("");
                                    }}
                                >
                                    Batal
                                </Button>
                            </div>
                            <div className="space-y-2">
                                <div>
                                    <Label className="text-xs">Nama Lengkap *</Label>
                                    <Input
                                        placeholder="Nama pelanggan..."
                                        value={newCustomerName}
                                        onChange={(e) => setNewCustomerName(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs flex items-center gap-1">
                                        <Phone className="h-3 w-3" />
                                        Nomor HP * (untuk struk WA)
                                    </Label>
                                    <Input
                                        type="tel"
                                        placeholder="08xxx..."
                                        value={newCustomerPhone}
                                        onChange={(e) => setNewCustomerPhone(e.target.value)}
                                    />
                                </div>
                                <Button
                                    onClick={handleAddNewCustomer}
                                    disabled={addNewLoading || !newCustomerName.trim() || !newCustomerPhone.trim()}
                                    className="w-full"
                                    size="sm"
                                >
                                    {addNewLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="mr-2 h-4 w-4" />
                                            Simpan & Lanjutkan
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {selectedCustomer && (
                        <p className="text-xs text-muted-foreground">
                            💡 Struk akan dikirim otomatis ke WhatsApp pelanggan
                        </p>
                    )}
                </div>

                {/* Loyalty Redemption */}
                {selectedCustomer && loyaltyInfo?.enabled && loyaltyInfo.points > 0 && (
                    <>
                        <Separator />
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="flex items-center gap-2 font-semibold">
                                    <Gift className="h-4 w-4 text-purple-600" />
                                    Gunakan Poin Loyalty
                                    <Badge variant="secondary" className="text-[10px] bg-purple-100 text-purple-800">
                                        {loyaltyInfo.points.toLocaleString("id-ID")} poin tersedia
                                    </Badge>
                                </Label>
                                <Switch checked={usePoints} onCheckedChange={(v) => { setUsePoints(v); if (!v) setPointsToRedeem(0); }} />
                            </div>
                            {usePoints && (
                                <div className="space-y-2 pl-6">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1">
                                            <Label className="text-xs">Jumlah Poin Ditukar</Label>
                                            <Input
                                                type="number"
                                                min={0}
                                                max={Math.min(loyaltyInfo.points, Math.ceil((subtotal + tax - calculatedDiscount) / loyaltyInfo.pointValue))}
                                                value={pointsToRedeem || ""}
                                                onChange={(e) => {
                                                    const v = Math.min(Number(e.target.value), loyaltyInfo.points, Math.ceil((subtotal + tax - calculatedDiscount) / loyaltyInfo.pointValue));
                                                    setPointsToRedeem(Math.max(0, v));
                                                }}
                                                placeholder="0"
                                            />
                                        </div>
                                        <div className="text-sm text-muted-foreground pt-5">
                                            = {formatCurrency(pointsToRedeem * loyaltyInfo.pointValue)}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" type="button"
                                            onClick={() => setPointsToRedeem(Math.min(loyaltyInfo.points, Math.ceil((subtotal + tax - calculatedDiscount) / loyaltyInfo.pointValue)))}>
                                            Pakai semua poin
                                        </Button>
                                        <Button variant="ghost" size="sm" type="button" onClick={() => setPointsToRedeem(0)}>Reset</Button>
                                    </div>
                                    {pointsToRedeem > 0 && (
                                        <p className="text-xs text-purple-700 font-medium">
                                            Diskon poin: -{formatCurrency(Math.min(pointsToRedeem * loyaltyInfo.pointValue, subtotal + tax - calculatedDiscount))}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}

                <Separator />

                {/* Promo Code */}
                <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Kode Promo
                    </Label>
                    {appliedPromo ? (
                        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-green-800 text-sm">{appliedPromo.name}</p>
                                <p className="text-xs text-green-600">
                                    {appliedPromo.type === "PERCENTAGE"
                                        ? `Diskon ${appliedPromo.value}%`
                                        : `Diskon ${formatCurrency(appliedPromo.value)}`}
                                    {" → "}-{formatCurrency(appliedPromo.discountAmount)}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-green-700 hover:text-red-600 hover:bg-red-50"
                                onClick={() => { setAppliedPromo(null); setPromoCode(""); }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <Input
                                placeholder="Masukkan kode promo..."
                                value={promoCode}
                                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                            />
                            <Button
                                variant="outline"
                                onClick={handleApplyPromo}
                                disabled={promoLoading || !promoCode.trim()}
                            >
                                {promoLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    "Terapkan"
                                )}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Manual Discount (hidden when promo is applied) */}
                {!appliedPromo && (
                    <div className="space-y-2">
                        <Label>Diskon Manual</Label>
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                placeholder="0"
                                value={discountInput || ""}
                                onChange={(e) => setDiscountInput(Number(e.target.value))}
                                className="flex-1"
                            />
                            <div className="flex rounded-md border">
                                <button
                                    className={`px-3 py-1 text-sm rounded-l-md transition-colors ${discountType === "amount" ? "bg-primary text-white" : "hover:bg-slate-100"}`}
                                    onClick={() => setDiscountType("amount")}
                                    type="button"
                                >
                                    Rp
                                </button>
                                <button
                                    className={`px-3 py-1 text-sm rounded-r-md transition-colors ${discountType === "percent" ? "bg-primary text-white" : "hover:bg-slate-100"}`}
                                    onClick={() => setDiscountType("percent")}
                                    type="button"
                                >
                                    %
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Payment Section ───────────────────────────────────────────── */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="font-semibold">Metode Pembayaran</Label>
                        <div className="flex items-center gap-2 text-sm">
                            <SplitSquareVertical className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Split Tagihan</span>
                            <Switch
                                checked={splitMode}
                                onCheckedChange={(v) => {
                                    setSplitMode(v);
                                    if (!v) setPayments([{ id: "1", method: payments[0]?.method ?? "CASH", amount: finalTotal }]);
                                }}
                            />
                        </div>
                    </div>

                    {/* Single mode */}
                    {!splitMode && (
                        <>
                            <div className="grid grid-cols-3 gap-2">
                                {PAYMENT_METHODS.map((m) => {
                                    const Icon = m.icon;
                                    return (
                                        <button
                                            key={m.value}
                                            onClick={() => { updatePaymentMethod("1", m.value); updatePaymentAmount("1", finalTotal); }}
                                            className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors text-sm ${payments[0]?.method === m.value ? "border-primary bg-primary/5 text-primary" : "border-slate-200 hover:border-slate-300"}`}
                                            type="button"
                                        >
                                            <Icon className="h-5 w-5" />
                                            {m.label}
                                        </button>
                                    );
                                })}
                            </div>
                            {payments[0]?.method === "CASH" && (
                                <div className="space-y-2">
                                    <Label>Jumlah Bayar</Label>
                                    <Input type="number" placeholder="0" value={payments[0].amount || ""} onChange={(e) => updatePaymentAmount("1", Number(e.target.value))} />
                                    <div className="flex flex-wrap gap-2">
                                        {QUICK_CASH.filter(a => a >= finalTotal).slice(0, 4).map((a) => (
                                            <Button key={a} variant="outline" size="sm" onClick={() => updatePaymentAmount("1", a)} type="button">{formatCurrency(a)}</Button>
                                        ))}
                                        <Button variant="outline" size="sm" onClick={() => updatePaymentAmount("1", finalTotal)} type="button">Uang Pas</Button>
                                    </div>
                                </div>
                            )}
                            {payments[0]?.method === "QRIS" && (
                                <QrisBlock line={payments[0]} amount={finalTotal} onGenerate={() => generateQrForLine("1", finalTotal)} />
                            )}
                        </>
                    )}

                    {/* Split mode */}
                    {splitMode && (
                        <div className="space-y-3">
                            {payments.map((line, idx) => (
                                <div key={line.id} className="p-3 border rounded-lg space-y-2 bg-slate-50">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-muted-foreground w-16">Bayar {idx + 1}</span>
                                        <Select value={line.method} onValueChange={(v) => updatePaymentMethod(line.id, v)}>
                                            <SelectTrigger className="flex-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {PAYMENT_METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <Input type="number" className="w-32 h-8 text-sm" placeholder="Nominal" value={line.amount || ""} onChange={(e) => updatePaymentAmount(line.id, Number(e.target.value))} />
                                        {payments.length > 1 && (
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-50" onClick={() => removePaymentLine(line.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                    {line.method === "QRIS" && (
                                        <QrisBlock line={line} amount={line.amount} onGenerate={() => generateQrForLine(line.id, line.amount)} />
                                    )}
                                </div>
                            ))}
                            <div className="flex items-center justify-between">
                                <Button variant="outline" size="sm" onClick={addPaymentLine} type="button">
                                    <Plus className="h-4 w-4 mr-1" />Tambah Metode
                                </Button>
                                <div className="text-sm">
                                    <span className={totalPaid >= finalTotal ? "text-green-600 font-semibold" : "text-red-500 font-semibold"}>
                                        Terbayar: {formatCurrency(totalPaid)}
                                    </span>
                                    <span className="text-muted-foreground"> / {formatCurrency(finalTotal)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Notes */}
                <div className="space-y-2">
                    <Label>Catatan (opsional)</Label>
                    <Textarea
                        placeholder="Catatan transaksi..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                    />
                </div>

                <Separator />

                {/* Total Summary */}
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Pajak</span>
                        <span>{formatCurrency(tax)}</span>
                    </div>
                    {calculatedDiscount > 0 && (
                        <div className="flex justify-between text-red-500">
                            <span className="flex items-center gap-1">
                                Diskon
                                {appliedPromo && (
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                        {appliedPromo.name}
                                    </Badge>
                                )}
                            </span>
                            <span>-{formatCurrency(calculatedDiscount)}</span>
                        </div>
                    )}
                    {pointsRedemptionAmount > 0 && (
                        <div className="flex justify-between text-purple-600">
                            <span className="flex items-center gap-1">
                                <Gift className="h-3 w-3" />
                                Redeem {pointsToRedeem.toLocaleString("id-ID")} poin
                            </span>
                            <span>-{formatCurrency(pointsRedemptionAmount)}</span>
                        </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>{formatCurrency(finalTotal)}</span>
                    </div>
                    {!splitMode && payments[0]?.method === "CASH" && payments[0].amount > 0 && (
                        <>
                            <div className="flex justify-between">
                                <span>Dibayar</span>
                                <span>{formatCurrency(payments[0].amount)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-green-600">
                                <span>Kembalian</span>
                                <span>{formatCurrency(changeAmount)}</span>
                            </div>
                        </>
                    )}
                    {splitMode && totalPaid > finalTotal && (
                        <div className="flex justify-between font-bold text-green-600">
                            <span>Kembalian</span>
                            <span>{formatCurrency(totalPaid - finalTotal)}</span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                        Batal
                    </Button>
                    <Button
                        className="flex-1"
                        disabled={!canPay || loading}
                        onClick={handleConfirm}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Konfirmasi Pembayaran
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
// ─── QRIS QR Block ────────────────────────────────────────────────────────────

function QrisBlock({
    line,
    amount,
    onGenerate,
}: {
    line: PaymentLine;
    amount: number;
    onGenerate: () => void;
}) {
    return (
        <div className="mt-2 space-y-2">
            {!line.qrCode && !line.qrLoading && (
                <Button variant="outline" size="sm" onClick={onGenerate} type="button" disabled={amount <= 0}>
                    <QrCode className="h-4 w-4 mr-2" />
                    Generate QR QRIS — {formatCurrency(amount)}
                </Button>
            )}
            {line.qrLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating QRIS...
                </div>
            )}
            {line.qrCode && (
                <div className="flex flex-col items-center gap-2 p-3 bg-white border-2 border-primary/20 rounded-xl">
                    <p className="text-xs font-semibold text-muted-foreground">Scan QRIS — {formatCurrency(amount)}</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={line.qrCode} alt="QRIS QR Code" width={200} height={200} className="rounded-lg" />
                    <p className="text-xs text-muted-foreground">Berlaku untuk transaksi ini saja</p>
                    <Button variant="ghost" size="sm" onClick={onGenerate} type="button">
                        <QrCode className="h-3 w-3 mr-1" />
                        Refresh
                    </Button>
                </div>
            )}
        </div>
    );
}