import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatNumberInputValue,
  parseDigitsToNumber,
} from "@/lib/number-input";
import { formatCurrency } from "@/lib/utils";
import {
  Banknote,
  Building2,
  CreditCard,
  Loader2,
  Plus,
  QrCode,
  SplitSquareVertical,
  Trash2,
  Wallet,
} from "lucide-react";

interface PaymentLine {
  id: string;
  method: string;
  amount: number;
  qrCode?: string;
  qrLoading?: boolean;
}

interface PaymentSectionProps {
  splitMode: boolean;
  onToggleSplitMode: (value: boolean) => void;
  payments: PaymentLine[];
  finalTotal: number;
  totalPaid: number;
  onUpdatePaymentMethod: (lineId: string, method: string) => void;
  onUpdatePaymentAmount: (lineId: string, amount: number) => void;
  onAddPaymentLine: () => void;
  onRemovePaymentLine: (lineId: string) => void;
  onGenerateQrForLine: (lineId: string, amount: number) => Promise<void>;
}

const PAYMENT_METHODS = [
  { value: "CASH", label: "Tunai", icon: Banknote },
  { value: "TRANSFER", label: "Transfer", icon: Building2 },
  { value: "QRIS", label: "QRIS", icon: QrCode },
  { value: "DEBIT_CARD", label: "Debit", icon: CreditCard },
  { value: "CREDIT_CARD", label: "Kredit", icon: CreditCard },
  { value: "EWALLET", label: "E-Wallet", icon: Wallet },
];

const QUICK_CASH = [50000, 100000, 150000, 200000, 300000, 500000];

export function PaymentSection({
  splitMode,
  onToggleSplitMode,
  payments,
  finalTotal,
  totalPaid,
  onUpdatePaymentMethod,
  onUpdatePaymentAmount,
  onAddPaymentLine,
  onRemovePaymentLine,
  onGenerateQrForLine,
}: PaymentSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="font-semibold">Metode Pembayaran</Label>
        <div className="flex items-center gap-2 text-sm">
          <SplitSquareVertical className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Split Tagihan</span>
          <Switch checked={splitMode} onCheckedChange={onToggleSplitMode} />
        </div>
      </div>

      {!splitMode && (
        <>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_METHODS.map((methodItem) => {
              const Icon = methodItem.icon;
              return (
                <button
                  key={methodItem.value}
                  onClick={() => {
                    onUpdatePaymentMethod("1", methodItem.value);
                    onUpdatePaymentAmount("1", finalTotal);
                  }}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors text-sm ${payments[0]?.method === methodItem.value ? "border-primary bg-primary/5 text-primary" : "border-slate-200 hover:border-slate-300"}`}
                  type="button"
                >
                  <Icon className="h-5 w-5" />
                  {methodItem.label}
                </button>
              );
            })}
          </div>
          {payments[0]?.method === "CASH" && (
            <div className="space-y-2">
              <Label>Jumlah Bayar</Label>
              <Input
                type="text"
                inputMode="numeric"
                aria-label="Jumlah bayar"
                placeholder="0"
                value={formatNumberInputValue(payments[0].amount)}
                onChange={(event) =>
                  onUpdatePaymentAmount(
                    "1",
                    parseDigitsToNumber(event.target.value),
                  )
                }
              />
              <div className="flex flex-wrap gap-2">
                {QUICK_CASH.filter((amount) => amount >= finalTotal)
                  .slice(0, 4)
                  .map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdatePaymentAmount("1", amount)}
                      type="button"
                    >
                      {formatCurrency(amount)}
                    </Button>
                  ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdatePaymentAmount("1", finalTotal)}
                  type="button"
                >
                  Uang Pas
                </Button>
              </div>
            </div>
          )}
          {payments[0]?.method === "QRIS" && (
            <QrisBlock
              line={payments[0]}
              amount={finalTotal}
              onGenerate={() => void onGenerateQrForLine("1", finalTotal)}
            />
          )}
        </>
      )}

      {splitMode && (
        <div className="space-y-3">
          {payments.map((line, index) => (
            <div
              key={line.id}
              className="p-3 border rounded-lg space-y-2 bg-slate-50"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground w-16">
                  Bayar {index + 1}
                </span>
                <Select
                  value={line.method}
                  onValueChange={(value) =>
                    onUpdatePaymentMethod(line.id, value)
                  }
                >
                  <SelectTrigger className="flex-1 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((methodItem) => (
                      <SelectItem
                        key={methodItem.value}
                        value={methodItem.value}
                      >
                        {methodItem.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="text"
                  inputMode="numeric"
                  aria-label={`Nominal bayar ${index + 1}`}
                  className="w-32 h-8 text-sm"
                  placeholder="Nominal"
                  value={formatNumberInputValue(line.amount)}
                  onChange={(event) =>
                    onUpdatePaymentAmount(
                      line.id,
                      parseDigitsToNumber(event.target.value),
                    )
                  }
                />
                {payments.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-500 hover:bg-red-50"
                    onClick={() => onRemovePaymentLine(line.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {line.method === "QRIS" && (
                <QrisBlock
                  line={line}
                  amount={line.amount}
                  onGenerate={() =>
                    void onGenerateQrForLine(line.id, line.amount)
                  }
                />
              )}
            </div>
          ))}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={onAddPaymentLine}
              type="button"
            >
              <Plus className="h-4 w-4 mr-1" />
              Tambah Metode
            </Button>
            <div className="text-sm">
              <span
                className={
                  totalPaid >= finalTotal
                    ? "text-green-600 font-semibold"
                    : "text-red-500 font-semibold"
                }
              >
                Terbayar: {formatCurrency(totalPaid)}
              </span>
              <span className="text-muted-foreground">
                {" "}
                / {formatCurrency(finalTotal)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QrisBlock({
  line,
  amount,
  onGenerate,
}: {
  line: PaymentLine;
  amount: number;
  onGenerate: () => void;
}) {
  return (
    <div className="mt-2 space-y-2">
      {!line.qrCode && !line.qrLoading && (
        <Button
          variant="outline"
          size="sm"
          onClick={onGenerate}
          type="button"
          disabled={amount <= 0}
        >
          <QrCode className="h-4 w-4 mr-2" />
          Generate QR QRIS — {formatCurrency(amount)}
        </Button>
      )}
      {line.qrLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating QRIS...
        </div>
      )}
      {line.qrCode && (
        <div className="flex flex-col items-center gap-2 p-3 bg-white border-2 border-primary/20 rounded-xl">
          <p className="text-xs font-semibold text-muted-foreground">
            Scan QRIS — {formatCurrency(amount)}
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={line.qrCode}
            alt="QRIS QR Code"
            width={200}
            height={200}
            className="rounded-lg"
          />
          <p className="text-xs text-muted-foreground">
            Berlaku untuk transaksi ini saja
          </p>
          <Button variant="ghost" size="sm" onClick={onGenerate} type="button">
            <QrCode className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        </div>
      )}
    </div>
  );
}

export type { PaymentLine };
