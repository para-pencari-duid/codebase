"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Search,
  Clock,
  ChefHat,
  CheckCircle2,
  XCircle,
  PackageCheck,
  Truck,
  RefreshCw,
  Eye,
  Pencil,
  Ban,
  CreditCard,
  Phone,
  MapPin,
  Calendar,
  StickyNote,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type PreOrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PRODUCTION"
  | "READY"
  | "COMPLETED"
  | "CANCELLED";

interface PreOrder {
  id: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  productName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  dpAmount: number;
  dpMethod?: string;
  dpPaidAt?: string;
  remainingAmount: number;
  finalPayMethod?: string;
  finalPaidAt?: string;
  pickupDate: string;
  deliveryType: "PICKUP" | "DELIVERY";
  status: PreOrderStatus;
  cancelReason?: string;
  createdAt: string;
  createdByUser?: { name: string };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  PreOrderStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  CONFIRMED: { label: "Dikonfirmasi", color: "bg-blue-100 text-blue-800", icon: CheckCircle2 },
  IN_PRODUCTION: { label: "Produksi", color: "bg-purple-100 text-purple-800", icon: ChefHat },
  READY: { label: "Siap", color: "bg-green-100 text-green-800", icon: PackageCheck },
  COMPLETED: { label: "Selesai", color: "bg-gray-100 text-gray-700", icon: CheckCircle2 },
  CANCELLED: { label: "Dibatalkan", color: "bg-red-100 text-red-800", icon: XCircle },
};

const NEXT_STATUS: Partial<Record<PreOrderStatus, PreOrderStatus>> = {
  CONFIRMED: "IN_PRODUCTION",
  IN_PRODUCTION: "READY",
  READY: "COMPLETED",
};

