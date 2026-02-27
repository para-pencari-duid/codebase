import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Search,
  User,
  UserPlus,
  Loader2,
  ChevronsUpDown,
  Gift,
  Check,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { CartItem } from "@/hooks/use-cart";
import type {
  PosCustomer,
  PosLoyaltyInfo,
  PosPaymentMethod,
} from "@/lib/types/pos-checkout";
import type { PosPaymentMethodUiOption } from "./types";

interface PosCheckoutPanelProps {
  items: CartItem[];
  customerOpen: boolean;
  setCustomerOpen: (value: boolean) => void;
  customerQuery: string;
  setCustomerQuery: (value: string) => void;
  customers: PosCustomer[];
  selectedCustomer: PosCustomer | null;
  setSelectedCustomer: (customer: PosCustomer | null) => void;
  searchLoading: boolean;
  showAddNew: boolean;
  setShowAddNew: (value: boolean) => void;
  newCustomerName: string;
  setNewCustomerName: (value: string) => void;
  newCustomerPhone: string;
  setNewCustomerPhone: (value: string) => void;
  addNewLoading: boolean;
  onAddNewCustomer: () => Promise<void>;
  loyaltyInfo: PosLoyaltyInfo | null;
  usePoints: boolean;
  setUsePoints: (value: boolean) => void;
  pointsToRedeem: number;
  setPointsToRedeem: (value: number) => void;
  pointsRedemptionAmount: number;
  paymentMethods: PosPaymentMethodUiOption[];
  paymentMethod: PosPaymentMethod;
  setPaymentMethod: (method: PosPaymentMethod) => void;
  qrisLoadState: "idle" | "loading" | "error";
  qrisImage: string | null;
  finalTotal: number;
  paymentAmount: number;
  setPaymentAmount: (value: number) => void;
  quickCashAmounts: readonly number[];
  discountInput: number;
  setDiscountInput: (value: number) => void;
  discountType: "amount" | "percent";
  setDiscountType: (value: "amount" | "percent") => void;
  notes: string;
  setNotes: (value: string) => void;
  subtotal: number;
  tax: number;
  taxRate: number;
  taxIncluded: boolean;
  manualDiscount: number;
  changeAmount: number;
  canPay: boolean;
  loading: boolean;
  onBackToCart: () => void;
  onConfirmPayment: () => Promise<void>;
}

