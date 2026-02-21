import { DateRangeOption, DateRange } from "./types/dashboard";

/**
 * Get date range based on option
 */
export function getDateRange(option: DateRangeOption, customRange?: DateRange): DateRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (option) {
    case "today":
      return {
        from: today,
        to: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59),
      };

    case "week":
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
      return {
        from: weekStart,
        to: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
      };

    case "month":
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
      };

    case "year":
      return {
        from: new Date(now.getFullYear(), 0, 1),
        to: new Date(now.getFullYear(), 11, 31, 23, 59, 59),
      };

    case "custom":
      if (!customRange) throw new Error("Custom range required");
      return customRange;

    default:
      return getDateRange("today");
  }
}

/**
 * Get previous period date range (for comparison)
 */
export function getPreviousPeriodRange(current: DateRange): DateRange {
  const duration = current.to.getTime() - current.from.getTime();
  
  return {
    from: new Date(current.from.getTime() - duration),
    to: new Date(current.from.getTime() - 1),
  };
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Format currency for display
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
 * Format number with thousands separator
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("id-ID").format(num);
}

/**
 * Format date for chart labels
 */
export function formatChartDate(date: Date | string, interval: DateRangeOption): string {
  const d = typeof date === "string" ? new Date(date) : date;
  
  switch (interval) {
    case "today":
    case "week":
      return d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric" });
    case "month":
      return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    case "year":
      return d.toLocaleDateString("id-ID", { month: "short" });
    default:
      return d.toLocaleDateString("id-ID");
  }
}

/**
 * Generate date range array for charts
 */
export function generateDateArray(from: Date, to: Date, interval: "day" | "week" | "month" = "day"): Date[] {
  const dates: Date[] = [];
  const current = new Date(from);

  while (current <= to) {
    dates.push(new Date(current));
    
    switch (interval) {
      case "day":
        current.setDate(current.getDate() + 1);
        break;
      case "week":
        current.setDate(current.getDate() + 7);
        break;
      case "month":
        current.setMonth(current.getMonth() + 1);
        break;
    }
  }

  return dates;
}
