import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Gift, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface AppliedPromo {
  id: string;
  name: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  discountAmount: number;
}

interface TotalActionsSectionProps {
  subtotal: number;
  tax: number;
  calculatedDiscount: number;
  pointsRedemptionAmount: number;
  pointsToRedeem: number;
  appliedPromo: AppliedPromo | null;
  finalTotal: number;
  splitMode: boolean;
  payments: Array<{ method: string; amount: number }>;
  totalPaid: number;
  changeAmount: number;
  canPay: boolean;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

export function TotalActionsSection({
  subtotal,
  tax,
  calculatedDiscount,
  pointsRedemptionAmount,
  pointsToRedeem,
  appliedPromo,
  finalTotal,
  splitMode,
  payments,
  totalPaid,
  changeAmount,
  canPay,
  loading,
  onCancel,
  onConfirm,
}: TotalActionsSectionProps) {
  return (
    <>
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
        {!splitMode &&
          payments[0]?.method === "CASH" &&
          payments[0].amount > 0 && (
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

      <div className="flex gap-2 pt-2">
        <Button variant="outline" className="flex-1" onClick={onCancel}>
          Batal
        </Button>
        <Button
          className="flex-1"
          disabled={!canPay || loading}
          onClick={() => void onConfirm()}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Konfirmasi Pembayaran
        </Button>
      </div>
    </>
  );
}
