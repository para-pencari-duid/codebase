export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  generateDailySalesReport,
  generateMonthlySalesReport,
  generateProductReport,
  generateInventoryReport,
  generateCustomerReport,
  generateProfitLossReport,
  DailySalesData,
  MonthlySalesData,
  ProductReportData,
  InventoryReportData,
  CustomerReportData,
  ProfitLossData,
} from "@/lib/excel-reports";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get("type") || "daily";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const dateParam = searchParams.get("date");

    const settings = await prisma.settings.findFirst();
    const businessName = settings?.businessName || "Usaha";

    let workbook;
    let filename;

    switch (reportType) {
      case "daily": {
        const date = dateParam ? new Date(dateParam) : new Date();
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const data = await generateDailySalesData(startOfDay, endOfDay, businessName);
        workbook = await generateDailySalesReport(data);
        filename = `Laporan_Harian_${date.toISOString().split("T")[0]}.xlsx`;
        break;
      }

      case "weekly": {
        const date = dateParam ? new Date(dateParam) : new Date();
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay() + 1); // Monday
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        // Use monthly report format for weekly
        const data = await generateMonthlySalesData(startOfWeek, endOfWeek, businessName, "Mingguan");
        workbook = await generateMonthlySalesReport(data);
        filename = `Laporan_Mingguan_${startOfWeek.toISOString().split("T")[0]}.xlsx`;
        break;
      }

      case "monthly": {
        const date = dateParam ? new Date(dateParam) : new Date();
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

        const data = await generateMonthlySalesData(startOfMonth, endOfMonth, businessName, "Bulanan");
        workbook = await generateMonthlySalesReport(data);
        filename = `Laporan_Bulanan_${date.getFullYear()}_${String(date.getMonth() + 1).padStart(2, "0")}.xlsx`;
        break;
      }

      case "custom": {
        if (!startDate || !endDate) {
          return NextResponse.json({ error: "Start date and end date required" }, { status: 400 });
        }
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const data = await generateMonthlySalesData(start, end, businessName, "Custom");
        workbook = await generateMonthlySalesReport(data);
        filename = `Laporan_Custom_${startDate}_${endDate}.xlsx`;
        break;
      }

      case "products": {
        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
        start.setHours(0, 0, 0, 0);
        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);

        const data = await generateProductReportData(start, end, businessName);
        workbook = await generateProductReport(data);
        filename = `Laporan_Produk_${start.toISOString().split("T")[0]}.xlsx`;
        break;
      }

      case "inventory": {
        const data = await generateInventoryReportData(businessName);
        workbook = await generateInventoryReport(data);
        filename = `Laporan_Inventory_${new Date().toISOString().split("T")[0]}.xlsx`;
        break;
      }

      case "customers": {
        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
        start.setHours(0, 0, 0, 0);
        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);

        const data = await generateCustomerReportData(start, end, businessName);
        workbook = await generateCustomerReport(data);
        filename = `Laporan_Customer_${start.toISOString().split("T")[0]}.xlsx`;
        break;
      }

      case "profitloss": {
        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
        start.setHours(0, 0, 0, 0);
        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);

        const data = await generateProfitLossData(start, end, businessName);
        workbook = await generateProfitLossReport(data);
        filename = `Laporan_LabaRugi_${start.toISOString().split("T")[0]}.xlsx`;
        break;
      }

      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ============================================
// DATA GENERATION FUNCTIONS
// ============================================