export function PosCheckoutPanel({
  items,
  customerOpen,
  setCustomerOpen,
  customerQuery,
  setCustomerQuery,
  customers,
  selectedCustomer,
  setSelectedCustomer,
  searchLoading,
  showAddNew,
  setShowAddNew,
  newCustomerName,
  setNewCustomerName,
  newCustomerPhone,
  setNewCustomerPhone,
  addNewLoading,
  onAddNewCustomer,
  loyaltyInfo,
  usePoints,
  setUsePoints,
  pointsToRedeem,
  setPointsToRedeem,
  pointsRedemptionAmount,
  paymentMethods,
  paymentMethod,
  setPaymentMethod,
  qrisLoadState,
  qrisImage,
  finalTotal,
  paymentAmount,
  setPaymentAmount,
  quickCashAmounts,
  discountInput,
  setDiscountInput,
  discountType,
  setDiscountType,
  notes,
  setNotes,
  subtotal,
  tax,
  taxRate,
  taxIncluded,
  manualDiscount,
  changeAmount,
  canPay,
  loading,
  onBackToCart,
  onConfirmPayment,
}: PosCheckoutPanelProps) {
  return (
    <>
      <div className="p-4 border-b bg-white shadow-sm flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={onBackToCart}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="font-semibold">Pembayaran</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div className="bg-white rounded-lg border p-3 space-y-1.5 text-sm">
          <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wide mb-2">
            Ringkasan Pesanan
          </p>
          {items.map((item) => (
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
                <p className="text-sm font-medium">{selectedCustomer.name}</p>
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
                onChange={(event) => setNewCustomerName(event.target.value)}
                className="h-8 text-sm"
              />
              <Input
                placeholder="No. HP (cth: 0812...)"
                value={newCustomerPhone}
                onChange={(event) => setNewCustomerPhone(event.target.value)}
                className="h-8 text-sm"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 h-8"
                  onClick={() => void onAddNewCustomer()}
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
              <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
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
                          <CommandEmpty>Pelanggan tidak ditemukan</CommandEmpty>
                        )}
                      {!searchLoading && customerQuery.length < 2 && (
                        <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                          Ketik min. 2 huruf untuk mencari
                        </div>
                      )}
                      <CommandGroup>
                        {customers.map((customer) => (
                          <CommandItem
                            key={customer.id}
                            value={customer.id}
                            onSelect={() => {
                              setSelectedCustomer(customer);
                              setCustomerOpen(false);
                            }}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {customer.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {customer.phone}
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
                <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Tambah Pelanggan
                Baru
              </Button>
            </div>
          )}
        </div>

        {loyaltyInfo?.enabled && loyaltyInfo.points > 0 && (
          <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-center justify-between">
              <Label className="font-semibold text-sm flex items-center gap-1.5">
                <Gift className="h-4 w-4 text-amber-600" />
                Tukar Poin
              </Label>
              <Switch
                checked={usePoints}
                onCheckedChange={(value) => {
                  setUsePoints(value);
                  if (!value) setPointsToRedeem(0);
                }}
              />
            </div>
            <p className="text-xs text-amber-700">
              Poin tersedia: <strong>{loyaltyInfo.points}</strong> poin (
              {formatCurrency(loyaltyInfo.points * loyaltyInfo.pointValue)})
            </p>
            {usePoints && (
              <div className="space-y-1.5">
                <Input
                  type="number"
                  min={0}
                  max={loyaltyInfo.points}
                  placeholder="Jumlah poin"
                  value={pointsToRedeem || ""}
                  onChange={(event) =>
                    setPointsToRedeem(
                      Math.min(Number(event.target.value), loyaltyInfo.points),
                    )
                  }
                  className="h-8 text-sm"
                />
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-7 text-xs"
                    onClick={() => setPointsToRedeem(loyaltyInfo.points)}
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

        <div className="space-y-2">
          <Label className="font-semibold text-sm">Metode Pembayaran</Label>
          <div className="grid grid-cols-3 gap-2">
            {paymentMethods.map((methodOption) => {
              const Icon = methodOption.icon;
              return (
                <button
                  key={methodOption.value}
                  onClick={() => {
                    setPaymentMethod(methodOption.value);
                    setPaymentAmount(0);
                  }}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-colors",
                    paymentMethod === methodOption.value
                      ? "border-primary bg-primary/5 text-primary font-semibold"
                      : "border-border hover:border-primary/50",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {methodOption.label}
                </button>
              );
            })}
          </div>
        </div>

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
                Gagal membuat QR. Pastikan QRIS sudah diatur di Pengaturan.
              </p>
            )}
            {qrisImage && qrisLoadState === "idle" && (
              <>
                <Image
                  src={qrisImage}
                  alt="QR QRIS"
                  width={192}
                  height={192}
                  className="rounded-lg"
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

        {paymentMethod === "CASH" && (
          <div className="space-y-2">
            <Label className="font-semibold text-sm">Jumlah Bayar</Label>
            <Input
              type="number"
              placeholder="0"
              value={paymentAmount || ""}
              onChange={(event) => setPaymentAmount(Number(event.target.value))}
              className="text-right font-mono text-base h-10"
            />
            <div className="grid grid-cols-3 gap-1.5">
              {quickCashAmounts.map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setPaymentAmount(amount)}
                >
                  {amount >= 1000 ? `${amount / 1000}rb` : amount}
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

        <div className="space-y-2">
          <Label className="font-semibold text-sm">Diskon</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="0"
              value={discountInput || ""}
              onChange={(event) => setDiscountInput(Number(event.target.value))}
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

        <div className="space-y-2">
          <Label className="font-semibold text-sm">Catatan</Label>
          <Textarea
            placeholder="Catatan transaksi (opsional)..."
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="text-sm resize-none h-16"
          />
        </div>
      </div>

      <div className="p-4 bg-white border-t space-y-3">
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {taxIncluded && tax > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Pajak ({taxRate}%)</span>
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
          onClick={() => void onConfirmPayment()}
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
  );
}
