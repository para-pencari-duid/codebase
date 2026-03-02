"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Play, CheckCircle, XCircle } from "lucide-react";
import { alertSuccess, alertError, confirmAction } from "@/lib/swal";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import Link from "next/link";
import { formatCurrency } from "@/lib/dashboard-utils";

interface ProductionOrder {
  id: string;
  orderNo: string;
  status: string;
  scheduledDate: string;
  totalCost: number;
  items: {
    id: string;
    productName: string;
    targetQuantity: number;
    producedQuantity: number;
  }[];
}

const STATUS_COLORS: Record<string, string> = {
  PLANNED: "bg-blue-500",
  IN_PROGRESS: "bg-yellow-500",
  COMPLETED: "bg-green-500",
  CANCELLED: "bg-red-500",
};

const STATUS_LABELS: Record<string, string> = {
  PLANNED: "Direncanakan",
  IN_PROGRESS: "Sedang Berlangsung",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

export function ProductionOrdersTab() {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/production");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      alertError("Gagal memuat order produksi");
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (id: string) => {
    const ok = await confirmAction({ title: "Mulai produksi?", description: "Bahan baku akan dikurangi dari stok." });
    if (!ok) return;

    try {
      const res = await fetch(`/api/production/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }

      alertSuccess("Produksi dimulai");
      fetchOrders();
    } catch (error: any) {
      alertError(error.message || "Gagal memulai produksi");
    }
  };

  return (
    <div className="rounded-xl border overflow-hidden" style={{ boxShadow: "0 1px 3px oklch(0 0 0 / 5%)" }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <p className="text-sm font-semibold text-gray-700">Order Produksi</p>
        <Link href="/production/orders/new">
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Buat Order
          </Button>
        </Link>
      </div>
      <div className="p-4">
        {loading ? (
          <p className="text-center py-8 text-gray-400 text-sm">Loading...</p>
        ) : orders.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">Belum ada order produksi</div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="rounded-xl p-4 bg-white hover:shadow-md transition-shadow" style={{ border: "1px solid var(--border)", boxShadow: "0 1px 2px oklch(0 0 0 / 5%)" }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-900">{order.orderNo}</span>
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">{STATUS_LABELS[order.status]}</span>
                    </div>
                    <p className="text-sm text-gray-500">
                        Jadwal: {format(new Date(order.scheduledDate), "dd MMM yyyy", { locale: localeId })}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">{order.items.length}</span> produk • 
                        <span className="font-medium ml-1">{formatCurrency(order.totalCost)}</span> estimasi biaya
                      </p>
                      <div className="text-sm text-gray-500">
                        {order.items.slice(0, 2).map((item) => (
                          <div key={item.id}>
                            • {item.productName} ({item.targetQuantity} pcs)
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <div>• +{order.items.length - 2} produk lainnya</div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {order.status === "PLANNED" && (
                        <Button size="sm" onClick={() => handleStart(order.id)}>
                          <Play className="h-4 w-4 mr-1" />
                          Mulai
                        </Button>
                      )}
                      <Link href={`/production/orders/${order.id}`}>
                        <Button size="sm" variant="outline">Detail</Button>
                      </Link>
                    </div>
                  </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