async function generateDailySalesData(
  startDate: Date,
  endDate: Date,
  businessName: string
): Promise<DailySalesData> {
  // Get transactions for the day
  const transactions = await prisma.transaction.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
    },
    include: {
      items: true,
      user: true,
      customer: true,
    },
  });

  const totalSales = transactions.reduce((sum, t) => sum + Number(t.total), 0);
  const totalItems = transactions.reduce(
    (sum, t) => sum + t.items.reduce((s, i) => s + i.quantity, 0),
    0
  );
  const uniqueCustomers = new Set(transactions.filter(t => t.customerId).map(t => t.customerId)).size;
  const walkInCustomers = transactions.filter(t => !t.customerId).length;

  // Payment breakdown
  const paymentMethods: Record<string, number> = {};
  transactions.forEach((t) => {
    const method = t.paymentMethod || "CASH";
    paymentMethods[method] = (paymentMethods[method] || 0) + Number(t.total);
  });

  const paymentBreakdown = Object.entries(paymentMethods).map(([method, amount]) => ({
    method: method === "CASH" ? "Cash" : method === "TRANSFER" ? "Transfer" : method === "QRIS" ? "QRIS" : "Kartu",
    icon: method === "CASH" ? "💵" : method === "TRANSFER" ? "🏦" : method === "QRIS" ? "📱" : "💳",
    amount,
    percentage: Math.round((amount / totalSales) * 100) || 0,
  }));

  // Hourly sales
  const hourlyMap: Record<number, { transactions: number; amount: number }> = {};
  for (let h = 8; h <= 21; h++) {
    hourlyMap[h] = { transactions: 0, amount: 0 };
  }

  transactions.forEach((t) => {
    const hour = t.createdAt.getHours();
    if (hourlyMap[hour]) {
      hourlyMap[hour].transactions++;
      hourlyMap[hour].amount += Number(t.total);
    }
  });

  const maxTransactions = Math.max(...Object.values(hourlyMap).map((h) => h.transactions));
  const hourlySales = Object.entries(hourlyMap)
    .filter(([_, data]) => data.transactions > 0)
    .map(([hour, data]) => ({
      hour: `${hour.padStart(2, "0")}:00-${String(Number(hour) + 1).padStart(2, "0")}:00`,
      transactions: data.transactions,
      amount: data.amount,
      isPeak: data.transactions === maxTransactions && maxTransactions > 0,
    }));

  // Top products
  const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
  transactions.forEach((t) => {
    t.items.forEach((item) => {
      if (!productSales[item.itemName]) {
        productSales[item.itemName] = { name: item.itemName, quantity: 0, revenue: 0 };
      }
      productSales[item.itemName].quantity += item.quantity;
      productSales[item.itemName].revenue += Number(item.subtotal);
    });
  });

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10)
    .map((p, idx) => ({
      rank: idx + 1,
      name: p.name,
      quantity: p.quantity,
      unit: "pcs",
      revenue: p.revenue,
    }));

  // Category sales
  const categories = await prisma.itemCategory.findMany();
  const itemsForCat = await prisma.item.findMany({ where: { type: "GOODS" }, select: { name: true, categoryId: true } });
  const productCategoryMap: Record<string, string> = {};
  itemsForCat.forEach((p) => {
    const cat = categories.find((c) => c.id === p.categoryId);
    productCategoryMap[p.name] = cat?.name || "Lainnya";
  });

  const categorySalesMap: Record<string, number> = {};
  transactions.forEach((t) => {
    t.items.forEach((item) => {
      const category = productCategoryMap[item.itemName] || "Lainnya";
      categorySalesMap[category] = (categorySalesMap[category] || 0) + Number(item.subtotal);
    });
  });

  // Build category icon map dynamically from DB
  const categoryIcons: Record<string, string> = { "Lainnya": "📦" };
  categories.forEach((c) => {
    if (c.icon) categoryIcons[c.name] = c.icon;
  });

  const categorySales = Object.entries(categorySalesMap)
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount]) => ({
      category,
      icon: categoryIcons[category] || "📦",
      amount,
      percentage: Math.round((amount / totalSales) * 100) || 0,
    }));

  // Cashier performance
  const cashierMap: Record<string, { name: string; transactions: number; amount: number }> = {};
  transactions.forEach((t) => {
    const name = t.user?.name || "Unknown";
    if (!cashierMap[name]) {
      cashierMap[name] = { name, transactions: 0, amount: 0 };
    }
    cashierMap[name].transactions++;
    cashierMap[name].amount += Number(t.total);
  });

  const cashierPerformance = Object.values(cashierMap).sort((a, b) => b.amount - a.amount);

  // Discount
  const totalDiscount = transactions.reduce((sum, t) => sum + Number(t.discount || 0), 0);

  // Notes
  const notes: string[] = [];
  const dayOfWeek = startDate.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    notes.push("✓ Hari libur (weekend)");
  } else {
    notes.push("✓ Hari biasa (weekday)");
  }

  // Check low stock
  const lowStockVariants = await prisma.itemVariant.findMany({
    where: { stock: { lte: 15 }, item: { isActive: true, type: "GOODS" } },
    include: { item: { select: { name: true } } },
    take: 3,
  });
  lowStockVariants.forEach((v) => {
    notes.push(`⚠ Stok ${v.item.name} menipis (sisa ${v.stock} pcs)`);
  });

  return {
    date: startDate,
    businessName,
    summary: {
      totalTransactions: transactions.length,
      totalSales,
      avgPerTransaction: transactions.length > 0 ? Math.round(totalSales / transactions.length) : 0,
      totalItems,
      totalCustomers: uniqueCustomers + walkInCustomers,
    },
    paymentBreakdown,
    hourlySales,
    topProducts,
    categorySales,
    cashierPerformance,
    discountSummary: {
      totalDiscount,
      avgPerTransaction: transactions.length > 0 ? Math.round(totalDiscount / transactions.length) : 0,
    },
    notes,
  };
}

