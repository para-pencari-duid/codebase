"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/dashboard-utils";
import type { SalesByCategory } from "@/lib/types/dashboard";
import { LayoutGrid } from "lucide-react";

// Default colors for pie chart
const COLORS = [
  "#10b981", // green
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
];

export function SalesByCategory() {
  const [data, setData] = useState<SalesByCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard/sales-by-category?range=month");
      const result = await res.json();
      setData(result.data);
    } catch (error) {
      console.error("Failed to fetch sales by category:", error);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-semibold text-sm mb-1">{data.category}</p>
          <p className="text-sm text-green-600">
            Pendapatan: {formatCurrency(data.revenue)}
          </p>
          <p className="text-sm text-muted-foreground">
            {data.percentage.toFixed(1)}% dari total
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {data.transactions} transaksi
          </p>
        </div>
      );
    }
    return null;
  };

  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex flex-wrap gap-2 justify-center mt-4">
        {payload.map((entry: any, index: number) => (
          <div
            key={`legend-${index}`}
            className="flex items-center gap-2 text-xs"
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span>{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-blue-600" />
          <CardTitle>Penjualan per Kategori</CardTitle>
        </div>
        <CardDescription>Distribusi pendapatan bulan ini berdasarkan kategori produk</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Belum ada data penjualan
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                dataKey="revenue"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(entry: any) => `${entry.percent ? (entry.percent * 100).toFixed(0) : 0}%`}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color || COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={renderLegend} />
            </PieChart>
          </ResponsiveContainer>
        )}
        {!loading && data.length > 0 && (
          <div className="mt-4 pt-4 border-t space-y-2">
            {data.slice(0, 3).map((cat) => (
              <div key={cat.category} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{cat.category}</span>
                <span className="font-semibold">{formatCurrency(cat.revenue)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
