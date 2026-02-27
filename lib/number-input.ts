export const idNumberFormatter = new Intl.NumberFormat("id-ID");

export const parseDigitsToNumber = (value: string): number => {
  const digitsOnly = value.replace(/\D/g, "");

  return digitsOnly === "" ? 0 : Number(digitsOnly);
};

export const formatNumberInputValue = (
  value: number | string | null | undefined,
): string => {
  const numericValue =
    typeof value === "string" ? Number(value || 0) : (value ?? 0);

  return Number.isFinite(numericValue) && numericValue > 0
    ? idNumberFormatter.format(numericValue)
    : "";
};

export const clampPercentDiscount = (value: number): number =>
  Math.min(value, 100);
