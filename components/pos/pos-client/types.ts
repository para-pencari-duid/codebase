import type { LucideIcon } from "lucide-react";
import type { PosPaymentMethod } from "@/lib/types/pos-checkout";

export interface PosPaymentMethodUiOption {
  value: PosPaymentMethod;
  label: string;
  icon: LucideIcon;
}
