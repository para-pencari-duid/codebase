import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2, Tag, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface AppliedPromo {
  id: string;
  name: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  discountAmount: number;
}

interface PromoDiscountSectionProps {
  promoCode: string;
  setPromoCode: (value: string) => void;
  promoLoading: boolean;
  appliedPromo: AppliedPromo | null;
  setAppliedPromo: (value: AppliedPromo | null) => void;
  discountInput: number;
  setDiscountInput: (value: number) => void;
  discountType: "amount" | "percent";
  setDiscountType: (value: "amount" | "percent") => void;
  onApplyPromo: () => Promise<void>;
}

export function PromoDiscountSection({
  promoCode,
  setPromoCode,
  promoLoading,
  appliedPromo,
  setAppliedPromo,
  discountInput,
  setDiscountInput,
  discountType,
  setDiscountType,
  onApplyPromo,
}: PromoDiscountSectionProps) {
  return (
    <>
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Tag className="h-4 w-4" />
          Kode Promo
        </Label>
        {appliedPromo ? (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-green-800 text-sm">
                {appliedPromo.name}
              </p>
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
              onClick={() => {
                setAppliedPromo(null);
                setPromoCode("");
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              placeholder="Masukkan kode promo..."
              value={promoCode}
              onChange={(event) =>
                setPromoCode(event.target.value.toUpperCase())
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void onApplyPromo();
                }
              }}
            />
            <Button
              variant="outline"
              onClick={() => void onApplyPromo()}
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

      {!appliedPromo && (
        <div className="space-y-2">
          <Label>Diskon Manual</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="0"
              value={discountInput || ""}
              onChange={(event) => setDiscountInput(Number(event.target.value))}
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
    </>
  );
}

export type { AppliedPromo };
