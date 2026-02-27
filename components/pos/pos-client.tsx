"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Banknote,
  Building2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  QrCode,
  Wallet,
  ShoppingCart,
} from "lucide-react";
import { toast } from "sonner";
import useCart from "@/hooks/use-cart";
import type { CartItem, CartItemModifier } from "@/hooks/use-cart";
import { usePosCustomer } from "@/hooks/pos/use-pos-customer";
import { usePosLoyalty } from "@/hooks/pos/use-pos-loyalty";
import { usePosQris } from "@/hooks/pos/use-pos-qris";
import { usePosCheckoutCalculations } from "@/hooks/pos/use-pos-checkout-calculations";
import type {
  PosBusinessSettings,
  PosCategory,
  PosProduct,
} from "@/lib/types/pos";
import type {
  PosPaymentMethod,
  PosReceiptData,
} from "@/lib/types/pos-checkout";
import { ReceiptDialog } from "./receipt-dialog";
import { ModifierPicker } from "./modifier-picker";
import { PosProductPanel } from "./pos-client/product-panel";
import { PosCartPanel } from "./pos-client/cart-panel";
import { PosCheckoutPanel } from "./pos-client/checkout-panel";
import type { PosPaymentMethodUiOption } from "./pos-client/types";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface POSClientProps {
  products: PosProduct[];
  categories: PosCategory[];
  cashierName: string;
  settings: PosBusinessSettings;
}

const paymentMethods: PosPaymentMethodUiOption[] = [
  { value: "CASH", label: "Tunai", icon: Banknote },
  { value: "TRANSFER", label: "Transfer", icon: Building2 },
  { value: "QRIS", label: "QRIS", icon: QrCode },
  { value: "DEBIT_CARD", label: "Debit", icon: CreditCard },
  { value: "EWALLET", label: "E-Wallet", icon: Wallet },
];

const quickCashAmounts = [
  50000, 100000, 150000, 200000, 300000, 500000,
] as const;

