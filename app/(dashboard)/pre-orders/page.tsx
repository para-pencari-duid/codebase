"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  Printer,
  FileSpreadsheet,
  Send,
  TableProperties,
  UserSearch,
  UserPlus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Customer {
  id: string;
  name: string;
  phone?: string | null;
  address?: string | null;
}

interface FormItem {
  name: string;
  quantity: string;
  unitPrice: string;
  notes: string;
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes?: string | null;
}

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
  items?: OrderItem[];
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

function fmtDate(d: string | Date | null | undefined) {
  if (!d) return "-";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dt);
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
  notes: "",
  dpAmount: "",
  dpMethod: "CASH",
  pickupDate: "",
  pickupTime: "10:00",
  deliveryType: "PICKUP",
};

const EMPTY_ITEM: FormItem = { name: "", quantity: "1", unitPrice: "", notes: "" };

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
  const [formItems, setFormItems] = useState<FormItem[]>([{ ...EMPTY_ITEM }]);
  const [cancelReason, setCancelReason] = useState("");
  const [payMethod, setPayMethod] = useState("CASH");
  const [saving, setSaving] = useState(false);

  // MVP extras
  const [activeTab, setActiveTab] = useState<"orders" | "recap">("orders");
  const [recapOrders, setRecapOrders] = useState<PreOrder[]>([]);
  const [recapDate, setRecapDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [loadingRecap, setLoadingRecap] = useState(false);
  const [sendingInvoice, setSendingInvoice] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [importLoading, setImportLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Customer search in form
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [saveAsNewCustomer, setSaveAsNewCustomer] = useState(false);
  const customerSearchRef = useRef<HTMLDivElement>(null);

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
    if (!form.customerName || !form.customerPhone || !form.pickupDate) {
      toast.error("Nama customer, HP, dan tanggal ambil wajib diisi");
      return;
    }
    const validItems = formItems.filter((it) => it.name.trim() && it.unitPrice);
    if (validItems.length === 0) {
      toast.error("Minimal 1 item pesanan wajib diisi (nama & harga)");
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
          customerId: selectedCustomer?.id ?? null,
          items: validItems.map((it) => ({
            name: it.name.trim(),
            quantity: parseInt(it.quantity) || 1,
            unitPrice: parseFloat(it.unitPrice),
            notes: it.notes.trim() || undefined,
          })),
          dpAmount: parseFloat(form.dpAmount) || 0,
          pickupDate: pickupDateTime.toISOString(),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal");
      }
      // Optionally save as new customer
      if (saveAsNewCustomer && !selectedCustomer) {
        await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.customerName,
            phone: form.customerPhone || null,
            address: form.customerAddress || null,
          }),
        });
      }
      toast.success("Pre-order berhasil dibuat & konfirmasi WA dikirim!");
      setCreateOpen(false);
      setForm({ ...EMPTY_FORM });
      setFormItems([{ ...EMPTY_ITEM }]);
      resetCustomerSearch();
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
    const validItems = formItems.filter((it) => it.name.trim() && it.unitPrice);
    if (validItems.length === 0) {
      toast.error("Minimal 1 item pesanan wajib diisi");
      return;
    }
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
          customerName: form.customerName,
          customerPhone: form.customerPhone,
          customerAddress: form.customerAddress,
          notes: form.notes,
          pickupDate: pickupDateTime?.toISOString(),
          deliveryType: form.deliveryType,
          items: validItems.map((it) => ({
            name: it.name.trim(),
            quantity: parseInt(it.quantity) || 1,
            unitPrice: parseFloat(it.unitPrice),
            notes: it.notes.trim() || undefined,
          })),
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
    const d = order.pickupDate ? new Date(order.pickupDate) : null;
    const validDate = d && !isNaN(d.getTime());
    const dateStr = validDate ? d!.toISOString().split("T")[0] : "";
    const timeStr = validDate
      ? `${String(d!.getHours()).padStart(2, "0")}:${String(d!.getMinutes()).padStart(2, "0")}`
      : "10:00";
    setForm({
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerAddress: order.customerAddress || "",
      notes: order.notes || "",
      dpAmount: String(order.dpAmount),
      dpMethod: order.dpMethod || "CASH",
      pickupDate: dateStr,
      pickupTime: timeStr,
      deliveryType: order.deliveryType,
    });
    // Populate formItems from existing items or fallback to single product fields
    if (order.items && order.items.length > 0) {
      setFormItems(order.items.map((it) => ({
        name: it.name,
        quantity: String(it.quantity),
        unitPrice: String(it.unitPrice),
        notes: it.notes || "",
      })));
    } else {
      setFormItems([{
        name: order.productName || "",
        quantity: String(order.quantity),
        unitPrice: String(order.unitPrice),
        notes: "",
      }]);
    }
    setEditOrder(order);
  };

  // ─── Customer search ──────────────────────────────────────────────────────

  useEffect(() => {
    const q = customerQuery.trim();
    if (!q) { setCustomerSuggestions([]); return; }
    const timer = setTimeout(async () => {
      setCustomerSearchLoading(true);
      try {
        const res = await fetch(`/api/customers?search=${encodeURIComponent(q)}`);
        if (res.ok) setCustomerSuggestions(await res.json());
      } finally {
        setCustomerSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [customerQuery]);

  // close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (customerSearchRef.current && !customerSearchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectCustomer = (c: Customer) => {
    setSelectedCustomer(c);
    setForm((f) => ({
      ...f,
      customerName: c.name,
      customerPhone: c.phone ?? "",
      customerAddress: c.address ?? "",
    }));
    setCustomerQuery(c.name);
    setShowSuggestions(false);
    setSaveAsNewCustomer(false);
  };

  const clearCustomerSelection = () => {
    setSelectedCustomer(null);
    setCustomerQuery("");
    setCustomerSuggestions([]);
    setForm((f) => ({ ...f, customerName: "", customerPhone: "", customerAddress: "" }));
  };

  const resetCustomerSearch = () => {
    setSelectedCustomer(null);
    setCustomerQuery("");
    setCustomerSuggestions([]);
    setSaveAsNewCustomer(false);
  };

  // ─── MVP: Recap / Print / WA Invoice / Excel Import ──────────────────────────

  const fetchRecap = useCallback(async () => {
    setLoadingRecap(true);
    try {
      const res = await fetch(`/api/pre-orders/recap?date=${recapDate}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRecapOrders(data.orders);
    } catch {
      toast.error("Gagal load rekap");
    } finally {
      setLoadingRecap(false);
    }
  }, [recapDate]);

  const handleSendInvoice = async (orderId: string) => {
    setSendingInvoice(orderId);
    try {
      const res = await fetch(`/api/pre-orders/${orderId}/send-invoice`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal kirim");
      toast.success("Invoice WA terkirim!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal kirim invoice WA");
    } finally {
      setSendingInvoice(null);
    }
  };

  const handlePrintLabels = (ids: string[]) => {
    window.open(`/print/orders?mode=labels&ids=${ids.join(",")}`, "_blank");
  };

  const handlePrintRecap = () => {
    window.open(`/print/orders?mode=recap&date=${recapDate}`, "_blank");
  };

  const handlePrintInvoice = (id: string) => {
    window.open(`/print/orders?mode=invoice&ids=${id}`, "_blank");
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportLoading(true);
    try {
      const xlsx = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = xlsx.read(buf, { type: "array", cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

      const created: string[] = [];
      for (const row of rows) {
        const pickupRaw = row["Tanggal Ambil"];
        let pickupDate = "";
        if (pickupRaw instanceof Date) {
          pickupDate = pickupRaw.toISOString().split("T")[0];
        } else if (typeof pickupRaw === "string" && pickupRaw) {
          pickupDate = pickupRaw.split("T")[0];
        }
        const payload = {
          customerName: String(row["Nama Pelanggan"] || ""),
          customerPhone: String(row["No HP"] || ""),
          productName: String(row["Produk"] || ""),
          quantity: parseInt(String(row["Qty"] || "1")),
          unitPrice: parseFloat(String(row["Harga"] || "0")),
          dpAmount: parseFloat(String(row["DP"] || "0")),
          dpMethod: "CASH",
          notes: String(row["Catatan"] || ""),
          pickupDate,
          pickupTime: String(row["Jam"] || "10:00"),
          deliveryType: String(row["Tipe"] || "PICKUP").toUpperCase(),
        };
        if (!payload.customerName || !payload.productName || !payload.pickupDate) continue;
        const res = await fetch("/api/pre-orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const d = await res.json();
          created.push(d.id);
        }
      }
      toast.success(`${created.length} pre-order berhasil diimport`);
      if (created.length > 0) {
        window.open(`/print/orders?mode=labels&ids=${created.join(",")}`, "_blank");
        fetchOrders();
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal import Excel");
    } finally {
      setImportLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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
        <div className="flex gap-2">
          {/* hidden file input for excel import */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleExcelImport}
          />
          <Button
            variant="outline"
            disabled={importLoading}
            onClick={() => fileInputRef.current?.click()}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            {importLoading ? "Importing..." : "Import Excel"}
          </Button>
          <Button onClick={() => { setForm({ ...EMPTY_FORM }); resetCustomerSearch(); setCreateOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Pre-Order Baru
          </Button>
        </div>
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

      {/* Tab Switcher */}
      <div className="flex gap-2 border-b pb-0">
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "orders"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Semua Order ({total})
        </button>
        <button
          onClick={() => { setActiveTab("recap"); fetchRecap(); }}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "recap"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <TableProperties className="h-3.5 w-3.5" />
          Rekap Besok
        </button>
      </div>

      {/* ── ORDERS TAB ─── */}
      {activeTab === "orders" && (
        <>
          {/* Batch actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3 flex-wrap">
              <span className="text-sm text-blue-700 font-medium">{selectedIds.size} dipilih</span>
              <Button size="sm" onClick={() => handlePrintLabels(Array.from(selectedIds))}>
                <Printer className="h-3.5 w-3.5 mr-1.5" />
                Cetak Label Pilihan
              </Button>
              <Button size="sm" variant="outline" onClick={() => window.open(`/print/orders?mode=invoice&ids=${Array.from(selectedIds).join(",")}`, "_blank")}>
                <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
                Cetak Invoice Pilihan
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
                Batal Pilih
              </Button>
            </div>
          )}

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
                  {/* Checkbox */}
                  <div className="flex-shrink-0 pt-0.5">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(order.id)}
                      onChange={() => toggleSelect(order.id)}
                      className="w-4 h-4 accent-primary cursor-pointer"
                    />
                  </div>
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

                    {/* Lunas button — any non-cancelled order with remaining > 0 */}
                    {Number(order.remainingAmount) > 0 && order.status !== "CANCELLED" && (
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
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Cetak Label"
                        onClick={() => handlePrintLabels([order.id])}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Cetak Invoice"
                        onClick={() => handlePrintInvoice(order.id)}
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                      </Button>
                      {order.customerPhone && (
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Kirim Invoice WA"
                          disabled={sendingInvoice === order.id}
                          onClick={() => handleSendInvoice(order.id)}
                        >
                          <Send className={`h-4 w-4 ${sendingInvoice === order.id ? "animate-pulse text-green-500" : ""}`} />
                        </Button>
                      )}
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
        </> )}

      {/* ── REKAP TAB ─────────────────────────────────────────────────────────── */}
      {activeTab === "recap" && (
        <div className="space-y-4">
          {/* Rekap controls */}
          <div className="flex gap-3 items-center flex-wrap">
            <Label className="text-sm font-medium">Tanggal:</Label>
            <Input
              type="date"
              value={recapDate}
              onChange={(e) => setRecapDate(e.target.value)}
              className="w-[160px]"
            />
            <Button variant="outline" onClick={fetchRecap} disabled={loadingRecap}>
              <RefreshCw className={`h-4 w-4 mr-1.5 ${loadingRecap ? "animate-spin" : ""}`} />
              Muat
            </Button>
            {recapOrders.length > 0 && (
              <>
                <Button onClick={handlePrintRecap}>
                  <Printer className="h-4 w-4 mr-1.5" />
                  Cetak Rekap A4
                </Button>
                <Button variant="outline" onClick={() => handlePrintLabels(recapOrders.map((o) => o.id))}>
                  <Printer className="h-4 w-4 mr-1.5" />
                  Cetak Semua Label
                </Button>
              </>
            )}
          </div>

          {/* Rekap table */}
          {loadingRecap ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : recapOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Tidak ada pesanan untuk tanggal ini
            </div>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">No.Order</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Pelanggan</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">HP</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Produk</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground text-xs">Total</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground text-xs">Sisa</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Jam</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Status</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {recapOrders.map((order, idx) => (
                    <tr key={order.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{order.orderNo}</td>
                      <td className="px-3 py-2 font-medium">{order.customerName}</td>
                      <td className="px-3 py-2 text-muted-foreground">{order.customerPhone}</td>
                      <td className="px-3 py-2">{order.productName}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(Number(order.totalPrice))}</td>
                      <td className="px-3 py-2 text-right">
                        {Number(order.remainingAmount) > 0 ? (
                          <span className="text-orange-600">{formatCurrency(Number(order.remainingAmount))}</span>
                        ) : (
                          <span className="text-green-600">Lunas</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {order.pickupDate && !isNaN(new Date(order.pickupDate).getTime())
                          ? new Date(order.pickupDate).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
                          : "-"}
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" title="Cetak Label" onClick={() => handlePrintLabels([order.id])}>
                            <Printer className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" title="Cetak Invoice" onClick={() => handlePrintInvoice(order.id)}>
                            <FileSpreadsheet className="h-3.5 w-3.5" />
                          </Button>
                          {order.customerPhone && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              title="Kirim Invoice WA"
                              disabled={sendingInvoice === order.id}
                              onClick={() => handleSendInvoice(order.id)}
                            >
                              <Send className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t bg-slate-100">
                  <tr>
                    <td colSpan={4} className="px-3 py-2 font-semibold text-sm">
                      Total {recapOrders.length} pesanan
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">
                      {formatCurrency(recapOrders.reduce((s, o) => s + Number(o.totalPrice), 0))}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-orange-600">
                      {formatCurrency(recapOrders.reduce((s, o) => s + Number(o.remainingAmount), 0))}
                    </td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── CREATE DIALOG ─────────────────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={(v) => { setCreateOpen(v); if (!v) { setForm({ ...EMPTY_FORM }); setFormItems([{ ...EMPTY_ITEM }]); resetCustomerSearch(); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Pre-Order Baru
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">

            {/* ── Row 1: Customer (left) | Jadwal & Pembayaran (right) ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  Data Customer
                </h4>
                <div className="space-y-1.5" ref={customerSearchRef}>
                  <Label className="flex items-center gap-1.5">
                    <UserSearch className="h-3.5 w-3.5" />
                    Cari Pelanggan
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder="Ketik nama / nomor HP..."
                      value={customerQuery}
                      onChange={(e) => {
                        setCustomerQuery(e.target.value);
                        setShowSuggestions(true);
                        if (selectedCustomer) setSelectedCustomer(null);
                      }}
                      onFocus={() => { if (customerQuery) setShowSuggestions(true); }}
                      className="pr-8"
                    />
                    {customerQuery && (
                      <button
                        type="button"
                        onClick={clearCustomerSelection}
                        className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                    {showSuggestions && customerQuery.trim() && (
                      <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {customerSearchLoading ? (
                          <div className="px-3 py-2 text-sm text-muted-foreground">Mencari...</div>
                        ) : customerSuggestions.length > 0 ? (
                          customerSuggestions.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onMouseDown={() => selectCustomer(c)}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex flex-col border-b last:border-0"
                            >
                              <span className="font-medium">{c.name}</span>
                              {c.phone && <span className="text-xs text-muted-foreground">{c.phone}</span>}
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
                            <UserPlus className="h-3.5 w-3.5" />
                            Pelanggan belum terdaftar — isi manual di bawah
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {selectedCustomer && (
                    <div className="flex items-center gap-2 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      <span>Terpilih: <b>{selectedCustomer.name}</b></span>
                      <button type="button" onClick={clearCustomerSelection} className="ml-auto">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
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
                {!selectedCustomer && form.customerName && (
                  <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={saveAsNewCustomer}
                      onChange={(e) => setSaveAsNewCustomer(e.target.checked)}
                      className="w-3.5 h-3.5 accent-primary"
                    />
                    <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Daftarkan sebagai pelanggan baru</span>
                  </label>
                )}
              </div>

              {/* Jadwal & Pembayaran */}
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
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PICKUP">🏪 Ambil di Toko</SelectItem>
                      <SelectItem value="DELIVERY">🚚 Delivery ke Alamat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
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
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {formItems.some((it) => it.unitPrice) && (
                  <p className="text-xs text-muted-foreground">
                    Sisa: {formatCurrency(
                      Math.max(0,
                        formItems.reduce((sum, it) => sum + (parseFloat(it.unitPrice) || 0) * (parseInt(it.quantity) || 1), 0)
                        - parseFloat(form.dpAmount || "0")
                      )
                    )}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* ── Row 2: Detail Pesanan — full width ── */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Detail Pesanan
              </h4>
              {/* Column labels */}
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span className="flex-1 min-w-0">Nama Produk / Kue</span>
                <span className="w-14 shrink-0 text-center">Qty</span>
                <span className="w-28 shrink-0">Harga Satuan</span>
                <span className="w-8 shrink-0" />
              </div>
              {/* Item rows */}
              <div className="space-y-2">
                {formItems.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex gap-2 items-center">
                      <Input
                        className="flex-1 min-w-0"
                        placeholder="cth: Black Forest 22cm"
                        value={item.name}
                        onChange={(e) =>
                          setFormItems((prev) => prev.map((it, i) => i === idx ? { ...it, name: e.target.value } : it))
                        }
                      />
                      <Input
                        type="number"
                        min="1"
                        className="w-14 shrink-0 text-center"
                        placeholder="1"
                        value={item.quantity}
                        onChange={(e) =>
                          setFormItems((prev) => prev.map((it, i) => i === idx ? { ...it, quantity: e.target.value } : it))
                        }
                      />
                      <Input
                        type="number"
                        className="w-28 shrink-0"
                        placeholder="Harga"
                        value={item.unitPrice}
                        onChange={(e) =>
                          setFormItems((prev) => prev.map((it, i) => i === idx ? { ...it, unitPrice: e.target.value } : it))
                        }
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-9 w-8 shrink-0 text-red-400 hover:text-red-600"
                        disabled={formItems.length === 1}
                        onClick={() => setFormItems((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Catatan item (opsional): rasa, dekorasi, tulisan kue…"
                      className="text-xs h-7"
                      value={item.notes}
                      onChange={(e) =>
                        setFormItems((prev) => prev.map((it, i) => i === idx ? { ...it, notes: e.target.value } : it))
                      }
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormItems((prev) => [...prev, { ...EMPTY_ITEM }])}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Tambah Item
                </Button>
                {formItems.some((it) => it.unitPrice) && (
                  <span className="text-sm font-semibold text-green-700">
                    Total: {formatCurrency(
                      formItems.reduce((sum, it) =>
                        sum + (parseFloat(it.unitPrice) || 0) * (parseInt(it.quantity) || 1), 0)
                    )}
                  </span>
                )}
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
                {/* Items list or fallback to single product */}
                {detailOrder.items && detailOrder.items.length > 0 ? (
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Pesanan</p>
                    {detailOrder.items.map((it) => (
                      <div key={it.id} className="flex justify-between text-sm">
                        <span className="font-medium">{it.name} <span className="text-muted-foreground">×{it.quantity}</span></span>
                        <span className="text-green-700">{formatCurrency(Number(it.subtotal))}</span>
                      </div>
                    ))}
                    {detailOrder.items.some((it) => it.notes) && (
                      <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                        {detailOrder.items.filter((it) => it.notes).map((it) => (
                          <p key={it.id}><span className="font-medium">{it.name}:</span> {it.notes}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <p className="font-semibold text-base">{detailOrder.productName}</p>
                    {detailOrder.description && (
                      <p className="text-muted-foreground">{detailOrder.description}</p>
                    )}
                  </>
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
                {(!detailOrder.items || detailOrder.items.length === 0) && (
                  <>
                    <div>
                      <p className="text-muted-foreground">Jumlah</p>
                      <p className="font-medium">{detailOrder.quantity} pcs</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Harga Satuan</p>
                      <p className="font-medium">{formatCurrency(Number(detailOrder.unitPrice))}</p>
                    </div>
                  </>
                )}
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

            <Separator />

            {/* Items table */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Item Pesanan</Label>
              <div className="grid grid-cols-[1fr_56px_96px_32px] gap-1 text-xs text-muted-foreground px-0.5">
                <span>Nama Produk</span><span>Qty</span><span>Harga Satuan</span><span />
              </div>
              {formItems.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="grid grid-cols-[1fr_56px_96px_32px] gap-1 items-start">
                    <Input
                      placeholder="Nama produk"
                      value={item.name}
                      onChange={(e) => setFormItems((prev) => prev.map((it, i) => i === idx ? { ...it, name: e.target.value } : it))}
                    />
                    <Input
                      type="number" min="1" placeholder="1"
                      value={item.quantity}
                      onChange={(e) => setFormItems((prev) => prev.map((it, i) => i === idx ? { ...it, quantity: e.target.value } : it))}
                    />
                    <Input
                      type="number" placeholder="0"
                      value={item.unitPrice}
                      onChange={(e) => setFormItems((prev) => prev.map((it, i) => i === idx ? { ...it, unitPrice: e.target.value } : it))}
                    />
                    <Button
                      type="button" size="icon" variant="ghost"
                      className="h-9 w-9 text-red-400 hover:text-red-600"
                      disabled={formItems.length === 1}
                      onClick={() => setFormItems((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Catatan item (opsional)"
                    className="text-xs h-7"
                    value={item.notes}
                    onChange={(e) => setFormItems((prev) => prev.map((it, i) => i === idx ? { ...it, notes: e.target.value } : it))}
                  />
                </div>
              ))}
              <div className="flex items-center justify-between pt-1">
                <Button type="button" variant="outline" size="sm"
                  onClick={() => setFormItems((prev) => [...prev, { ...EMPTY_ITEM }])}>
                  <Plus className="h-3.5 w-3.5 mr-1" />Tambah Item
                </Button>
                {formItems.some((it) => it.unitPrice) && (
                  <span className="text-sm font-semibold text-green-700">
                    Total: {formatCurrency(formItems.reduce((sum, it) => sum + (parseFloat(it.unitPrice) || 0) * (parseInt(it.quantity) || 1), 0))}
                  </span>
                )}
              </div>
            </div>

            <Separator />

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
                <p className="font-medium">
                  {payOrder.items && payOrder.items.length > 0
                    ? payOrder.items.map((it) => `${it.name} ×${it.quantity}`).join(", ")
                    : payOrder.productName}
                </p>
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
