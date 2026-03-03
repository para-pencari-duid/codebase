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
  /** Feature 5: pass true when at least one cart item is a pre-order */
  hasPreOrderItems?: boolean;
  /** Feature 5: callback to open the pre-order dialog */
  onGoToPreOrder?: () => void;
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
  hasPreOrderItems = false,
  onGoToPreOrder,
}: PosCartPanelProps) {
  return (
    <>
      <div className="p-4 border-b bg-white shadow-sm">
        <h2 className="font-semibold flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          Keranjang ({itemCount} item)
        </h2>
        {hasPreOrderItems && (
          <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
            <CalendarClock className="h-3 w-3" />
            Ada produk pre-order di keranjang
          </p>
        )}
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
              className={`flex gap-3 p-3 rounded-lg border shadow-sm ${item.isPreOrder ? "border-amber-200 bg-amber-50/40" : "bg-white"
                }`}
            >
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm line-clamp-1 flex items-center gap-1.5">
                  {item.name}
                  {item.isPreOrder && (
                    <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700">
                      Pre-Order
                    </span>
                  )}
                </h4>
                {item.modifiers && item.modifiers.length > 0 && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {item.modifiers.map((m) => m.optionName).join(", ")}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(
                    Number(item.price) +
                    (item.modifiers || []).reduce((sum, m) => sum + m.price, 0),
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
                  <span className="text-sm w-5 text-center">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    // Feature 6: pre-order items have no stock cap
                    disabled={!item.isPreOrder && item.quantity >= item.stock}
                    onClick={() => onIncreaseQuantity(item)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <span className="text-sm font-semibold">
                  {formatCurrency(
                    (Number(item.price) +
                      (item.modifiers || []).reduce((sum, m) => sum + m.price, 0)) *
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
            {/* Feature 5: disable Pay when cart has pre-order items */}
            <Button
              onClick={onGoToCheckout}
              disabled={items.length === 0 || hasPreOrderItems}
              title={
                hasPreOrderItems
                  ? "Ada produk pre-order — lanjut ke formulir pre-order"
                  : undefined
              }
            >
              Bayar
            </Button>
          </div>
          {/* Feature 5: show pre-order CTA when mixed cart detected */}
          {hasPreOrderItems && onGoToPreOrder ? (
            <Button
              onClick={onGoToPreOrder}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
            >
              <CalendarClock className="mr-2 h-4 w-4" />
              Lanjut ke Pre-Order
            </Button>
          ) : (
            <Link href="/pre-orders">
              <Button
                variant="outline"
                className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <CalendarClock className="mr-2 h-4 w-4" /> Pre-Order
              </Button>
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