async function generateMonthlySalesData(
  startDate: Date,
  endDate: Date,
  businessName: string,
  periodType: string
): Promise<MonthlySalesData> {
  const transactions = await prisma.transaction.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
    },
    include: {
      items: true,
      user: true,
      customer: true,
    },
  });

  const totalSales = transactions.reduce((sum, t) => sum + Number(t.total), 0);
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  // Estimate COGS as 40% of sales (simplified)
  const cogs = totalSales * 0.4;
  const grossProfit = totalSales - cogs;

  // Weekly trend
  const weeklyData: { [key: number]: number } = {};
  transactions.forEach((t) => {
    const week = Math.floor((t.createdAt.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    weeklyData[week] = (weeklyData[week] || 0) + Number(t.total);
  });

  const weeklyTrend = Object.entries(weeklyData).map(([week, amount], idx, arr) => {
    const weekNum = parseInt(week) + 1;
    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() + parseInt(week) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    let trend: "up" | "down" | "stable" = "stable";
    if (idx > 0) {
      const prevAmount = arr[idx - 1][1] as number;
      if (amount > prevAmount * 1.05) trend = "up";
      else if (amount < prevAmount * 0.95) trend = "down";
    }

    return {
      week: `Minggu ${weekNum}`,
      dates: `${weekStart.getDate()}-${weekEnd.getDate()}`,
      amount,
      trend,
    };
  });

  // Calculate real growth from previous period
  const periodLength = endDate.getTime() - startDate.getTime();
  const prevPeriodStart = new Date(startDate.getTime() - periodLength);
  const prevPeriodEnd = new Date(startDate.getTime() - 1);

  const prevTransactions = await prisma.transaction.findMany({
    where: {
      createdAt: { gte: prevPeriodStart, lte: prevPeriodEnd },
    },
  });

  const prevSales = prevTransactions.reduce((sum, t) => sum + Number(t.total), 0);
  const growthVsLast = prevSales > 0 ? ((totalSales - prevSales) / prevSales) * 100 : 0;

  // Calculate year-over-year growth
  const yearAgoPeriodStart = new Date(startDate);
  yearAgoPeriodStart.setFullYear(yearAgoPeriodStart.getFullYear() - 1);
  const yearAgoPeriodEnd = new Date(endDate);
  yearAgoPeriodEnd.setFullYear(yearAgoPeriodEnd.getFullYear() - 1);

  const yearAgoTransactions = await prisma.transaction.findMany({
    where: {
      createdAt: { gte: yearAgoPeriodStart, lte: yearAgoPeriodEnd },
    },
  });

  const yearAgoSales = yearAgoTransactions.reduce((sum, t) => sum + Number(t.total), 0);
  const growthVsYear = yearAgoSales > 0 ? ((totalSales - yearAgoSales) / yearAgoSales) * 100 : 0;

  // Top products
  const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
  transactions.forEach((t) => {
    t.items.forEach((item) => {
      if (!productSales[item.itemName]) {
        productSales[item.itemName] = { name: item.itemName, quantity: 0, revenue: 0 };
      }
      productSales[item.itemName].quantity += item.quantity;
      productSales[item.itemName].revenue += Number(item.subtotal);
    });
  });

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10)
    .map((p, idx) => ({
      rank: idx + 1,
      name: p.name,
      quantity: p.quantity,
      unit: "pcs",
      revenue: p.revenue,
    }));

  // Category sales
  const categories = await prisma.itemCategory.findMany();
  const itemsForCat = await prisma.item.findMany({ where: { type: "GOODS" }, select: { name: true, categoryId: true } });
  const productCategoryMap: Record<string, string> = {};
  itemsForCat.forEach((p) => {
    const cat = categories.find((c) => c.id === p.categoryId);
    productCategoryMap[p.name] = cat?.name || "Lainnya";
  });

  const categorySalesMap: Record<string, number> = {};
  transactions.forEach((t) => {
    t.items.forEach((item) => {
      const category = productCategoryMap[item.itemName] || "Lainnya";
      categorySalesMap[category] = (categorySalesMap[category] || 0) + Number(item.subtotal);
    });
  });

  // Build category icon map dynamically from DB
  const categoryIcons: Record<string, string> = { "Lainnya": "📦" };
  categories.forEach((c) => {
    if (c.icon) categoryIcons[c.name] = c.icon;
  });

  const categorySales = Object.entries(categorySalesMap)
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount]) => ({
      category,
      icon: categoryIcons[category] || "📦",
      amount,
      percentage: Math.round((amount / totalSales) * 100) || 0,
    }));

  // Payment methods
  const paymentMethods: Record<string, number> = {};
  transactions.forEach((t) => {
    const method = t.paymentMethod || "CASH";
    paymentMethods[method] = (paymentMethods[method] || 0) + Number(t.total);
  });

  const paymentMethodsArr = Object.entries(paymentMethods).map(([method, amount]) => ({
    method: method === "CASH" ? "Cash" : method === "TRANSFER" ? "Transfer" : method === "QRIS" ? "QRIS" : "Kartu",
    icon: method === "CASH" ? "💵" : method === "TRANSFER" ? "🏦" : method === "QRIS" ? "📱" : "💳",
    amount,
    percentage: Math.round((amount / totalSales) * 100) || 0,
  }));

  // Customer metrics
  const uniqueCustomerIds = new Set(transactions.filter(t => t.customerId).map(t => t.customerId));
  const totalCustomers = uniqueCustomerIds.size + transactions.filter(t => !t.customerId).length;

  // Calculate real new customers in this period
  const allCustomers = await prisma.customer.findMany();
  const newCustomersInPeriod = allCustomers.filter(
    (c) => c.createdAt >= startDate && c.createdAt <= endDate
  ).length;

  // Calculate real repeat rate
  const customerIdsArray = Array.from(uniqueCustomerIds).filter((id): id is string => id !== null);
  const customersWithMultipleTrx = customerIdsArray.length > 0
    ? await prisma.customer.count({
      where: {
        id: { in: customerIdsArray },
        transactions: { some: { createdAt: { lt: startDate } } },
      },
    })
    : 0;
  const repeatRate = customerIdsArray.length > 0
    ? Math.round((customersWithMultipleTrx / customerIdsArray.length) * 100)
    : 0;

  // Get customer transaction counts
  const customerTrxCounts: Record<string, { count: number; total: number; name: string }> = {};
  transactions.forEach((t) => {
    if (t.customerId && t.customer) {
      if (!customerTrxCounts[t.customerId]) {
        customerTrxCounts[t.customerId] = { count: 0, total: 0, name: t.customer.name };
      }
      customerTrxCounts[t.customerId].count++;
      customerTrxCounts[t.customerId].total += Number(t.total);
    }
  });

  const topCustomers = Object.values(customerTrxCounts)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map((c, idx) => ({
      rank: idx + 1,
      name: c.name,
      transactions: c.count,
      totalSpent: c.total,
    }));

  // Cashier performance
  const cashierMap: Record<string, { name: string; transactions: number; amount: number }> = {};
  transactions.forEach((t) => {
    const name = t.user?.name || "Unknown";
    if (!cashierMap[name]) {
      cashierMap[name] = { name, transactions: 0, amount: 0 };
    }
    cashierMap[name].transactions++;
    cashierMap[name].amount += Number(t.total);
  });

  const maxCashierAmount = Math.max(...Object.values(cashierMap).map(c => c.amount));
  const cashierPerformance = Object.values(cashierMap)
    .sort((a, b) => b.amount - a.amount)
    .map((c) => ({ ...c, isTop: c.amount === maxCashierAmount }));

  // Daily averages by day type
  const dayTypeAmounts: { saturday: number[]; sunday: number[]; weekday: number[] } = {
    saturday: [], sunday: [], weekday: [],
  };

  const dailyTotals: Record<string, number> = {};
  transactions.forEach((t) => {
    const dateKey = t.createdAt.toISOString().split("T")[0];
    dailyTotals[dateKey] = (dailyTotals[dateKey] || 0) + Number(t.total);
  });

  Object.entries(dailyTotals).forEach(([dateStr, total]) => {
    const day = new Date(dateStr).getDay();
    if (day === 6) dayTypeAmounts.saturday.push(total);
    else if (day === 0) dayTypeAmounts.sunday.push(total);
    else dayTypeAmounts.weekday.push(total);
  });

  const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  return {
    month: months[startDate.getMonth()],
    year: startDate.getFullYear(),
    businessName,
    summary: {
      totalTransactions: transactions.length,
      totalSales,
      avgPerDay: totalDays > 0 ? Math.round(totalSales / totalDays) : 0,
      operationalDays: Object.keys(dailyTotals).length,
    },
    grossProfit: {
      revenue: totalSales,
      cogs,
      profit: grossProfit,
      margin: totalSales > 0 ? Math.round((grossProfit / totalSales) * 100) : 0,
    },
    weeklyTrend,
    growth: {
      vsLastMonth: parseFloat(growthVsLast.toFixed(1)),
      vsLastYear: parseFloat(growthVsYear.toFixed(1)),
    },
    topProducts,
    categorySales,
    paymentMethods: paymentMethodsArr,
    customerMetrics: {
      totalCustomers,
      newCustomers: newCustomersInPeriod,
      repeatRate,
      avgTransaction: transactions.length > 0 ? Math.round(totalSales / transactions.length) : 0,
    },
    topCustomers,
    cashierPerformance,
    dailyAverage: {
      saturday: avg(dayTypeAmounts.saturday),
      sunday: avg(dayTypeAmounts.sunday),
      weekday: avg(dayTypeAmounts.weekday),
    },
    insights: [
      growthVsLast > 0 ? `✓ Penjualan tumbuh ${growthVsLast.toFixed(1)}% vs periode sebelumnya` : `⚠ Penjualan turun ${Math.abs(growthVsLast).toFixed(1)}% vs periode sebelumnya`,
      repeatRate >= 70 ? `✓ Repeat customer rate tinggi (${repeatRate}%)` : `⚠ Perlu tingkatkan repeat customer (${repeatRate}%)`,
      dayTypeAmounts.saturday.length > 0 && avg(dayTypeAmounts.saturday) > avg(dayTypeAmounts.weekday) * 1.2 ? "⚠ Pertimbangkan tambah produksi untuk weekend" : "",
      repeatRate < 70 ? "✓ Program loyalty bisa efektif untuk meningkatkan retention" : "",
    ].filter(Boolean),
  };
}

