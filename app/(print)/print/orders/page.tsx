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
  PENDING: "⏳ Pending",
  CONFIRMED: "✅ Dikonfirmasi",
  PROCESSING: "🔧 Produksi",
  IN_PRODUCTION: "🔧 Produksi",
  READY: "📦 Siap Ambil",
  COMPLETED: "✓ Selesai",
  CANCELLED: "✗ Dibatal",
};

// Label produksi: dicetak lalu ditempel di rak/baskom adonan
function OrderLabel({ order, store }: { order: Order; store: StoreInfo }) {
  const dueDateObj = order.dueDate ? new Date(order.dueDate) : null;
  const dueDateValid = dueDateObj && !isNaN(dueDateObj.getTime());

  const itemLines =
    order.items.length > 0
      ? order.items
      : [{ id: "-", name: order.title, quantity: order.quantity, unitPrice: 0, subtotal: 0, notes: order.description ?? undefined }];

  return (
    <div className="label-card">
      {/* Logo + order no */}
      <div className="label-header-row">
        {store.logo ? (
          <img src={store.logo} alt="logo" className="label-logo" />
        ) : (
          <span className="label-store-name">{store.name}</span>
        )}
        <span className="label-no">{order.ticketNo}</span>
      </div>

      <div className="label-divider" />

      {/* Nama customer */}
      <div className="label-customer">{order.customerName}</div>

      <div className="label-divider" />

      {/* Produk */}
      <div className="label-section-title">PRODUKSI</div>
      {itemLines.map((it, i) => (
        <div key={i} className="label-item-row">
          <span className="label-item-name">{it.name}</span>
          <span className="label-item-qty">×{it.quantity}</span>
        </div>
      ))}

      {/* Catatan produksi */}
      {order.description && (
        <div className="label-notes">✏️ {order.description}</div>
      )}
      {order.notes && (
        <div className="label-notes">📝 {order.notes}</div>
      )}

      <div className="label-divider" />

      {/* Tanggal ambil */}
      <div className="label-date-row">
        <span className="label-delivery-tag">
          {order.deliveryType === "DELIVERY" ? "🚚 ANTAR" : "🏪 AMBIL"}
        </span>
        <span className="label-date-val">
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
                <td className="center">{o.deliveryType === "DELIVERY" ? "🚚" : "🏪"}</td>
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

// Invoice kurir: compact, beberapa per lembar HVS
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
      {/* Header: logo + nama toko */}
      <div className="inv-card-header">
        {store.logo ? (
          <img src={store.logo} alt="logo" className="inv-logo" />
        ) : null}
        <div className="inv-header-text">
          <div className="inv-store-name">{store.name}</div>
          {store.phone && <div className="inv-store-phone">{store.phone}</div>}
        </div>
        <div className="inv-card-no">{order.ticketNo}</div>
      </div>

      <div className="inv-divider" />

      {/* Penerima */}
      <div className="inv-section-title">PENERIMA</div>
      <div className="inv-recipient-name">{order.customerName}</div>
      <div className="inv-recipient-detail">📞 {order.customerPhone || "-"}</div>
      {order.customerAddress && (
        <div className="inv-recipient-detail">📍 {order.customerAddress}</div>
      )}

      <div className="inv-divider" />

      {/* Pesanan */}
      <div className="inv-section-title">PESANAN</div>
      {itemLines.map((it, i) => (
        <div key={i} className="inv-item-row">
          <span className="inv-item-name">{it.name}</span>
          <span className="inv-item-qty">×{it.quantity}</span>
        </div>
      ))}
      {order.notes && (
        <div className="inv-item-note">📝 {order.notes}</div>
      )}

      <div className="inv-divider" />

      {/* Total + status */}
      <div className="inv-footer-row">
        <div>
          <span className="inv-total-label">Total </span>
          <span className="inv-total-val">{fmtCurrency(Number(order.totalPrice))}</span>
        </div>
        <div className={`inv-status-badge ${isPaid ? "paid" : "unpaid"}`}>
          {isPaid ? "PAID ✅" : "BELUM LUNAS"}
        </div>
      </div>

      {/* Tanggal */}
      <div className="inv-date-row">
        <span className={`inv-delivery-tag ${order.deliveryType === "DELIVERY" ? "delivery" : "pickup"}`}>
          {order.deliveryType === "DELIVERY" ? "🚚 ANTAR" : "🏪 AMBIL"}
        </span>
        <span className="inv-date-val">
          {dueDateValid
            ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(dueDt!)
            : "-"}
        </span>
      </div>
    </div>
  );
}

// ─── Main Print Page ──────────────────────────────────────────────────────────

function PrintContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") ?? "labels"; // "labels" | "recap"
  const ids = searchParams.get("ids"); // comma-separated order IDs
  const date = searchParams.get("date"); // YYYY-MM-DD

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
      } catch (e: any) {
        setError(e.message ?? "Gagal memuat");
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
      {/* Print controls — hidden on print */}
      <div className="print-controls no-print">
        <strong>{orders.length} pesanan</strong> siap cetak
        <button onClick={() => window.print()} className="btn-print">
          🖨️ Cetak
        </button>
        <button onClick={() => window.close()} className="btn-close">
          ✕ Tutup
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

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; background: #f5f5f5; }

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

        /* ── Single label (produksi) ── */
        .label-card {
          border: 2px solid #1e293b;
          border-radius: 8px;
          padding: 10px 12px;
          background: white;
          page-break-inside: avoid;
          break-inside: avoid;
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-family: Arial, sans-serif;
        }

        /* Header: logo + order no */
        .label-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
        }
        .label-logo {
          height: 28px;
          width: auto;
          object-fit: contain;
        }
        .label-store-name {
          font-size: 10px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: 0.3px;
        }
        .label-no {
          font-size: 9px;
          font-family: monospace;
          font-weight: bold;
          color: #94a3b8;
          letter-spacing: 0.5px;
        }

        /* Customer */
        .label-customer {
          font-size: 14px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.2;
        }

        /* Divider */
        .label-divider { border-top: 1px dashed #cbd5e1; margin: 3px 0; }

        /* Section title */
        .label-section-title {
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 1px;
          color: #94a3b8;
          text-transform: uppercase;
          margin-bottom: 1px;
        }

        /* Item rows */
        .label-item-row {
          display: flex;
          align-items: baseline;
          gap: 4px;
          font-size: 13px;
        }
        .label-item-name { font-weight: 700; color: #1e40af; flex: 1; }
        .label-item-qty { color: #0f172a; font-size: 12px; font-weight: 600; white-space: nowrap; }

        /* Notes */
        .label-notes { font-size: 10px; color: #64748b; font-style: italic; margin-top: 1px; }

        /* Date row */
        .label-date-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          margin-top: 1px;
        }
        .label-delivery-tag {
          font-size: 10px;
          font-weight: bold;
          padding: 2px 7px;
          border-radius: 4px;
          background: #f1f5f9;
          color: #1e293b;
          white-space: nowrap;
        }
        .label-date-val {
          font-size: 11px;
          font-weight: 700;
          color: #dc2626;
          text-align: right;
        }

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

        /* ── Invoice grid (kurir, beberapa per HVS) ── */
        .invoice-grid {
          padding: 48px 16px 16px;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          max-width: 860px;
          margin: 0 auto;
        }

        /* ── Invoice card (compact kurir) ── */
        .invoice-card {
          border: 2px solid #1e293b;
          border-radius: 8px;
          padding: 12px 14px;
          background: white;
          page-break-inside: avoid;
          break-inside: avoid;
          display: flex;
          flex-direction: column;
          gap: 5px;
          font-family: Arial, sans-serif;
        }

        /* Header: logo + nama toko + no order */
        .inv-card-header {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .inv-logo {
          height: 36px;
          width: auto;
          object-fit: contain;
          flex-shrink: 0;
        }
        .inv-header-text { flex: 1; }
        .inv-store-name {
          font-size: 11px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.2;
        }
        .inv-store-phone { font-size: 9px; color: #64748b; }
        .inv-card-no {
          font-size: 9px;
          font-family: monospace;
          font-weight: bold;
          color: #94a3b8;
          letter-spacing: 0.5px;
          align-self: flex-start;
          white-space: nowrap;
        }

        .inv-divider { border-top: 1px dashed #cbd5e1; margin: 2px 0; }

        .inv-section-title {
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 1px;
          color: #94a3b8;
          text-transform: uppercase;
          margin-bottom: 1px;
        }

        /* Penerima */
        .inv-recipient-name {
          font-size: 15px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.2;
        }
        .inv-recipient-detail {
          font-size: 11px;
          color: #475569;
          line-height: 1.4;
        }

        /* Items */
        .inv-item-row {
          display: flex;
          align-items: baseline;
          gap: 6px;
          font-size: 13px;
        }
        .inv-item-name { font-weight: 700; color: #1e40af; flex: 1; }
        .inv-item-qty { font-size: 12px; font-weight: 600; color: #0f172a; white-space: nowrap; }
        .inv-item-note { font-size: 10px; color: #64748b; font-style: italic; }

        /* Footer row: total + status */
        .inv-footer-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          padding-top: 2px;
        }
        .inv-total-label { font-size: 11px; color: #64748b; }
        .inv-total-val { font-size: 14px; font-weight: 800; color: #0f172a; }
        .inv-status-badge {
          font-size: 10px;
          font-weight: 800;
          padding: 3px 10px;
          border-radius: 4px;
          border: 1.5px solid;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }
        .inv-status-badge.paid { color: #15803d; border-color: #15803d; background: #f0fdf4; }
        .inv-status-badge.unpaid { color: #b91c1c; border-color: #b91c1c; background: #fef2f2; }

        /* Date row */
        .inv-date-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
        }
        .inv-delivery-tag {
          font-size: 10px;
          font-weight: bold;
          padding: 2px 7px;
          border-radius: 4px;
          white-space: nowrap;
        }
        .inv-delivery-tag.delivery { background: #dbeafe; color: #1d4ed8; }
        .inv-delivery-tag.pickup { background: #f0fdf4; color: #166534; }
        .inv-date-val {
          font-size: 11px;
          font-weight: 700;
          color: #dc2626;
        }

        /* ── Print media ── */
        @media print {
          @page { size: A4; margin: 8mm; }
          body { background: white; }
          .no-print { display: none !important; }
          .labels-grid {
            padding: 0;
            grid-template-columns: repeat(3, 1fr);
            gap: 6px;
          }
          .label-card { border: 1.5px solid #000; border-radius: 4px; }
          .recap-sheet { padding: 0; }
          .recap-header { padding-bottom: 8px; margin-bottom: 8px; }
          .invoice-grid {
            padding: 0;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }
          .invoice-card { border: 1.5px solid #000; border-radius: 4px; }
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
