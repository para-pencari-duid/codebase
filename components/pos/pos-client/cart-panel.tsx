import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Trash, Minus, Plus, CalendarClock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { CartItem } from "@/hooks/use-cart";

interface PosCartPanelProps {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  tax: number;
  taxRate: number;
  taxIncluded: boolean;
  onDecreaseQuantity: (item: CartItem) => void;
  onIncreaseQuantity: (item: CartItem) => void;
  onUpdateNotes: (item: CartItem, notes: string) => void;
  onClearCart: () => void;
  onGoToCheckout: () => void;
}

export function PosCartPanel({
  items,
  itemCount,
  subtotal,
  tax,
  taxRate,
  taxIncluded,
  onDecreaseQuantity,
  onIncreaseQuantity,
  onUpdateNotes,
  onClearCart,
  onGoToCheckout,
}: PosCartPanelProps) {
  return (
    <>
      <div className="p-4 border-b bg-white shadow-sm">
        <h2 className="font-semibold flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          Keranjang ({itemCount} item)
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
            <ShoppingCart className="h-12 w-12 opacity-20" />
            <p>Keranjang kosong</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex gap-3 p-3 bg-white rounded-lg border shadow-sm"
            >
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm line-clamp-1">
                  {item.name}
                </h4>
                {item.modifiers && item.modifiers.length > 0 && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {item.modifiers
                      .map((modifier) => modifier.optionName)
                      .join(", ")}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(
                    Number(item.price) +
                      (item.modifiers || []).reduce(
                        (sum, modifier) => sum + modifier.price,
                        0,
                      ),
                  )}
                </p>
                <input
                  type="text"
                  placeholder="Catatan item..."
                  value={item.notes || ""}
                  onChange={(e) => onUpdateNotes(item, e.target.value)}
                  className="mt-1 w-full text-xs border rounded px-2 py-1 text-gray-600 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onDecreaseQuantity(item)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-sm w-5 text-center">
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    disabled={item.quantity >= item.stock}
                    onClick={() => onIncreaseQuantity(item)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <span className="text-sm font-semibold">
                  {formatCurrency(
                    (Number(item.price) +
                      (item.modifiers || []).reduce(
                        (sum, modifier) => sum + modifier.price,
                        0,
                      )) *
                      item.quantity,
                  )}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 bg-white border-t space-y-4">
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {taxIncluded && (
            <div className="flex justify-between text-muted-foreground">
              <span>Pajak ({taxRate}%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>{formatCurrency(subtotal + tax)}</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={onClearCart}
              disabled={items.length === 0}
            >
              <Trash className="mr-2 h-4 w-4" /> Batal
            </Button>
            <Button onClick={onGoToCheckout} disabled={items.length === 0}>
              Bayar
            </Button>
          </div>
          <Link href="/pre-orders">
            <Button
              variant="outline"
              className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <CalendarClock className="mr-2 h-4 w-4" /> Pre-Order
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}
