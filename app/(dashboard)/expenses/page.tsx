"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { formatCurrency, formatNumber } from "@/lib/dashboard-utils";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Plus,
  Pencil,
  Trash2,
  FileText,
  TrendingDown,
  Filter,
} from "lucide-react";
import { alertSuccess, alertError, confirmDestroy } from "@/lib/swal";

interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  paymentMethod: string;
  reference?: string;
  notes?: string;
}

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

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "Cash",
  TRANSFER: "Transfer",
  QRIS: "QRIS",
  DEBIT_CARD: "Debit",
  CREDIT_CARD: "Credit",
  EWALLET: "E-Wallet",
};

export default function ExpensesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("month");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  useEffect(() => {
    fetchData();
  }, [selectedCategory, dateRange]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Build query params
      const params = new URLSearchParams();
      if (dateRange !== "all") {
        const { from, to } = getDateRangeParams(dateRange);
        if (from) params.set("from", from);
        if (to) params.set("to", to);
      }
      if (selectedCategory !== "all") {
        params.set("category", selectedCategory);
      }

      // Fetch expenses and summary in parallel
      const [expensesRes, summaryRes] = await Promise.all([
        fetch(`/api/expenses?${params.toString()}`),
        fetch(`/api/expenses/summary?range=${dateRange}`),
      ]);

      if (expensesRes.ok) {
        const data = await expensesRes.json();
        setExpenses(data.expenses || []);
      }

      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummary(data);
      }
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
      alertError("Gagal memuat data pengeluaran");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmDestroy({ title: "Hapus pengeluaran?", description: "Tindakan ini tidak dapat dibatalkan." });
    if (!ok) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete expense");
      }

      alertSuccess("Pengeluaran berhasil dihapus");
      fetchData();
    } catch (error) {
      alertError("Gagal menghapus pengeluaran");
    }
  };

  const getDateRangeParams = (range: string) => {
    const today = new Date();
    let from: string | null = null;
    let to: string | null = null;

    switch (range) {
      case "today":
        from = today.toISOString().split("T")[0];
        to = from;
        break;
      case "week":
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        from = weekAgo.toISOString().split("T")[0];
        to = today.toISOString().split("T")[0];
        break;
      case "month":
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        from = monthAgo.toISOString().split("T")[0];
        to = today.toISOString().split("T")[0];
        break;
      case "year":
        const yearAgo = new Date(today);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        from = yearAgo.toISOString().split("T")[0];
        to = today.toISOString().split("T")[0];
        break;
    }

    return { from, to };
  };

  return (
    <div className="p-5 lg:p-7 space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Pengeluaran</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola dan pantau pengeluaran toko</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Pengeluaran
        </Button>
      </div>

      {/* Summary Cards */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : (
        summary && (
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl p-4 bg-white flex items-center justify-between" style={{ border: "1px solid var(--border)", boxShadow: "0 1px 3px oklch(0 0 0 / 5%)" }}>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Total Pengeluaran</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalExpenses)}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  <span className={summary.changePercentage >= 0 ? "text-red-500" : "text-green-600"}>
                    {summary.changePercentage >= 0 ? "+" : ""}{summary.changePercentage.toFixed(1)}%
                  </span>{" "}
                  dari periode sebelumnya
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "oklch(0.94 0.08 20)" }}>
                <TrendingDown className="h-5 w-5" style={{ color: "oklch(0.45 0.16 20)" }} />
              </div>
            </div>

            <div className="rounded-xl p-4 bg-white flex items-center justify-between" style={{ border: "1px solid var(--border)", boxShadow: "0 1px 3px oklch(0 0 0 / 5%)" }}>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Jumlah Transaksi</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(summary.totalCount)}</p>
                <p className="text-xs text-gray-400 mt-0.5">pengeluaran tercatat</p>
              </div>
              <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "oklch(0.95 0.05 240)" }}>
                <FileText className="h-5 w-5" style={{ color: "oklch(0.45 0.14 240)" }} />
              </div>
            </div>

            <div className="rounded-xl p-4 bg-white flex items-center justify-between" style={{ border: "1px solid var(--border)", boxShadow: "0 1px 3px oklch(0 0 0 / 5%)" }}>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Kategori Terbanyak</p>
                {summary.categoryBreakdown.length > 0 ? (
                  <>
                    <p className="text-2xl font-bold text-gray-900">{CATEGORY_LABELS[summary.categoryBreakdown[0].category]}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatCurrency(summary.categoryBreakdown[0].amount)} ({summary.categoryBreakdown[0].percentage.toFixed(1)}%)</p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">Belum ada data</p>
                )}
              </div>
              <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "oklch(0.97 0.06 80)" }}>
                <Filter className="h-5 w-5" style={{ color: "oklch(0.50 0.14 70)" }} />
              </div>
            </div>
          </div>
        )
      )}

      {/* ── Table section ── */}
      <div className="rounded-xl border overflow-hidden" style={{ boxShadow: "0 1px 3px oklch(0 0 0 / 5%)" }}>
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <p className="text-sm font-semibold text-gray-700">Daftar Pengeluaran</p>
          <div className="flex gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="h-9 w-40 text-sm border-gray-200 bg-white">
                <SelectValue />
              </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hari Ini</SelectItem>
                  <SelectItem value="week">7 Hari Terakhir</SelectItem>
                  <SelectItem value="month">30 Hari Terakhir</SelectItem>
                  <SelectItem value="year">1 Tahun Terakhir</SelectItem>
                  <SelectItem value="all">Semua</SelectItem>
                </SelectContent>
              </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-9 w-44 text-sm border-gray-200 bg-white">
                <SelectValue />
              </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </div>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-12">
              <TrendingDown className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Belum ada pengeluaran</h3>
              <p className="text-muted-foreground">
                Mulai tambahkan pengeluaran untuk melacak keuangan toko Anda
              </p>
              <Button
                onClick={() => setShowAddDialog(true)}
                className="mt-4"
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah Pengeluaran
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow style={{ background: "oklch(0.97 0.002 80)" }}>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tanggal</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Kategori</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Deskripsi</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Metode</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Jumlah</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id} className="hover:bg-gray-50/60 transition-colors">
                    <TableCell className="text-sm text-gray-600">
                      {format(new Date(expense.date), "dd MMM yyyy", {
                        locale: localeId,
                      })}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700">
                        {CATEGORY_LABELS[expense.category]}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="font-medium text-sm text-gray-900">{expense.description}</div>
                      {expense.reference && (
                        <div className="text-xs text-gray-400">Ref: {expense.reference}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-500">{PAYMENT_METHOD_LABELS[expense.paymentMethod]}</span>
                    </TableCell>
                    <TableCell className="text-right font-medium text-red-600">
                      {formatCurrency(expense.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingExpense(expense)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(expense.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Pengeluaran Baru</DialogTitle>
            <DialogDescription>
              Isi formulir di bawah untuk menambahkan pengeluaran baru
            </DialogDescription>
          </DialogHeader>
          <ExpenseForm
            onSuccess={() => {
              setShowAddDialog(false);
              fetchData();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingExpense}
        onOpenChange={(open) => !open && setEditingExpense(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Pengeluaran</DialogTitle>
            <DialogDescription>
              Update informasi pengeluaran
            </DialogDescription>
          </DialogHeader>
          {editingExpense && (
            <ExpenseForm
              expense={{
                ...editingExpense,
                date: new Date(editingExpense.date),
              }}
              onSuccess={() => {
                setEditingExpense(null);
                fetchData();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
