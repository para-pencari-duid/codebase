"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { alertSuccess, alertError } from "@/lib/swal";
import {
  formatNumberInputValue,
  parseDigitsToNumber,
} from "@/lib/number-input";
import { cn } from "@/lib/utils";

const EXPENSE_CATEGORIES = [
  { value: "SALARY", label: "Gaji" },
  { value: "UTILITIES", label: "Utilitas (Listrik, Air, Internet)" },
  { value: "RAW_MATERIALS", label: "Bahan Baku" },
  { value: "SUPPLIES", label: "Perlengkapan" },
  { value: "RENT", label: "Sewa" },
  { value: "MAINTENANCE", label: "Perawatan & Perbaikan" },
  { value: "MARKETING", label: "Marketing & Promosi" },
  { value: "TRANSPORTATION", label: "Transportasi" },
  { value: "TAX_FEE", label: "Pajak & Administrasi" },
  { value: "OTHER", label: "Lain-lain" },
];

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "TRANSFER", label: "Transfer Bank" },
  { value: "QRIS", label: "QRIS" },
  { value: "DEBIT_CARD", label: "Debit Card" },
  { value: "CREDIT_CARD", label: "Credit Card" },
  { value: "EWALLET", label: "E-Wallet" },
];

interface ExpenseFormProps {
  expense?: {
    id: string;
    category: string;
    amount: number;
    date: Date;
    description: string;
    paymentMethod: string;
    reference?: string;
    notes?: string;
  };
  onSuccess?: () => void;
}

export function ExpenseForm({ expense, onSuccess }: ExpenseFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date>(
    expense?.date ? new Date(expense.date) : new Date(),
  );
  const [formData, setFormData] = useState({
    category: expense?.category || "",
    amount: expense?.amount?.toString() || "",
    description: expense?.description || "",
    paymentMethod: expense?.paymentMethod || "",
    reference: expense?.reference || "",
    notes: expense?.notes || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.category ||
      !formData.amount ||
      !formData.description ||
      !formData.paymentMethod
    ) {
      alertError("Harap isi semua field yang wajib");
      return;
    }

    setLoading(true);
    try {
      const url = expense ? `/api/expenses/${expense.id}` : "/api/expenses";
      const method = expense ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          date: date.toISOString(),
          amount: parseFloat(formData.amount),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save expense");
      }

      alertSuccess(expense ? "Pengeluaran berhasil diupdate" : "Pengeluaran berhasil ditambahkan");

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/expenses");
        router.refresh();
      }
    } catch (error: any) {
      alertError(error.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {expense ? "Edit Pengeluaran" : "Tambah Pengeluaran"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">
                Kategori <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">
                Jumlah <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                type="text"
                inputMode="numeric"
                aria-label="Jumlah pengeluaran"
                placeholder="0"
                value={formatNumberInputValue(formData.amount)}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    amount: String(parseDigitsToNumber(e.target.value)),
                  })
                }
                required
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label>
                Tanggal <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pilih tanggal</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">
                Metode Pembayaran <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) =>
                  setFormData({ ...formData, paymentMethod: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih metode" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reference */}
            <div className="space-y-2">
              <Label htmlFor="reference">
                No. Referensi (Invoice/Kuitansi)
              </Label>
              <Input
                id="reference"
                placeholder="INV-001"
                value={formData.reference}
                onChange={(e) =>
                  setFormData({ ...formData, reference: e.target.value })
                }
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Deskripsi <span className="text-red-500">*</span>
            </Label>
            <Input
              id="description"
              placeholder="Contoh: Gaji karyawan bulan Januari"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Catatan</Label>
            <Textarea
              id="notes"
              placeholder="Catatan tambahan..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {expense ? "Update" : "Simpan"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