const NEXT_STATUS_LABEL: Partial<Record<PreOrderStatus, string>> = {
  CONFIRMED: "Mulai Produksi",
  IN_PRODUCTION: "Tandai Siap",
  READY: "Selesaikan",
};

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "TRANSFER", label: "Transfer" },
  { value: "QRIS", label: "QRIS" },
  { value: "DEBIT_CARD", label: "Kartu Debit" },
  { value: "CREDIT_CARD", label: "Kartu Kredit" },
  { value: "EWALLET", label: "E-Wallet" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(d: string | Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
}

function StatusBadge({ status }: { status: PreOrderStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

// ─── Empty Form ───────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  customerName: "",
  customerPhone: "",
  customerAddress: "",
  productName: "",
  description: "",
  quantity: "1",
  unitPrice: "",
  notes: "",
  dpAmount: "",
  dpMethod: "CASH",
  pickupDate: "",
  pickupTime: "10:00",
  deliveryType: "PICKUP",
};

// ─── Main Component ────────────────────────────────────────────────────────────

export default function PreOrdersPage() {
  const [orders, setOrders] = useState<PreOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState<PreOrder | null>(null);
  const [editOrder, setEditOrder] = useState<PreOrder | null>(null);
  const [cancelOrder, setCancelOrder] = useState<PreOrder | null>(null);
  const [payOrder, setPayOrder] = useState<PreOrder | null>(null);

  // Form state
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [cancelReason, setCancelReason] = useState("");
  const [payMethod, setPayMethod] = useState("CASH");
  const [saving, setSaving] = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "ALL") params.set("status", filterStatus);
      if (search) params.set("search", search);
      const res = await fetch(`/api/pre-orders?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOrders(data.orders);
      setTotal(data.total);
    } catch {
      toast.error("Gagal load pre-order");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, search]);

  useEffect(() => {
    const t = setTimeout(fetchOrders, 300);
    return () => clearTimeout(t);
  }, [fetchOrders]);

  // ── Computed totals ───────────────────────────────────────────────────────
  const stats = {
    pending: orders.filter((o) => o.status === "PENDING").length,
    confirmed: orders.filter((o) => o.status === "CONFIRMED").length,
    inProduction: orders.filter((o) => o.status === "IN_PRODUCTION").length,
    ready: orders.filter((o) => o.status === "READY").length,
  };

  // ── Create ────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!form.customerName || !form.customerPhone || !form.productName || !form.unitPrice || !form.pickupDate) {
      toast.error("Nama customer, HP, produk, harga, dan tanggal ambil wajib diisi");
      return;
    }
    setSaving(true);
    try {
      const pickupDateTime = new Date(`${form.pickupDate}T${form.pickupTime}:00`);
      const res = await fetch("/api/pre-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          unitPrice: parseFloat(form.unitPrice),
          dpAmount: parseFloat(form.dpAmount) || 0,
          pickupDate: pickupDateTime.toISOString(),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal");
      }
      toast.success("Pre-order berhasil dibuat & konfirmasi WA dikirim!");
      setCreateOpen(false);
      setForm({ ...EMPTY_FORM });
      fetchOrders();
    } catch (e: any) {
      toast.error(e.message || "Gagal membuat pre-order");
    } finally {
      setSaving(false);
    }
  };

  // ── Update status ─────────────────────────────────────────────────────────
  const handleNextStatus = async (order: PreOrder) => {
    const nextStatus = NEXT_STATUS[order.status];
    if (!nextStatus) return;
    try {
      const res = await fetch(`/api/pre-orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_status", status: nextStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Status diubah ke ${STATUS_CONFIG[nextStatus].label}`);
      fetchOrders();
    } catch {
      toast.error("Gagal update status");
    }
  };

  // ── Cancel ────────────────────────────────────────────────────────────────
  const handleCancel = async () => {
    if (!cancelOrder) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/pre-orders/${cancelOrder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", cancelReason }),
      });
      if (!res.ok) throw new Error();
      toast.success("Pre-order dibatalkan");
      setCancelOrder(null);
      setCancelReason("");
      fetchOrders();
    } catch {
      toast.error("Gagal membatalkan");
    } finally {
      setSaving(false);
    }
  };

  // ── Pay remaining ─────────────────────────────────────────────────────────
  const handlePayRemaining = async () => {
    if (!payOrder) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/pre-orders/${payOrder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pay_remaining", payMethod }),
      });
      if (!res.ok) throw new Error();
      toast.success("Pelunasan berhasil!");
      setPayOrder(null);
      fetchOrders();
    } catch {
      toast.error("Gagal proses pelunasan");
    } finally {
      setSaving(false);
    }
  };

  // ── Edit save ─────────────────────────────────────────────────────────────
  const handleEditSave = async () => {
    if (!editOrder) return;
    setSaving(true);
    try {
      const pickupDateTime = form.pickupDate
        ? new Date(`${form.pickupDate}T${form.pickupTime}:00`)
        : undefined;
      const res = await fetch(`/api/pre-orders/${editOrder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "edit",
          ...form,
          unitPrice: form.unitPrice ? parseFloat(form.unitPrice) : undefined,
          pickupDate: pickupDateTime?.toISOString(),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Pre-order diperbarui");
      setEditOrder(null);
      fetchOrders();
    } catch {
      toast.error("Gagal simpan perubahan");
    } finally {
      setSaving(false);
    }
  };

  // ── Open edit dialog ──────────────────────────────────────────────────────
  const openEdit = (order: PreOrder) => {
    const d = new Date(order.pickupDate);
    const dateStr = d.toISOString().split("T")[0];
    const timeStr = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    setForm({
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerAddress: order.customerAddress || "",
      productName: order.productName,
      description: order.description || "",
      quantity: String(order.quantity),
      unitPrice: String(order.unitPrice),
      notes: order.notes || "",
      dpAmount: String(order.dpAmount),
      dpMethod: order.dpMethod || "CASH",
      pickupDate: dateStr,
      pickupTime: timeStr,
      deliveryType: order.deliveryType,
    });
    setEditOrder(order);
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 space-y-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pre-Order</h2>
          <p className="text-muted-foreground text-sm">Kelola pesanan custom cake & kue</p>
        </div>
        <Button onClick={() => { setForm({ ...EMPTY_FORM }); setCreateOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Pre-Order Baru
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Pending", value: stats.pending, color: "text-yellow-600", icon: Clock },
          { label: "Dikonfirmasi", value: stats.confirmed, color: "text-blue-600", icon: CheckCircle2 },
          { label: "Produksi", value: stats.inProduction, color: "text-purple-600", icon: ChefHat },
          { label: "Siap Ambil", value: stats.ready, color: "text-green-600", icon: PackageCheck },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
                <s.icon className={`h-8 w-8 opacity-20 ${s.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, HP, produk, nomor order..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Status</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={fetchOrders}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Order List */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Tidak ada pre-order ditemukan
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card key={order.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  {/* Left info */}
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-muted-foreground">{order.orderNo}</span>
                      <StatusBadge status={order.status} />
                      <span className="text-xs text-muted-foreground bg-slate-100 px-1.5 py-0.5 rounded">
                        {order.deliveryType === "PICKUP" ? "🏪 Pickup" : "🚚 Delivery"}
                      </span>
                    </div>
                    <div className="font-semibold text-sm">{order.productName}</div>
                    {order.description && (
                      <div className="text-xs text-muted-foreground">{order.description}</div>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-0.5">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {order.customerName} · {order.customerPhone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {fmtDate(order.pickupDate)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs">
                      <span>
                        Qty: <b>{order.quantity}</b>
                      </span>
                      <span>
                        Total: <b>{formatCurrency(Number(order.totalPrice))}</b>
                      </span>
                      {Number(order.dpAmount) > 0 && (
                        <span className="text-green-600">
                          DP: {formatCurrency(Number(order.dpAmount))}
                        </span>
                      )}
                      {Number(order.remainingAmount) > 0 ? (
                        <span className="text-orange-600">
                          Sisa: {formatCurrency(Number(order.remainingAmount))}
                        </span>
                      ) : (
                        order.status !== "CANCELLED" && (
                          <span className="text-green-600">✓ Lunas</span>
                        )
                      )}
                    </div>
                    {order.cancelReason && (
                      <p className="text-xs text-red-500">Alasan batal: {order.cancelReason}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 md:flex-col md:items-end">
                    {/* Next status button */}
                    {NEXT_STATUS[order.status] && (
                      <Button size="sm" onClick={() => handleNextStatus(order)}>
                        {NEXT_STATUS_LABEL[order.status]}
                      </Button>
                    )}

                    {/* Lunas button */}
                    {Number(order.remainingAmount) > 0 &&
                      ["READY", "COMPLETED"].includes(order.status) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-300"
                          onClick={() => { setPayOrder(order); setPayMethod("CASH"); }}
                        >
                          <CreditCard className="h-3.5 w-3.5 mr-1" />
                          Lunaskan
                        </Button>
                      )}

                    {/* Detail / Edit / Cancel */}
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => setDetailOrder(order)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {!["COMPLETED", "CANCELLED"].includes(order.status) && (
                        <>
                          <Button size="icon" variant="ghost" onClick={() => openEdit(order)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-red-500"
                            onClick={() => { setCancelOrder(order); setCancelReason(""); }}
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── CREATE DIALOG ─────────────────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Pre-Order Baru
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  Data Customer
                </h4>
                <div className="space-y-1.5">
                  <Label>Nama Customer *</Label>
                  <Input
                    placeholder="Nama lengkap"
                    value={form.customerName}
                    onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Nomor HP *</Label>
                  <Input
                    placeholder="0812xxxx (untuk notif WA)"
                    value={form.customerPhone}
                    onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Alamat (jika delivery)</Label>
                  <Textarea
                    placeholder="Alamat pengiriman"
                    rows={2}
                    value={form.customerAddress}
                    onChange={(e) => setForm((f) => ({ ...f, customerAddress: e.target.value }))}
                  />
                </div>
              </div>

              {/* Produk */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  Detail Pesanan
                </h4>
                <div className="space-y-1.5">
                  <Label>Nama Produk / Jenis Kue *</Label>
                  <Input
                    placeholder="cth: Black Forest 22cm, Kue Ulang Tahun"
                    value={form.productName}
                    onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Deskripsi Custom</Label>
                  <Textarea
                    placeholder="Rasa, ukuran, dekorasi, tulisan di kue, dll"
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label>Jumlah *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={form.quantity}
                      onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Harga Satuan (Rp) *</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={form.unitPrice}
                      onChange={(e) => setForm((f) => ({ ...f, unitPrice: e.target.value }))}
                    />
                  </div>
                </div>
                {form.unitPrice && form.quantity && (
                  <div className="text-sm font-semibold text-green-700">
                    Total: {formatCurrency(parseFloat(form.unitPrice || "0") * parseInt(form.quantity || "1"))}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pembayaran */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  Pembayaran
                </h4>
                <div className="space-y-1.5">
                  <Label>DP (Rp) — isi 0 jika belum bayar</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={form.dpAmount}
                    onChange={(e) => setForm((f) => ({ ...f, dpAmount: e.target.value }))}
                  />
                </div>
                {parseFloat(form.dpAmount) > 0 && (
                  <div className="space-y-1.5">
                    <Label>Metode Bayar DP</Label>
                    <Select
                      value={form.dpMethod}
                      onValueChange={(v) => setForm((f) => ({ ...f, dpMethod: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {form.unitPrice && form.quantity && (
                  <p className="text-xs text-muted-foreground">
                    Sisa: {formatCurrency(
                      Math.max(0, parseFloat(form.unitPrice || "0") * parseInt(form.quantity || "1") - parseFloat(form.dpAmount || "0"))
                    )}
                  </p>
                )}
              </div>

              {/* Jadwal */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  Jadwal & Pengambilan
                </h4>
                <div className="space-y-1.5">
                  <Label>Tanggal Ambil *</Label>
                  <Input
                    type="date"
                    value={form.pickupDate}
                    onChange={(e) => setForm((f) => ({ ...f, pickupDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Jam Ambil</Label>
                  <Input
                    type="time"
                    value={form.pickupTime}
                    onChange={(e) => setForm((f) => ({ ...f, pickupTime: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Tipe Pengiriman</Label>
                  <Select
                    value={form.deliveryType}
                    onValueChange={(v) => setForm((f) => ({ ...f, deliveryType: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PICKUP">🏪 Ambil di Toko</SelectItem>
                      <SelectItem value="DELIVERY">🚚 Delivery ke Alamat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Catatan */}
            <div className="space-y-1.5">
              <Label>Catatan Tambahan</Label>
              <Textarea
                placeholder="Alergi bahan, instruksi khusus, dll"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? "Menyimpan..." : "Buat Pre-Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DETAIL DIALOG ─────────────────────────────────────────────────────── */}
      <Dialog open={!!detailOrder} onOpenChange={() => setDetailOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Pre-Order</DialogTitle>
          </DialogHeader>
          {detailOrder && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-muted-foreground">{detailOrder.orderNo}</span>
                <StatusBadge status={detailOrder.status} />
              </div>
              <Separator />
              <div className="space-y-1.5">
                <p className="font-semibold text-base">{detailOrder.productName}</p>
                {detailOrder.description && (
                  <p className="text-muted-foreground">{detailOrder.description}</p>
                )}
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium">{detailOrder.customerName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">HP</p>
                  <p className="font-medium">{detailOrder.customerPhone}</p>
                </div>
                {detailOrder.customerAddress && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Alamat</p>
                    <p className="font-medium">{detailOrder.customerAddress}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Jumlah</p>
                  <p className="font-medium">{detailOrder.quantity} pcs</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Harga Satuan</p>
                  <p className="font-medium">{formatCurrency(Number(detailOrder.unitPrice))}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-semibold text-green-700">{formatCurrency(Number(detailOrder.totalPrice))}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">DP Dibayar</p>
                  <p className="font-medium">{formatCurrency(Number(detailOrder.dpAmount))}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Sisa Bayar</p>
                  <p className={`font-medium ${Number(detailOrder.remainingAmount) > 0 ? "text-orange-600" : "text-green-600"}`}>
                    {Number(detailOrder.remainingAmount) > 0
                      ? formatCurrency(Number(detailOrder.remainingAmount))
                      : "LUNAS ✓"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Jadwal Ambil</p>
                  <p className="font-medium">{fmtDate(detailOrder.pickupDate)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tipe</p>
                  <p className="font-medium">{detailOrder.deliveryType === "PICKUP" ? "Ambil di Toko" : "Delivery"}</p>
                </div>
              </div>
              {detailOrder.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-muted-foreground text-xs flex items-center gap-1"><StickyNote className="h-3 w-3" />Catatan</p>
                    <p className="font-medium">{detailOrder.notes}</p>
                  </div>
                </>
              )}
              {detailOrder.cancelReason && (
                <div className="bg-red-50 p-2 rounded text-red-700 text-xs">
                  Alasan batal: {detailOrder.cancelReason}
                </div>
              )}
              <Separator />
              <div className="text-xs text-muted-foreground">
                Dibuat oleh {detailOrder.createdByUser?.name} · {fmtDate(detailOrder.createdAt)}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── EDIT DIALOG ───────────────────────────────────────────────────────── */}
      <Dialog open={!!editOrder} onOpenChange={() => setEditOrder(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Pre-Order #{editOrder?.orderNo}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Nama Customer</Label>
              <Input value={form.customerName} onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Nomor HP</Label>
              <Input value={form.customerPhone} onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Alamat</Label>
              <Input value={form.customerAddress} onChange={(e) => setForm((f) => ({ ...f, customerAddress: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Nama Produk</Label>
              <Input value={form.productName} onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Deskripsi</Label>
              <Textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Jumlah</Label>
                <Input type="number" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Harga Satuan</Label>
                <Input type="number" value={form.unitPrice} onChange={(e) => setForm((f) => ({ ...f, unitPrice: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Tanggal Ambil</Label>
                <Input type="date" value={form.pickupDate} onChange={(e) => setForm((f) => ({ ...f, pickupDate: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Jam Ambil</Label>
                <Input type="time" value={form.pickupTime} onChange={(e) => setForm((f) => ({ ...f, pickupTime: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Tipe Pengiriman</Label>
              <Select value={form.deliveryType} onValueChange={(v) => setForm((f) => ({ ...f, deliveryType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PICKUP">🏪 Ambil di Toko</SelectItem>
                  <SelectItem value="DELIVERY">🚚 Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Catatan</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOrder(null)} disabled={saving}>Batal</Button>
            <Button onClick={handleEditSave} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── CANCEL DIALOG ─────────────────────────────────────────────────────── */}
      <Dialog open={!!cancelOrder} onOpenChange={() => setCancelOrder(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-600">Batalkan Pre-Order?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Pre-order <b>{cancelOrder?.orderNo}</b> akan dibatalkan.
              {Number(cancelOrder?.dpAmount) > 0 && (
                <span className="block mt-1 text-orange-600">
                  DP {formatCurrency(Number(cancelOrder?.dpAmount))} hangus sesuai policy.
                </span>
              )}
            </p>
            <div className="space-y-1.5">
              <Label>Alasan Pembatalan</Label>
              <Textarea
                placeholder="Tulis alasan (opsional)"
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOrder(null)} disabled={saving}>Tidak</Button>
            <Button variant="destructive" onClick={handleCancel} disabled={saving}>
              {saving ? "Membatalkan..." : "Ya, Batalkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── PAY REMAINING DIALOG ──────────────────────────────────────────────── */}
      <Dialog open={!!payOrder} onOpenChange={() => setPayOrder(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Pelunasan Pre-Order</DialogTitle>
          </DialogHeader>
          {payOrder && (
            <div className="space-y-3 py-2">
              <div className="bg-slate-50 p-3 rounded-lg space-y-1 text-sm">
                <p className="font-medium">{payOrder.productName}</p>
                <p className="text-muted-foreground">{payOrder.customerName}</p>
                <p className="text-lg font-bold text-green-700">
                  {formatCurrency(Number(payOrder.remainingAmount))}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Metode Bayar</Label>
                <Select value={payMethod} onValueChange={setPayMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOrder(null)} disabled={saving}>Batal</Button>
            <Button onClick={handlePayRemaining} disabled={saving}>
              {saving ? "Memproses..." : "Konfirmasi Lunas"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
