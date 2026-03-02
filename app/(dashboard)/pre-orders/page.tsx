"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  Calendar,
  StickyNote,
  Printer,
  FileSpreadsheet,
  TableProperties,
  X,
  Plus,
} from "lucide-react";
import { alertSuccess, alertError, confirmDestroy, confirmAction } from "@/lib/swal";
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
  PENDING:       { label: "Pending",      color: "bg-yellow-100 text-yellow-800", icon: Clock },
  CONFIRMED:     { label: "Dibuat",        color: "bg-blue-100 text-blue-800",    icon: CheckCircle2 },
  IN_PRODUCTION: { label: "Diproses",     color: "bg-purple-100 text-purple-800", icon: ChefHat },
  READY:         { label: "Siap Diantar", color: "bg-green-100 text-green-800",  icon: PackageCheck },
  COMPLETED:     { label: "Selesai",      color: "bg-gray-100 text-gray-700",    icon: CheckCircle2 },
  CANCELLED:     { label: "Dibatalkan",   color: "bg-red-100 text-red-800",      icon: XCircle },
};

// Status progression: Pending → Dibuat → Siap Diantar → Selesai
const NEXT_STATUS: Partial<Record<PreOrderStatus, PreOrderStatus>> = {
  PENDING:   "CONFIRMED",
  CONFIRMED: "READY",
  READY:     "COMPLETED",
};

