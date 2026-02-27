"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  clampPercentDiscount,
  formatNumberInputValue,
  parseDigitsToNumber,
} from "@/lib/number-input";

interface DiscountFormProps {
  initialData: {
    id: string;
    name: string;
    code: string | null;
    type: "PERCENTAGE" | "FIXED";
    value: number;
    minPurchase: number | null;
    maxDiscount: number | null;
    startDate: Date | null;
    endDate: Date | null;
    isActive: boolean;
    usageLimit: number | null;
  } | null;
  onSuccess: () => void;
}

export function DiscountForm({ initialData, onSuccess }: DiscountFormProps) {
  const [loading, setLoading] = useState(false);

  const formatDateForInput = (date: Date | null) => {
    if (!date) return "";
    return new Date(date).toISOString().split("T")[0];
  };

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    code: initialData?.code || "",
    type: initialData?.type || ("PERCENTAGE" as "PERCENTAGE" | "FIXED"),
    value: initialData?.value || 0,
    minPurchase: initialData?.minPurchase || 0,
    maxDiscount: initialData?.maxDiscount || 0,
    startDate: formatDateForInput(initialData?.startDate || null),
    endDate: formatDateForInput(initialData?.endDate || null),
    isActive: initialData?.isActive ?? true,
    usageLimit: initialData?.usageLimit || 0,
  });

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Nama diskon wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const url = initialData
        ? `/api/discounts/${initialData.id}`
        : "/api/discounts";
      const method = initialData ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          code: formData.code || null,
          minPurchase: formData.minPurchase || null,
          maxDiscount: formData.maxDiscount || null,
          usageLimit: formData.usageLimit || null,
        }),
      });

      if (res.ok) {
        toast.success(
          initialData ? "Diskon berhasil diperbarui" : "Diskon berhasil dibuat",
        );
        onSuccess();
      } else {
        const error = await res.text();
        toast.error(error || "Terjadi kesalahan");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nama Diskon *</Label>
          <Input
            id="name"
            placeholder="Contoh: Diskon Weekend"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="code">Kode Promo (Opsional)</Label>
          <Input
            id="code"
            placeholder="Contoh: WEEKEND10"
            value={formData.code}
            onChange={(e) => handleChange("code", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Tipe Diskon</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => handleChange("type", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PERCENTAGE">Persentase (%)</SelectItem>
              <SelectItem value="FIXED">Nominal (Rp)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="value">
            Nilai Diskon {formData.type === "PERCENTAGE" ? "(%)" : "(Rp)"}
          </Label>
          <Input
            id="value"
            type="text"
            inputMode="numeric"
            aria-label={
              formData.type === "PERCENTAGE"
                ? "Nilai diskon persen"
                : "Nilai diskon rupiah"
            }
            placeholder={formData.type === "PERCENTAGE" ? "10" : "10000"}
            value={
              formData.value > 0
                ? formData.type === "PERCENTAGE"
                  ? String(formData.value)
                  : formatNumberInputValue(formData.value)
                : ""
            }
            onChange={(e) =>
              handleChange(
                "value",
                formData.type === "PERCENTAGE"
                  ? clampPercentDiscount(parseDigitsToNumber(e.target.value))
                  : parseDigitsToNumber(e.target.value),
              )
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="minPurchase">Minimum Pembelian (Rp)</Label>
          <Input
            id="minPurchase"
            type="text"
            inputMode="numeric"
            aria-label="Minimum pembelian"
            placeholder="0"
            value={formatNumberInputValue(formData.minPurchase)}
            onChange={(e) =>
              handleChange("minPurchase", parseDigitsToNumber(e.target.value))
            }
          />
        </div>
        {formData.type === "PERCENTAGE" && (
          <div className="space-y-2">
            <Label htmlFor="maxDiscount">Maksimal Diskon (Rp)</Label>
            <Input
              id="maxDiscount"
              type="text"
              inputMode="numeric"
              aria-label="Maksimal diskon"
              placeholder="50000"
              value={formatNumberInputValue(formData.maxDiscount)}
              onChange={(e) =>
                handleChange("maxDiscount", parseDigitsToNumber(e.target.value))
              }
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Tanggal Mulai</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => handleChange("startDate", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">Tanggal Berakhir</Label>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) => handleChange("endDate", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="usageLimit">Batas Penggunaan</Label>
          <Input
            id="usageLimit"
            type="number"
            placeholder="Kosongkan untuk unlimited"
            value={formData.usageLimit || ""}
            onChange={(e) =>
              handleChange("usageLimit", Number(e.target.value) || 0)
            }
          />
        </div>
        <div className="flex items-center space-x-2 pt-6">
          <Checkbox
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) =>
              handleChange("isActive", checked === true)
            }
          />
          <Label htmlFor="isActive">Aktif</Label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Simpan Perubahan" : "Buat Diskon"}
        </Button>
      </div>
    </form>
  );
}
