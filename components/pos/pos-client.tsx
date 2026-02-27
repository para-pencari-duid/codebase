"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ShoppingCart,
  Search,
  CalendarClock,
  ArrowLeft,
  Trash,
  Minus,
  Plus,
  Banknote,
  Building2,
  QrCode,
  CreditCard,
  Wallet,
  User,
  UserPlus,
  Loader2,
  Check,
  ChevronsUpDown,
  Gift,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import useCart from "@/hooks/use-cart";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ReceiptDialog } from "./receipt-dialog";
import { ModifierPicker } from "./modifier-picker";
import type { CartItemModifier } from "@/hooks/use-cart";
import type {
  PosBusinessSettings,
  PosCategory,
  PosProduct,
} from "@/lib/types/pos";
import Link from "next/link";
import { formatCurrency, cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

interface Customer {
  id: string;
  name: string;
  phone: string;
}

interface ReceiptData {
  transactionNo: string;
  createdAt: string;
  cashierName: string;
  customerName: string;
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
    discount: number;
    subtotal: number;
    modifiers: CartItemModifier[];
  }>;
  subtotal: number;
  tax: number;
  taxRate: number;
  taxIncluded: boolean;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentAmount: number;
  changeAmount: number;
  pointsEarned: number;
  pointsRedeemed: number;
  pointsRedemptionAmount: number;
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  receiptHeader: string;
  receiptFooter: string;
}

interface POSClientProps {
  products: PosProduct[];
  categories: PosCategory[];
  cashierName: string;
  settings: PosBusinessSettings;
}

type ModifierPickerConfirmProduct = Parameters<
  React.ComponentProps<typeof ModifierPicker>["onConfirm"]
>[0];
type ModifierPickerConfirmModifiers = Parameters<
  React.ComponentProps<typeof ModifierPicker>["onConfirm"]
>[1];

const paymentMethods = [
  { value: "CASH", label: "Tunai", icon: Banknote },
  { value: "TRANSFER", label: "Transfer", icon: Building2 },
  { value: "QRIS", label: "QRIS", icon: QrCode },
  { value: "DEBIT_CARD", label: "Debit", icon: CreditCard },
  { value: "EWALLET", label: "E-Wallet", icon: Wallet },
];

const quickCashAmounts = [50000, 100000, 150000, 200000, 300000, 500000];

