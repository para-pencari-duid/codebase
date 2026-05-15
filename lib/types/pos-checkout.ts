import type { CartItemModifier } from "@/hooks/use-cart";

export type PosPaymentMethod =
  | "CASH"
  | "TRANSFER"
  | "QRIS"
  | "DEBIT_CARD"
  | "CREDIT_CARD"
  | "EWALLET";

export interface PosPaymentMethodOption {
  value: PosPaymentMethod;
  label: string;
}

export interface PosCustomer {
  id: string;
  name: string;
  phone: string;
  address?: string | null;
}

export interface PosLoyaltyInfo {
  enabled: boolean;
  points: number;
  pointValue: number;
  pointsPerRupiah: number;
}

export interface PosReceiptItem {
  productName: string;
  quantity: number;
  price: number;
  discount: number;
  subtotal: number;
  modifiers?: CartItemModifier[];
}

export interface PosReceiptData {
  transactionNo: string;
  createdAt: string;
  cashierName: string;
  customerName?: string;
  items: PosReceiptItem[];
  subtotal: number;
  tax: number;
  taxRate: number;
  taxIncluded: boolean;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentAmount: number;
  changeAmount: number;
  deliveryType?: "PICKUP" | "DELIVERY" | string | null;
  deliveryAddress?: string | null;
  pointsEarned?: number;
  pointsRedeemed?: number;
  pointsRedemptionAmount?: number;
  businessName: string;
  businessAddress?: string | null;
  businessPhone?: string | null;
  receiptHeader?: string | null;
  receiptFooter?: string | null;
  businessLogo?: string | null;
}
