"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, CalendarDays, ClipboardList, Search, X, UserCheck, Loader2 } from "lucide-react";

interface CustomerResult {
  id: string;
  name: string;
  phone: string;
  address?: string | null;
}

interface AvailableProduct {
  id: string;
  name: string;
  price: number;
  images: string[];
}

function ItemNameCombobox({
  value,
  onChange,
  onSelectProduct,
  products,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelectProduct: (p: AvailableProduct) => void;
  products: AvailableProduct[];
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = value.trim().length === 0
    ? products
    : products.filter((p) =>
        p.name.toLowerCase().includes(value.toLowerCase()),
      );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative flex-1">
      <Input
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Pilih atau ketik nama pesanan..."
        required
        className="pr-8"
      />
      {value && (
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={() => { onChange(""); setOpen(false); }}
          tabIndex={-1}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      {open && products.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-48 overflow-y-auto">
          {filtered.length > 0 ? filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
              onMouseDown={(e) => {
                e.preventDefault(); // prevent blur before click
                onSelectProduct(p);
                onChange(p.name);
                setOpen(false);
              }}
            >
              {p.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.images[0]} alt="" className="h-8 w-8 rounded object-cover shrink-0" />
              ) : (
                <div className="h-8 w-8 rounded bg-muted shrink-0 flex items-center justify-center text-xs font-bold text-muted-foreground">
                  {p.name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{p.name}</div>
                <div className="text-xs text-muted-foreground">
                  {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(p.price)}
                </div>
              </div>
            </button>
          )) : (
            <div className="px-3 py-2 text-sm text-muted-foreground italic">Tidak ada produk cocok — nama akan disimpan manual</div>
          )}
        </div>
      )}
    </div>
  );
}

interface OrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
  notes: string;
}

interface PosPreOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Products available for selection in the item dropdown */
  availableProducts?: AvailableProduct[];
  /** Optional pre-filled items */
  initialItems?: Array<{ name: string; quantity: number; unitPrice: number }>;
}

const emptyItem = (): OrderItem => ({
  name: "",
  quantity: 1,
  unitPrice: 0,
  notes: "",
});

