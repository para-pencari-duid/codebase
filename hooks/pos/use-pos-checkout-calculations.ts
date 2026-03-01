import type { CartItem } from "@/hooks/use-cart";
import type { PosBusinessSettings } from "@/lib/types/pos";
import type {
  PosLoyaltyInfo,
  PosPaymentMethod,
} from "@/lib/types/pos-checkout";

interface UsePosCheckoutCalculationsParams {
  cartItems: CartItem[];
  settings: PosBusinessSettings;
  discountType: "amount" | "percent";
  discountInput: number;
  usePoints: boolean;
  pointsToRedeem: number;
  loyaltyInfo: PosLoyaltyInfo | null;
  paymentMethod: PosPaymentMethod;
  paymentAmount: number;
}

export function usePosCheckoutCalculations({
  cartItems,
  settings,
  discountType,
  discountInput,
  usePoints,
  pointsToRedeem,
  loyaltyInfo,
  paymentMethod,
  paymentAmount,
}: UsePosCheckoutCalculationsParams) {
  const subtotal = cartItems.reduce((sum, item) => {
    const modPrice = (item.modifiers || []).reduce(
      (acc, modifier) => acc + modifier.price,
      0,
    );
    return sum + (Number(item.price) + modPrice) * item.quantity;
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
          Math.max(0, subtotal + tax - manualDiscount),
        )
      : 0;

  const finalTotal = Math.max(
    0,
    subtotal + tax - manualDiscount - pointsRedemptionAmount,
  );

  const changeAmount =
    paymentMethod === "CASH" ? Math.max(0, paymentAmount - finalTotal) : 0;

  return {
    subtotal,
    tax,
    manualDiscount,
    pointsRedemptionAmount,
    finalTotal,
    changeAmount,
  };
}
