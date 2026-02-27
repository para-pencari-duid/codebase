"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Printer, X } from "lucide-react";
import { useRef } from "react";
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

export function ReceiptDialog({
  open,
  onOpenChange,
  data,
}: ReceiptDialogProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!data) return null;

  const handlePrint = () => {
    const content = receiptRef.current;
    if (!content) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
            <html>
            <head>
                <title>Struk ${data.transactionNo}</title>
                <style>
                    body { font-family: monospace; font-size: 12px; width: 300px; margin: 0 auto; padding: 10px; }
                    .center { text-align: center; }
                    .right { text-align: right; }
                    .bold { font-weight: bold; }
                    .divider { border-top: 1px dashed #000; margin: 8px 0; }
                    .item-row { display: flex; justify-content: space-between; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                ${content.innerHTML}
                <script>window.print(); window.close();</script>
            </body>
            </html>
        `);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Struk Transaksi</DialogTitle>
        </DialogHeader>

        <div
          ref={receiptRef}
          className="font-mono text-xs space-y-2 bg-white p-4 rounded border"
        >
          <div className="text-center space-y-1">
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

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
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