export function PosPreOrderDialog({
  open,
  onOpenChange,
  availableProducts = [],
  initialItems,
}: PosPreOrderDialogProps) {
  const [loading, setLoading] = useState(false);

  // Customer search
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<CustomerResult[]>([]);
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Customer fields
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  // Search customers as user types
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (customerSearch.trim().length < 2) {
      setCustomerResults([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setCustomerSearchLoading(true);
      try {
        const res = await fetch(`/api/customers?search=${encodeURIComponent(customerSearch)}`);
        if (res.ok) {
          const data = await res.json();
          setCustomerResults(Array.isArray(data) ? data.slice(0, 8) : []);
        }
      } catch { /* ignore */ } finally {
        setCustomerSearchLoading(false);
      }
    }, 300);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [customerSearch]);

  const handleSelectCustomer = (c: CustomerResult) => {
    setSelectedCustomerId(c.id);
    setCustomerName(c.name);
    setCustomerPhone(c.phone);
    setCustomerAddress(c.address ?? "");
    setCustomerSearch("");
    setCustomerResults([]);
  };

  const clearCustomerSelection = () => {
    setSelectedCustomerId(null);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerAddress("");
    setCustomerSearch("");
    setCustomerResults([]);
  };

  // Order items
  const [items, setItems] = useState<OrderItem[]>(
    initialItems
      ? initialItems.map((i) => ({ ...i, notes: "" }))
      : [emptyItem()],
  );

  // Schedule
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("10:00");
  const [deliveryType, setDeliveryType] = useState<"PICKUP" | "DELIVERY">(
    "PICKUP",
  );

  // Payment
  const [dpAmount, setDpAmount] = useState<number>(0);
  const [dpMethod, setDpMethod] = useState<string>("CASH");
  const [notes, setNotes] = useState("");

  const totalPrice = items.reduce(
    (sum, it) => sum + it.quantity * it.unitPrice,
    0,
  );

  const resetForm = useCallback(() => {
    setCustomerSearch("");
    setCustomerResults([]);
    setCustomerSearchLoading(false);
    setSelectedCustomerId(null);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerAddress("");
    setItems([emptyItem()]);
    setPickupDate("");
    setPickupTime("10:00");
    setDeliveryType("PICKUP");
    setDpAmount(0);
    setDpMethod("CASH");
    setNotes("");
  }, []);

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  // ----- Item helpers -----
  const addItem = () => setItems((prev) => [...prev, emptyItem()]);

  const removeItem = (idx: number) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  const updateItem = (
    idx: number,
    field: keyof OrderItem,
    value: string | number,
  ) =>
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)),
    );

  // ----- Submit -----
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error("Nama dan nomor telepon pelanggan wajib diisi");
      return;
    }
    if (!pickupDate) {
      toast.error("Tanggal pengambilan wajib diisi");
      return;
    }
    if (items.some((it) => !it.name.trim() || it.unitPrice <= 0)) {
      toast.error("Setiap item harus ada nama dan harga satuan");
      return;
    }

    setLoading(true);
    try {
      const pickupDatetime = new Date(`${pickupDate}T${pickupTime}:00`).toISOString();

      const res = await fetch("/api/pre-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerAddress: customerAddress.trim() || null,
          customerId: selectedCustomerId || null,
          items: items.map((it) => ({
            name: it.name.trim(),
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            notes: it.notes.trim() || null,
          })),
          notes: notes.trim() || null,
          dpAmount: dpAmount || 0,
          dpMethod: dpAmount > 0 ? dpMethod : null,
          pickupDate: pickupDatetime,
          deliveryType,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Gagal membuat pre-order" }));
        toast.error(err.error || "Gagal membuat pre-order");
        return;
      }

      const result = await res.json();
      toast.success(`Pre-Order ${result.ticketNo} berhasil dibuat!`);
      resetForm();
      onOpenChange(false);
    } catch {
      toast.error("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(n);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="h-5 w-5 text-primary" />
            Buat Pre-Order Baru
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* ── Pelanggan ── */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Data Pelanggan
            </h3>

            {/* Customer search box */}
            {!selectedCustomerId ? (
              <div className="relative">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  {customerSearchLoading && (
                    <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                  )}
                  <Input
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Cari pelanggan (nama / telepon)..."
                    className="pl-9 pr-9"
                  />
                </div>

                {customerResults.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
                    {customerResults.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-accent"
                        onClick={() => handleSelectCustomer(c)}
                      >
                        <UserCheck className="h-4 w-4 shrink-0 text-primary" />
                        <div>
                          <div className="font-medium">{c.name}</div>
                          <div className="text-xs text-muted-foreground">{c.phone}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2">
                <UserCheck className="h-4 w-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{customerName}</div>
                  <div className="text-xs text-muted-foreground">{customerPhone}</div>
                </div>
                <button
                  type="button"
                  onClick={clearCustomerSelection}
                  className="ml-auto rounded p-1 hover:bg-muted"
                  title="Ganti pelanggan"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            )}

            {/* Manual fields — always editable */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="po-customer-name">
                  Nama <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="po-customer-name"
                  value={customerName}
                  onChange={(e) => { setCustomerName(e.target.value); setSelectedCustomerId(null); }}
                  placeholder="Nama pelanggan"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="po-customer-phone">
                  No. Telepon <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="po-customer-phone"
                  value={customerPhone}
                  onChange={(e) => { setCustomerPhone(e.target.value); setSelectedCustomerId(null); }}
                  placeholder="08xx-xxxx-xxxx"
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="po-customer-address">Alamat (opsional)</Label>
              <Input
                id="po-customer-address"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Alamat pengiriman / pengambilan"
              />
            </div>
          </section>

          {/* ── Item Pesanan ── */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Item Pesanan
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
                className="h-7 gap-1 text-xs"
              >
                <Plus className="h-3 w-3" />
                Tambah Item
              </Button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border bg-muted/30 p-3 space-y-2"
                >
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground w-5">
                      {idx + 1}.
                    </span>
                    <ItemNameCombobox
                      value={item.name}
                      onChange={(v) => updateItem(idx, "name", v)}
                      onSelectProduct={(p) => {
                        updateItem(idx, "name", p.name);
                        updateItem(idx, "unitPrice", p.price);
                      }}
                      products={availableProducts}
                    />
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => removeItem(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pl-6">
                    <div className="space-y-1">
                      <Label className="text-xs">Jumlah</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(
                            idx,
                            "quantity",
                            parseInt(e.target.value) || 1,
                          )
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Harga Satuan (Rp)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={item.unitPrice || ""}
                        onChange={(e) =>
                          updateItem(
                            idx,
                            "unitPrice",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="pl-6">
                    <Input
                      value={item.notes}
                      onChange={(e) => updateItem(idx, "notes", e.target.value)}
                      placeholder="Catatan (ukuran, warna, custom, dll.)"
                      className="text-sm"
                    />
                  </div>

                  {item.quantity > 0 && item.unitPrice > 0 && (
                    <div className="pl-6 text-xs text-muted-foreground text-right">
                      Subtotal:{" "}
                      <span className="font-semibold text-foreground">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Total */}
            {totalPrice > 0 && (
              <div className="rounded-md bg-primary/5 border border-primary/20 px-3 py-2 text-sm text-right">
                <span className="text-muted-foreground">Total Pesanan: </span>
                <span className="font-bold text-primary text-base">
                  {formatCurrency(totalPrice)}
                </span>
              </div>
            )}
          </section>

          {/* ── Jadwal Pengambilan ── */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Jadwal
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="po-pickup-date">
                  Tanggal Pengambilan <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="po-pickup-date"
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="po-pickup-time">Jam</Label>
                <Input
                  id="po-pickup-time"
                  type="time"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Tipe Pengiriman</Label>
              <Select
                value={deliveryType}
                onValueChange={(v) =>
                  setDeliveryType(v as "PICKUP" | "DELIVERY")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PICKUP">Ambil di Toko</SelectItem>
                  <SelectItem value="DELIVERY">Diantar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </section>

          {/* ── DP ── */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Down Payment (DP)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="po-dp-amount">Jumlah DP (Rp)</Label>
                <Input
                  id="po-dp-amount"
                  type="number"
                  min="0"
                  value={dpAmount || ""}
                  onChange={(e) =>
                    setDpAmount(parseFloat(e.target.value) || 0)
                  }
                  placeholder="0"
                />
                {dpAmount > 0 && totalPrice > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Sisa pelunasan:{" "}
                    <span className="font-medium">
                      {formatCurrency(Math.max(0, totalPrice - dpAmount))}
                    </span>
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Metode DP</Label>
                <Select value={dpMethod} onValueChange={setDpMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Tunai</SelectItem>
                    <SelectItem value="TRANSFER">Transfer</SelectItem>
                    <SelectItem value="QRIS">QRIS</SelectItem>
                    <SelectItem value="DEBIT_CARD">Debit</SelectItem>
                    <SelectItem value="EWALLET">E-Wallet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* ── Catatan Tambahan ── */}
          <section className="space-y-1">
            <Label htmlFor="po-notes">Catatan Tambahan</Label>
            <Textarea
              id="po-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instruksi khusus, tema kue, dll."
              rows={2}
            />
          </section>

          {/* ── Actions ── */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Buat Pre-Order"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
