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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { toast } from "sonner";

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
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      toast.error("Gagal memuat data pengeluaran");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete expense");
      }

      toast.success("Pengeluaran berhasil dihapus");
      setDeletingId(null);
      fetchData();
    } catch (error) {
      toast.error("Gagal menghapus pengeluaran");
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
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pengeluaran</h2>
          <p className="text-muted-foreground">
            Kelola dan pantau pengeluaran toko
          </p>
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
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Pengeluaran
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(summary.totalExpenses)}
                </div>
                <p className="text-xs text-muted-foreground">
                  <span
                    className={
                      summary.changePercentage >= 0
                        ? "text-red-600"
                        : "text-green-600"
                    }
                  >
                    {summary.changePercentage >= 0 ? "+" : ""}
                    {summary.changePercentage.toFixed(1)}%
                  </span>{" "}
                  dari periode sebelumnya
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Jumlah Transaksi
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(summary.totalCount)}
                </div>
                <p className="text-xs text-muted-foreground">
                  pengeluaran tercatat
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Kategori Terbanyak
                </CardTitle>
                <Filter className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {summary.categoryBreakdown.length > 0 ? (
                  <>
                    <div className="text-2xl font-bold">
                      {CATEGORY_LABELS[summary.categoryBreakdown[0].category]}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(summary.categoryBreakdown[0].amount)} (
                      {summary.categoryBreakdown[0].percentage.toFixed(1)}%)
                    </p>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Belum ada data
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <CardTitle>Daftar Pengeluaran</CardTitle>
            <div className="flex gap-2">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[150px]">
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
                <SelectTrigger className="w-[180px]">
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
        </CardHeader>
        <CardContent>
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
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Metode</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      {format(new Date(expense.date), "dd MMM yyyy", {
                        locale: localeId,
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {CATEGORY_LABELS[expense.category]}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <div className="font-medium">{expense.description}</div>
                      {expense.reference && (
                        <div className="text-xs text-muted-foreground">
                          Ref: {expense.reference}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {PAYMENT_METHOD_LABELS[expense.paymentMethod]}
                      </span>
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
                          onClick={() => setDeletingId(expense.id)}
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
        </CardContent>
      </Card>

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

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pengeluaran?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Pengeluaran akan dihapus
              secara permanen dari sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && handleDelete(deletingId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