async function generateProductReportData(
  startDate: Date,
  endDate: Date,
  businessName: string
): Promise<ProductReportData> {
  const transactions = await prisma.transaction.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
    },
    include: { items: true },
  });

  const productSales: Record<string, { name: string; quantity: number; revenue: number; lastSold: Date }> = {};

  transactions.forEach((t) => {
    t.items.forEach((item) => {
      if (!productSales[item.itemName]) {
        productSales[item.itemName] = { name: item.itemName, quantity: 0, revenue: 0, lastSold: t.createdAt };
      }
      productSales[item.itemName].quantity += item.quantity;
      productSales[item.itemName].revenue += Number(item.subtotal);
      if (t.createdAt > productSales[item.itemName].lastSold) {
        productSales[item.itemName].lastSold = t.createdAt;
      }
    });
  });

  const sortedProducts = Object.values(productSales).sort((a, b) => b.quantity - a.quantity);

  const topProducts = sortedProducts.slice(0, 20).map((p, idx) => ({
    rank: idx + 1,
    name: p.name,
    quantity: p.quantity,
    unit: "pcs",
    revenue: p.revenue,
  }));

  // Slow moving (less than 50 sold)
  const slowMoving = sortedProducts
    .filter((p) => p.quantity < 50)
    .slice(0, 10)
    .map((p) => ({
      name: p.name,
      quantity: p.quantity,
      lastSold: p.lastSold,
    }));

  // Margin analysis using real product cost
  const allItems = await prisma.item.findMany({ where: { type: "GOODS" }, select: { name: true, baseCost: true } });
  const productCostMap: Record<string, number> = {};
  allItems.forEach((p) => {
    productCostMap[p.name] = Number(p.baseCost || 0);
  });

  const marginAnalysis = sortedProducts.slice(0, 10).map((p) => {
    const costPerUnit = productCostMap[p.name] || 0;
    const cogs = costPerUnit * p.quantity;
    const profit = p.revenue - cogs;
    const margin = p.revenue > 0 ? (profit / p.revenue) * 100 : 0;
    return {
      name: p.name,
      sold: p.quantity,
      revenue: p.revenue,
      cogs: Math.round(cogs),
      profit: Math.round(profit),
      margin: Math.round(margin),
    };
  });

  const totalRevenue = sortedProducts.reduce((sum, p) => sum + p.revenue, 0);
  const top10Revenue = topProducts.slice(0, 10).reduce((sum, p) => sum + p.revenue, 0);
  const top10Percentage = totalRevenue > 0 ? Math.round((top10Revenue / totalRevenue) * 100) : 0;

  const avgMargin = marginAnalysis.length > 0
    ? Math.round(marginAnalysis.reduce((sum, m) => sum + m.margin, 0) / marginAnalysis.length)
    : 0;
  const highMarginProducts = marginAnalysis.filter(m => m.margin >= 60);
  const lowMarginProducts = marginAnalysis.filter(m => m.margin < 40);

  return {
    period: { start: startDate, end: endDate },
    businessName,
    topProducts,
    slowMovingProducts: slowMoving,
    marginAnalysis,
    insights: [
      `Top 10 products = ${top10Percentage}% dari total revenue`,
      sortedProducts[0] ? `${sortedProducts[0].name} adalah best seller (${sortedProducts[0].quantity} terjual)` : "",
      marginAnalysis[0] ? `Rata-rata margin produk: ${avgMargin}%` : "",
      highMarginProducts.length > 0 ? `${highMarginProducts.length} produk dengan margin tinggi (≥60%)` : "",
      lowMarginProducts.length > 0 ? `⚠ ${lowMarginProducts.length} produk margin rendah (<40%), review pricing` : "",
      slowMoving.length > 3 ? `⚠ ${slowMoving.length} produk slow-moving, pertimbangkan diskon/promo` : "",
    ].filter(Boolean),
  };
}

