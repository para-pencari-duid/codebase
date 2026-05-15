"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Loader2, Printer, X } from "lucide-react";
import { useState } from "react";
import type { PosReceiptData } from "@/lib/types/pos-checkout";

interface ReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: PosReceiptData | null;
}

const paymentMethodLabels: Record<string, string> = {
  CASH: "Tunai",
  TRANSFER: "Transfer Bank",
  QRIS: "QRIS",
  DEBIT_CARD: "Kartu Debit",
  CREDIT_CARD: "Kartu Kredit",
  EWALLET: "E-Wallet",
};

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#039;";
      default:
        return char;
    }
  });
}

function waitForImages(doc: Document) {
  const images = Array.from(doc.images);
  if (images.length === 0) return Promise.resolve();

  return Promise.all(
    images.map((image) => {
      if (image.complete) return Promise.resolve();

      return new Promise<void>((resolve) => {
        image.onload = () => resolve();
        image.onerror = () => resolve();
      });
    }),
  ).then(() => undefined);
}

function buildReceiptHtml(data: PosReceiptData) {
  const logoHtml = data.businessLogo
    ? `<img class="logo" src="${escapeHtml(data.businessLogo)}" alt="logo" />`
    : "";

  const itemsHtml = data.items
    .map((item) => {
      const modifiersHtml = item.modifiers && item.modifiers.length > 0
        ? item.modifiers
          .map((modifier) => `
            <div class="row muted indent">
              <span>+ ${escapeHtml(modifier.optionName)}</span>
              ${modifier.price > 0 ? `<span class="amount">+${escapeHtml(formatCurrency(modifier.price))}</span>` : ""}
            </div>
          `)
          .join("")
        : "";

      const discountHtml = item.discount > 0
        ? `
          <div class="row muted indent">
            <span>Diskon</span>
            <span class="amount">-${escapeHtml(formatCurrency(item.discount))}</span>
          </div>
        `
        : "";

      return `
        <div class="item">
          <div class="row">
            <span class="name">${escapeHtml(`${item.quantity}x ${item.productName}`)}</span>
            <span class="amount">${escapeHtml(formatCurrency(item.subtotal))}</span>
          </div>
          ${modifiersHtml}
          ${discountHtml}
        </div>
      `;
    })
    .join("");

  const taxHtml = data.taxIncluded && data.tax > 0
    ? `
      <div class="row">
        <span>Pajak (${escapeHtml(data.taxRate)}%)</span>
        <span class="amount">${escapeHtml(formatCurrency(data.tax))}</span>
      </div>
    `
    : "";

  const discountHtml = data.discount > 0
    ? `
      <div class="row">
        <span>Diskon</span>
        <span class="amount">-${escapeHtml(formatCurrency(data.discount))}</span>
      </div>
    `
    : "";

  const pointsRedeemedHtml = data.pointsRedemptionAmount && data.pointsRedemptionAmount > 0
    ? `
      <div class="row">
        <span>Poin (${escapeHtml(data.pointsRedeemed ?? 0)} poin)</span>
        <span class="amount">-${escapeHtml(formatCurrency(data.pointsRedemptionAmount))}</span>
      </div>
    `
    : "";

  const changeHtml = data.changeAmount > 0
    ? `
      <div class="row">
        <span>Kembalian</span>
        <span class="amount">${escapeHtml(formatCurrency(data.changeAmount))}</span>
      </div>
    `
    : "";

  const pointsEarnedHtml = data.pointsEarned && data.pointsEarned > 0
    ? `
      <div class="divider"></div>
      <div class="center small">
        <div class="bold">Poin Loyalty</div>
        <div>+${escapeHtml(data.pointsEarned)} poin dari transaksi ini</div>
      </div>
    `
    : "";

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Struk ${escapeHtml(data.transactionNo)}</title>
        <style>
          @page { size: auto; margin: 3mm; }
          * { box-sizing: border-box; }
          html, body { width: 80mm; margin: 0; padding: 0; background: #fff; color: #111; }
          body { font-family: "Courier New", Courier, monospace; font-size: 11px; line-height: 1.35; }
          .receipt { width: 72mm; padding: 0; }
          .center { text-align: center; }
          .bold { font-weight: 700; }
          .small { font-size: 10px; }
          .muted { color: #555; }
          .logo { display: block; max-height: 30px; max-width: 42mm; object-fit: contain; margin: 0 auto 4px; }
          .divider { border-top: 1px dashed #777; margin: 6px 0; }
          .row { display: flex; align-items: flex-start; justify-content: space-between; gap: 6px; margin: 1px 0; }
          .name { overflow-wrap: anywhere; }
          .amount { white-space: nowrap; text-align: right; }
          .indent { padding-left: 8px; font-size: 10px; }
          .item { margin-bottom: 3px; }
          .total { font-size: 12px; font-weight: 700; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="center">
            ${logoHtml}
            ${data.receiptHeader ? `<div class="small muted">${escapeHtml(data.receiptHeader)}</div>` : ""}
            <div class="bold">${escapeHtml(data.businessName.toUpperCase())}</div>
            ${data.businessAddress ? `<div>${escapeHtml(data.businessAddress)}</div>` : ""}
            ${data.businessPhone ? `<div>Telp: ${escapeHtml(data.businessPhone)}</div>` : ""}
          </div>

          <div class="divider"></div>

          <div>
            <div>No: ${escapeHtml(data.transactionNo)}</div>
            <div>Tanggal: ${escapeHtml(formatDateTime(data.createdAt))}</div>
            <div>Kasir: ${escapeHtml(data.cashierName)}</div>
            ${data.customerName ? `<div>Customer: ${escapeHtml(data.customerName)}</div>` : ""}
          </div>

          <div class="divider"></div>

          ${itemsHtml}

          <div class="divider"></div>

          <div>
            <div class="row">
              <span>Subtotal</span>
              <span class="amount">${escapeHtml(formatCurrency(data.subtotal))}</span>
            </div>
            ${taxHtml}
            ${discountHtml}
            ${pointsRedeemedHtml}
          </div>

          <div class="divider"></div>

          <div class="row total">
            <span>TOTAL</span>
            <span class="amount">${escapeHtml(formatCurrency(data.total))}</span>
          </div>

          <div>
            <div class="row">
              <span>Bayar (${escapeHtml(paymentMethodLabels[data.paymentMethod] || data.paymentMethod)})</span>
              <span class="amount">${escapeHtml(formatCurrency(data.paymentAmount))}</span>
            </div>
            ${changeHtml}
          </div>

          ${pointsEarnedHtml}

          <div class="divider"></div>

          <div class="center">
            <div>Terima kasih atas kunjungan Anda!</div>
            ${data.receiptFooter ? `<div>${escapeHtml(data.receiptFooter)}</div>` : ""}
          </div>
        </div>
      </body>
    </html>
  `;
}

async function printReceipt(data: PosReceiptData) {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-10000px";
  iframe.style.bottom = "0";
  iframe.style.width = "80mm";
  iframe.style.height = "1px";
  iframe.style.border = "0";
  iframe.style.opacity = "0";

  document.body.appendChild(iframe);

  const printWindow = iframe.contentWindow;
  const doc = printWindow?.document;

  if (!printWindow || !doc) {
    iframe.remove();
    throw new Error("Print window tidak tersedia");
  }

  doc.open();
  doc.write(buildReceiptHtml(data));
  doc.close();

  await waitForImages(doc);
  await new Promise((resolve) => window.setTimeout(resolve, 150));

  const cleanup = () => {
    window.setTimeout(() => iframe.remove(), 500);
  };

  printWindow.addEventListener("afterprint", cleanup, { once: true });
  window.setTimeout(cleanup, 5000);

  printWindow.focus();
  printWindow.print();
}

export function ReceiptDialog({
  open,
  onOpenChange,
  data,
}: ReceiptDialogProps) {
  const [printing, setPrinting] = useState(false);
  const [printError, setPrintError] = useState("");

  if (!data) return null;

  const handlePrint = async () => {
    setPrintError("");
    setPrinting(true);

    try {
      await printReceipt(data);
    } catch {
      setPrintError("Gagal membuka dialog print. Coba tekan Print sekali lagi.");
    } finally {
      setPrinting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Struk Transaksi</DialogTitle>
        </DialogHeader>

        <div className="font-mono text-xs space-y-2 bg-white p-4 rounded border">
          <div className="text-center space-y-1">
            {data.businessLogo && (
              <img
                src={data.businessLogo}
                alt="logo"
                className="h-10 w-auto mx-auto object-contain"
              />
            )}
            {data.receiptHeader && (
              <p className="text-xs text-muted-foreground">
                {data.receiptHeader}
              </p>
            )}
            <p className="font-bold text-sm">
              {data.businessName.toUpperCase()}
            </p>
            {data.businessAddress && <p>{data.businessAddress}</p>}
            {data.businessPhone && <p>Telp: {data.businessPhone}</p>}
          </div>

          <div className="border-t border-dashed border-gray-400 my-2" />

          <div className="space-y-0.5">
            <p>No: {data.transactionNo}</p>
            <p>Tanggal: {formatDateTime(data.createdAt)}</p>
            <p>Kasir: {data.cashierName}</p>
            {data.customerName && <p>Customer: {data.customerName}</p>}
          </div>

          <div className="border-t border-dashed border-gray-400 my-2" />

          <div className="space-y-1">
            {data.items.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between">
                  <span>
                    {item.quantity}x {item.productName}
                  </span>
                  <span>{formatCurrency(item.subtotal)}</span>
                </div>
                {item.modifiers && item.modifiers.length > 0 && (
                  <div className="pl-4 text-gray-500">
                    {item.modifiers.map((mod, j) => (
                      <div key={j} className="flex justify-between">
                        <span>+ {mod.optionName}</span>
                        {mod.price > 0 && (
                          <span>+{formatCurrency(mod.price)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {item.discount > 0 && (
                  <div className="flex justify-between text-gray-500 pl-4">
                    <span>Diskon</span>
                    <span>-{formatCurrency(item.discount)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-gray-400 my-2" />

          <div className="space-y-0.5">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(data.subtotal)}</span>
            </div>
            {data.taxIncluded && data.tax > 0 && (
              <div className="flex justify-between">
                <span>Pajak ({data.taxRate}%)</span>
                <span>{formatCurrency(data.tax)}</span>
              </div>
            )}
            {data.discount > 0 && (
              <div className="flex justify-between">
                <span>Diskon</span>
                <span>-{formatCurrency(data.discount)}</span>
              </div>
            )}
            {data.pointsRedemptionAmount && data.pointsRedemptionAmount > 0 ? (
              <div className="flex justify-between">
                <span>Poin ({data.pointsRedeemed} poin)</span>
                <span>-{formatCurrency(data.pointsRedemptionAmount)}</span>
              </div>
            ) : null}
          </div>

          <div className="border-t border-dashed border-gray-400 my-2" />

          <div className="flex justify-between font-bold text-sm">
            <span>TOTAL</span>
            <span>{formatCurrency(data.total)}</span>
          </div>

          <div className="space-y-0.5 mt-1">
            <div className="flex justify-between">
              <span>
                Bayar (
                {paymentMethodLabels[data.paymentMethod] || data.paymentMethod})
              </span>
              <span>{formatCurrency(data.paymentAmount)}</span>
            </div>
            {data.changeAmount > 0 && (
              <div className="flex justify-between">
                <span>Kembalian</span>
                <span>{formatCurrency(data.changeAmount)}</span>
              </div>
            )}
          </div>

          {data.pointsEarned && data.pointsEarned > 0 ? (
            <>
              <div className="border-t border-dashed border-gray-400 my-2" />
              <div className="text-center text-xs space-y-0.5">
                <p className="font-semibold">🎁 Poin Loyalty</p>
                <p>+{data.pointsEarned} poin dari transaksi ini</p>
              </div>
            </>
          ) : null}

          <div className="border-t border-dashed border-gray-400 my-2" />

          <div className="text-center space-y-1">
            <p>Terima kasih atas kunjungan Anda!</p>
            {data.receiptFooter && <p>{data.receiptFooter}</p>}
          </div>
        </div>

        {printError && (
          <p className="text-xs text-destructive text-center">{printError}</p>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => void handlePrint()}
            disabled={printing}
          >
            {printing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Printer className="mr-2 h-4 w-4" />
            )}
            {printing ? "Menyiapkan..." : "Print"}
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            <X className="mr-2 h-4 w-4" />
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
