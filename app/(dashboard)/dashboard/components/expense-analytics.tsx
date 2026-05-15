"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/dashboard-utils";
import { TrendingDown, TrendingUp, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ExpenseCategoryComparison {
  category: string;
  amount: number;
  count: number;
  previousAmount: number;
  previousCount: number;
  changeAmount: number;
  changePercentage: number;
  percentage: number;
}

interface ExpenseSummary {
  totalExpenses: number;
  totalCount: number;
  currentTotal: number;
  currentCount: number;
  previousTotal: number;
  previousCount: number;
  changeAmount: number;
  currentLabel: string;
  previousLabel: string;
  categoryBreakdown: ExpenseCategoryComparison[];
  changePercentage: number;
  insights: {
    topCategory: ExpenseCategoryComparison | null;
    largestIncrease: ExpenseCategoryComparison | null;
    biggestSaving: ExpenseCategoryComparison | null;
    trend: "up" | "down" | "flat";
  };
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const expensesRes = await fetch("/api/expenses/summary?range=month");

      if (expensesRes.ok) {
        const data = await expensesRes.json();
        setExpenses(data);
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

  const isUp = expenses.changeAmount > 0;
  const isDown = expenses.changeAmount < 0;
  const insightTone = isUp
    ? "border-red-200 bg-red-50/70 text-red-800"
    : isDown
      ? "border-green-200 bg-green-50/70 text-green-800"
      : "border-gray-200 bg-gray-50 text-gray-700";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <CardTitle>Insight Pengeluaran</CardTitle>
            </div>
            <CardDescription>
              Perbandingan {expenses.currentLabel} dengan {expenses.previousLabel}
            </CardDescription>
          </div>
          <Link href="/expenses">
            <Button variant="outline" size="sm">
              Lihat Detail
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-red-50/50 p-3">
            <p className="text-xs font-medium text-muted-foreground">
              Bulan Ini
            </p>
            <p className="mt-1 text-xl font-bold text-red-600">
              {formatCurrency(expenses.currentTotal)}
            </p>
            <p className="text-xs text-muted-foreground">
              {expenses.currentCount} transaksi
            </p>
          </div>
          <div className="rounded-lg border bg-gray-50 p-3">
            <p className="text-xs font-medium text-muted-foreground">
              Bulan Lalu
            </p>
            <p className="mt-1 text-xl font-bold text-gray-800">
              {formatCurrency(expenses.previousTotal)}
            </p>
            <p className="text-xs text-muted-foreground">
              {expenses.previousCount} transaksi
            </p>
          </div>
          <div className="rounded-lg border bg-white p-3">
            <p className="text-xs font-medium text-muted-foreground">Selisih</p>
            <div
              className={`mt-1 flex items-center gap-1 text-xl font-bold ${
                isUp ? "text-red-600" : isDown ? "text-green-600" : "text-gray-700"
              }`}
            >
              {isUp ? (
                <TrendingUp className="h-4 w-4" />
              ) : isDown ? (
                <TrendingDown className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              {formatCurrency(Math.abs(expenses.changeAmount))}
            </div>
            <p className="text-xs text-muted-foreground">
              {isUp ? "+" : isDown ? "-" : ""}
              {Math.abs(expenses.changePercentage).toFixed(1)}% vs bulan lalu
            </p>
          </div>
        </div>

        <div className={`rounded-lg border p-3 text-sm ${insightTone}`}>
          {isUp
            ? `Pengeluaran naik ${formatCurrency(expenses.changeAmount)} dari bulan lalu.`
            : isDown
              ? `Pengeluaran lebih hemat ${formatCurrency(Math.abs(expenses.changeAmount))} dari bulan lalu.`
              : "Pengeluaran bulan ini sama dengan bulan lalu."}
          {expenses.insights.largestIncrease && (
            <span className="block mt-1 text-xs">
              Kenaikan terbesar:{" "}
              {CATEGORY_LABELS[expenses.insights.largestIncrease.category] ||
                expenses.insights.largestIncrease.category}{" "}
              ({formatCurrency(expenses.insights.largestIncrease.changeAmount)}).
            </span>
          )}
        </div>

        {/* Top Categories */}
        {expenses.categoryBreakdown.length > 0 && (
          <>
            <div className="pt-2">
              <h4 className="text-sm font-semibold mb-3">
                Kategori Pengeluaran
              </h4>
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
                      <div className="text-right">
                        <span className="block font-semibold text-red-600">
                          {formatCurrency(cat.amount)}
                        </span>
                        <span
                          className={`text-xs ${
                            cat.changeAmount > 0
                              ? "text-red-600"
                              : cat.changeAmount < 0
                                ? "text-green-600"
                                : "text-muted-foreground"
                          }`}
                        >
                          {cat.changeAmount > 0
                            ? "+"
                            : cat.changeAmount < 0
                              ? "-"
                              : ""}
                          {formatCurrency(Math.abs(cat.changeAmount))}
                        </span>
                      </div>
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
