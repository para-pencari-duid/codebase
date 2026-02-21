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

export interface CheckoutData {
    paymentMethod: string;
    paymentAmount: number;
    discount: number;
    notes: string;
    customerId?: string;
    discountId?: string;
}

const paymentMethods = [
    { value: "CASH", label: "Tunai", icon: Banknote },
    { value: "TRANSFER", label: "Transfer", icon: Building2 },
    { value: "QRIS", label: "QRIS", icon: QrCode },
    { value: "DEBIT_CARD", label: "Debit", icon: CreditCard },
    { value: "CREDIT_CARD", label: "Kredit", icon: CreditCard },
    { value: "EWALLET", label: "E-Wallet", icon: Wallet },
];

const quickCashAmounts = [50000, 100000, 150000, 200000, 300000, 500000];

interface AppliedPromo {
    id: string;
    name: string;
    type: "PERCENTAGE" | "FIXED";
    value: number;
    discountAmount: number;
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
    const [paymentMethod, setPaymentMethod] = useState("CASH");
    const [paymentAmount, setPaymentAmount] = useState<number>(0);
    const [notes, setNotes] = useState("");
    const [discountInput, setDiscountInput] = useState<number>(discount);
    const [discountType, setDiscountType] = useState<"amount" | "percent">("amount");
    const [loading, setLoading] = useState(false);

    // Customer search & selection state
    const [customerOpen, setCustomerOpen] = useState(false);
    const [customerQuery, setCustomerQuery] = useState("");
    const [customers, setCustomers] = useState<any[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [searchLoading, setSearchLoading] = useState(false);
    
    // Add new customer state
    const [showAddNew, setShowAddNew] = useState(false);
    const [newCustomerName, setNewCustomerName] = useState("");
    const [newCustomerPhone, setNewCustomerPhone] = useState("");
    const [addNewLoading, setAddNewLoading] = useState(false);

    // Promo code state
    const [promoCode, setPromoCode] = useState("");
    const [promoLoading, setPromoLoading] = useState(false);
    const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);

    // Calculate discount: promo takes priority over manual
    const manualDiscount = discountType === "percent"
        ? (subtotal * discountInput) / 100
        : discountInput;
    const calculatedDiscount = appliedPromo ? appliedPromo.discountAmount : manualDiscount;
    const finalTotal = subtotal + tax - calculatedDiscount;
    const changeAmount = paymentMethod === "CASH" ? Math.max(0, paymentAmount - finalTotal) : 0;
    const canPay = (paymentMethod === "CASH" ? paymentAmount >= finalTotal : true) && selectedCustomer !== null;

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
            setCustomers(data.slice(0, 20)); // Limit to 20 results
        } catch (error) {
            console.error("Customer search error:", error);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleAddNewCustomer = async () => {
        if (!newCustomerName.trim() || !newCustomerPhone.trim()) {
            toast.error("Nama dan nomor HP wajib diisi");
            return;
        }

        setAddNewLoading(true);
        try {
            const res = await fetch("/api/customers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newCustomerName.trim(),
                    phone: newCustomerPhone.trim(),
                }),
            });

            if (!res.ok) throw new Error("Failed to create customer");

            const newCustomer = await res.json();
            setSelectedCustomer(newCustomer);
            setShowAddNew(false);
            setNewCustomerName("");
            setNewCustomerPhone("");
            setCustomerOpen(false);
            toast.success(`Pelanggan "${newCustomer.name}" berhasil ditambahkan`);
        } catch (error) {
            console.error("Add customer error:", error);
            toast.error("Gagal menambahkan pelanggan");
        } finally {
            setAddNewLoading(false);
        }
    };

    const handleApplyPromo = async () => {
        if (!promoCode.trim()) {
            toast.error("Masukkan kode promo");
            return;
        }

        setPromoLoading(true);
        try {
            const res = await fetch("/api/discounts/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: promoCode.trim(), subtotal }),
            });

            if (!res.ok) {
                toast.error("Gagal memvalidasi kode promo");
                return;
            }

            const data = await res.json();

            if (data.valid) {
                setAppliedPromo({
                    id: data.discount.id,
                    name: data.discount.name,
                    type: data.discount.type,
                    value: data.discount.value,
                    discountAmount: data.discount.discountAmount,
                });
                setDiscountInput(0); // Clear manual discount
                toast.success(`Promo "${data.discount.name}" berhasil diterapkan!`);
            } else {
                toast.error(data.message || "Kode promo tidak valid");
            }
        } catch {
            toast.error("Terjadi kesalahan saat validasi promo");
        } finally {
            setPromoLoading(false);
        }
    };

    const handleRemovePromo = () => {
        setAppliedPromo(null);
        setPromoCode("");
    };

    const handleConfirm = async () => {
        if (!canPay || !selectedCustomer) return;
        setLoading(true);
        try {
            await onConfirm({
                paymentMethod,
                paymentAmount: paymentMethod === "CASH" ? paymentAmount : finalTotal,
                discount: calculatedDiscount,
                notes,
                customerId: selectedCustomer.id,
                discountId: appliedPromo?.id,
            });
        } finally {
            setLoading(false);
            setPaymentAmount(0);
            setNotes("");
            setDiscountInput(0);
            setAppliedPromo(null);
            setPromoCode("");
            setSelectedCustomer(null);
            setCustomerQuery("");
            setShowAddNew(false);
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
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-green-700 hover:text-red-600 hover:bg-red-50"
                                onClick={() => setSelectedCustomer(null)}
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
                                onClick={handleRemovePromo}
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

                {/* Payment Method */}
                <div className="space-y-2">
                    <Label>Metode Pembayaran</Label>
                    <div className="grid grid-cols-3 gap-2">
                        {paymentMethods.map((method) => {
                            const Icon = method.icon;
                            return (
                                <button
                                    key={method.value}
                                    onClick={() => setPaymentMethod(method.value)}
                                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors text-sm ${paymentMethod === method.value
                                        ? "border-primary bg-primary/5 text-primary"
                                        : "border-slate-200 hover:border-slate-300"
                                        }`}
                                    type="button"
                                >
                                    <Icon className="h-5 w-5" />
                                    {method.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Cash Payment */}
                {paymentMethod === "CASH" && (
                    <div className="space-y-3">
                        <Label>Jumlah Bayar</Label>
                        <Input
                            type="number"
                            placeholder="0"
                            value={paymentAmount || ""}
                            onChange={(e) => setPaymentAmount(Number(e.target.value))}
                        />
                        <div className="flex flex-wrap gap-2">
                            {quickCashAmounts
                                .filter((amt) => amt >= finalTotal)
                                .slice(0, 4)
                                .map((amount) => (
                                    <Button
                                        key={amount}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPaymentAmount(amount)}
                                        type="button"
                                    >
                                        {formatCurrency(amount)}
                                    </Button>
                                ))}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPaymentAmount(finalTotal)}
                                type="button"
                            >
                                Uang Pas
                            </Button>
                        </div>
                    </div>
                )}

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
                        <span>Pajak (11%)</span>
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
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>{formatCurrency(finalTotal)}</span>
                    </div>
                    {paymentMethod === "CASH" && paymentAmount > 0 && (
                        <>
                            <div className="flex justify-between">
                                <span>Dibayar</span>
                                <span>{formatCurrency(paymentAmount)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-green-600">
                                <span>Kembalian</span>
                                <span>{formatCurrency(changeAmount)}</span>
                            </div>
                        </>
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