export const POSClient: React.FC<POSClientProps> = ({
  products,
  categories,
  cashierName,
  settings,
}) => {
  const cart = useCart();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [mode, setMode] = useState<"cart" | "checkout">("cart");
  const [isCartExpanded, setIsCartExpanded] = useState(true);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<PosReceiptData | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<PosPaymentMethod>("CASH");
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [discountInput, setDiscountInput] = useState<number>(0);
  const [discountType, setDiscountType] = useState<"amount" | "percent">(
    "amount",
  );
  const [loading, setLoading] = useState(false);

  const [usePoints, setUsePoints] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(0);

  const {
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
    handleAddNewCustomer,
    resetCustomerState,
  } = usePosCustomer();

  const { loyaltyInfo, resetLoyalty } = usePosLoyalty(
    selectedCustomer?.id ?? null,
  );

  const {
    subtotal,
    tax,
    manualDiscount,
    pointsRedemptionAmount,
    finalTotal,
    changeAmount,
  } = usePosCheckoutCalculations({
    cartItems: cart.items,
    settings,
    discountType,
    discountInput,
    usePoints,
    pointsToRedeem,
    loyaltyInfo,
    paymentMethod,
    paymentAmount,
  });

  const { qrisImage, qrisLoadState, clearQris } = usePosQris({
    paymentMethod,
    amount: finalTotal,
  });

  const [modPickerOpen, setModPickerOpen] = useState(false);
  const [modPickerProduct, setModPickerProduct] = useState<PosProduct | null>(
    null,
  );

  const cartItemCount = useMemo(
    () => cart.items.reduce((sum, item) => sum + item.quantity, 0),
    [cart.items],
  );

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const matchSearch =
          product.name.toLowerCase().includes(search.toLowerCase()) ||
          product.sku.toLowerCase().includes(search.toLowerCase());
        const matchCategory =
          selectedCategory === "all" || product.categoryId === selectedCategory;
        return (
          matchSearch && matchCategory && product.isActive && product.stock > 0
        );
      }),
    [products, search, selectedCategory],
  );

  const canPay =
    cart.items.length > 0 &&
    selectedCustomer !== null &&
    (paymentMethod !== "CASH" || paymentAmount >= finalTotal);

  const resetCheckout = useCallback(() => {
    setPaymentMethod("CASH");
    setPaymentAmount(0);
    setNotes("");
    setDiscountInput(0);
    setDiscountType("amount");
    resetCustomerState();
    resetLoyalty();
    setUsePoints(false);
    setPointsToRedeem(0);
    clearQris();
  }, [clearQris, resetCustomerState, resetLoyalty]);

  const onAddToCart = useCallback(
    (product: PosProduct) => {
      if (product.modifierGroups && product.modifierGroups.length > 0) {
        setModPickerProduct(product);
        setModPickerOpen(true);
        return;
      }

      const existing = cart.items.find((item) => item.id === product.id);
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
    },
    [cart],
  );

  const onModifierConfirm = useCallback(
    (product: PosProduct, modifiers: CartItemModifier[]) => {
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
    },
    [cart],
  );

  const handleGoToCheckout = useCallback(() => {
    if (cart.items.length === 0) return;
    resetCheckout();
    setMode("checkout");
  }, [cart.items.length, resetCheckout]);

  const handleBackToCart = useCallback(() => {
    setMode("cart");
    resetCheckout();
  }, [resetCheckout]);

  const handleDecreaseQuantity = useCallback(
    (item: CartItem) => {
      if (item.quantity > 1) {
        cart.updateQuantity(item.id, item.quantity - 1);
      } else {
        cart.removeItem(item.id);
      }
    },
    [cart],
  );

  const handleIncreaseQuantity = useCallback(
    (item: CartItem) => {
      cart.updateQuantity(item.id, item.quantity + 1);
    },
    [cart],
  );

  const handleConfirmPayment = useCallback(async () => {
    if (!canPay || !selectedCustomer) return;
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
            modifiers: (item.modifiers || []).map((modifier) => ({
              groupName: modifier.groupName,
              optionName: modifier.optionName,
              price: modifier.price,
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
          const modifierPrice = (item.modifiers || []).reduce(
            (sum, modifier) => sum + modifier.price,
            0,
          );

          return {
            productName: item.name,
            quantity: item.quantity,
            price: item.price + modifierPrice,
            discount: 0,
            subtotal: (item.price + modifierPrice) * item.quantity,
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
      setIsMobileCartOpen(false);
      resetCheckout();
      setIsReceiptOpen(true);
    } catch {
      toast.error("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }, [
    canPay,
    selectedCustomer,
    paymentMethod,
    paymentAmount,
    finalTotal,
    cart,
    manualDiscount,
    notes,
    usePoints,
    pointsToRedeem,
    cashierName,
    subtotal,
    tax,
    settings,
    changeAmount,
    pointsRedemptionAmount,
    resetCheckout,
  ]);

  const cartCheckoutContent =
    mode === "cart" ? (
      <div className="flex flex-1 min-h-0 flex-col">
        <PosCartPanel
          items={cart.items}
          itemCount={cartItemCount}
          subtotal={subtotal}
          tax={tax}
          taxRate={settings.taxRate}
          taxIncluded={settings.taxIncluded}
          onDecreaseQuantity={handleDecreaseQuantity}
          onIncreaseQuantity={handleIncreaseQuantity}
          onClearCart={cart.removeAll}
          onGoToCheckout={handleGoToCheckout}
        />
      </div>
    ) : (
      <div className="flex flex-1 min-h-0 flex-col">
        <PosCheckoutPanel
          items={cart.items}
          customerOpen={customerOpen}
          setCustomerOpen={setCustomerOpen}
          customerQuery={customerQuery}
          setCustomerQuery={setCustomerQuery}
          customers={customers}
          selectedCustomer={selectedCustomer}
          setSelectedCustomer={setSelectedCustomer}
          searchLoading={searchLoading}
          showAddNew={showAddNew}
          setShowAddNew={setShowAddNew}
          newCustomerName={newCustomerName}
          setNewCustomerName={setNewCustomerName}
          newCustomerPhone={newCustomerPhone}
          setNewCustomerPhone={setNewCustomerPhone}
          addNewLoading={addNewLoading}
          onAddNewCustomer={handleAddNewCustomer}
          loyaltyInfo={loyaltyInfo}
          usePoints={usePoints}
          setUsePoints={setUsePoints}
          pointsToRedeem={pointsToRedeem}
          setPointsToRedeem={setPointsToRedeem}
          pointsRedemptionAmount={pointsRedemptionAmount}
          paymentMethods={paymentMethods}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          qrisLoadState={qrisLoadState}
          qrisImage={qrisImage}
          finalTotal={finalTotal}
          paymentAmount={paymentAmount}
          setPaymentAmount={setPaymentAmount}
          quickCashAmounts={quickCashAmounts}
          discountInput={discountInput}
          setDiscountInput={setDiscountInput}
          discountType={discountType}
          setDiscountType={setDiscountType}
          notes={notes}
          setNotes={setNotes}
          subtotal={subtotal}
          tax={tax}
          taxRate={settings.taxRate}
          taxIncluded={settings.taxIncluded}
          manualDiscount={manualDiscount}
          changeAmount={changeAmount}
          canPay={canPay}
          loading={loading}
          onBackToCart={handleBackToCart}
          onConfirmPayment={handleConfirmPayment}
        />
      </div>
    );

  return (
    <>
      <div className="flex h-[calc(100vh-80px)] min-h-0 overflow-hidden">
        <PosProductPanel
          search={search}
          onSearchChange={setSearch}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categories={categories}
          products={filteredProducts}
          onAddToCart={onAddToCart}
        />

        {cart.items.length > 0 && (
          <div
            className={`relative hidden lg:flex border-l bg-slate-50/50 flex-col h-full min-h-0 transition-all duration-200 ${
              isCartExpanded ? "w-[360px] xl:w-[420px]" : "w-14"
            }`}
          >
            <button
              type="button"
              onClick={() => setIsCartExpanded((prev) => !prev)}
              className="absolute top-3 right-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-md border bg-white text-slate-700 hover:bg-slate-100"
              aria-label={
                isCartExpanded ? "Kecilkan keranjang" : "Perbesar keranjang"
              }
              title={
                isCartExpanded ? "Kecilkan keranjang" : "Perbesar keranjang"
              }
            >
              {isCartExpanded ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>

            {isCartExpanded ? (
              cartCheckoutContent
            ) : (
              <div className="flex flex-1 items-center justify-center px-2 pt-12">
                <ShoppingCart />
              </div>
            )}
          </div>
        )}
      </div>

      {cartItemCount > 0 && (
        <button
          type="button"
          onClick={() => setIsMobileCartOpen(true)}
          className="fixed right-4 bottom-4 z-40 inline-flex h-14 min-w-14 items-center justify-center gap-2 rounded-full bg-primary px-4 text-primary-foreground shadow-lg lg:hidden"
          aria-label="Buka keranjang"
        >
          <ShoppingCart className="h-5 w-5" />
          <span className="text-sm font-semibold">{cartItemCount}</span>
        </button>
      )}

      <Sheet open={isMobileCartOpen} onOpenChange={setIsMobileCartOpen}>
        <SheetContent
          side="right"
          className="h-[100dvh] w-screen max-w-none gap-0 p-0 sm:max-w-none lg:hidden"
        >
          <div className="flex h-full min-h-0 flex-col bg-slate-50/50">
            {cartCheckoutContent}
          </div>
        </SheetContent>
      </Sheet>

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
