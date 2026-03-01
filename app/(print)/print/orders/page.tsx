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

function OrderLabel({ order, storeName }: { order: Order; storeName: string }) {
  const isPaid = Number(order.remainingAmount) === 0;
  const hasDP = Number(order.dpAmount) > 0;

  // Build per-item lines
  const itemLines =
    order.items.length > 0
      ? order.items
      : [{ id: "-", name: order.title, quantity: order.quantity, unitPrice: Number(order.unitPrice), subtotal: Number(order.totalPrice), notes: undefined }];

  const dueDateObj = order.dueDate ? new Date(order.dueDate) : null;
  const dueDateValid = dueDateObj && !isNaN(dueDateObj.getTime());

  return (
    <div className="label-card">
      {/* ── Row 1: order no + status ── */}
      <div className="label-row-between">
        <span className="label-no">{order.ticketNo}</span>
        <span className={`label-badge ${isPaid ? "paid" : "unpaid"}`}>
          {isPaid ? "✓ LUNAS" : `Sisa ${fmtCurrency(Number(order.remainingAmount))}`}
        </span>
      </div>

      {/* ── Row 2: Customer ── */}
      <div className="label-customer">{order.customerName}</div>
      <div className="label-phone">📞 {order.customerPhone}</div>
      {order.deliveryType === "DELIVERY" && order.customerAddress && (
        <div className="label-address">📍 {order.customerAddress}</div>
      )}

      <div className="label-divider" />

      {/* ── Row 3: Products ── */}
      <div className="label-section-title">PESANAN</div>
      {itemLines.map((it, i) => (
        <div key={i} className="label-item-row">
          <span className="label-item-name">{it.name}</span>
          <span className="label-item-qty">×{it.quantity}</span>
          <span className="label-item-price">{fmtCurrency(Number(it.subtotal))}</span>
        </div>
      ))}

      {/* description (custom cake notes) */}
      {order.description && (
        <div className="label-description">✏️ {order.description}</div>
      )}
      {order.notes && (
        <div className="label-notes">📝 {order.notes}</div>
      )}

      <div className="label-divider" />

      {/* ── Row 4: Payment summary ── */}
      <div className="label-payment-block">
        <div className="label-payment-row">
          <span>Total</span>
          <span className="label-payment-value total">{fmtCurrency(Number(order.totalPrice))}</span>
        </div>
        {hasDP && (
          <div className="label-payment-row">
            <span>DP ({order.dpMethod ?? "CASH"})</span>
            <span className="label-payment-value dp">– {fmtCurrency(Number(order.dpAmount))}</span>
          </div>
        )}
        <div className="label-payment-row">
          <span>{isPaid ? "Lunas" : "Sisa tagihan"}</span>
          <span className={`label-payment-value ${isPaid ? "paid-val" : "unpaid-val"}`}>
            {isPaid ? "✓ LUNAS" : fmtCurrency(Number(order.remainingAmount))}
          </span>
        </div>
      </div>

      <div className="label-divider" />

      {/* ── Row 5: Pickup info ── */}
      <div className="label-pickup-row">
        <span className={`label-delivery-badge ${order.deliveryType === "DELIVERY" ? "delivery" : "pickup"}`}>
          {order.deliveryType === "DELIVERY" ? "🚚 ANTAR" : "🏪 AMBIL"}
        </span>
        <div className="label-date-block">
          {dueDateValid ? (
            <>
              <div className="label-date-main">
                {new Intl.DateTimeFormat("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(dueDateObj!)}
              </div>
              <div className="label-date-time">
                {new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(dueDateObj!)}
              </div>
            </>
          ) : (
            <div className="label-date-main">-</div>
          )}
        </div>
      </div>

      {/* ── Row 6: Footer ── */}
      <div className="label-footer-row">
        <span className="label-store">{storeName}</span>
        <span className="label-status">{STATUS_LABEL[order.status] ?? order.status}</span>
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

// ─── Invoice Component ──────────────────────────────────────────────────────────

function InvoiceDoc({ order, store }: { order: Order; store: StoreInfo }) {
  const isPaid = Number(order.remainingAmount) === 0;
  const hasDP = Number(order.dpAmount) > 0;
  const dueDt = order.dueDate ? new Date(order.dueDate) : null;
  const dueDateValid = dueDt && !isNaN(dueDt.getTime());

  const itemLines =
    order.items.length > 0
      ? order.items
      : [{ id: "-", name: order.title, quantity: order.quantity, unitPrice: Number(order.unitPrice), subtotal: Number(order.totalPrice), notes: order.description ?? undefined }];

  const printedAt = new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short" }).format(new Date());

  return (
    <div className="invoice-page">
      {/* ── Store header ── */}
      <div className="inv-header">
        <div className="inv-store-name">{store.name}</div>
        {store.address && <div className="inv-store-detail">{store.address}</div>}
        {store.phone && <div className="inv-store-detail">📞 {store.phone}</div>}
      </div>

      <div className="inv-title-bar">
        <span>INVOICE / NOTA PESANAN</span>
        <span className={`inv-paid-stamp ${isPaid ? "paid" : "unpaid"}`}>
          {isPaid ? "✓ LUNAS" : "BELUM LUNAS"}
        </span>
      </div>

      {/* ── Meta row ── */}
      <div className="inv-meta">
        <table className="inv-meta-table">
          <tbody>
            <tr>
              <td>No. Order</td>
              <td>:</td>
              <td><strong>{order.ticketNo}</strong></td>
              <td>Tgl. Cetak</td>
              <td>:</td>
              <td>{printedAt}</td>
            </tr>
            <tr>
              <td>Tgl. Ambil / Kirim</td>
              <td>:</td>
              <td><strong className="inv-due-date">{dueDateValid ? fmtDate(order.dueDate) : "-"}</strong></td>
              <td>Tipe</td>
              <td>:</td>
              <td>{order.deliveryType === "DELIVERY" ? "🚚 Pengiriman" : "🏪 Ambil di Toko"}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Customer box ── */}
      <div className="inv-customer-box">
        <div className="inv-box-title">DATA PELANGGAN</div>
        <table className="inv-customer-table">
          <tbody>
            <tr>
              <td className="inv-cust-label">Nama</td>
              <td>:</td>
              <td><strong>{order.customerName}</strong></td>
            </tr>
            <tr>
              <td className="inv-cust-label">No. HP / WA</td>
              <td>:</td>
              <td><strong>{order.customerPhone || "-"}</strong></td>
            </tr>
            {(order.customerAddress || order.deliveryType === "DELIVERY") && (
              <tr>
                <td className="inv-cust-label">Alamat</td>
                <td>:</td>
                <td>{order.customerAddress || "-"}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Items table ── */}
      <table className="inv-items-table">
        <thead>
          <tr>
            <th className="center" style={{ width: 28 }}>No</th>
            <th>Nama Produk / Pesanan</th>
            <th className="center" style={{ width: 40 }}>Qty</th>
            <th className="right" style={{ width: 110 }}>Harga Satuan</th>
            <th className="right" style={{ width: 110 }}>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {itemLines.map((it, i) => (
            <tr key={i}>
              <td className="center">{i + 1}</td>
              <td>
                <div style={{ fontWeight: 600 }}>{it.name}</div>
                {it.notes && <div style={{ fontSize: 10, color: "#64748b", fontStyle: "italic" }}>↳ {it.notes}</div>}
              </td>
              <td className="center">{it.quantity}</td>
              <td className="right">{fmtCurrency(Number(it.unitPrice))}</td>
              <td className="right">{fmtCurrency(Number(it.subtotal))}</td>
            </tr>
          ))}
          {/* Description row if not in items */}
          {order.description && order.items.length === 0 && (
            <tr>
              <td />
              <td colSpan={4} style={{ fontSize: 11, color: "#475569", fontStyle: "italic", paddingTop: 2, paddingBottom: 6 }}>
                ✏️ {order.description}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ── Payment summary ── */}
      <div className="inv-payment-section">
        <div className="inv-payment-rows">
          <div className="inv-pay-row">
            <span>Total Harga</span>
            <span>{fmtCurrency(Number(order.totalPrice))}</span>
          </div>
          {hasDP && (
            <div className="inv-pay-row">
              <span>DP ({order.dpMethod ?? "CASH"})</span>
              <span className="dp-val">– {fmtCurrency(Number(order.dpAmount))}</span>
            </div>
          )}
          <div className={`inv-pay-row total-row ${isPaid ? "paid-row" : "unpaid-row"}`}>
            <span>{isPaid ? "Status Pembayaran" : "Sisa Tagihan"}</span>
            <span>{isPaid ? "✓ LUNAS" : fmtCurrency(Number(order.remainingAmount))}</span>
          </div>
        </div>
      </div>

      {/* ── Notes ── */}
      {order.notes && (
        <div className="inv-notes">
          <strong>Catatan:</strong> {order.notes}
        </div>
      )}

      {/* ── Signature area ── */}
      <div className="inv-sign-area">
        <div className="inv-sign-box">
          <div className="inv-sign-title">Diterima oleh,</div>
          <div className="inv-sign-line" />
          <div className="inv-sign-name">( __________________ )</div>
        </div>
        <div className="inv-sign-box right-sign">
          <div className="inv-sign-title">{store.name}</div>
          <div className="inv-sign-line" />
          <div className="inv-sign-name">( __________________ )</div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="inv-footer">
        Terima kasih atas kepercayaan Anda! 🙏 &nbsp;|&nbsp; {store.name}
        {store.phone && <> &nbsp;|&nbsp; {store.phone}</>}
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
        <div className="invoice-wrapper">
          {orders.map((order, i) => (
            <div key={order.id}>
              {i > 0 && <div className="page-break" />}
              <InvoiceDoc order={order} store={storeInfo} />
            </div>
          ))}
        </div>
      ) : (
        <div className="labels-grid">
          {orders.map((order) => (
            <OrderLabel key={order.id} order={order} storeName={storeInfo.name} />
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

        /* ── Labels grid ── */
        .labels-grid {
          padding: 48px 16px 16px;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          max-width: 800px;
          margin: 0 auto;
        }

        /* ── Single label ── */
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

        /* Row: order no + badge */
        .label-row-between {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .label-no {
          font-size: 10px;
          font-family: monospace;
          font-weight: bold;
          color: #475569;
          letter-spacing: 0.5px;
        }
        .label-badge {
          font-size: 9px;
          font-weight: bold;
          padding: 2px 7px;
          border-radius: 10px;
        }
        .label-badge.paid { background: #dcfce7; color: #15803d; }
        .label-badge.unpaid { background: #fef3c7; color: #92400e; }

        /* Customer */
        .label-customer {
          font-size: 15px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.2;
          margin-top: 1px;
        }
        .label-phone { font-size: 11px; color: #475569; }
        .label-address { font-size: 10px; color: #64748b; font-style: italic; }

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
          font-size: 12px;
        }
        .label-item-name { font-weight: 600; color: #1e40af; flex: 1; }
        .label-item-qty { color: #64748b; font-size: 11px; white-space: nowrap; }
        .label-item-price { color: #0f172a; font-size: 11px; font-weight: 600; white-space: nowrap; margin-left:auto; }

        /* Description + notes */
        .label-description {
          font-size: 11px;
          color: #1e293b;
          background: #f8fafc;
          border-left: 2px solid #94a3b8;
          padding: 2px 6px;
          margin: 1px 0;
          border-radius: 0 2px 2px 0;
        }
        .label-notes { font-size: 10px; color: #64748b; font-style: italic; }

        /* Payment block */
        .label-payment-block {
          background: #f8fafc;
          border-radius: 4px;
          padding: 4px 8px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .label-payment-row {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #475569;
        }
        .label-payment-value { font-weight: 600; }
        .label-payment-value.total { color: #0f172a; font-size: 11px; }
        .label-payment-value.dp { color: #2563eb; }
        .label-payment-value.paid-val { color: #15803d; }
        .label-payment-value.unpaid-val { color: #b91c1c; font-size: 11px; }

        /* Pickup row */
        .label-pickup-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          margin-top: 1px;
        }
        .label-delivery-badge {
          font-size: 10px;
          font-weight: bold;
          padding: 3px 8px;
          border-radius: 4px;
          white-space: nowrap;
        }
        .label-delivery-badge.delivery { background: #dbeafe; color: #1d4ed8; }
        .label-delivery-badge.pickup { background: #f0fdf4; color: #166534; }
        .label-date-block { text-align: right; }
        .label-date-main {
          font-size: 12px;
          font-weight: 800;
          color: #dc2626;
          line-height: 1.2;
        }
        .label-date-time {
          font-size: 11px;
          font-weight: 600;
          color: #dc2626;
        }

        /* Footer row */
        .label-footer-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 2px;
        }
        .label-store { font-size: 9px; color: #94a3b8; }
        .label-status { font-size: 9px; color: #64748b; font-style: italic; }

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

        /* ── Invoice ── */
        .invoice-wrapper { padding: 48px 0 0; }
        .invoice-page {
          max-width: 720px;
          margin: 0 auto 40px;
          background: white;
          padding: 32px 36px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-family: Arial, sans-serif;
          font-size: 13px;
          color: #0f172a;
        }

        /* Store header */
        .inv-header {
          text-align: center;
          border-bottom: 3px double #1e293b;
          padding-bottom: 12px;
          margin-bottom: 12px;
        }
        .inv-store-name {
          font-size: 22px;
          font-weight: 900;
          letter-spacing: 0.5px;
          color: #0f172a;
        }
        .inv-store-detail { font-size: 12px; color: #475569; margin-top: 2px; }

        /* Title bar */
        .inv-title-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 15px;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-bottom: 12px;
          color: #1e293b;
        }
        .inv-paid-stamp {
          font-size: 12px;
          font-weight: 800;
          padding: 4px 14px;
          border-radius: 4px;
          border: 2px solid;
          letter-spacing: 1px;
        }
        .inv-paid-stamp.paid { color: #15803d; border-color: #15803d; background: #f0fdf4; }
        .inv-paid-stamp.unpaid { color: #b91c1c; border-color: #b91c1c; background: #fef2f2; }

        /* Meta table */
        .inv-meta { margin-bottom: 14px; }
        .inv-meta-table { width: 100%; font-size: 12px; }
        .inv-meta-table td { padding: 2px 6px 2px 0; vertical-align: top; white-space: nowrap; }
        .inv-meta-table td:nth-child(4) { padding-left: 24px; }
        .inv-due-date { color: #dc2626; font-size: 13px; }

        /* Customer box */
        .inv-customer-box {
          border: 2px solid #1e293b;
          border-radius: 6px;
          padding: 10px 14px;
          margin-bottom: 16px;
          background: #f8fafc;
        }
        .inv-box-title {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #64748b;
          margin-bottom: 6px;
        }
        .inv-customer-table { width: 100%; font-size: 13px; }
        .inv-customer-table td { padding: 3px 6px 3px 0; vertical-align: top; }
        .inv-cust-label { color: #64748b; width: 110px; font-size: 12px; }

        /* Items table */
        .inv-items-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          margin-bottom: 0;
        }
        .inv-items-table th {
          background: #1e293b;
          color: white;
          padding: 7px 10px;
          font-size: 11px;
          font-weight: 700;
        }
        .inv-items-table td {
          padding: 7px 10px;
          border-bottom: 1px solid #e2e8f0;
          vertical-align: top;
        }
        .inv-items-table tbody tr:last-child td { border-bottom: none; }

        /* Payment section */
        .inv-payment-section {
          display: flex;
          justify-content: flex-end;
          border-top: 2px solid #1e293b;
          padding-top: 10px;
          margin-top: 0;
          margin-bottom: 14px;
        }
        .inv-payment-rows {
          width: 260px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .inv-pay-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          padding: 3px 0;
        }
        .dp-val { color: #2563eb; font-weight: 600; }
        .total-row {
          font-size: 14px;
          font-weight: 800;
          border-top: 1.5px solid #1e293b;
          padding-top: 6px;
          margin-top: 4px;
        }
        .paid-row { color: #15803d; }
        .unpaid-row { color: #b91c1c; }

        /* Notes */
        .inv-notes {
          font-size: 11px;
          color: #475569;
          background: #fefce8;
          border-left: 3px solid #facc15;
          padding: 6px 10px;
          border-radius: 0 4px 4px 0;
          margin-bottom: 16px;
        }

        /* Signature area */
        .inv-sign-area {
          display: flex;
          justify-content: space-between;
          margin-top: 24px;
          margin-bottom: 12px;
          gap: 24px;
        }
        .inv-sign-box { flex: 1; text-align: center; }
        .inv-sign-title { font-size: 12px; font-weight: 600; margin-bottom: 48px; }
        .inv-sign-line { border-top: 1px solid #0f172a; }
        .inv-sign-name { font-size: 11px; color: #475569; margin-top: 4px; }

        /* Footer */
        .inv-footer {
          text-align: center;
          font-size: 11px;
          color: #94a3b8;
          border-top: 1px dashed #cbd5e1;
          padding-top: 10px;
        }

        /* page break between invoices */
        .page-break { page-break-after: always; break-after: page; height: 0; }

        /* ── Print media ── */
        @media print {
          @page { size: A4; margin: 10mm; }
          body { background: white; }
          .no-print { display: none !important; }
          .labels-grid {
            padding: 0;
            grid-template-columns: repeat(2, 1fr);
            gap: 6px;
          }
          .label-card { border: 1.5px solid #000; border-radius: 4px; }
          .recap-sheet { padding: 0; }
          .recap-header { padding-bottom: 8px; margin-bottom: 8px; }
          .invoice-wrapper { padding: 0; }
          .invoice-page {
            border: none;
            border-radius: 0;
            padding: 0;
            margin: 0;
            max-width: 100%;
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
