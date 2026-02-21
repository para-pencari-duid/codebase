"use client";

import { useEffect, useState } from "react";
import { DollarSign, ShoppingCart, Users, AlertTriangle } from "lucide-react";
import { StatsCard } from "./stats-card";
import type { QuickStats } from "@/lib/types/dashboard";
import { Skeleton } from "@/components/ui/skeleton";

export function StatsCards() {
  const [stats, setStats] = useState<QuickStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard/stats");
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-[120px]" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Pendapatan Hari Ini"
        value={stats.todayRevenue}
        change={stats.revenueChange}
        icon={DollarSign}
        format="currency"
        iconColor="text-green-600"
      />
      <StatsCard
        title="Transaksi Hari Ini"
        value={stats.todayTransactions}
        change={stats.transactionsChange}
        icon={ShoppingCart}
        iconColor="text-blue-600"
      />
      <StatsCard
        title="Pelanggan Hari Ini"
        value={stats.todayCustomers}
        change={stats.customersChange}
        icon={Users}
        iconColor="text-purple-600"
      />
      <StatsCard
        title="Stok Menipis"
        value={stats.lowStockCount}
        icon={AlertTriangle}
        iconColor="text-orange-600"
        subtitle={
          stats.bestSellingProduct
            ? `Terlaris: ${stats.bestSellingProduct.name}`
            : undefined
        }
      />
    </div>
  );
}
