"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/dashboard-utils";
import { TrendingDown, TrendingUp, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ExpenseSummary {
  totalExpenses: number;
  totalCount: number;
  categoryBreakdown: {
    category: string;
    amount: number;
    count: number;
    percentage: number;
  }[];
  changePercentage: number;
}

interface RevenueSummary {
  todayRevenue: number;
  revenueChange: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  SALARY: "Gaji",
  UTILITIES: "Utilitas",
  RAW_MATERIALS: "Bahan Baku",
  SUPPLIES: "Perlengkapan",
  RENT: "Sewa",
  MAINTENANCE: "Perawatan",
  MARKETING: "Marketing",
  TRANSPORTATION: "Transportasi",
  TAX_FEE: "Pajak & Admin",
  OTHER: "Lain-lain",
};

const CATEGORY_COLORS: Record<string, string> = {
  SALARY: "bg-blue-500",
  UTILITIES: "bg-yellow-500",
  RAW_MATERIALS: "bg-green-500",
  SUPPLIES: "bg-purple-500",
  RENT: "bg-red-500",
  MAINTENANCE: "bg-orange-500",
  MARKETING: "bg-pink-500",
  TRANSPORTATION: "bg-cyan-500",
  TAX_FEE: "bg-indigo-500",
  OTHER: "bg-gray-500",
};

export function ExpenseAnalytics() {
  const [expenses, setExpenses] = useState<ExpenseSummary | null>(null);
  const [revenue, setRevenue] = useState<RevenueSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [expensesRes, revenueRes] = await Promise.all([
        fetch("/api/expenses/summary?range=month"),
        fetch("/api/dashboard/stats"),
      ]);

      if (expensesRes.ok) {
        const data = await expensesRes.json();
        setExpenses(data);
      }

      if (revenueRes.ok) {
        const data = await revenueRes.json();
        setRevenue({
          todayRevenue: data.todayRevenue || 0,
          revenueChange: data.revenueChange || 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch expense analytics:", error);
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
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!expenses) return null;

  // Calculate profit/loss
  const monthlyRevenue = revenue?.todayRevenue || 0;
  const monthlyExpenses = expenses.totalExpenses;
  const profitLoss = monthlyRevenue - monthlyExpenses;
  const profitMargin = monthlyRevenue > 0 ? (profitLoss / monthlyRevenue) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <CardTitle>Analisis Pengeluaran</CardTitle>
            </div>
            <CardDescription>Ringkasan pengeluaran 30 hari terakhir</CardDescription>
          </div>
          <Link href="/expenses">
            <Button variant="outline" size="sm">
              Lihat Detail
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Expenses */}
        <div className="p-4 border rounded-lg bg-red-50/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Pengeluaran</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(expenses.totalExpenses)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {expenses.totalCount} transaksi
              </p>
            </div>
            <div className="text-right">
              <div
                className={`flex items-center gap-1 text-sm ${
                  expenses.changePercentage >= 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                {expenses.changePercentage >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span className="font-semibold">
                  {expenses.changePercentage >= 0 ? "+" : ""}
                  {expenses.changePercentage.toFixed(1)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">vs bulan lalu</p>
            </div>
          </div>
        </div>

        {/* Profit/Loss Indicator */}
        {monthlyRevenue > 0 && (
          <div className={`p-4 border rounded-lg ${profitLoss >= 0 ? 'bg-green-50/50' : 'bg-orange-50/50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Laba/Rugi Bersih</p>
                <p className={`text-2xl font-bold ${profitLoss >= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                  {formatCurrency(Math.abs(profitLoss))}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Margin: {profitMargin.toFixed(1)}%
                </p>
              </div>
              {profitLoss < 0 && (
                <AlertCircle className="h-8 w-8 text-orange-600" />
              )}
            </div>
          </div>
        )}

        {/* Top Categories */}
        {expenses.categoryBreakdown.length > 0 && (
          <>
            <div className="pt-2">
              <h4 className="text-sm font-semibold mb-3">Kategori Terbanyak</h4>
              <div className="space-y-3">
                {expenses.categoryBreakdown.slice(0, 5).map((cat) => (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            CATEGORY_COLORS[cat.category] || "bg-gray-500"
                          }`}
                        />
                        <span className="font-medium">
                          {CATEGORY_LABELS[cat.category] || cat.category}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {cat.count}x
                        </Badge>
                      </div>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(cat.amount)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          CATEGORY_COLORS[cat.category] || "bg-gray-500"
                        }`}
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground text-right">
                      {cat.percentage.toFixed(1)}% dari total
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {expenses.categoryBreakdown.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">Belum ada pengeluaran bulan ini</p>
            <Link href="/expenses">
              <Button variant="link" size="sm" className="mt-2">
                Tambah Pengeluaran
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
