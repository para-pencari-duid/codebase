import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { PosPaymentMethod } from "@/lib/types/pos-checkout";

type QrisLoadState = "idle" | "loading" | "error";

interface UsePosQrisParams {
  paymentMethod: PosPaymentMethod;
  amount: number;
}

interface UsePosQrisResult {
  qrisImage: string | null;
  qrisLoadState: QrisLoadState;
  regenerateQris: () => Promise<void>;
  clearQris: () => void;
}

export function usePosQris({
  paymentMethod,
  amount,
}: UsePosQrisParams): UsePosQrisResult {
  const [qrisImage, setQrisImage] = useState<string | null>(null);
  const [qrisLoadState, setQrisLoadState] = useState<QrisLoadState>("idle");

  const clearQris = useCallback(() => {
    setQrisImage(null);
    setQrisLoadState("idle");
  }, []);

  const regenerateQris = useCallback(async () => {
    if (paymentMethod !== "QRIS" || amount <= 0) {
      clearQris();
      return;
    }

    setQrisLoadState("loading");
    setQrisImage(null);

    try {
      const res = await fetch("/api/qris/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(err.error || "Gagal membuat QR QRIS");
        setQrisLoadState("error");
        return;
      }

      const data = (await res.json()) as { qrCode?: string };
      if (!data.qrCode) {
        setQrisLoadState("error");
        return;
      }

      setQrisImage(data.qrCode);
      setQrisLoadState("idle");
    } catch {
      setQrisLoadState("error");
    }
  }, [amount, clearQris, paymentMethod]);

  useEffect(() => {
    if (paymentMethod !== "QRIS" || amount <= 0) return;
    let cancelled = false;

    void Promise.resolve().then(() => {
      if (!cancelled) void regenerateQris();
    });

    return () => {
      cancelled = true;
    };
  }, [amount, paymentMethod, regenerateQris]);

  const isActive = paymentMethod === "QRIS" && amount > 0;

  return {
    qrisImage: isActive ? qrisImage : null,
    qrisLoadState: isActive ? qrisLoadState : "idle",
    regenerateQris,
    clearQris,
  };
}
