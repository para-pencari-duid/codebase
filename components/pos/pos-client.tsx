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
import { alertSuccess, alertError } from "@/lib/swal";
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
  PosCustomer,
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
import { PosPreOrderDialog } from "./pos-preorder-dialog";
import { CalendarDays } from "lucide-react";

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

type PreOrderPaymentType = "DP" | "FULL";

export const POSClient: React.FC<POSClientProps> = ({
  products,
  categories,
  cashierName,
  settings,
}) => {
  const cart = useCart();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [mode, setMode] = useState<"cart" | "checkout" | "preorder-checkout">("cart");
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

  // Pre-order checkout state
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("10:00");
  const [deliveryType, setDeliveryType] = useState<"PICKUP" | "DELIVERY">("PICKUP");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [preOrderPaymentType, setPreOrderPaymentType] =
    useState<PreOrderPaymentType>("DP");
  const [preOrderDpAmount, setPreOrderDpAmount] = useState<number>(0);

  const {
    customerOpen,
    setCustomerOpen,
    customerQuery,
    setCustomerQuery,
    customers,
    selectedCustomer,
    setSelectedCustomer: setSelectedCustomerBase,
    searchLoading,
    showAddNew,
    setShowAddNew,
    newCustomerName,
    setNewCustomerName,
    newCustomerPhone,
    setNewCustomerPhone,    
    newCustomerAddress,
    setNewCustomerAddress,
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

  const preOrderPaymentAmount = useMemo(() => {
    const rawAmount =
      preOrderPaymentType === "FULL" ? finalTotal : preOrderDpAmount;

    return Math.min(Math.max(rawAmount, 0), finalTotal);
  }, [finalTotal, preOrderDpAmount, preOrderPaymentType]);

  const qrisChargeAmount =
    mode === "preorder-checkout" ? preOrderPaymentAmount : finalTotal;

  const { qrisImage, qrisLoadState, clearQris } = usePosQris({
    paymentMethod,
    amount: qrisChargeAmount,
  });

  const [modPickerOpen, setModPickerOpen] = useState(false);
  const [modPickerProduct, setModPickerProduct] = useState<PosProduct | null>(
    null,
  );

  const [preOrderOpen, setPreOrderOpen] = useState(false);

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
        // Pre-Order products are shown regardless of stock
        const isPreOrderProduct = product.orderType === "PRE_ORDER";
        return (
          matchSearch && matchCategory && product.isActive &&
          (isPreOrderProduct || product.stock > 0)
        );
      }),
    [products, search, selectedCategory],
  );

  // Feature 5: detect if cart has any pre-order items → disable Pay, show PreOrder button
  const hasPreOrderItems = useMemo(
    () => cart.items.some((item) => item.isPreOrder === true),
    [cart.items],
  );

  const canPay =
    cart.items.length > 0 &&
    selectedCustomer !== null &&
    (deliveryType !== "DELIVERY" || deliveryAddress.trim().length > 0) &&
    (paymentMethod !== "CASH" || paymentAmount >= finalTotal);

  const canCreatePreOrder =
    cart.items.length > 0 &&
    selectedCustomer !== null &&
    !!pickupDate &&
    (deliveryType !== "DELIVERY" || deliveryAddress.trim().length > 0) &&
    preOrderPaymentAmount > 0;

  const setSelectedCustomer = useCallback(
    (customer: PosCustomer | null) => {
      setSelectedCustomerBase(customer);
      if (
        customer &&
        deliveryType === "DELIVERY" &&
        !deliveryAddress.trim() &&
        customer.address
      ) {
        setDeliveryAddress(customer.address);
      }
    },
    [deliveryAddress, deliveryType, setSelectedCustomerBase],
  );

  const handleDeliveryTypeChange = useCallback(
    (value: "PICKUP" | "DELIVERY") => {
      setDeliveryType(value);
      if (
        value === "DELIVERY" &&
        !deliveryAddress.trim() &&
        selectedCustomer?.address
      ) {
        setDeliveryAddress(selectedCustomer.address);
      }
    },
    [deliveryAddress, selectedCustomer],
  );

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
    setDeliveryType("PICKUP");
    setDeliveryAddress("");
    setPreOrderPaymentType("DP");
    setPreOrderDpAmount(0);
    clearQris();
  }, [clearQris, resetCustomerState, resetLoyalty]);

  const onAddToCart = useCallback(
    (product: PosProduct) => {
      const isPreOrder = product.orderType === "PRE_ORDER";

      if (product.modifierGroups && product.modifierGroups.length > 0) {
        setModPickerProduct(product);
        setModPickerOpen(true);
        return;
      }

      // For ready products: enforce stock limit
      if (!isPreOrder) {
        const existing = cart.items.find((item) => item.id === product.id);
        if (existing && existing.quantity >= product.stock) {
          alertError(`Stok ${product.name} tidak mencukupi.`, "Stok Habis");
          return;
        }
      }

      cart.addItem({
        id: product.id,
        itemId: product.id,
        variantId: product.variantId ?? null,
        name: product.name,
        price: Number(product.price),
        quantity: 1,
        // Feature 6: pre-order products have unlimited stock
        stock: isPreOrder ? Infinity : product.stock,
        images: product.images,
        category: product.category
          ? { name: product.category.name, icon: product.category.icon }
          : undefined,
        isPreOrder,
      });
    },
    [cart],
  );

  const onModifierConfirm = useCallback(
    (product: PosProduct, modifiers: CartItemModifier[]) => {
      const isPreOrder = product.orderType === "PRE_ORDER";
      cart.addItem({
        id: product.id,
        itemId: product.id,
        variantId: product.variantId ?? null,
        name: product.name,
        price: Number(product.price),
        quantity: 1,
        stock: isPreOrder ? Infinity : product.stock,
        images: product.images,
        category: product.category
          ? { name: product.category.name, icon: product.category.icon }
          : undefined,
        isPreOrder,
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

  const handleGoToPreOrderCheckout = useCallback(() => {
    if (cart.items.length === 0) return;
    resetCheckout();
    // Default pickup date = tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setPickupDate(tomorrow.toISOString().slice(0, 10));
    setPickupTime("10:00");
    setDeliveryType("PICKUP");
    setMode("preorder-checkout");
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
            notes: item.notes || undefined,
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
          deliveryType,
          deliveryAddress:
            deliveryType === "DELIVERY" ? deliveryAddress.trim() : null,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        alertError(`Transaksi gagal: ${error}`);
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
        deliveryType,
        deliveryAddress:
          deliveryType === "DELIVERY" ? deliveryAddress.trim() : null,
        pointsEarned: result.pointsEarned ?? 0,
        pointsRedeemed: usePoints ? pointsToRedeem : 0,
        pointsRedemptionAmount,
        businessName: settings.businessName ?? "",
        businessAddress: settings.businessAddress ?? "",
        businessPhone: settings.businessPhone ?? "",
        receiptHeader: settings.receiptHeader ?? "",
        receiptFooter: settings.receiptFooter ?? "",
        businessLogo: settings.logo ?? null,
      });

      cart.removeAll();
      setMode("cart");
      setIsMobileCartOpen(false);
      resetCheckout();
      setIsReceiptOpen(true);
      alertSuccess("Pembayaran berhasil diproses.", "Transaksi Berhasil!");
    } catch {
      alertError("Terjadi kesalahan saat memproses pembayaran.");
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
    deliveryType,
    deliveryAddress,
    pointsRedemptionAmount,
    resetCheckout,
  ]);

  const handleConfirmPreOrder = useCallback(async () => {
    if (
      !selectedCustomer ||
      !pickupDate ||
      (deliveryType === "DELIVERY" && !deliveryAddress.trim()) ||
      preOrderPaymentAmount <= 0
    ) return;
    setLoading(true);
    try {
      const preOrderItems = cart.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: Number(item.price) + (item.modifiers || []).reduce((s, m) => s + m.price, 0),
        notes: item.notes || undefined,
      }));

      const response = await fetch("/api/pre-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          customerName: selectedCustomer.name,
          customerPhone: selectedCustomer.phone,
          customerAddress:
            deliveryType === "DELIVERY" ? deliveryAddress.trim() : null,
          items: preOrderItems,
          pickupDate: `${pickupDate}T${pickupTime}:00`,
          notes,
          deliveryType,
          dpAmount: preOrderPaymentAmount,
          dpMethod: paymentMethod,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        alertError(`Pre-order gagal: ${err}`);
        return;
      }

      cart.removeAll();
      setMode("cart");
      setIsMobileCartOpen(false);
      resetCheckout();
      alertSuccess("Pre-order berhasil dibuat!", "Pre-Order Berhasil");
    } catch {
      alertError("Terjadi kesalahan saat membuat pre-order.");
    } finally {
      setLoading(false);
    }
  }, [
    selectedCustomer,
    pickupDate,
    pickupTime,
    deliveryType,
    deliveryAddress,
    preOrderPaymentAmount,
    paymentMethod,
    cart,
    notes,
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
          onUpdateNotes={(item, notes) => cart.updateNotes(item.id, notes)}
          onClearCart={cart.removeAll}
          onGoToCheckout={handleGoToCheckout}
          hasPreOrderItems={hasPreOrderItems}
          onGoToPreOrder={handleGoToPreOrderCheckout}
        />
      </div>
    ) : mode === "preorder-checkout" ? (
      <div className="flex flex-1 min-h-0 flex-col">
        <PosCheckoutPanel
          items={cart.items}
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
          newCustomerAddress={newCustomerAddress}
          setNewCustomerAddress={setNewCustomerAddress}
          addNewLoading={addNewLoading}
          onAddNewCustomer={handleAddNewCustomer}
          loyaltyInfo={null}
          usePoints={false}
          setUsePoints={() => { }}
          pointsToRedeem={0}
          setPointsToRedeem={() => { }}
          pointsRedemptionAmount={0}
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
          canPay={canCreatePreOrder}
          loading={loading}
          onBackToCart={handleBackToCart}
          onConfirmPayment={handleConfirmPreOrder}
          checkoutMode="preorder"
          pickupDate={pickupDate}
          setPickupDate={setPickupDate}
          pickupTime={pickupTime}
          setPickupTime={setPickupTime}
          deliveryType={deliveryType}
          setDeliveryType={handleDeliveryTypeChange}
          deliveryAddress={deliveryAddress}
          setDeliveryAddress={setDeliveryAddress}
          preOrderPaymentType={preOrderPaymentType}
          setPreOrderPaymentType={setPreOrderPaymentType}
          preOrderDpAmount={preOrderDpAmount}
          setPreOrderDpAmount={setPreOrderDpAmount}
        />
      </div>
    ) : (
      <div className="flex flex-1 min-h-0 flex-col">
        <PosCheckoutPanel
          items={cart.items}
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
          newCustomerAddress={newCustomerAddress}
          setNewCustomerAddress={setNewCustomerAddress}
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
          deliveryType={deliveryType}
          setDeliveryType={handleDeliveryTypeChange}
          deliveryAddress={deliveryAddress}
          setDeliveryAddress={setDeliveryAddress}
        />
      </div>
    );

  return (
    <>
      <div className="flex h-[calc(100svh-60px)] min-h-0 overflow-hidden">
        <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
          {/* Pre-Order shortcut bar */}
          {/* <div className="shrink-0 flex items-center gap-2 px-4 py-2 border-b" style={{ background: "var(--brand-muted, oklch(0.96 0.04 60))" }}>
            <span className="text-xs font-medium" style={{ color: "oklch(0.5 0 0)" }}>Pintasan:</span>
            <button
              type="button"
              onClick={() => setPreOrderOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-colors"
              style={{ background: "var(--brand, oklch(0.68 0.16 55))", color: "#fff" }}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Pre-Order Baru
            </button>
          </div> */}
          <PosProductPanel
            search={search}
            onSearchChange={setSearch}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categories={categories}
            products={filteredProducts}
            onAddToCart={onAddToCart}
          />
        </div>

        {cart.items.length > 0 && (
          <div
            className={`relative hidden lg:flex flex-col h-full min-h-0 transition-all duration-200 ${isCartExpanded ? "w-90 xl:w-100" : "w-14"
              }`}
            style={{ borderLeft: "1px solid var(--border)", background: "oklch(0.99 0.002 80)" }}
          >
            <button
              type="button"
              onClick={() => setIsCartExpanded((prev) => !prev)}
              className="absolute top-3 right-3 z-10 inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors"
              style={{ border: "1px solid var(--border)", background: "white", color: "oklch(0.5 0 0)" }}
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
          className="fixed right-4 bottom-4 z-40 inline-flex h-14 min-w-14 items-center justify-center gap-2 rounded-full px-4 shadow-lg lg:hidden"
          style={{ background: "var(--brand, oklch(0.68 0.16 55))", color: "#fff" }}
          aria-label="Buka keranjang"
        >
          <ShoppingCart className="h-5 w-5" />
          <span className="text-sm font-semibold">{cartItemCount}</span>
        </button>
      )}

      <Sheet open={isMobileCartOpen} onOpenChange={setIsMobileCartOpen}>
        <SheetContent
          side="right"
          className="h-dvh w-screen max-w-none gap-0 p-0 sm:max-w-none lg:hidden"
        >
          <div className="flex h-full min-h-0 flex-col" style={{ background: "oklch(0.99 0.002 80)" }}>
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
      <PosPreOrderDialog
        open={preOrderOpen}
        onOpenChange={setPreOrderOpen}
        availableProducts={products
          .filter((p) => p.category?.name === "Pre-Order" && p.isActive)
          .map((p) => ({ id: p.id, name: p.name, price: p.price, images: p.images }))}
      />
    </>
  );
};