const NEXT_STATUS_LABEL: Partial<Record<PreOrderStatus, string>> = {
  PENDING:   "Tandai Dibuat",
  CONFIRMED: "Siap Diantar",
  READY:     "Selesai",
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

// ─── Available product type for dropdown ─────────────────────────────────────
interface AvailableProduct {
  id: string;
  name: string;
  price: number;
  images: string[];
}

function EditItemCombobox({
  value,
  onChange,
  onSelectProduct,
  products,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelectProduct: (p: AvailableProduct) => void;
  products: AvailableProduct[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered =
    value.trim().length === 0
      ? products
      : products.filter((p) => p.name.toLowerCase().includes(value.toLowerCase()));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <Input
        placeholder="Nama produk"
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
      />
      {open && products.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-40 overflow-y-auto">
          {filtered.length > 0 ? (
            filtered.map((p) => (
              <button
                key={p.id}
                type="button"
                className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-accent"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelectProduct(p);
                  onChange(p.name);
                  setOpen(false);
                }}
              >
                {p.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0]} alt="" className="h-6 w-6 rounded object-cover shrink-0" />
                ) : (
                  <div className="h-6 w-6 rounded bg-muted shrink-0 flex items-center justify-center text-xs font-bold text-muted-foreground">
                    {p.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{formatCurrency(p.price)}</div>
                </div>
              </button>
            ))
          ) : (
            <div className="px-2 py-1.5 text-xs text-muted-foreground italic">Tidak ada produk cocok</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function PreOrdersPage() {
  const [orders, setOrders] = useState<PreOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterDate, setFilterDate] = useState("");

  // Dialogs
  const [detailOrder, setDetailOrder] = useState<PreOrder | null>(null);
  const [editOrder, setEditOrder] = useState<PreOrder | null>(null);
  const [cancelOrder, setCancelOrder] = useState<PreOrder | null>(null);
  const [completeOrder, setCompleteOrder] = useState<PreOrder | null>(null);
  const [completePayMethod, setCompletePayMethod] = useState("CASH");

  // Form state (edit only)
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [formItems, setFormItems] = useState<FormItem[]>([{ ...EMPTY_ITEM }]);
  const [cancelReason, setCancelReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<AvailableProduct[]>([]);

  // MVP extras
  const [activeTab, setActiveTab] = useState<"orders" | "recap">("orders");
  const [recapOrders, setRecapOrders] = useState<PreOrder[]>([]);
  const [recapDate, setRecapDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [loadingRecap, setLoadingRecap] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "ALL") params.set("status", filterStatus);
      if (search) params.set("search", search);
      if (filterDate) params.set("date", filterDate);
      const res = await fetch(`/api/pre-orders?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOrders(data.orders);
      setTotal(data.total);
    } catch {
      alertError("Gagal memuat data pre-order.");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, search, filterDate]);

  useEffect(() => {
    const t = setTimeout(fetchOrders, 300);
    return () => clearTimeout(t);
  }, [fetchOrders]);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: unknown) => {
        const items = Array.isArray(data) ? data : [];
        setAvailableProducts(
          (items as Array<{ id: string; name: string; basePrice?: number; price?: number; images?: string[]; isActive?: boolean; category?: { name?: string } }>)
            .filter((p) => p.isActive && p.category?.name === "Pre-Order")
            .map((p) => ({
              id: p.id,
              name: p.name,
              price: Number(p.basePrice ?? p.price ?? 0),
              images: p.images ?? [],
            }))
        );
      })
      .catch(() => {});
  }, []);

  // ── Computed totals ───────────────────────────────────────────────────────
  const stats = {
    pending:    orders.filter((o) => o.status === "PENDING").length,
    dibuat:     orders.filter((o) => o.status === "CONFIRMED").length,
    siapDiantar:orders.filter((o) => o.status === "READY").length,
    selesai:    orders.filter((o) => o.status === "COMPLETED").length,
  };

  // ── Create ──  (moved to POS — no create on this page)

  // ── Update status ─────────────────────────────────────────────────────────
  const handleNextStatus = async (order: PreOrder) => {
    const nextStatus = NEXT_STATUS[order.status];
    if (!nextStatus) return;
    // Selesai always goes through confirmation dialog
    if (nextStatus === "COMPLETED") {
      setCompleteOrder(order);
      setCompletePayMethod("CASH");
      return;
    }
    try {
      const res = await fetch(`/api/pre-orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_status", status: nextStatus }),
      });
      if (!res.ok) throw new Error();
      alertSuccess(`Status diubah ke ${STATUS_CONFIG[nextStatus].label}`);
      fetchOrders();
    } catch {
      alertError("Gagal update status.");
    }
  };

  // ── Complete (Selesai + Lunas) ────────────────────────────────────────────
  const handleComplete = async () => {
    if (!completeOrder) return;
    setSaving(true);
    try {
      let res: Response;
      if (Number(completeOrder.remainingAmount) > 0) {
        // Pay remaining + auto-set COMPLETED
        res = await fetch(`/api/pre-orders/${completeOrder.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "pay_remaining", payMethod: completePayMethod }),
        });
      } else {
        // Already fully paid, just mark completed
        res = await fetch(`/api/pre-orders/${completeOrder.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "update_status", status: "COMPLETED" }),
        });
      }
      if (!res.ok) throw new Error();
      alertSuccess("Pesanan telah diselesaikan!", "Pesanan Selesai");
      setCompleteOrder(null);
      fetchOrders();
    } catch {
      alertError("Gagal menyelesaikan pesanan.");
    } finally {
      setSaving(false);
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
      alertSuccess("Pre-order dibatalkan.");
      setCancelOrder(null);
      setCancelReason("");
      fetchOrders();
    } catch {
      alertError("Gagal membatalkan.");
    } finally {
      setSaving(false);
    }
  };

  // handlePayRemaining removed — payment now handled via Selesai confirmation

  // ── Edit save ─────────────────────────────────────────────────────────────
  const handleEditSave = async () => {
    if (!editOrder) return;
    const validItems = formItems.filter((it) => it.name.trim() && it.unitPrice);
    if (validItems.length === 0) {
      alertError("Minimal 1 item pesanan wajib diisi.");
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
      alertSuccess("Pre-order berhasil diperbarui.");
      setEditOrder(null);
      fetchOrders();
    } catch {
      alertError("Gagal menyimpan perubahan.");
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

  // ─── MVP: Recap / Print ──────────────────────────────────────────────────────

  const fetchRecap = useCallback(async () => {
    setLoadingRecap(true);
    try {
      const res = await fetch(`/api/pre-orders/recap?date=${recapDate}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRecapOrders(data.orders);
    } catch {
      alertError("Gagal memuat data rekap.");
    } finally {
      setLoadingRecap(false);
    }
  }, [recapDate]);

  const handleSendInvoice = async (_orderId: string) => {
    // WA notifications removed — only sent on completion via API
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

  const isAllSelected = orders.length > 0 && orders.every((o) => selectedIds.has(o.id));
  const isSomeSelected = orders.some((o) => selectedIds.has(o.id)) && !isAllSelected;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(orders.map((o) => o.id)));
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-5 lg:p-7 space-y-5">
      {/* ── Page header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Pre-Order</h1>
        <p className="text-sm text-gray-500 mt-0.5">Kelola &amp; pantau status pesanan</p>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Pending",       value: stats.pending,     bg: "oklch(0.97 0.06 80)",  text: "oklch(0.50 0.14 70)", icon: Clock },
          { label: "Dibuat",        value: stats.dibuat,      bg: "oklch(0.95 0.05 240)", text: "oklch(0.45 0.14 240)", icon: CheckCircle2 },
          { label: "Siap Diantar",  value: stats.siapDiantar, bg: "oklch(0.94 0.06 145)", text: "oklch(0.40 0.10 145)", icon: Truck },
          { label: "Selesai",       value: stats.selesai,     bg: "oklch(0.97 0.002 80)", text: "oklch(0.50 0 0)",      icon: PackageCheck },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-4 flex items-center justify-between"
            style={{ background: "white", border: "1px solid var(--border)", boxShadow: "0 1px 3px oklch(0 0 0 / 5%)" }}
          >
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">{s.label}</p>
              <p className="text-2xl font-bold" style={{ color: s.text }}>{s.value}</p>
            </div>
            <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: s.bg }}>
              <s.icon className="h-5 w-5" style={{ color: s.text }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Tab Switcher ── */}
      <div className="flex gap-0 border-b" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={() => setActiveTab("orders")}
          className="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors"
          style={activeTab === "orders"
            ? { borderColor: "var(--brand, oklch(0.68 0.16 55))", color: "var(--brand, oklch(0.68 0.16 55))" }
            : { borderColor: "transparent", color: "oklch(0.5 0 0)" }}
        >
          Semua Order ({total})
        </button>
        <button
          onClick={() => { setActiveTab("recap"); fetchRecap(); }}
          className="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5"
          style={activeTab === "recap"
            ? { borderColor: "var(--brand, oklch(0.68 0.16 55))", color: "var(--brand, oklch(0.68 0.16 55))" }
            : { borderColor: "transparent", color: "oklch(0.5 0 0)" }}
        >
          <TableProperties className="h-3.5 w-3.5" />
          Rekap Besok
        </button>
      </div>

      {/* ── ORDERS TAB ─── */}
      {activeTab === "orders" && (
        <>
          {/* ── Batch actions ── */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 rounded-xl p-3 flex-wrap"
                 style={{ background: "oklch(0.95 0.05 240)", border: "1px solid oklch(0.82 0.08 240)" }}>
              <span className="text-sm font-semibold" style={{ color: "oklch(0.40 0.14 240)" }}>{selectedIds.size} dipilih</span>
              <Button size="sm" onClick={() => handlePrintLabels(Array.from(selectedIds))}>
                <Printer className="h-3.5 w-3.5 mr-1.5" />
                Cetak Label
              </Button>
              <Button size="sm" variant="outline" onClick={() => window.open(`/print/orders?mode=invoice&ids=${Array.from(selectedIds).join(",")}`, "_blank")}>
                <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
                Cetak Invoice
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
                <X className="h-3.5 w-3.5 mr-1" />
                Batal Pilih
              </Button>
            </div>
          )}

          {/* ── Filters ── */}
          <div className="flex gap-2 flex-wrap items-center">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                className="w-4 h-4 cursor-pointer rounded"
                style={{ accentColor: "var(--brand, oklch(0.68 0.16 55))" }}
                checked={isAllSelected}
                ref={(el) => { if (el) el.indeterminate = isSomeSelected; }}
                onChange={toggleSelectAll}
                title={isAllSelected ? "Batal pilih semua" : "Pilih semua"}
              />
              {(isAllSelected || isSomeSelected) && (
                <span className="text-xs text-gray-400 whitespace-nowrap">{selectedIds.size}/{orders.length}</span>
              )}
            </div>
            <div className="relative flex-1 min-w-50">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari nama, HP, produk, nomor order..."
                className="pl-9 h-9 bg-white border-gray-200 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-9 w-full sm:w-44 text-sm border-gray-200 bg-white">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              <Input
                type="date"
                className="h-9 w-44 text-sm border-gray-200 bg-white"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
              {filterDate && (
                <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400" onClick={() => setFilterDate("")}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={fetchOrders}>
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
            <div
              key={order.id}
              className="rounded-xl bg-white p-4 transition-shadow hover:shadow-md"
              style={{ border: "1px solid var(--border)", boxShadow: "0 1px 3px oklch(0 0 0 / 5%)" }}
            >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  {/* Checkbox */}
                  <div className="shrink-0 pt-0.5">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(order.id)}
                      onChange={() => toggleSelect(order.id)}
                      className="w-4 h-4 cursor-pointer rounded"
                      style={{ accentColor: "var(--brand, oklch(0.68 0.16 55))" }}
                    />
                  </div>
                  {/* Left info */}
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-gray-400">{order.orderNo}</span>
                      <StatusBadge status={order.status} />
                      <span className="text-xs text-gray-500" style={{ background: "oklch(0.97 0.002 80)", borderRadius: "4px", padding: "1px 6px" }}>
                        {order.deliveryType === "PICKUP" ? "🏪 Pickup" : "🚚 Delivery"}
                      </span>
                    </div>
                    <div className="font-semibold text-sm text-gray-900">{order.productName}</div>
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
                          <span className="text-green-600">Lunas</span>
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
              </div>
          ))}
        </div>
      )}
      </>)}

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
              className="h-9 w-44 text-sm border-gray-200 bg-white"
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
            <div className="rounded-xl border overflow-x-auto" style={{ boxShadow: "0 1px 3px oklch(0 0 0 / 5%)" }}>
              <table className="w-full text-sm">
                <thead style={{ background: "oklch(0.97 0.002 80)", borderBottom: "1px solid var(--border)" }}>
                  <tr>
                    <th className="text-left px-3 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">No.Order</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Pelanggan</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">HP</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Produk</th>
                    <th className="text-right px-3 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Total</th>
                    <th className="text-right px-3 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Sisa</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Jam</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Status</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {recapOrders.map((order, idx) => (
                    <tr key={order.id} className="hover:bg-gray-50/60 transition-colors">
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
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot style={{ borderTop: "1px solid var(--border)", background: "oklch(0.97 0.002 80)" }}>
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
              <div className="grid grid-cols-2 gap-2 text-xs rounded-lg p-3" style={{ background: "oklch(0.97 0.002 80)" }}>
                <div>
                  <p className="text-gray-500">Customer</p>
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
                    <EditItemCombobox
                      value={item.name}
                      onChange={(v) => setFormItems((prev) => prev.map((it, i) => i === idx ? { ...it, name: v } : it))}
                      onSelectProduct={(p) => setFormItems((prev) => prev.map((it, i) =>
                        i === idx ? { ...it, name: p.name, unitPrice: String(p.price) } : it
                      ))}
                      products={availableProducts}
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
                  <SelectItem value="PICKUP">Ambil di Toko</SelectItem>
                  <SelectItem value="DELIVERY">Diantar</SelectItem>
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

      {/* ── SELESAI CONFIRMATION DIALOG ──────────────────────────────────────── */}
      <Dialog open={!!completeOrder} onOpenChange={() => setCompleteOrder(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Tandai Selesai?</DialogTitle>
          </DialogHeader>
          {completeOrder && (
            <div className="space-y-3 py-2">
              <p className="text-sm text-muted-foreground">
                Pre-order <b>{completeOrder.orderNo}</b> akan ditandai selesai.
              </p>
              {Number(completeOrder.remainingAmount) > 0 ? (
                <>
                  <div className="rounded border border-orange-200 bg-orange-50 p-2 text-sm text-orange-700">
                    Masih ada sisa pembayaran{" "}
                    <b>{formatCurrency(Number(completeOrder.remainingAmount))}</b>.
                    Konfirmasi ini akan mencatat pelunasan sekaligus.
                  </div>
                  <div className="space-y-1.5">
                    <Label>Metode Pelunasan</Label>
                    <Select value={completePayMethod} onValueChange={setCompletePayMethod}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <p className="text-sm text-green-600">
                  Pesanan ini sudah lunas. Tandai sebagai selesai?
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteOrder(null)} disabled={saving}>Batal</Button>
            <Button onClick={handleComplete} disabled={saving}>
              {saving ? "Memproses..." : "Ya, Selesai"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