async function generateInventoryReportData(businessName: string): Promise<InventoryReportData> {
  const variants = await prisma.itemVariant.findMany({
    where: { item: { isActive: true, type: "GOODS" } },
    include: { item: { select: { name: true, unit: true } } },
    orderBy: { stock: "desc" },
  });

  const totalStock = variants.reduce((sum, p) => sum + p.stock, 0);
  const stockValueCost = variants.reduce((sum, p) => sum + p.stock * Number(p.cost || 0), 0);
  const stockValuePrice = variants.reduce((sum, p) => sum + p.stock * Number(p.price), 0);

  const settings = await prisma.settings.findFirst();
  const minStock = settings?.lowStockThreshold || 10;

  const safeStock = variants.filter((p) => p.stock > minStock);
  const lowStock = variants.filter((p) => p.stock > 0 && p.stock <= minStock);
  const outOfStock = variants.filter((p) => p.stock === 0);

  return {
    asOfDate: new Date(),
    businessName,
    summary: {
      totalProducts: variants.length,
      totalStock,
      stockValueCost,
      stockValuePrice,
    },
    stockStatus: {
      safe: safeStock.length,
      low: lowStock.length,
      outOfStock: outOfStock.length,
    },
    topStockProducts: safeStock.slice(0, 10).map((p) => ({
      name: p.item.name,
      stock: p.stock,
      unit: p.item.unit || "pcs",
    })),
    lowStockProducts: lowStock.slice(0, 10).map((p) => ({
      name: p.item.name,
      stock: p.stock,
      minStock,
    })),
    outOfStockProducts: outOfStock.slice(0, 10).map((p) => p.item.name),
    recommendations: [
      outOfStock.length > 0 ? `Restock segera untuk ${outOfStock.length} produk habis` : "",
      lowStock.length > 0 ? `Tambah produksi untuk ${lowStock.length} produk menipis` : "",
      "Review minimum stock level secara berkala",
    ].filter(Boolean),
  };
}