export const POSClient: React.FC<POSClientProps> = ({
  products,
  categories,
  cashierName,
  settings,
}) => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const cart = useCart();

  // "cart" = tampilkan keranjang biasa | "checkout" = form pembayaran inline
  const [mode, setMode] = useState<"cart" | "checkout">("cart");

  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  // ── Checkout form state ────────────────────────────
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [discountInput, setDiscountInput] = useState<number>(0);
  const [discountType, setDiscountType] = useState<"amount" | "percent">(
    "amount",
  );
  const [loading, setLoading] = useState(false);

  // ── Loyalty state ──────────────────────────────────
  const [loyaltyInfo, setLoyaltyInfo] = useState<{
    enabled: boolean;
    points: number;
    pointValue: number;
    pointsPerRupiah: number;
  } | null>(null);
  const [usePoints, setUsePoints] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(0);

  // ── QRIS QR state ─────────────────────────────────
  const [qrisImage, setQrisImage] = useState<string | null>(null);
  const [qrisLoadState, setQrisLoadState] = useState<
    "idle" | "loading" | "error"
  >("idle");

  // ── Customer state ─────────────────────────────────
  const [customerOpen, setCustomerOpen] = useState(false);
  const [customerQuery, setCustomerQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [searchLoading, setSearchLoading] = useState(false);
  const [showAddNew, setShowAddNew] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [addNewLoading, setAddNewLoading] = useState(false);

  // ── Modifier picker state ───────────────────────────
  const [modPickerOpen, setModPickerOpen] = useState(false);
  const [modPickerProduct, setModPickerProduct] = useState<PosProduct | null>(
    null,
  );

  // ── Calculations ───────────────────────────────────
  const subtotal = cart.items.reduce((sum, i) => {
    const modPrice = (i.modifiers || []).reduce((s, m) => s + m.price, 0);
    return sum + (Number(i.price) + modPrice) * i.quantity;
  }, 0);
  const tax = settings.taxIncluded ? subtotal * (settings.taxRate / 100) : 0;
  const manualDiscount =
    discountType === "percent"
      ? (subtotal * discountInput) / 100
      : discountInput;
  const pointsRedemptionAmount =
    usePoints && loyaltyInfo
      ? Math.min(
          pointsToRedeem * loyaltyInfo.pointValue,
          subtotal + tax - manualDiscount,
        )
      : 0;
  const finalTotal = Math.max(
    0,
    subtotal + tax - manualDiscount - pointsRedemptionAmount,
  );
  const changeAmount =
    paymentMethod === "CASH" ? Math.max(0, paymentAmount - finalTotal) : 0;
  const canPay =
    cart.items.length > 0 &&
    selectedCustomer !== null &&
    (paymentMethod !== "CASH" || paymentAmount >= finalTotal);

  // ── Product filter ─────────────────────────────────
  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat =
      selectedCategory === "all" || p.categoryId === selectedCategory;
    return matchSearch && matchCat && p.isActive && p.stock > 0;
  });

  const onAddToCart = (product: PosProduct) => {
    // If product has modifiers, open the picker dialog
    if (product.modifierGroups && product.modifierGroups.length > 0) {
      setModPickerProduct(product);
      setModPickerOpen(true);
      return;
    }

    // No modifiers — add directly (same as before)
    const existing = cart.items.find((i) => i.id === product.id);
    if (existing && existing.quantity >= product.stock) {
      toast.error(`Stok ${product.name} tidak mencukupi`);
      return;
    }
    cart.addItem({
      id: product.id,
      itemId: product.id,
      variantId: product.variantId ?? null,
      name: product.name,
      price: Number(product.price),
      quantity: 1,
      stock: product.stock,
      images: product.images,
      category: product.category
        ? { name: product.category.name, icon: product.category.icon }
        : undefined,
    });
  };

  const onModifierConfirm = (
    product: PosProduct,
    modifiers: CartItemModifier[],
  ) => {
    cart.addItem({
      id: product.id,
      itemId: product.id,
      variantId: product.variantId ?? null,
      name: product.name,
      price: Number(product.price),
      quantity: 1,
      stock: product.stock,
      images: product.images,
      category: product.category
        ? { name: product.category.name, icon: product.category.icon }
        : undefined,
      modifiers,
    });
    setModPickerOpen(false);
    setModPickerProduct(null);
  };

  // ── Customer search (debounced) ────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      if (customerQuery.trim().length >= 2) searchCustomers(customerQuery);
      else setCustomers([]);
    }, 300);
    return () => clearTimeout(t);
  }, [customerQuery]);

  // ── Fetch QRIS QR when method = QRIS ─────────────
  useEffect(() => {
    if (paymentMethod !== "QRIS" || finalTotal <= 0) {
      setQrisImage(null);
      setQrisLoadState("idle");
      return;
    }
    let cancelled = false;
    setQrisLoadState("loading");
    setQrisImage(null);
    fetch("/api/qris/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: finalTotal }),
    })
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          toast.error(err?.error || "Gagal membuat QR QRIS");
          setQrisLoadState("error");
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setQrisImage(data.qrCode);
          setQrisLoadState("idle");
        }
      })
      .catch(() => {
        if (!cancelled) setQrisLoadState("error");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentMethod, finalTotal]);

  // ── Load loyalty info when customer is selected ────
  useEffect(() => {
    if (!selectedCustomer) {
      setLoyaltyInfo(null);
      setUsePoints(false);
      setPointsToRedeem(0);
      return;
    }
    fetch(`/api/loyalty/${selectedCustomer.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data)
          setLoyaltyInfo({
            enabled: data.enabled,
            points: data.points,
            pointValue: data.pointValue,
            pointsPerRupiah: data.pointsPerRupiah,
          });
      })
      .catch(() => setLoyaltyInfo(null));
  }, [selectedCustomer]);

  const searchCustomers = async (query: string) => {
    setSearchLoading(true);
    try {
      const res = await fetch(
        `/api/customers?search=${encodeURIComponent(query)}`,
      );
      if (!res.ok) {
        console.error("Customer search failed:", res.status);
        setCustomers([]);
        return;
      }
      const data = await res.json();
      setCustomers(Array.isArray(data) ? data.slice(0, 20) : []);
    } catch (error) {
      console.error("Customer search error:", error);
      setCustomers([]);
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
      if (!res.ok) throw new Error();
      const newCust = await res.json();
      setSelectedCustomer(newCust);
      setShowAddNew(false);
      setNewCustomerName("");
      setNewCustomerPhone("");
      setCustomerOpen(false);
      toast.success(`Pelanggan "${newCust.name}" berhasil ditambahkan`);
    } catch {
      toast.error("Gagal menambahkan pelanggan");
    } finally {
      setAddNewLoading(false);
    }
  };

  // ── Reset checkout form ────────────────────────────
  const resetCheckout = () => {
    setPaymentMethod("CASH");
    setPaymentAmount(0);
    setNotes("");
    setDiscountInput(0);
    setDiscountType("amount");
    setSelectedCustomer(null);
    setCustomerQuery("");
    setCustomers([]);
    setShowAddNew(false);
    setNewCustomerName("");
    setNewCustomerPhone("");
    setLoyaltyInfo(null);
    setUsePoints(false);
    setPointsToRedeem(0);
    setQrisImage(null);
    setQrisLoadState("idle");
  };

  const handleGoToCheckout = () => {
    if (cart.items.length === 0) return;
    resetCheckout();
    setMode("checkout");
  };

  const handleBackToCart = () => {
    setMode("cart");
    resetCheckout();
  };

  // ── Process payment ────────────────────────────────
  const handleConfirmPayment = async () => {
    if (!canPay) return;
    setLoading(true);
    try {
      const effectivePaymentAmount =
        paymentMethod === "CASH" ? paymentAmount : finalTotal;
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.items.map((item) => ({
            variantId: item.variantId ?? item.itemId ?? item.id,
            quantity: item.quantity,
            price: Number(item.price),
            discount: 0,
            modifiers: (item.modifiers || []).map((m) => ({
              groupName: m.groupName,
              optionName: m.optionName,
              price: m.price,
            })),
          })),
          payments: [{ method: paymentMethod, amount: effectivePaymentAmount }],
          discount: manualDiscount,
          notes,
          customerId: selectedCustomer.id,
          pointsRedeemed: usePoints ? pointsToRedeem : 0,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        toast.error(`Transaksi Gagal: ${error}`);
        return;
      }

      const result = await response.json();

      setReceiptData({
        transactionNo: result.transactionNo,
        createdAt: result.createdAt,
        cashierName,
        customerName: selectedCustomer.name,
        items: cart.items.map((item) => {
          const modPrice = (item.modifiers || []).reduce(
            (s, m) => s + m.price,
            0,
          );
          return {
            productName: item.name,
            quantity: item.quantity,
            price: item.price + modPrice,
            discount: 0,
            subtotal: (item.price + modPrice) * item.quantity,
            modifiers: item.modifiers || [],
          };
        }),
        subtotal,
        tax,
        taxRate: settings.taxRate,
        taxIncluded: settings.taxIncluded,
        discount: manualDiscount,
        total: result.total ? Number(result.total) : finalTotal,
        paymentMethod,
        paymentAmount: paymentMethod === "CASH" ? paymentAmount : finalTotal,
        changeAmount: result.changeAmount
          ? Number(result.changeAmount)
          : changeAmount,
        pointsEarned: result.pointsEarned ?? 0,
        pointsRedeemed: usePoints ? pointsToRedeem : 0,
        pointsRedemptionAmount,
        businessName: settings.businessName ?? "",
        businessAddress: settings.businessAddress ?? "",
        businessPhone: settings.businessPhone ?? "",
        receiptHeader: settings.receiptHeader ?? "",
        receiptFooter: settings.receiptFooter ?? "",
      });

      toast.success("Transaksi Berhasil!");
      cart.removeAll();
      setMode("cart");
      resetCheckout();
      setIsReceiptOpen(true);
    } catch {
      toast.error("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex h-[calc(100vh-80px)] overflow-hidden">
        {/* ── LEFT: Product Grid ─────────────────────────── */}
        <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari produk (Nama / SKU)..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="flex-1">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="cursor-pointer hover:border-primary transition-colors flex flex-col justify-between"
                  onClick={() => onAddToCart(product)}
                >
                  <CardContent className="p-4 flex flex-col gap-2 h-full">
                    <div className="aspect-square bg-slate-100 rounded-md flex items-center justify-center text-4xl mb-2">
                      {product.category?.icon || "📦"}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm line-clamp-2">
                        {product.name}
                      </h3>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm font-bold">
                          {formatCurrency(Number(product.price))}
                        </span>
                        <Badge
                          variant={
                            product.stock > 10
                              ? "outline"
                              : product.stock > 0
                                ? "secondary"
                                : "destructive"
                          }
                          className="text-[10px] px-1"
                        >
                          {product.stock > 0
                            ? `Stok: ${product.stock}`
                            : "Habis"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full text-center py-10 text-muted-foreground">
                  Tidak ada produk ditemukan.
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* ── RIGHT PANEL ────────────────────────────────── */}
        <div className="w-[360px] lg:w-[420px] border-l bg-slate-50/50 flex flex-col h-full">
          {mode === "cart" ? (
            /* ══════════════ CART MODE ══════════════ */
            <>
              <div className="p-4 border-b bg-white shadow-sm">
                <h2 className="font-semibold flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Keranjang ({cart.items.reduce(
                    (s, i) => s + i.quantity,
                    0,
                  )}{" "}
                  item)
                </h2>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cart.items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                    <ShoppingCart className="h-12 w-12 opacity-20" />
                    <p>Keranjang kosong</p>
                  </div>
                ) : (
                  cart.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3 p-3 bg-white rounded-lg border shadow-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-1">
                          {item.name}
                        </h4>
                        {item.modifiers && item.modifiers.length > 0 && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {item.modifiers.map((m) => m.optionName).join(", ")}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(
                            Number(item.price) +
                              (item.modifiers || []).reduce(
                                (s, m) => s + m.price,
                                0,
                              ),
                          )}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() =>
                              item.quantity > 1
                                ? cart.updateQuantity(
                                    item.id,
                                    item.quantity - 1,
                                  )
                                : cart.removeItem(item.id)
                            }
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm w-5 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            disabled={item.quantity >= item.stock}
                            onClick={() =>
                              cart.updateQuantity(item.id, item.quantity + 1)
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="text-sm font-semibold">
                          {formatCurrency(
                            (Number(item.price) +
                              (item.modifiers || []).reduce(
                                (s, m) => s + m.price,
                                0,
                              )) *
                              item.quantity,
                          )}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 bg-white border-t space-y-4">
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {settings.taxIncluded && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Pajak ({settings.taxRate}%)</span>
                      <span>{formatCurrency(tax)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(subtotal + tax)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => cart.removeAll()}
                      disabled={cart.items.length === 0}
                    >
                      <Trash className="mr-2 h-4 w-4" /> Batal
                    </Button>
                    <Button
                      onClick={handleGoToCheckout}
                      disabled={cart.items.length === 0}
                    >
                      Bayar
                    </Button>
                  </div>
                  <Link href="/pre-orders">
                    <Button
                      variant="outline"
                      className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <CalendarClock className="mr-2 h-4 w-4" /> Pre-Order
                    </Button>
                  </Link>
                </div>
              </div>
            </>
          ) : (
            /* ══════════════ CHECKOUT MODE ══════════════ */
            <>
              <div className="p-4 border-b bg-white shadow-sm flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={handleBackToCart}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h2 className="font-semibold">Pembayaran</h2>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {/* Order summary mini */}
                <div className="bg-white rounded-lg border p-3 space-y-1.5 text-sm">
                  <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wide mb-2">
                    Ringkasan Pesanan
                  </p>
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span className="line-clamp-1 flex-1 mr-2">
                        {item.quantity}x {item.name}
                      </span>
                      <span className="shrink-0">
                        {formatCurrency(Number(item.price) * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Customer selection */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-red-500" />
                    <Label className="font-semibold text-sm">
                      Pelanggan <span className="text-red-500">*</span>
                    </Label>
                  </div>

                  {selectedCustomer ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">
                          {selectedCustomer.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {selectedCustomer.phone}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setSelectedCustomer(null)}
                      >
                        Ganti
                      </Button>
                    </div>
                  ) : showAddNew ? (
                    <div className="space-y-2 border rounded-lg p-3 bg-white">
                      <p className="text-xs font-medium text-muted-foreground">
                        Pelanggan Baru
                      </p>
                      <Input
                        placeholder="Nama pelanggan"
                        value={newCustomerName}
                        onChange={(e) => setNewCustomerName(e.target.value)}
                        className="h-8 text-sm"
                      />
                      <Input
                        placeholder="No. HP (cth: 0812...)"
                        value={newCustomerPhone}
                        onChange={(e) => setNewCustomerPhone(e.target.value)}
                        className="h-8 text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 h-8"
                          onClick={handleAddNewCustomer}
                          disabled={addNewLoading}
                        >
                          {addNewLoading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "Simpan"
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() => setShowAddNew(false)}
                        >
                          Batal
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Popover
                        open={customerOpen}
                        onOpenChange={setCustomerOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between h-9 text-sm"
                          >
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <Search className="h-3.5 w-3.5" />
                              Cari nama / nomor HP...
                            </span>
                            <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command shouldFilter={false}>
                            <CommandInput
                              placeholder="Ketik nama / nomor HP..."
                              value={customerQuery}
                              onValueChange={setCustomerQuery}
                            />
                            <CommandList>
                              {searchLoading && (
                                <div className="flex items-center justify-center py-4">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                              )}
                              {!searchLoading &&
                                customerQuery.length >= 2 &&
                                customers.length === 0 && (
                                  <CommandEmpty>
                                    Pelanggan tidak ditemukan
                                  </CommandEmpty>
                                )}
                              {!searchLoading && customerQuery.length < 2 && (
                                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                                  Ketik min. 2 huruf untuk mencari
                                </div>
                              )}
                              <CommandGroup>
                                {customers.map((c) => (
                                  <CommandItem
                                    key={c.id}
                                    value={c.id}
                                    onSelect={() => {
                                      setSelectedCustomer(c);
                                      setCustomerOpen(false);
                                    }}
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-medium">
                                        {c.name}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {c.phone}
                                      </span>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-8 text-xs border-dashed"
                        onClick={() => setShowAddNew(true)}
                      >
                        <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Tambah
                        Pelanggan Baru
                      </Button>
                    </div>
                  )}
                </div>

                {/* Loyalty points */}
                {loyaltyInfo?.enabled && loyaltyInfo.points > 0 && (
                  <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-semibold text-sm flex items-center gap-1.5">
                        <Gift className="h-4 w-4 text-amber-600" />
                        Tukar Poin
                      </Label>
                      <Switch
                        checked={usePoints}
                        onCheckedChange={(v) => {
                          setUsePoints(v);
                          if (!v) setPointsToRedeem(0);
                        }}
                      />
                    </div>
                    <p className="text-xs text-amber-700">
                      Poin tersedia: <strong>{loyaltyInfo.points}</strong> poin
                      (
                      {formatCurrency(
                        loyaltyInfo.points * loyaltyInfo.pointValue,
                      )}
                      )
                    </p>
                    {usePoints && (
                      <div className="space-y-1.5">
                        <Input
                          type="number"
                          min={0}
                          max={loyaltyInfo.points}
                          placeholder="Jumlah poin"
                          value={pointsToRedeem || ""}
                          onChange={(e) =>
                            setPointsToRedeem(
                              Math.min(
                                Number(e.target.value),
                                loyaltyInfo.points,
                              ),
                            )
                          }
                          className="h-8 text-sm"
                        />
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 h-7 text-xs"
                            onClick={() =>
                              setPointsToRedeem(loyaltyInfo.points)
                            }
                          >
                            Semua poin
                          </Button>
                          {pointsToRedeem > 0 && (
                            <p className="text-xs text-green-700 flex items-center px-2">
                              -{formatCurrency(pointsRedemptionAmount)}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Payment method */}
                <div className="space-y-2">
                  <Label className="font-semibold text-sm">
                    Metode Pembayaran
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {paymentMethods.map((m) => {
                      const Icon = m.icon;
                      return (
                        <button
                          key={m.value}
                          onClick={() => {
                            setPaymentMethod(m.value);
                            setPaymentAmount(0);
                          }}
                          className={cn(
                            "flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-colors",
                            paymentMethod === m.value
                              ? "border-primary bg-primary/5 text-primary font-semibold"
                              : "border-border hover:border-primary/50",
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {m.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* QRIS QR Code display */}
                {paymentMethod === "QRIS" && (
                  <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border">
                    {qrisLoadState === "loading" && (
                      <>
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-xs text-muted-foreground">
                          Membuat QR QRIS...
                        </p>
                      </>
                    )}
                    {qrisLoadState === "error" && (
                      <p className="text-xs text-destructive text-center">
                        Gagal membuat QR. Pastikan QRIS sudah diatur di
                        Pengaturan.
                      </p>
                    )}
                    {qrisImage && qrisLoadState === "idle" && (
                      <>
                        <img
                          src={qrisImage}
                          alt="QR QRIS"
                          className="w-48 h-48 rounded-lg"
                        />
                        <p className="text-xs text-muted-foreground text-center">
                          Scan QR untuk membayar{" "}
                          <span className="font-semibold text-foreground">
                            {formatCurrency(finalTotal)}
                          </span>
                        </p>
                      </>
                    )}
                  </div>
                )}

                {/* Payment amount — only for CASH */}
                {paymentMethod === "CASH" && (
                  <div className="space-y-2">
                    <Label className="font-semibold text-sm">
                      Jumlah Bayar
                    </Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={paymentAmount || ""}
                      onChange={(e) => setPaymentAmount(Number(e.target.value))}
                      className="text-right font-mono text-base h-10"
                    />
                    <div className="grid grid-cols-3 gap-1.5">
                      {quickCashAmounts.map((amt) => (
                        <Button
                          key={amt}
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => setPaymentAmount(amt)}
                        >
                          {amt >= 1000 ? `${amt / 1000}rb` : amt}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-7 text-xs"
                      onClick={() => setPaymentAmount(Math.ceil(finalTotal))}
                    >
                      Pas: {formatCurrency(Math.ceil(finalTotal))}
                    </Button>
                  </div>
                )}

                {/* Discount */}
                <div className="space-y-2">
                  <Label className="font-semibold text-sm">Diskon</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="0"
                      value={discountInput || ""}
                      onChange={(e) => setDiscountInput(Number(e.target.value))}
                      className="flex-1 h-9 text-sm"
                    />
                    <div className="flex rounded-md border overflow-hidden shrink-0">
                      <button
                        onClick={() => setDiscountType("amount")}
                        className={cn(
                          "px-3 text-sm transition-colors",
                          discountType === "amount"
                            ? "bg-primary text-white"
                            : "hover:bg-muted",
                        )}
                      >
                        Rp
                      </button>
                      <button
                        onClick={() => setDiscountType("percent")}
                        className={cn(
                          "px-3 text-sm transition-colors",
                          discountType === "percent"
                            ? "bg-primary text-white"
                            : "hover:bg-muted",
                        )}
                      >
                        %
                      </button>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label className="font-semibold text-sm">Catatan</Label>
                  <Textarea
                    placeholder="Catatan transaksi (opsional)..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="text-sm resize-none h-16"
                  />
                </div>
              </div>

              {/* Sticky footer summary + confirm */}
              <div className="p-4 bg-white border-t space-y-3">
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {settings.taxIncluded && tax > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Pajak ({settings.taxRate}%)</span>
                      <span>{formatCurrency(tax)}</span>
                    </div>
                  )}
                  {manualDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Diskon</span>
                      <span>-{formatCurrency(manualDiscount)}</span>
                    </div>
                  )}
                  {pointsRedemptionAmount > 0 && (
                    <div className="flex justify-between text-amber-600">
                      <span>Poin ({pointsToRedeem} poin)</span>
                      <span>-{formatCurrency(pointsRedemptionAmount)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span>{formatCurrency(finalTotal)}</span>
                  </div>
                  {paymentMethod === "CASH" && paymentAmount > 0 && (
                    <div className="flex justify-between text-blue-600 font-medium">
                      <span>Kembalian</span>
                      <span>{formatCurrency(changeAmount)}</span>
                    </div>
                  )}
                </div>

                <Button
                  className="w-full h-11 text-base font-semibold"
                  onClick={handleConfirmPayment}
                  disabled={!canPay || loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  {loading ? "Memproses..." : "Konfirmasi Bayar"}
                </Button>

                {!selectedCustomer && (
                  <p className="text-xs text-center text-red-500">
                    Pilih pelanggan terlebih dahulu
                  </p>
                )}
                {selectedCustomer &&
                  paymentMethod === "CASH" &&
                  paymentAmount < finalTotal && (
                    <p className="text-xs text-center text-red-500">
                      Kurang {formatCurrency(finalTotal - paymentAmount)}
                    </p>
                  )}
              </div>
            </>
          )}
        </div>
      </div>

      <ReceiptDialog
        open={isReceiptOpen}
        onOpenChange={setIsReceiptOpen}
        data={receiptData}
      />
      <ModifierPicker
        open={modPickerOpen}
        onClose={() => {
          setModPickerOpen(false);
          setModPickerProduct(null);
        }}
        product={modPickerProduct}
        onConfirm={onModifierConfirm}
      />
    </>
  );
};
