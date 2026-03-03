import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { PosCategory, PosProduct } from "@/lib/types/pos";
import Image from "next/image";

interface PosProductPanelProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  categories: PosCategory[];
  products: PosProduct[];
  onAddToCart: (product: PosProduct) => void;
}

export function PosProductPanel({
  search,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  products,
  onAddToCart,
}: PosProductPanelProps) {
  return (
    <div className="flex-1 min-h-0 flex flex-col py-3 px-4 lg:px-6 gap-3 overflow-hidden">
      {/* Search + category filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cari produk (Nama / SKU)..."
            className="pl-9 h-9 bg-white border-gray-200 text-sm"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>

        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="h-9 w-full sm:w-45 text-sm border-gray-200 bg-white">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 pb-4">
          {products.map((product) => {
            const isPreOrder = product.orderType === "PRE_ORDER";
            const thumbUrl =
              product.images && product.images.length > 0
                ? product.images[0]
                : null;
            const stockOk = product.stock > 10;
            const stockLow = product.stock > 0 && product.stock <= 10;

            return (
              <div
                key={product.id}
                onClick={() => onAddToCart(product)}
                className="group cursor-pointer rounded-xl border bg-white overflow-hidden transition-all duration-150 hover:shadow-md active:scale-[0.98]"
                style={{
                  borderColor: isPreOrder ? "oklch(0.85 0.08 55)" : "var(--border)",
                  boxShadow: "0 1px 3px oklch(0 0 0 / 6%)",
                }}
              >
                {/* Thumbnail */}
                <div className="relative aspect-square overflow-hidden" style={{ background: "oklch(0.97 0.002 80)" }}>
                  {thumbUrl ? (
                    <Image
                      src={thumbUrl}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="text-3xl font-bold select-none" style={{ color: "oklch(0.80 0.002 80)" }}>
                        {product.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/* Jenis Pesanan badge — top-left */}
                  {isPreOrder ? (
                    <span
                      className="absolute top-1.5 left-1.5 rounded-md px-1.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wide leading-none"
                      style={{ background: "oklch(0.65 0.17 55)" }}
                    >
                      Pre-Order
                    </span>
                  ) : (
                    <span
                      className="absolute top-1.5 left-1.5 rounded-md px-1.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wide leading-none"
                      style={{ background: "oklch(0.55 0.14 145)" }}
                    >
                      Ready
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-2.5">
                  <p className="text-xs font-semibold leading-tight line-clamp-2 text-gray-800 mb-1">
                    {product.name}
                  </p>

                  {/* Kategori label */}
                  {product.category && (
                    <p className="text-[10px] text-gray-400 mb-1.5 leading-none truncate">
                      {product.category.name}
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm font-bold" style={{ color: "var(--brand, oklch(0.68 0.16 55))" }}>
                      {formatCurrency(Number(product.price))}
                    </span>

                    {/* Stok — hanya untuk produk Ready */}
                    {!isPreOrder && (
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none"
                        style={{
                          background: stockOk
                            ? "oklch(0.94 0.06 145)"
                            : stockLow
                              ? "oklch(0.96 0.08 70)"
                              : "oklch(0.95 0.05 25)",
                          color: stockOk
                            ? "oklch(0.4 0.1 145)"
                            : stockLow
                              ? "oklch(0.5 0.12 70)"
                              : "oklch(0.5 0.15 25)",
                        }}
                      >
                        {product.stock > 0 ? `${product.stock}` : "Habis"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {products.length === 0 && (
            <div className="col-span-full text-center py-16 text-gray-400 text-sm">
              Tidak ada produk ditemukan.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