async function generateCustomerReportData(
  startDate: Date,
  endDate: Date,
  businessName: string
): Promise<CustomerReportData> {
  const customers = await prisma.customer.findMany({
    include: {
      transactions: {
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      },
    },
  });

  const activeCustomers = customers.filter((c) => c.transactions.length > 0);

  // New customers (created in period)
  const newCustomers = customers.filter(
    (c) => c.createdAt >= startDate && c.createdAt <= endDate
  );

  // Segmentation by frequency
  const frequencySegments = [
    { segment: "Loyal (>10 trx/bulan)", count: 0, percentage: 0 },
    { segment: "Regular (5-10 trx/bulan)", count: 0, percentage: 0 },
    { segment: "Occasional (2-4 trx/bulan)", count: 0, percentage: 0 },
    { segment: "One-time (1 trx)", count: 0, percentage: 0 },
  ];

  activeCustomers.forEach((c) => {
    const trxCount = c.transactions.length;
    if (trxCount > 10) frequencySegments[0].count++;
    else if (trxCount >= 5) frequencySegments[1].count++;
    else if (trxCount >= 2) frequencySegments[2].count++;
    else frequencySegments[3].count++;
  });

  const totalActive = activeCustomers.length || 1;
  frequencySegments.forEach((s) => {
    s.percentage = Math.round((s.count / totalActive) * 100);
  });

  // Calculate real retention metrics
  const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const prevPeriodStart = new Date(startDate.getTime() - periodDays * 24 * 60 * 60 * 1000);

  const prevPeriodCustomers = await prisma.customer.findMany({
    where: {
      transactions: {
        some: {
          createdAt: { gte: prevPeriodStart, lt: startDate },
        },
      },
    },
  });

  const retainedCustomers = prevPeriodCustomers.filter((c) =>
    activeCustomers.some((ac) => ac.id === c.id)
  ).length;

  const retentionRate = prevPeriodCustomers.length > 0
    ? Math.round((retainedCustomers / prevPeriodCustomers.length) * 100)
    : 0;

  const churnedCount = prevPeriodCustomers.length - retainedCustomers;

  // Segmentation by spending
  const spendingSegments = [
    { segment: "VIP (>Rp 1jt)", count: 0, percentage: 0 },
    { segment: "High Value (Rp 500k-1jt)", count: 0, percentage: 0 },
    { segment: "Medium (Rp 200k-500k)", count: 0, percentage: 0 },
    { segment: "Low (<Rp 200k)", count: 0, percentage: 0 },
  ];

  activeCustomers.forEach((c) => {
    const totalSpent = c.transactions.reduce((sum, t) => sum + Number(t.total), 0);
    if (totalSpent > 1000000) spendingSegments[0].count++;
    else if (totalSpent >= 500000) spendingSegments[1].count++;
    else if (totalSpent >= 200000) spendingSegments[2].count++;
    else spendingSegments[3].count++;
  });

  spendingSegments.forEach((s) => {
    s.percentage = Math.round((s.count / totalActive) * 100);
  });

  // Lifetime value
  const customerValues = activeCustomers.map((c) =>
    c.transactions.reduce((sum, t) => sum + Number(t.total), 0)
  ).sort((a, b) => b - a);

  const avgValue = customerValues.length > 0
    ? Math.round(customerValues.reduce((a, b) => a + b, 0) / customerValues.length)
    : 0;
  const medianValue = customerValues.length > 0
    ? customerValues[Math.floor(customerValues.length / 2)]
    : 0;
  const top10Value = customerValues.length > 0
    ? customerValues[Math.floor(customerValues.length * 0.1)]
    : 0;

  // Top customers
  const topCustomers = activeCustomers
    .map((c) => ({
      id: c.id,
      name: c.name,
      transactions: c.transactions.length,
      totalSpent: c.transactions.reduce((sum, t) => sum + Number(t.total), 0),
      lastVisit: c.transactions.length > 0
        ? c.transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt
        : c.createdAt,
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 20)
    .map((c, idx) => ({
      rank: idx + 1,
      name: c.name,
      transactions: c.transactions,
      totalSpent: c.totalSpent,
      lastVisit: c.lastVisit,
    }));

  // Calculate total revenue from active customers
  const totalRevenue = activeCustomers.reduce(
    (sum, c) => sum + c.transactions.reduce((s, t) => s + Number(t.total), 0),
    0
  );

  // Calculate top customer contribution
  const top20Revenue = topCustomers.slice(0, 20).reduce((sum, c) => sum + c.totalSpent, 0);
  const top20Percentage = totalRevenue > 0 ? Math.round((top20Revenue / totalRevenue) * 100) : 0;
  const avgFrequency = totalActive > 0
    ? Math.round(activeCustomers.reduce((sum, c) => sum + c.transactions.length, 0) / totalActive)
    : 0;
  const vipCustomers = spendingSegments[0].count;

  return {
    period: { start: startDate, end: endDate },
    businessName,
    summary: {
      totalCustomers: customers.length,
      newCustomers: newCustomers.length,
      repeatCustomers: activeCustomers.filter((c) => c.transactions.length > 1).length,
    },
    segmentation: {
      byFrequency: frequencySegments,
      bySpending: spendingSegments,
    },
    lifetime: {
      average: avgValue,
      median: medianValue,
      top10: top10Value,
    },
    retention: {
      monthOverMonth: retentionRate,
      churnedCustomers: churnedCount,
    },
    topCustomers,
    insights: [
      `Top 20 customers = ${top20Percentage}% dari total revenue`,
      `Average visit frequency: ${avgFrequency}x per periode`,
      retentionRate >= 70 ? `✓ Retention rate baik (${retentionRate}%)` : `⚠ Retention rate perlu ditingkatkan (${retentionRate}%)`,
      vipCustomers > 0 ? `${vipCustomers} VIP customers - program loyalty sangat recommended` : "",
      newCustomers.length > activeCustomers.length * 0.2 ? `✓ Akuisisi customer baru sedang bagus (${newCustomers.length} baru)` : "",
    ].filter(Boolean),
  };
}

async function generateProfitLossData(
  startDate: Date,
  endDate: Date,
  businessName: string
): Promise<ProfitLossData> {
  const transactions = await prisma.transaction.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
    },
    include: { items: true },
  });

  const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.total), 0);

  // Calculate real COGS from product costs
  const costItems = await prisma.item.findMany({ where: { type: "GOODS" }, select: { name: true, baseCost: true } });
  const productCostMap: Record<string, number> = {};
  costItems.forEach((p) => {
    productCostMap[p.name] = Number(p.baseCost || 0);
  });

  let totalCOGS = 0;
  transactions.forEach((t) => {
    t.items.forEach((item) => {
      const costPerUnit = productCostMap[item.itemName] || 0;
      totalCOGS += costPerUnit * item.quantity;
    });
  });

  // If no cost data, estimate at 40%
  const cogs = totalCOGS > 0 ? totalCOGS : totalRevenue * 0.4;
  const grossProfit = totalRevenue - cogs;
  const grossMargin = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0;

  // Get real operational expenses from Expense model
  const expenses = await prisma.expense.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
    },
  });

  // Group expenses by category
  const expenseByCategory: Record<string, number> = {};
  expenses.forEach((e) => {
    const category = e.category || "LAIN_LAIN";
    expenseByCategory[category] = (expenseByCategory[category] || 0) + Number(e.amount);
  });

  const categoryNames: Record<string, string> = {
    SALARY: "Gaji & Upah",
    RENT: "Sewa",
    UTILITIES: "Utilitas (Listrik/Air)",
    RAW_MATERIALS: "Bahan Baku",
    MARKETING: "Marketing & Promosi",
    MAINTENANCE: "Pemeliharaan",
    TRANSPORTATION: "Transport",
    OTHER: "Lain-lain",
  };

  const operationalExpenses = Object.entries(expenseByCategory)
    .map(([category, amount]) => ({
      name: categoryNames[category] || category,
      amount: Math.round(amount),
    }))
    .filter((e) => e.amount > 0);

  // If no expense data, use estimates
  if (operationalExpenses.length === 0) {
    operationalExpenses.push(
      { name: "Gaji & Upah", amount: Math.round(totalRevenue * 0.1) },
      { name: "Sewa", amount: 5000000 },
      { name: "Utilitas (Listrik/Air)", amount: 2500000 },
      { name: "Marketing", amount: Math.round(totalRevenue * 0.01) },
      { name: "Lain-lain", amount: 1500000 }
    );
  }

  const totalOpex = operationalExpenses.reduce((sum, e) => sum + e.amount, 0);
  const operatingProfit = grossProfit - totalOpex;
  const operatingMargin = totalRevenue > 0 ? Math.round((operatingProfit / totalRevenue) * 100) : 0;

  const otherExpenses: { name: string; amount: number }[] = [];

  const totalOther = otherExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = operatingProfit + totalOther;
  const netMargin = totalRevenue > 0 ? parseFloat(((netProfit / totalRevenue) * 100).toFixed(1)) : 0;

  // Calculate real comparison with previous period
  const periodLength = endDate.getTime() - startDate.getTime();
  const prevPeriodStart = new Date(startDate.getTime() - periodLength);
  const prevPeriodEnd = new Date(startDate.getTime() - 1);

  const prevPeriodData = await generateProfitLossDataSimple(prevPeriodStart, prevPeriodEnd);
  const vsLastMonth = prevPeriodData.netProfit > 0
    ? ((netProfit - prevPeriodData.netProfit) / prevPeriodData.netProfit) * 100
    : 0;

  // Year-over-year
  const yearAgoPeriodStart = new Date(startDate);
  yearAgoPeriodStart.setFullYear(yearAgoPeriodStart.getFullYear() - 1);
  const yearAgoPeriodEnd = new Date(endDate);
  yearAgoPeriodEnd.setFullYear(yearAgoPeriodEnd.getFullYear() - 1);

  const yearAgoData = await generateProfitLossDataSimple(yearAgoPeriodStart, yearAgoPeriodEnd);
  const vsLastYear = yearAgoData.netProfit > 0
    ? ((netProfit - yearAgoData.netProfit) / yearAgoData.netProfit) * 100
    : 0;

  return {
    period: { start: startDate, end: endDate },
    businessName,
    revenue: {
      sales: totalRevenue,
      other: 0,
      total: totalRevenue,
    },
    cogs,
    grossProfit,
    grossMargin,
    operationalExpenses,
    totalOperationalExpenses: totalOpex,
    operatingProfit,
    operatingMargin,
    otherExpenses,
    netProfit,
    netMargin,
    comparison: {
      vsLastMonth: parseFloat(vsLastMonth.toFixed(1)),
      vsLastYear: parseFloat(vsLastYear.toFixed(1)),
    },
  };
}

// Helper function for comparison calculations
async function generateProfitLossDataSimple(
  startDate: Date,
  endDate: Date
): Promise<{ revenue: number; netProfit: number }> {
  const transactions = await prisma.transaction.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
    },
    include: { items: true },
  });

  const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.total), 0);

  // Calculate COGS
  const costItems = await prisma.item.findMany({ where: { type: "GOODS" }, select: { name: true, baseCost: true } });
  const productCostMap: Record<string, number> = {};
  costItems.forEach((p) => {
    productCostMap[p.name] = Number(p.baseCost || 0);
  });

  let totalCOGS = 0;
  transactions.forEach((t) => {
    t.items.forEach((item) => {
      const costPerUnit = productCostMap[item.itemName] || 0;
      totalCOGS += costPerUnit * item.quantity;
    });
  });

  const cogs = totalCOGS > 0 ? totalCOGS : totalRevenue * 0.4;
  const grossProfit = totalRevenue - cogs;

  // Get expenses
  const expenses = await prisma.expense.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
    },
  });

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const netProfit = grossProfit - totalExpenses;

  return { revenue: totalRevenue, netProfit };
}
