/**
 * WhatsApp Integration Helper
 * Connects to WA Gateway Service (Golang) at localhost:4000
 * Architecture: Asynchronous Worker Pattern with Queue
 */

import { randomBytes } from "crypto";
import prisma from "@/lib/db";

// WhatsApp Service URL and Authentication
const WA_SERVICE_URL = process.env.WA_SERVICE_URL || "http://localhost:4000";
const WA_SECRET_KEY = process.env.WA_SECRET_KEY || "LokkahPOS2026DevSecretKey99";

// Log WA service URL on module load
if (typeof window === "undefined") {
  console.log("[WA] Service URL:", WA_SERVICE_URL);
  console.log("[WA] Auth configured:", WA_SECRET_KEY ? "✓" : "✗");
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
// WHATSAPP API FUNCTIONS
// ============================================

/**
 * Initialize WhatsApp session and get QR code
 * If init fails with 500 (stale session), auto-logout and retry once
 */
export async function initWhatsAppSession(tenantId: string): Promise<{
  status: string;
  qr_code?: string;
  message?: string;
  error?: string;
}> {
  const doInit = async () => {
    console.log(`[WA] Initializing session for tenant: ${tenantId}`);
    console.log(`[WA] Connecting to: ${WA_SERVICE_URL}/session/init`);

    const response = await fetch(`${WA_SERVICE_URL}/session/init`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Secret-Key": WA_SECRET_KEY,
      },
      body: JSON.stringify({ tenant_id: tenantId }),
    });

    console.log(`[WA] Init response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[WA] Init failed with status ${response.status}:`, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 100)}`);
    }

    const data = await response.json();
    console.log(`[WA] Init response:`, data.status);
    return data;
  };

  try {
    return await doInit();
  } catch (error) {
    // If init fails (e.g., stale/broken session), try logout first then retry
    const errMsg = error instanceof Error ? error.message : "";
    if (errMsg.includes("500")) {
      console.log(`[WA] Init failed with 500, attempting logout + retry for tenant: ${tenantId}`);
      try {
        await disconnectWhatsApp(tenantId);
        // Small delay to let WA service clean up
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return await doInit();
      } catch (retryError) {
        console.error("[WA] Retry after logout also failed:", retryError);
        return {
          status: "error",
          error: "Session rusak. Silakan gunakan Reset WhatsApp lalu coba lagi.",
        };
      }
    }

    console.error("[WA] Init Error:", error);
    return {
      status: "error",
      error: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

/**
 * Check WhatsApp connection status
 */
export async function checkWhatsAppStatus(tenantId: string): Promise<{
  tenant_id: string;
  status: string;
}> {
  try {
    const response = await fetch(`${WA_SERVICE_URL}/session/status/${tenantId}`, {
      method: "GET",
      headers: {
        "X-Secret-Key": WA_SECRET_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("WA Status Error:", error);
    return {
      tenant_id: tenantId,
      status: "disconnected",
    };
  }
}

/**
 * Disconnect/Logout WhatsApp session
 * WA Service endpoint: POST /session/logout
 */
export async function disconnectWhatsApp(tenantId: string): Promise<{
  status: string;
  message?: string;
}> {
  try {
    const response = await fetch(`${WA_SERVICE_URL}/session/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Secret-Key": WA_SECRET_KEY,
      },
      body: JSON.stringify({ tenant_id: tenantId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("WA Disconnect Error:", error);
    return {
      status: "error",
    };
  }
}

/**
 * Send WhatsApp message with rate limiting
 */
export async function sendWhatsAppMessage(
  tenantId: string,
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

  // Check rate limit
  if (!bypassRateLimit) {
    if (!checkRateLimit(formattedPhone)) {
      const resetTime = getRateLimitReset(formattedPhone);
      return {
        success: false,
        error: "Rate limit exceeded",
        rateLimitReset: resetTime,
      };
    }
  }

  try {
    const response = await fetch(`${WA_SERVICE_URL}/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Secret-Key": WA_SECRET_KEY,
      },
      body: JSON.stringify({
        tenant_id: tenantId,
        phone: formattedPhone,
        message: message,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    // New async architecture returns 'queued' status
    console.log(`[WA] Message queued: ${data.status}`);
    return {
      success: true,
      message: data.message || "Message queued successfully",
    };
  } catch (error) {
    console.error("WA Send Error:", error);
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
 * Generate or get tenant ID from settings
 */
/**
 * Get existing tenant ID or create a new one
 * Settings should already exist from seed/migration
 */
export async function getOrCreateTenantId(): Promise<string> {
  let settings = await prisma.settings.findFirst();

  // If settings exists and has tenant ID, return it
  if (settings?.whatsappTenantId) {
    console.log(`[WA] Using existing tenant ID: ${settings.whatsappTenantId}`);
    return settings.whatsappTenantId;
  }

  const prefix = settings?.businessName?.replace(/[^a-z0-9]/gi, "-").substring(0, 20) || "tenant";

  // Generate new tenant ID (12 random alphanumeric chars)
  const randomString = randomBytes(9).toString("base64").replace(/[+/=]/g, "").substring(0, 12);
  const tenantId = `${prefix}-${randomString}`;

  console.log(`[WA] Generated new tenant ID: ${tenantId}`);

  // Update existing settings with tenant ID
  if (settings) {
    await prisma.settings.update({
      where: { id: settings.id },
      data: { whatsappTenantId: tenantId },
    });
  } else {
    // Fallback: create settings row (singleton)
    console.warn("[WA] No settings found, creating defaults");
    settings = await prisma.settings.create({
      data: {
        businessName: "Toko",
        taxRate: 11,
        whatsappTenantId: tenantId,
      },
    });
  }

  return tenantId;
}

/**
 * Check if WhatsApp is enabled and connected
 */
export async function isWhatsAppReady(): Promise<boolean> {
  const settings = await prisma.settings.findFirst();

  if (!settings?.whatsappEnabled || !settings?.whatsappTenantId) {
    return false;
  }

  // Check connection status
  const status = await checkWhatsAppStatus(settings.whatsappTenantId);
  return status.status === "connected";
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
    if (!settings?.whatsappEnabled || !settings?.whatsappTenantId) {
      console.log(`[WA] WhatsApp not enabled, skipping ${label}`);
      return false;
    }
    const result = await sendWhatsAppMessage(
      settings.whatsappTenantId,
      phone,
      message,
      bypassRateLimit
    );
    if (result.success) {
      console.log(`[WA] ${label} sent to ${phone}`);
    } else {
      console.error(`[WA] ${label} failed:`, result.error);
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

  if (!settings?.whatsappEnabled || !settings?.whatsappTenantId) {
    console.log("[WA] WhatsApp not enabled, skipping notification");
    return;
  }

  // Check if this notification type is enabled
  const notificationEnabled = {
    transaction: settings.notifyOnTransaction,
    lowstock: settings.notifyOnLowStock,
    backup: settings.notifyOnBackup,
    report: settings.notifyDailyReport,
  };

  if (!notificationEnabled[notificationType]) {
    console.log(`[WA] ${notificationType} notifications disabled`);
    return;
  }

  // Send message
  const result = await sendWhatsAppMessage(
    settings.whatsappTenantId,
    phone,
    message,
    notificationType === "lowstock" // Bypass rate limit for critical alerts
  );

  if (!result.success) {
    console.error(`[WA] Failed to send ${notificationType}:`, result.error);
  } else {
    console.log(`[WA] ${notificationType} notification sent to ${phone}`);
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
