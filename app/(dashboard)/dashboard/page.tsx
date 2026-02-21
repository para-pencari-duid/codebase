import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StatsCards } from "./components/stats-cards";
import { RevenueChart } from "./components/revenue-chart";
import { TopProducts } from "./components/top-products";
import { SalesByCategory } from "./components/sales-by-category";
import { CustomerInsights } from "./components/customer-insights";
import { ExpenseAnalytics } from "./components/expense-analytics";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Overview penjualan dan kinerja toko Anda
          </p>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <StatsCards />

      {/* Revenue Chart - Full Width */}
      <div className="grid gap-6">
        <RevenueChart />
      </div>

      {/* Analytics Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Products & Sales by Category */}
        <div className="grid gap-6">
          <TopProducts />
          <SalesByCategory />
        </div>
        
        {/* Customer Insights & Expense Analytics */}
        <div className="grid gap-6">
          <CustomerInsights />
          <ExpenseAnalytics />
        </div>
      </div>
    </div>
  );
}
