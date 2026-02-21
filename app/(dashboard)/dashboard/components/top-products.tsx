"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/lib/dashboard-utils";
import type { TopProduct } from "@/lib/types/dashboard";
import { TrendingUp } from "lucide-react";

export function TopProducts() {
  const [products, setProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard/top-products?range=month&limit=10");
      const result = await res.json();
      setProducts(result.data);
    } catch (error) {
      console.error("Failed to fetch top products:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          <CardTitle>Produk Terlaris</CardTitle>
        </div>
        <CardDescription>Top 10 produk bulan ini berdasarkan jumlah terjual</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Belum ada data transaksi
          </p>
        ) : (
          <div className="space-y-3">
            {products.map((product, index) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Badge
                    variant={index === 0 ? "default" : "secondary"}
                    className="text-xs shrink-0"
                  >
                    #{index + 1}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.category}</p>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="font-semibold text-sm">
                    {formatNumber(product.quantitySold)} pcs
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(product.revenue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
