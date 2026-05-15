import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StatsCards } from "./components/stats-cards";
import { RevenueChart } from "./components/revenue-chart";
import { TopProducts } from "./components/top-products";
import { SalesByCategory } from "./components/sales-by-category";
import { CustomerInsights } from "./components/customer-insights";
import { ExpenseAnalytics } from "./components/expense-analytics";
import { ProductionTargetInsight } from "./components/production-target-insight";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="p-5 lg:p-7 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Overview penjualan dan kinerja toko Anda</p>
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
          <ProductionTargetInsight />
          <ExpenseAnalytics />
        </div>
      </div>
    </div>
  );
}
