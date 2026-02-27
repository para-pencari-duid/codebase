import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    <div className="flex-1 min-h-0 flex flex-col py-4 px-10 gap-4 overflow-hidden">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari produk (Nama / SKU)..."
            className="pl-8"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>

        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-full md:w-[180px]">
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

      <ScrollArea className="flex-1 min-h-0 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
          {products.map((product) => (
            <Card
              key={product.id}
              className="cursor-pointer hover:border-primary transition-colors flex flex-col justify-between"
              onClick={() => onAddToCart(product)}
            >
              <CardContent className="p-4 flex flex-col gap-2 h-full">
                <div className="aspect-square bg-slate-100 rounded-md flex items-center justify-center text-4xl mb-2">
                  {product.category?.icon || "📦"}
                </div>
                <div>
                  <h3 className="font-semibold text-sm line-clamp-2">
                    {product.name}
                  </h3>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm font-bold">
                      {formatCurrency(Number(product.price))}
                    </span>
                    <Badge
                      variant={
                        product.stock > 10
                          ? "outline"
                          : product.stock > 0
                            ? "secondary"
                            : "destructive"
                      }
                      className="text-[10px] px-1"
                    >
                      {product.stock > 0 ? `Stok: ${product.stock}` : "Habis"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {products.length === 0 && (
            <div className="col-span-full text-center py-10 text-muted-foreground">
              Tidak ada produk ditemukan.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
