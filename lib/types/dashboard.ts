// Dashboard TypeScript Types

export interface QuickStats {
  todayRevenue: number;
  todayTransactions: number;
  todayCustomers: number;
  lowStockCount: number;
  revenueChange: number; // percentage change from yesterday
  transactionsChange: number;
  customersChange: number;
  bestSellingProduct: {
    name: string;
    quantity: number;
  } | null;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  transactions: number;
}

export interface TopProduct {
  id: string;
  name: string;
  category: string;
  quantitySold: number;
  revenue: number;
  profit?: number;
}

export interface SalesByCategory {
  category: string;
  revenue: number;
  transactions: number;
  percentage: number;
  color?: string;
}

export interface CustomerInsight {
  totalCustomers: number;
  newCustomers: number; // this month
  returningCustomers: number;
  averageOrderValue: number;
  topCustomers: Array<{
    id: string;
    name: string;
    phone: string | null;
    totalSpent: number;
    orderCount: number;
  }>;
}

export type DateRangeOption = "today" | "week" | "month" | "year" | "custom";

export interface DateRange {
  from: Date;
  to: Date;
}

export interface DashboardFilters {
  dateRange: DateRangeOption;
  customRange?: DateRange;
}
