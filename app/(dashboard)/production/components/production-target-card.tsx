"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { alertError, alertSuccess } from "@/lib/swal";
import {
  formatNumberInputValue,
  parseDigitsToNumber,
} from "@/lib/number-input";

interface ProductionTargetSummary {
  monthLabel: string;
  targetQuantity: number;
  notes: string;
  plannedQuantity: number;
  producedQuantity: number;
  wasteQuantity: number;
  remainingQuantity: number;
  progressPercentage: number;
  totalOrders: number;
  completedOrders: number;
}

function getCurrentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function ProductionTargetCard() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue);
  const [summary, setSummary] = useState<ProductionTargetSummary | null>(null);
  const [targetQuantity, setTargetQuantity] = useState(0);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetchSummary(selectedMonth);
  }, [selectedMonth]);

  const fetchSummary = async (month: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/production/targets?month=${month}`);
      if (!response.ok) throw new Error("Gagal memuat target produksi");
      const data = (await response.json()) as ProductionTargetSummary;
      setSummary(data);
      setTargetQuantity(data.targetQuantity);
      setNotes(data.notes || "");
    } catch (error) {
      alertError(error instanceof Error ? error.message : "Gagal memuat target");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch("/api/production/targets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: selectedMonth,
          targetQuantity,
          notes,
        }),
      });
      if (!response.ok) throw new Error("Gagal menyimpan target produksi");
      const data = (await response.json()) as ProductionTargetSummary;
      setSummary(data);
      setTargetQuantity(data.targetQuantity);
      setNotes(data.notes || "");
      alertSuccess("Target produksi berhasil disimpan");
    } catch (error) {
      alertError(
        error instanceof Error ? error.message : "Gagal menyimpan target",
      );
    } finally {
      setSaving(false);
    }
  };

  const progress = summary?.progressPercentage ?? 0;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Target Produksi Bulanan
                </h2>
                <p className="text-sm text-muted-foreground">
                  Pantau target jumlah produk selesai setiap bulan.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Memuat target...
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    Progress {summary?.monthLabel}
                  </span>
                  <span className="text-muted-foreground">
                    {summary?.producedQuantity ?? 0}/{summary?.targetQuantity ?? 0} pcs
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-4">
                  <span>Order: {summary?.totalOrders ?? 0}</span>
                  <span>Selesai: {summary?.completedOrders ?? 0}</span>
                  <span>Rencana: {summary?.plannedQuantity ?? 0} pcs</span>
                  <span>Sisa target: {summary?.remainingQuantity ?? 0} pcs</span>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:w-[460px]">
            <div className="space-y-1.5">
              <Label>Bulan</Label>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Target pcs</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={formatNumberInputValue(targetQuantity)}
                onChange={(event) =>
                  setTargetQuantity(parseDigitsToNumber(event.target.value))
                }
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Catatan</Label>
              <Textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Opsional, contoh: target hampers Lebaran atau stok mingguan."
                className="h-16 resize-none"
              />
            </div>
            <Button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || loading}
              className="sm:col-span-2"
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Simpan Target
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
