import { formatCurrency } from "@/lib/utils";
import type { CartItem } from "@/hooks/use-cart";

interface OrderSummarySectionProps {
  items: CartItem[];
}

export function OrderSummarySection({ items }: OrderSummarySectionProps) {
  return (
    <div className="space-y-2 text-sm">
      <h3 className="font-semibold">Ringkasan Pesanan</h3>
      <div className="bg-slate-50 rounded-lg p-3 space-y-1 max-h-32 overflow-y-auto">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between">
            <span>
              {item.quantity}x {item.name}
            </span>
            <span>{formatCurrency(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
