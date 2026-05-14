"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes?: string;
}

interface Order {
  id: string;
  ticketNo: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  title: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  dpAmount: number;
  dpMethod?: string;
  remainingAmount: number;
  dueDate: string;
  deliveryType: "PICKUP" | "DELIVERY";
  status: string;
  notes?: string;
  items: OrderItem[];
}

// ─── Store info type ────────────────────────────────────────────────────────────

interface StoreInfo {
  name: string;
  phone: string;
  address: string;
  logo?: string;
}

type PrintPaper = "a4" | "thermal";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string | Date | null | undefined) {
  if (!d) return "-";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dt);
}

function fmtDateShort(d: string | Date | null | undefined) {
  if (!d) return "-";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(dt);
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

// ─── Label Component ──────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Dikonfirmasi",
  PROCESSING: "Produksi",
  IN_PRODUCTION: "Produksi",
  READY: "Siap Ambil",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

// Label produksi: thermal-receipt style
function OrderLabel({ order, store }: { order: Order; store: StoreInfo }) {
  const dueDateObj = order.dueDate ? new Date(order.dueDate) : null;
  const dueDateValid = dueDateObj && !isNaN(dueDateObj.getTime());

  const itemLines =
    order.items.length > 0
      ? order.items
      : [{ id: "-", name: order.title, quantity: order.quantity, unitPrice: 0, subtotal: 0, notes: order.description ?? undefined }];

  return (
    <div className="label-card">
      {/* Header toko */}
      <div className="rc-header">
        {store.logo && <img src={store.logo} alt="logo" className="rc-logo" />}
        <div className="rc-store-name">{store.name.toUpperCase()}</div>
        {store.phone && <div className="rc-store-sub">{store.phone}</div>}
      </div>

      <div className="rc-divider" />

      {/* No order + customer */}
      <div className="rc-row-between">
        <span className="rc-label">No. Order</span>
        <span className="rc-mono">{order.ticketNo}</span>
      </div>
      <div className="rc-customer">{order.customerName}</div>

      <div className="rc-divider" />

      {/* Items */}
      <div className="rc-section-title">PRODUKSI</div>
      {itemLines.map((it, i) => (
        <div key={i}>
          <div className="rc-row-between">
            <span className="rc-item-name">{it.quantity}x {it.name}</span>
          </div>
          {it.notes && <div className="rc-item-note">{it.notes}</div>}
        </div>
      ))}
      {order.notes && <div className="rc-item-note">Ket: {order.notes}</div>}

      <div className="rc-divider" />

      {/* Jadwal */}
      <div className="rc-row-between">
        <span className="rc-badge">{order.deliveryType === "DELIVERY" ? "ANTAR" : "AMBIL"}</span>
        <span className="rc-date">
          {dueDateValid
            ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(dueDateObj!)
            : "-"}
        </span>
      </div>
    </div>
  );
}

// ─── Recap Component ─────────────────────────────────────────────────────────

function RecapSheet({ orders, date, storeName }: { orders: Order[]; date: string; storeName: string }) {
  const totalRevenue = orders.reduce((s, o) => s + Number(o.totalPrice), 0);
  const totalDP = orders.reduce((s, o) => s + Number(o.dpAmount), 0);
  const totalSisa = orders.reduce((s, o) => s + Number(o.remainingAmount), 0);

  return (
    <div className="recap-sheet">
      <div className="recap-header">
        <h1>{storeName}</h1>
        <h2>REKAP PESANAN — {fmtDateShort(date)}</h2>
        <p>Total: {orders.length} pesanan | Omzet: {fmtCurrency(totalRevenue)} | DP: {fmtCurrency(totalDP)} | Sisa tagihan: {fmtCurrency(totalSisa)}</p>
      </div>

      <table className="recap-table">
        <thead>
          <tr>
            <th>No</th>
            <th>No. Order</th>
            <th>Pelanggan</th>
            <th>HP</th>
            <th>Produk</th>
            <th>Total</th>
            <th>DP</th>
            <th>Sisa</th>
            <th>Jam</th>
            <th>Tipe</th>
            <th>Catatan</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o, i) => {
            const itemDisplay =
              o.items.length > 0
                ? o.items.map((it) => `${it.name} ×${it.quantity}`).join(", ")
                : `${o.title} ×${o.quantity}`;
            const dueDt = o.dueDate ? new Date(o.dueDate) : null;
            const time = dueDt && !isNaN(dueDt.getTime())
              ? new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(dueDt)
              : "-";

            return (
              <tr key={o.id} className={i % 2 === 0 ? "even" : "odd"}>
                <td className="center">{i + 1}</td>
                <td className="mono">{o.ticketNo}</td>
                <td><strong>{o.customerName}</strong></td>
                <td>{o.customerPhone}</td>
                <td>{itemDisplay}</td>
                <td className="right">{fmtCurrency(Number(o.totalPrice))}</td>
                <td className="right">{Number(o.dpAmount) > 0 ? fmtCurrency(Number(o.dpAmount)) : "-"}</td>
                <td className={`right ${Number(o.remainingAmount) > 0 ? "unpaid-cell" : "paid-cell"}`}>
                  {Number(o.remainingAmount) > 0 ? fmtCurrency(Number(o.remainingAmount)) : "LUNAS"}
                </td>
                <td className="center">{time}</td>
                <td className="center">{o.deliveryType === "DELIVERY" ? "Antar" : "Ambil"}</td>
                <td className="notes-cell">{o.notes ?? ""}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={5} className="right"><strong>TOTAL</strong></td>
            <td className="right"><strong>{fmtCurrency(totalRevenue)}</strong></td>
            <td className="right"><strong>{fmtCurrency(totalDP)}</strong></td>
            <td className="right"><strong>{fmtCurrency(totalSisa)}</strong></td>
            <td colSpan={3} />
          </tr>
        </tfoot>
      </table>

      <div className="recap-footer">
        Dicetak: {new Intl.DateTimeFormat("id-ID", { dateStyle: "full", timeStyle: "short" }).format(new Date())}
      </div>
    </div>
  );
}

// Invoice: thermal-receipt style
function InvoiceDoc({ order, store }: { order: Order; store: StoreInfo }) {
  const isPaid = Number(order.remainingAmount) === 0;
  const dueDt = order.dueDate ? new Date(order.dueDate) : null;
  const dueDateValid = dueDt && !isNaN(dueDt.getTime());

  const itemLines =
    order.items.length > 0
      ? order.items
      : [{ id: "-", name: order.title, quantity: order.quantity, unitPrice: Number(order.unitPrice), subtotal: Number(order.totalPrice), notes: order.description ?? undefined }];

  return (
    <div className="invoice-card">
      {/* Header toko */}
      <div className="rc-header">
        {store.logo && <img src={store.logo} alt="logo" className="rc-logo" />}
        <div className="rc-store-name">{store.name.toUpperCase()}</div>
        {store.phone && <div className="rc-store-sub">{store.phone}</div>}
        {store.address && <div className="rc-store-sub">{store.address}</div>}
      </div>

      <div className="rc-divider" />

      {/* No order */}
      <div className="rc-row-between">
        <span className="rc-label">No. Order</span>
        <span className="rc-mono">{order.ticketNo}</span>
      </div>
      {dueDateValid && (
        <div className="rc-row-between">
          <span className="rc-label">Jadwal</span>
          <span className="rc-val">
            {new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(dueDt!)}
          </span>
        </div>
      )}

      <div className="rc-divider" />

      {/* Penerima */}
      <div className="rc-section-title">PENERIMA</div>
      <div className="rc-customer">{order.customerName}</div>
      <div className="rc-val-sm">{order.customerPhone || "-"}</div>
      {order.customerAddress && <div className="rc-val-sm">{order.customerAddress}</div>}

      <div className="rc-divider" />

      {/* Items */}
      <div className="rc-section-title">PESANAN</div>
      {itemLines.map((it, i) => (
        <div key={i}>
          <div className="rc-row-between">
            <span className="rc-item-name">{it.quantity}x {it.name}</span>
            <span className="rc-item-price">{fmtCurrency(it.subtotal)}</span>
          </div>
          {it.notes && <div className="rc-item-note">{it.notes}</div>}
        </div>
      ))}
      {order.notes && <div className="rc-item-note">Ket: {order.notes}</div>}

      <div className="rc-divider" />

      {/* Totals */}
      <div className="rc-row-between">
        <span className="rc-label">Total</span>
        <span className="rc-val-bold">{fmtCurrency(Number(order.totalPrice))}</span>
      </div>
      {Number(order.dpAmount) > 0 && (
        <div className="rc-row-between">
          <span className="rc-label">DP {order.dpMethod ? `(${order.dpMethod})` : ""}</span>
          <span className="rc-val">{fmtCurrency(Number(order.dpAmount))}</span>
        </div>
      )}
      <div className="rc-row-between">
        <span className="rc-label">Sisa tagihan</span>
        <span className={`rc-val ${isPaid ? "rc-paid" : "rc-unpaid"}`}>
          {isPaid ? "LUNAS" : fmtCurrency(Number(order.remainingAmount))}
        </span>
      </div>

      <div className="rc-divider" />

      {/* Delivery */}
      <div className="rc-row-between">
        <span className="rc-badge">{order.deliveryType === "DELIVERY" ? "ANTAR" : "AMBIL"}</span>
        <span className={`rc-status-badge ${isPaid ? "paid" : "unpaid"}`}>
          {isPaid ? "LUNAS" : "BELUM LUNAS"}
        </span>
      </div>
    </div>
  );
}

// ─── Main Print Page ──────────────────────────────────────────────────────────

function PrintContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") ?? "labels"; // "labels" | "recap" | "invoice"
  const ids = searchParams.get("ids"); // comma-separated order IDs
  const date = searchParams.get("date"); // YYYY-MM-DD
  const paperParam = (searchParams.get("paper") ?? searchParams.get("format") ?? "a4").toLowerCase();
  const paper: PrintPaper =
    mode !== "recap" && ["thermal", "receipt", "resi"].includes(paperParam)
      ? "thermal"
      : "a4";
  const paperLabel = paper === "thermal" ? "Printer resi" : "HVS / A4";

  const [orders, setOrders] = useState<Order[]>([]);
  const [recapDate, setRecapDate] = useState<string>("");
  const [storeInfo, setStoreInfo] = useState<StoreInfo>({ name: "Toko", phone: "", address: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        // Load store info
        const settingsRes = await fetch("/api/settings");
        if (settingsRes.ok) {
          const s = await settingsRes.json();
          setStoreInfo({
            name: s.businessName ?? "Toko",
            phone: s.businessPhone ?? "",
            address: s.businessAddress ?? "",
            logo: s.logo ?? undefined,
          });
        }

        if (mode === "recap" || (mode === "labels" && !ids)) {
          // Load by date
          const dateQ = date ?? "";
          const res = await fetch(`/api/pre-orders/recap${dateQ ? `?date=${dateQ}` : ""}`);
          if (!res.ok) throw new Error("Gagal memuat data");
          const data = await res.json();
          setOrders(data.orders);
          setRecapDate(data.date);
        } else if (ids) {
          // Load specific orders by IDs
          const idList = ids.split(",").filter(Boolean);
          const results = await Promise.all(
            idList.map((id) => fetch(`/api/pre-orders/${id}`).then((r) => r.json()))
          );
          setOrders(results.filter((r) => r && !r.error));
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Gagal memuat");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [mode, ids, date]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontSize: 18 }}>
        Memuat data...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ color: "red", padding: 32 }}>Error: {error}</div>
    );
  }

  if (orders.length === 0) {
    return (
      <div style={{ padding: 32, textAlign: "center" }}>
        <p>Tidak ada pesanan ditemukan.</p>
        <button onClick={() => window.close()} style={{ marginTop: 16, padding: "8px 16px" }}>
          Tutup
        </button>
      </div>
    );
  }

  return (
    <>
      <div className={`print-page print-${paper}`}>
        {/* Print controls — hidden on print */}
        <div className="print-controls no-print">
          <strong>{orders.length} pesanan</strong>
          <span>Format: {paperLabel}</span>
          <button onClick={() => window.print()} className="btn-print">
            Cetak
          </button>
          <button onClick={() => window.close()} className="btn-close">
            Tutup
          </button>
        </div>

        {mode === "recap" ? (
          <RecapSheet orders={orders} date={recapDate} storeName={storeInfo.name} />
        ) : mode === "invoice" ? (
          <div className="invoice-grid">
            {orders.map((order) => (
              <InvoiceDoc key={order.id} order={order} store={storeInfo} />
            ))}
          </div>
        ) : (
          <div className="labels-grid">
            {orders.map((order) => (
              <OrderLabel key={order.id} order={order} store={storeInfo} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; background: #f5f5f5; }
        .print-page { min-height: 100vh; }

        /* ── Print controls ── */
        .print-controls {
          position: fixed;
          top: 0; left: 0; right: 0;
          background: #1e40af;
          color: white;
          padding: 10px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          z-index: 100;
          font-size: 14px;
        }
        .btn-print {
          background: white; color: #1e40af;
          border: none; padding: 6px 16px; border-radius: 6px;
          cursor: pointer; font-weight: bold; font-size: 14px;
        }
        .btn-close {
          background: rgba(255,255,255,0.2); color: white;
          border: none; padding: 6px 12px; border-radius: 6px;
          cursor: pointer; font-size: 14px;
        }

        /* ── Labels grid (produksi) ── */
        .labels-grid {
          padding: 48px 16px 16px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          max-width: 860px;
          margin: 0 auto;
        }

        /* ── Shared receipt card ── */
        .label-card, .invoice-card {
          border: 1px solid #d1d5db;
          border-radius: 6px;
          padding: 12px;
          background: white;
          page-break-inside: avoid;
          break-inside: avoid;
          display: flex;
          flex-direction: column;
          gap: 0;
          font-family: 'Courier New', Courier, monospace;
          font-size: 11px;
        }

        /* ── Receipt header ── */
        .rc-header {
          text-align: center;
          padding-bottom: 6px;
        }
        .rc-logo {
          height: 36px;
          width: auto;
          object-fit: contain;
          display: block;
          margin: 0 auto 4px;
        }
        .rc-store-name {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 1px;
          color: #111;
        }
        .rc-store-sub { font-size: 10px; color: #555; }

        /* ── Divider ── */
        .rc-divider { border-top: 1px dashed #999; margin: 6px 0; }

        /* ── Section title ── */
        .rc-section-title {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1px;
          color: #888;
          text-transform: uppercase;
          margin-bottom: 2px;
        }

        /* ── Row helpers ── */
        .rc-row-between {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 4px;
          margin-bottom: 2px;
          min-width: 0;
        }
        .rc-label { color: #555; font-size: 10px; }
        .rc-mono { font-family: monospace; font-size: 10px; color: #777; }
        .rc-val { font-size: 10px; color: #111; }
        .rc-val-sm { font-size: 10px; color: #555; overflow-wrap: anywhere; }
        .rc-val-bold { font-size: 11px; font-weight: 700; color: #111; }
        .rc-paid { color: #15803d; font-weight: 700; }
        .rc-unpaid { color: #b91c1c; font-weight: 700; }

        /* ── Customer name ── */
        .rc-customer {
          font-size: 14px;
          font-weight: 700;
          color: #111;
          line-height: 1.2;
          margin-bottom: 2px;
        }

        /* ── Item rows ── */
        .rc-item-name { font-weight: 600; color: #111; flex: 1; overflow-wrap: anywhere; }
        .rc-item-price { white-space: nowrap; font-size: 10px; color: #111; }
        .rc-item-note { font-size: 9px; color: #777; font-style: italic; padding-left: 8px; margin-bottom: 2px; overflow-wrap: anywhere; }

        /* ── Badge + status ── */
        .rc-badge {
          font-size: 9px;
          font-weight: 700;
          padding: 2px 6px;
          border: 1px solid #555;
          border-radius: 3px;
          letter-spacing: 0.5px;
        }
        .rc-status-badge {
          font-size: 9px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 3px;
          border: 1px solid;
          letter-spacing: 0.5px;
        }
        .rc-status-badge.paid { color: #15803d; border-color: #15803d; background: #f0fdf4; }
        .rc-status-badge.unpaid { color: #b91c1c; border-color: #b91c1c; background: #fef2f2; }
        .rc-date { font-size: 10px; font-weight: 700; color: #dc2626; }

        /* ── Recap sheet ── */
        .recap-sheet {
          padding: 48px 24px 24px;
          max-width: 100%;
        }
        .recap-header {
          text-align: center;
          margin-bottom: 16px;
          border-bottom: 2px solid #1e293b;
          padding-bottom: 12px;
        }
        .recap-header h1 { font-size: 20px; font-weight: 800; }
        .recap-header h2 { font-size: 16px; font-weight: 700; margin-top: 4px; }
        .recap-header p { font-size: 12px; color: #475569; margin-top: 4px; }
        .recap-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
          margin-top: 8px;
        }
        .recap-table th {
          background: #1e293b;
          color: white;
          padding: 6px 8px;
          text-align: left;
          white-space: nowrap;
        }
        .recap-table td {
          padding: 5px 8px;
          border-bottom: 1px solid #e2e8f0;
          vertical-align: top;
        }
        .recap-table tr.even td { background: #f8fafc; }
        .recap-table tfoot td { border-top: 2px solid #1e293b; background: #f1f5f9; }
        .center { text-align: center; }
        .right { text-align: right; white-space: nowrap; }
        .mono { font-family: monospace; font-size: 10px; }
        .paid-cell { color: #15803d; font-weight: bold; }
        .unpaid-cell { color: #b91c1c; font-weight: bold; }
        .notes-cell { font-size: 10px; color: #64748b; max-width: 120px; }
        .recap-footer {
          margin-top: 12px;
          font-size: 10px;
          color: #94a3b8;
          text-align: right;
        }

        /* ── Invoice grid ── */
        .invoice-grid {
          padding: 48px 16px 16px;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          max-width: 860px;
          margin: 0 auto;
        }

        /* ── Thermal receipt preview ── */
        .print-thermal {
          width: 80mm;
          max-width: 80mm;
          margin: 0 auto;
          background: white;
        }
        .print-thermal .print-controls {
          left: 50%;
          right: auto;
          transform: translateX(-50%);
          width: min(100vw, 420px);
          justify-content: center;
        }
        .print-thermal .labels-grid,
        .print-thermal .invoice-grid {
          padding: 56px 4mm 8mm;
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-width: 80mm;
          margin: 0 auto;
        }
        .print-thermal .label-card,
        .print-thermal .invoice-card {
          width: 72mm;
          border-radius: 0;
          padding: 3mm;
          font-size: 11px;
        }
        .print-thermal .rc-logo { height: 28px; }
        .print-thermal .rc-store-name { font-size: 12px; letter-spacing: 0.5px; }
        .print-thermal .rc-customer { font-size: 13px; }

        /* ── Print media ── */
        @media print {
          @page { size: ${paper === "thermal" ? "auto" : "A4"}; margin: ${paper === "thermal" ? "3mm" : "8mm"}; }
          ${paper === "thermal" ? "html, body { width: 80mm; }" : ""}
          body { background: white; }
          .no-print { display: none !important; }
          .labels-grid {
            padding: 0;
            grid-template-columns: repeat(3, 1fr);
            gap: 6px;
          }
          .recap-sheet { padding: 0; }
          .recap-header { padding-bottom: 8px; margin-bottom: 8px; }
          .invoice-grid {
            padding: 0;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }
          .print-thermal {
            width: auto;
            max-width: none;
            margin: 0;
          }
          .print-thermal .labels-grid,
          .print-thermal .invoice-grid {
            display: block;
            width: 72mm;
            max-width: 72mm;
            padding: 0;
          }
          .print-thermal .label-card,
          .print-thermal .invoice-card {
            width: 72mm;
            border: none;
            padding: 0;
            page-break-after: always;
            break-after: page;
          }
          .print-thermal .label-card:last-child,
          .print-thermal .invoice-card:last-child {
            page-break-after: auto;
            break-after: auto;
          }
        }
      `}</style>
    </>
  );
}

export default function PrintPage() {
  return (
    <Suspense fallback={<div style={{ padding: 32 }}>Memuat...</div>}>
      <PrintContent />
    </Suspense>
  );
}
