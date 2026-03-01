import { useEffect, useState } from "react";
import type { PosLoyaltyInfo } from "@/lib/types/pos-checkout";

interface UsePosLoyaltyResult {
  loyaltyInfo: PosLoyaltyInfo | null;
  loyaltyLoading: boolean;
  resetLoyalty: () => void;
}

export function usePosLoyalty(customerId: string | null): UsePosLoyaltyResult {
  const [loyaltyInfo, setLoyaltyInfo] = useState<PosLoyaltyInfo | null>(null);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);

  useEffect(() => {
    if (!customerId) {
      setLoyaltyInfo(null);
      setLoyaltyLoading(false);
      return;
    }

    let active = true;
    setLoyaltyLoading(true);

    fetch(`/api/loyalty/${customerId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: unknown) => {
        if (!active) return;
        if (!data || typeof data !== "object") {
          setLoyaltyInfo(null);
          return;
        }
        const loyalty = data as PosLoyaltyInfo;
        setLoyaltyInfo({
          enabled: Boolean(loyalty.enabled),
          points: Number(loyalty.points || 0),
          pointValue: Number(loyalty.pointValue || 0),
          pointsPerRupiah: Number(loyalty.pointsPerRupiah || 0),
        });
      })
      .catch(() => {
        if (active) setLoyaltyInfo(null);
      })
      .finally(() => {
        if (active) setLoyaltyLoading(false);
      });

    return () => {
      active = false;
    };
  }, [customerId]);

  return {
    loyaltyInfo,
    loyaltyLoading,
    resetLoyalty: () => setLoyaltyInfo(null),
  };
}
