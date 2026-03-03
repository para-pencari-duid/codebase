import { formatCurrency } from "@/lib/utils";
import type { CartItem } from "@/hooks/use-cart";

interface OrderSummarySectionProps {
  items: CartItem[];
}

export function OrderSummarySection({ items }: OrderSummarySectionProps) {
  return (
    <div className="space-y-2 text-sm">
      <h3 className="font-semibold">Ringkasan Pesanan</h3>
      <div className="bg-slate-50 rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
        {items.map((item) => {
          const modifierTotal = (item.modifiers ?? []).reduce((s, m) => s + m.price, 0);
          const unitTotal = (item.price + modifierTotal) * item.quantity;
          return (
            <div key={item.id} className="space-y-0.5">
              <div className="flex justify-between gap-2">
                <span className="flex-1 font-medium">
                  {item.quantity}x {item.name}
                </span>
                <span className="shrink-0">{formatCurrency(unitTotal)}</span>
              </div>
              {item.modifiers && item.modifiers.length > 0 && (
                <div className="pl-4 space-y-0.5">
                  {item.modifiers.map((mod, i) => (
                    <div key={i} className="flex justify-between text-xs text-muted-foreground">
                      <span>+ {mod.optionName}</span>
                      {mod.price > 0 && (
                        <span>+{formatCurrency(mod.price * item.quantity)}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {item.notes && (
                <p className="pl-4 text-xs text-amber-700 italic">
                  📝 {item.notes}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
