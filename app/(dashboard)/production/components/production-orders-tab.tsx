"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Play, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
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
      toast.error("Gagal memuat order produksi");
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (id: string) => {
    if (!confirm("Mulai produksi? Bahan baku akan dikurangi dari stok.")) return;

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

      toast.success("Produksi dimulai");
      fetchOrders();
    } catch (error: any) {
      toast.error(error.message || "Gagal memulai produksi");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Order Produksi</CardTitle>
          <Link href="/production/orders/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Buat Order Produksi
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Loading...</p>
        ) : orders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Belum ada order produksi</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{order.orderNo}</h3>
                        <Badge className={STATUS_COLORS[order.status]}>
                          {STATUS_LABELS[order.status]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Jadwal: {format(new Date(order.scheduledDate), "dd MMM yyyy", { locale: localeId })}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">{order.items.length}</span> produk • 
                        <span className="font-medium ml-1">{formatCurrency(order.totalCost)}</span> estimasi biaya
                      </p>
                      <div className="text-sm text-muted-foreground">
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
                        <Button size="sm" variant="outline">
                          Detail
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
