"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { CartItem } from "@/hooks/use-cart";
import { usePosCustomer } from "@/hooks/pos/use-pos-customer";
import { usePosLoyalty } from "@/hooks/pos/use-pos-loyalty";
import { toast } from "sonner";
import { OrderSummarySection } from "@/components/pos/checkout-dialog/order-summary-section";
import { CustomerLoyaltySection } from "@/components/pos/checkout-dialog/customer-loyalty-section";
import {
  PromoDiscountSection,
  type AppliedPromo,
} from "@/components/pos/checkout-dialog/promo-discount-section";
import { PaymentSection } from "@/components/pos/checkout-dialog/payment-section";
import { TotalActionsSection } from "@/components/pos/checkout-dialog/total-actions-section";

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

export function CheckoutDialog({
  open,
  onOpenChange,
  items,
  subtotal,
  tax,
  discount,
  onConfirm,
}: CheckoutDialogProps) {
  // ── Customer ─────────────────────────────────────────────────────────────
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

  // ── Promo ─────────────────────────────────────────────────────────────────
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);
  const [discountInput, setDiscountInput] = useState<number>(discount);
  const [discountType, setDiscountType] = useState<"amount" | "percent">(
    "amount",
  );

  // ── Loyalty ───────────────────────────────────────────────────────────────
  const [usePoints, setUsePoints] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const { loyaltyInfo, resetLoyalty } = usePosLoyalty(
    selectedCustomer?.id ?? null,
  );

  // ── Payments (split bill) ─────────────────────────────────────────────────
  const [splitMode, setSplitMode] = useState(false);
  const [payments, setPayments] = useState<PaymentLine[]>([
    { id: "1", method: "CASH", amount: 0 },
  ]);

  // ── Misc ──────────────────────────────────────────────────────────────────
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  // ─── Calculated values ────────────────────────────────────────────────────
  const manualDiscount =
    discountType === "percent"
      ? (subtotal * discountInput) / 100
      : discountInput;
  const calculatedDiscount = appliedPromo
    ? appliedPromo.discountAmount
    : manualDiscount;
  const pointsRedemptionAmount = usePoints
    ? Math.min(
        pointsToRedeem * (loyaltyInfo?.pointValue ?? 1),
        subtotal + tax - calculatedDiscount,
      )
    : 0;
  const finalTotal = Math.max(
    0,
    subtotal + tax - calculatedDiscount - pointsRedemptionAmount,
  );
  const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const cashPaid = payments
    .filter((p) => p.method === "CASH")
    .reduce((s, p) => s + p.amount, 0);
  const changeAmount = Math.max(
    0,
    cashPaid - (finalTotal - (totalPaid - cashPaid)),
  );
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
      resetCustomerState();
      resetLoyalty();
      setUsePoints(false);
      setPointsToRedeem(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ─── Auto-fill single payment amount ─────────────────────────────────────
  useEffect(() => {
    if (!splitMode) {
      setPayments((prev) => [{ ...prev[0], amount: finalTotal }]);
    }
  }, [finalTotal, splitMode]);

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
        setDiscountInput(0);
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

  // ─── QRIS helpers ─────────────────────────────────────────────────────────
  const generateQrForLine = useCallback(
    async (lineId: string, amount: number) => {
      if (amount <= 0) return;
      setPayments((prev) =>
        prev.map((p) =>
          p.id === lineId ? { ...p, qrLoading: true, qrCode: undefined } : p,
        ),
      );
      try {
        const res = await fetch("/api/qris/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount }),
        });
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          toast.error(err.error || "QRIS belum diatur di Pengaturan");
          setPayments((prev) =>
            prev.map((p) => (p.id === lineId ? { ...p, qrLoading: false } : p)),
          );
          return;
        }
        const data = await res.json();
        setPayments((prev) =>
          prev.map((p) =>
            p.id === lineId
              ? { ...p, qrCode: data.qrCode, qrLoading: false }
              : p,
          ),
        );
      } catch {
        setPayments((prev) =>
          prev.map((p) => (p.id === lineId ? { ...p, qrLoading: false } : p)),
        );
      }
    },
    [],
  );

  // ─── Payment-line helpers ─────────────────────────────────────────────────
  const updatePaymentMethod = (lineId: string, method: string) => {
    setPayments((prev) =>
      prev.map((p) =>
        p.id !== lineId
          ? p
          : { ...p, method, qrCode: undefined, qrLoading: false },
      ),
    );
  };
  const updatePaymentAmount = (lineId: string, amount: number) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === lineId ? { ...p, amount } : p)),
    );
  };
  const addPaymentLine = () => {
    const remaining = Math.max(0, finalTotal - totalPaid);
    setPayments((prev) => [
      ...prev,
      { id: Date.now().toString(), method: "CASH", amount: remaining },
    ]);
  };
  const removePaymentLine = (lineId: string) => {
    setPayments((prev) => prev.filter((p) => p.id !== lineId));
  };

  const handleConfirm = async () => {
    if (!canPay || !selectedCustomer) return;
    setLoading(true);
    try {
      await onConfirm({
        payments: payments.map((p) => ({
          id: p.id,
          method: p.method,
          amount: p.amount,
        })),
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

        <OrderSummarySection items={items} />

        <Separator />

        <CustomerLoyaltySection
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
          subtotal={subtotal}
          tax={tax}
          calculatedDiscount={calculatedDiscount}
        />

        <Separator />

        <PromoDiscountSection
          promoCode={promoCode}
          setPromoCode={setPromoCode}
          promoLoading={promoLoading}
          appliedPromo={appliedPromo}
          setAppliedPromo={setAppliedPromo}
          discountInput={discountInput}
          setDiscountInput={setDiscountInput}
          discountType={discountType}
          setDiscountType={setDiscountType}
          onApplyPromo={handleApplyPromo}
        />

        <PaymentSection
          splitMode={splitMode}
          onToggleSplitMode={(value) => {
            setSplitMode(value);
            if (!value) {
              setPayments([
                {
                  id: "1",
                  method: payments[0]?.method ?? "CASH",
                  amount: finalTotal,
                },
              ]);
            }
          }}
          payments={payments}
          finalTotal={finalTotal}
          totalPaid={totalPaid}
          onUpdatePaymentMethod={updatePaymentMethod}
          onUpdatePaymentAmount={updatePaymentAmount}
          onAddPaymentLine={addPaymentLine}
          onRemovePaymentLine={removePaymentLine}
          onGenerateQrForLine={generateQrForLine}
        />

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

        <TotalActionsSection
          subtotal={subtotal}
          tax={tax}
          calculatedDiscount={calculatedDiscount}
          pointsRedemptionAmount={pointsRedemptionAmount}
          pointsToRedeem={pointsToRedeem}
          appliedPromo={appliedPromo}
          finalTotal={finalTotal}
          splitMode={splitMode}
          payments={payments}
          totalPaid={totalPaid}
          changeAmount={changeAmount}
          canPay={canPay}
          loading={loading}
          onCancel={() => onOpenChange(false)}
          onConfirm={handleConfirm}
        />
      </DialogContent>
    </Dialog>
  );
}
