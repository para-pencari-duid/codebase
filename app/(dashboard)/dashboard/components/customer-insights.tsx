"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/lib/dashboard-utils";
import type { CustomerInsight } from "@/lib/types/dashboard";
import { Users, UserPlus, UserCheck, DollarSign } from "lucide-react";

export function CustomerInsights() {
  const [data, setData] = useState<CustomerInsight | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard/customers?range=month");
      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error("Failed to fetch customer insights:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-600" />
          <CardTitle>Insight Pelanggan</CardTitle>
        </div>
        <CardDescription>Analisis pelanggan bulan ini</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 border rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              <span className="text-xs">Total Pelanggan</span>
            </div>
            <p className="text-2xl font-bold">{formatNumber(data.totalCustomers)}</p>
          </div>
          <div className="p-3 border rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <UserPlus className="h-4 w-4" />
              <span className="text-xs">Pelanggan Baru</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{formatNumber(data.newCustomers)}</p>
          </div>
          <div className="p-3 border rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <UserCheck className="h-4 w-4" />
              <span className="text-xs">Repeat Customer</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{formatNumber(data.returningCustomers)}</p>
          </div>
          <div className="p-3 border rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs">Rata-rata</span>
            </div>
            <p className="text-lg font-bold">{formatCurrency(data.averageOrderValue)}</p>
          </div>
        </div>

        {/* Top Customers */}
        {data.topCustomers.length > 0 && (
          <>
            <div className="pt-2">
              <h4 className="text-sm font-semibold mb-3">Top 5 Pelanggan</h4>
              <div className="space-y-2">
                {data.topCustomers.map((customer, index) => (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Badge
                        variant={index === 0 ? "default" : "outline"}
                        className="text-xs shrink-0"
                      >
                        #{index + 1}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {customer.phone || "No phone"} • {customer.orderCount} transaksi
                        </p>
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <p className="font-semibold text-sm text-green-600">
                        {formatCurrency(customer.totalSpent)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
