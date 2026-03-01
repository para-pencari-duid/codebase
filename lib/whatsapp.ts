/**
 * WhatsApp Integration Helper
 * Uses Fonnte API (https://fonnte.com) for sending messages.
 * Set FONNTE_TOKEN in .env
 */

import prisma from "@/lib/db";

// Fonnte API token
const FONNTE_TOKEN = process.env.FONNTE_TOKEN || "";

if (typeof window === "undefined") {
  console.log("[WA] Fonnte token configured:", FONNTE_TOKEN ? "✓" : "✗ (FONNTE_TOKEN not set)");
}

// ============================================
// RATE LIMITER
// ============================================
interface RateLimitEntry {
  lastSent: number;
  count: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const MAX_MESSAGES_PER_WINDOW = 1; // 1 message per minute

/**
 * Check if we can send message (rate limiting)
 * Returns true if allowed, false if rate limited
 */
function checkRateLimit(phone: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(phone);

  if (!entry) {
    rateLimitMap.set(phone, { lastSent: now, count: 1 });
    return true;
  }

  const timeSinceLastSent = now - entry.lastSent;

  // Reset if outside window
  if (timeSinceLastSent >= RATE_LIMIT_WINDOW) {
    rateLimitMap.set(phone, { lastSent: now, count: 1 });
    return true;
  }

  // Check if exceeded limit
  if (entry.count >= MAX_MESSAGES_PER_WINDOW) {
    return false;
  }

  // Increment count
  entry.count++;
  entry.lastSent = now;
  return true;
}

/**
 * Get remaining time until rate limit resets
 */
function getRateLimitReset(phone: string): number {
  const entry = rateLimitMap.get(phone);
  if (!entry) return 0;

  const now = Date.now();
  const timeSinceLastSent = now - entry.lastSent;
  const remaining = RATE_LIMIT_WINDOW - timeSinceLastSent;

  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format phone number to Indonesian format (628xxx)
 */
export function formatPhoneNumber(phone: string): string {
  let formatted = phone.replace(/\D/g, ""); // Remove non-digits

  // Convert 08xxx to 628xxx
  if (formatted.startsWith("08")) {
    formatted = "62" + formatted.substring(1);
  }

  // Add 62 if missing
  if (!formatted.startsWith("62")) {
    formatted = "62" + formatted;
  }

  return formatted;
}

/**
 * Format currency for Indonesian Rupiah
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date to Indonesian format
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

// ============================================
// FONNTE API FUNCTIONS
// ============================================

/**
 * Get QR code (base64 PNG) from Fonnte to connect a WhatsApp number.
 * Returns base64 PNG string — use as <img src={`data:image/png;base64,${qrBase64}`} />
 */
export async function getFonnteQRCode(): Promise<{
  status: boolean;
  qrBase64?: string;
  alreadyConnected?: boolean;
  error?: string;
}> {
  try {
    const response = await fetch("https://api.fonnte.com/qr", {
      method: "POST",
      headers: { Authorization: FONNTE_TOKEN },
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Fonnte /qr HTTP ${response.status}: ${text.substring(0, 100)}`);
    }
    const data = await response.json();
    if (data.device_status === "connect") {
      return { status: true, alreadyConnected: true };
    }
    return { status: true, qrBase64: data.url };
  } catch (error) {
    console.error("[Fonnte] Get QR error:", error);
    return {
      status: false,
      error: error instanceof Error ? error.message : "Gagal mengambil QR code dari Fonnte",
    };
  }
}

/**
 * Check WhatsApp connection status via Fonnte /device endpoint.
 */
export async function checkWhatsAppStatus(): Promise<{
  connected: boolean;
  device?: string;
}> {
  try {
    if (!FONNTE_TOKEN) return { connected: false };
    const response = await fetch("https://api.fonnte.com/device", {
      method: "POST",
      headers: { Authorization: FONNTE_TOKEN },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return {
      connected: data.device_status === "connect",
      device: data.device,
    };
  } catch (error) {
    console.error("[Fonnte] Status check error:", error);
    return { connected: false };
  }
}

// (disconnect is handled at the DB level — Fonnte device stays linked)

/**
 * Send WhatsApp message via Fonnte.
 */
export async function sendWhatsAppMessage(
  phone: string,
  message: string,
  bypassRateLimit = false
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  rateLimitReset?: number;
}> {
  const formattedPhone = formatPhoneNumber(phone);

  if (!bypassRateLimit) {
    if (!checkRateLimit(formattedPhone)) {
      return {
        success: false,
        error: "Rate limit exceeded",
        rateLimitReset: getRateLimitReset(formattedPhone),
      };
    }
  }

  try {
    const body = new URLSearchParams({ target: formattedPhone, message });
    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: FONNTE_TOKEN,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Fonnte HTTP ${response.status}: ${errText.substring(0, 100)}`);
    }

    const data = await response.json();
    console.log(`[Fonnte] Sent to ${formattedPhone}:`, data);
    return { success: true, message: "Message sent" };
  } catch (error) {
    console.error("[Fonnte] Send error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send message",
    };
  }
}

// ============================================
// BUSINESS LOGIC HELPERS
// ============================================

/**
 * Check if WhatsApp (Fonnte) is enabled and connected.
 */
export async function isWhatsAppReady(): Promise<boolean> {
  const settings = await prisma.settings.findFirst();
  if (!settings?.whatsappEnabled) return false;
  const status = await checkWhatsAppStatus();
  return status.connected;
}

/**
 * Send a WhatsApp message directly to any phone with any message.
 * Useful for pre-orders, custom notifications, etc.
 * Returns true on success, false on failure (non-blocking).
 */
export async function sendWhatsAppNotification(
  phone: string,
  label: string,
  message: string,
  bypassRateLimit = true
): Promise<boolean> {
  try {
    const settings = await prisma.settings.findFirst();
    if (!settings?.whatsappEnabled) {
      console.log(`[WA] WhatsApp not enabled, skipping ${label}`);
      return false;
    }
    const result = await sendWhatsAppMessage(phone, message, bypassRateLimit);
    if (result.success) {
      console.log(`[Fonnte] ${label} sent to ${phone}`);
    } else {
      console.error(`[Fonnte] ${label} failed:`, result.error);
    }
    return result.success;
  } catch (err) {
    console.error(`[WA] ${label} error:`, err);
    return false;
  }
}

/**
 * Send notification if enabled
 */
export async function sendNotificationIfEnabled(
  phone: string,
  message: string,
  notificationType: "transaction" | "lowstock" | "backup" | "report"
): Promise<void> {
  const settings = await prisma.settings.findFirst();

  if (!settings?.whatsappEnabled) {
    console.log("[WA] WhatsApp not enabled, skipping notification");
    return;
  }

  const notificationEnabled: Record<string, boolean | null | undefined> = {
    transaction: settings.notifyOnTransaction,
    lowstock: settings.notifyOnLowStock,
    backup: settings.notifyOnBackup,
    report: settings.notifyDailyReport,
  };

  if (!notificationEnabled[notificationType]) {
    console.log(`[WA] ${notificationType} notifications disabled`);
    return;
  }

  const result = await sendWhatsAppMessage(
    phone,
    message,
    notificationType === "lowstock"
  );

  if (!result.success) {
    console.error(`[Fonnte] Failed to send ${notificationType}:`, result.error);
  } else {
    console.log(`[Fonnte] ${notificationType} notification sent to ${phone}`);
  }
}

// ============================================
// MESSAGE TEMPLATES
// ============================================

/**
 * Create transaction receipt message (enterprise format)
 */
export function createTransactionMessage(data: {
  transactionNo: string;
  customerName: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  payment: string;
  points?: number;
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
}): string {
  const itemsList = data.items
    .map((item) => `  ${item.quantity}x ${item.name} - ${formatCurrency(item.price)}`)
    .join("\n");

  return `
╔═══════════════════════════════════╗
  ${data.businessName.toUpperCase()}
  ${data.businessAddress || ""}
  ${data.businessPhone || ""}
╚═══════════════════════════════════╝

📋 STRUK PEMBELIAN

No. Transaksi: ${data.transactionNo}
Tanggal: ${formatDate(new Date())}
Pelanggan: ${data.customerName}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ITEM PEMBELIAN:
${itemsList}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Subtotal    : ${formatCurrency(data.subtotal)}
Pajak       : ${formatCurrency(data.tax)}
Diskon      : ${formatCurrency(data.discount)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL       : ${formatCurrency(data.total)}

Pembayaran  : ${data.payment}
${data.points ? `Poin Didapat: +${data.points} poin 🎁` : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Terima kasih atas kepercayaan Anda!
Semoga hari Anda menyenangkan. 😊

~ ${data.businessName} ~
`.trim();
}

/**
 * Create low stock alert message
 */
export function createLowStockMessage(products: Array<{ name: string; stock: number }>): string {
  const productList = products.map((p) => `  • ${p.name} - Sisa ${p.stock} pcs`).join("\n");

  return `
⚠️ PERINGATAN STOK MENIPIS

Produk berikut memerlukan restock segera:

${productList}

Mohon segera lakukan produksi/pembelian.

Waktu: ${formatDate(new Date())}
`.trim();
}

/**
 * Create backup success message
 */
export function createBackupSuccessMessage(filename: string, size: string): string {
  return `
✅ BACKUP DATABASE BERHASIL

File: ${filename}
Ukuran: ${size}
Waktu: ${formatDate(new Date())}

Data Anda aman tersimpan.
`.trim();
}

/**
 * Create daily report message
 */
export function createDailyReportMessage(data: {
  date: Date;
  totalTransactions: number;
  totalSales: number;
  totalItems: number;
  topProduct: string;
  businessName: string;
}): string {
  return `
📊 LAPORAN HARIAN ${data.businessName.toUpperCase()}

Tanggal: ${formatDate(data.date)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Transaksi    : ${data.totalTransactions}
Total Penjualan: ${formatCurrency(data.totalSales)}
Item Terjual : ${data.totalItems} pcs

Produk Terlaris: ${data.topProduct}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Semoga besok lebih baik! 💪
`.trim();
}
