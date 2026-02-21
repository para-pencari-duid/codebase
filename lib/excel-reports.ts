import ExcelJS from "exceljs";

// Color palette for reports
const COLORS = {
  primary: "1E3A5F",      // Dark blue
  secondary: "2563EB",    // Blue
  accent: "F59E0B",       // Amber
  success: "10B981",      // Green
  warning: "F59E0B",      // Yellow
  danger: "EF4444",       // Red
  headerBg: "1E3A5F",
  headerText: "FFFFFF",
  altRowBg: "F3F4F6",
  borderColor: "D1D5DB",
  lightBg: "EBF5FF",
};

// Helper functions
export function formatCurrency(value: number): string {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatDate(date: Date, format: "short" | "long" | "full" = "long"): string {
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  
  if (format === "short") {
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  } else if (format === "full") {
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  }
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

// Style helpers
export function setHeaderStyle(cell: ExcelJS.Cell) {
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: COLORS.headerBg },
  };
  cell.font = {
    bold: true,
    color: { argb: COLORS.headerText },
    size: 11,
  };
  cell.alignment = { horizontal: "center", vertical: "middle" };
  cell.border = {
    top: { style: "thin", color: { argb: COLORS.borderColor } },
    bottom: { style: "thin", color: { argb: COLORS.borderColor } },
    left: { style: "thin", color: { argb: COLORS.borderColor } },
    right: { style: "thin", color: { argb: COLORS.borderColor } },
  };
}

export function setTitleStyle(cell: ExcelJS.Cell) {
  cell.font = {
    bold: true,
    size: 18,
    color: { argb: COLORS.primary },
  };
  cell.alignment = { horizontal: "center", vertical: "middle" };
}

export function setSubtitleStyle(cell: ExcelJS.Cell) {
  cell.font = {
    size: 12,
    color: { argb: "666666" },
  };
  cell.alignment = { horizontal: "center", vertical: "middle" };
}

export function setSectionHeaderStyle(cell: ExcelJS.Cell) {
  cell.font = {
    bold: true,
    size: 12,
    color: { argb: COLORS.primary },
  };
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: COLORS.lightBg },
  };
  cell.border = {
    bottom: { style: "medium", color: { argb: COLORS.primary } },
  };
}

export function setDataCellStyle(cell: ExcelJS.Cell, isAlternate: boolean = false) {
  if (isAlternate) {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: COLORS.altRowBg },
    };
  }
  cell.border = {
    top: { style: "thin", color: { argb: COLORS.borderColor } },
    bottom: { style: "thin", color: { argb: COLORS.borderColor } },
    left: { style: "thin", color: { argb: COLORS.borderColor } },
    right: { style: "thin", color: { argb: COLORS.borderColor } },
  };
}

export function setAmountStyle(cell: ExcelJS.Cell) {
  cell.numFmt = '"Rp "#,##0';
  cell.alignment = { horizontal: "right" };
}

export function setPercentStyle(cell: ExcelJS.Cell) {
  cell.numFmt = "0.0%";
  cell.alignment = { horizontal: "right" };
}

export function addEmptyRow(worksheet: ExcelJS.Worksheet) {
  worksheet.addRow([]);
}

// ===========================================
// LAPORAN PENJUALAN HARIAN
// ===========================================
export interface DailySalesData {
  date: Date;
  businessName: string;
  summary: {
    totalTransactions: number;
    totalSales: number;
    avgPerTransaction: number;
    totalItems: number;
    totalCustomers: number;
  };
  paymentBreakdown: {
    method: string;
    amount: number;
    percentage: number;
    icon: string;
  }[];
  hourlySales: {
    hour: string;
    transactions: number;
    amount: number;
    isPeak: boolean;
  }[];
  topProducts: {
    rank: number;
    name: string;
    quantity: number;
    unit: string;
    revenue: number;
  }[];
  categorySales: {
    category: string;
    icon: string;
    amount: number;
    percentage: number;
  }[];
  cashierPerformance: {
    name: string;
    transactions: number;
    amount: number;
  }[];
  discountSummary: {
    totalDiscount: number;
    avgPerTransaction: number;
  };
  notes: string[];
}

export async function generateDailySalesReport(data: DailySalesData): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = data.businessName;
  workbook.created = new Date();
  
  const ws = workbook.addWorksheet("Laporan Harian", {
    pageSetup: { paperSize: 9, orientation: "portrait" },
  });

  // Set column widths
  ws.columns = [
    { width: 5 },   // A
    { width: 20 },  // B
    { width: 15 },  // C
    { width: 18 },  // D
    { width: 15 },  // E
    { width: 15 },  // F
  ];

  let rowNum = 1;

  // === HEADER ===
  ws.mergeCells(`A${rowNum}:F${rowNum}`);
  const titleCell = ws.getCell(`A${rowNum}`);
  titleCell.value = "═══════════════════════════════════";
  titleCell.font = { color: { argb: COLORS.primary }, size: 12 };
  rowNum++;

  ws.mergeCells(`A${rowNum}:F${rowNum}`);
  const mainTitle = ws.getCell(`A${rowNum}`);
  mainTitle.value = "LAPORAN PENJUALAN HARIAN";
  setTitleStyle(mainTitle);
  rowNum++;

  ws.mergeCells(`A${rowNum}:F${rowNum}`);
  const titleCell2 = ws.getCell(`A${rowNum}`);
  titleCell2.value = "═══════════════════════════════════";
  titleCell2.font = { color: { argb: COLORS.primary }, size: 12 };
  rowNum++;

  // Date and Branch
  ws.mergeCells(`A${rowNum}:F${rowNum}`);
  ws.getCell(`A${rowNum}`).value = `Tanggal: ${formatDate(data.date, "full")}`;
  ws.getCell(`A${rowNum}`).font = { size: 11 };
  rowNum++;

  ws.mergeCells(`A${rowNum}:F${rowNum}`);
  ws.getCell(`A${rowNum}`).value = `Cabang: ${data.businessName}`;
  ws.getCell(`A${rowNum}`).font = { size: 11 };
  rowNum += 2;

  // === RINGKASAN ===
  ws.mergeCells(`A${rowNum}:F${rowNum}`);
  const summaryHeader = ws.getCell(`A${rowNum}`);
  summaryHeader.value = "RINGKASAN";
  setSectionHeaderStyle(summaryHeader);
  rowNum++;

  const summaryData = [
    ["Total Transaksi:", `${data.summary.totalTransactions} transaksi`],
    ["Total Penjualan:", formatCurrency(data.summary.totalSales)],
    ["Rata-rata per trx:", formatCurrency(data.summary.avgPerTransaction)],
    ["Total Items Terjual:", `${data.summary.totalItems} items`],
    ["Customer:", `${data.summary.totalCustomers} orang`],
  ];

  summaryData.forEach(([label, value], idx) => {
    ws.getCell(`B${rowNum}`).value = label;
    ws.getCell(`B${rowNum}`).font = { color: { argb: "666666" } };
    ws.getCell(`D${rowNum}`).value = value;
    ws.getCell(`D${rowNum}`).font = { bold: true };
    ws.getCell(`D${rowNum}`).alignment = { horizontal: "right" };
    setDataCellStyle(ws.getCell(`B${rowNum}`), idx % 2 === 0);
    setDataCellStyle(ws.getCell(`C${rowNum}`), idx % 2 === 0);
    setDataCellStyle(ws.getCell(`D${rowNum}`), idx % 2 === 0);
    rowNum++;
  });
  rowNum++;

  // === BREAKDOWN PAYMENT ===
  ws.mergeCells(`A${rowNum}:F${rowNum}`);
  const paymentHeader = ws.getCell(`A${rowNum}`);
  paymentHeader.value = "BREAKDOWN PAYMENT";
  setSectionHeaderStyle(paymentHeader);
  rowNum++;

  data.paymentBreakdown.forEach((payment, idx) => {
    ws.getCell(`B${rowNum}`).value = `${payment.icon} ${payment.method}:`;
    ws.getCell(`D${rowNum}`).value = formatCurrency(payment.amount);
    ws.getCell(`E${rowNum}`).value = `(${payment.percentage}%)`;
    setDataCellStyle(ws.getCell(`B${rowNum}`), idx % 2 === 0);
    setDataCellStyle(ws.getCell(`C${rowNum}`), idx % 2 === 0);
    setDataCellStyle(ws.getCell(`D${rowNum}`), idx % 2 === 0);
    setDataCellStyle(ws.getCell(`E${rowNum}`), idx % 2 === 0);
    rowNum++;
  });
  rowNum++;

  // === PENJUALAN PER JAM ===
  ws.mergeCells(`A${rowNum}:F${rowNum}`);
  const hourlyHeader = ws.getCell(`A${rowNum}`);
  hourlyHeader.value = "PENJUALAN PER JAM";
  setSectionHeaderStyle(hourlyHeader);
  rowNum++;

  // Table header
  ["Jam", "Transaksi", "Jumlah", ""].forEach((header, idx) => {
    const cell = ws.getCell(rowNum, idx + 2);
    cell.value = header;
    setHeaderStyle(cell);
  });
  rowNum++;

  data.hourlySales.forEach((hourData, idx) => {
    ws.getCell(`B${rowNum}`).value = hourData.hour;
    ws.getCell(`C${rowNum}`).value = `${hourData.transactions} trx`;
    ws.getCell(`D${rowNum}`).value = formatCurrency(hourData.amount);
    ws.getCell(`E${rowNum}`).value = hourData.isPeak ? "⭐" : "";
    
    [2, 3, 4, 5].forEach(col => {
      setDataCellStyle(ws.getCell(rowNum, col), idx % 2 === 0);
    });
    
    if (hourData.isPeak) {
      ws.getCell(`B${rowNum}`).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FEF3C7" },
      };
      ws.getCell(`C${rowNum}`).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FEF3C7" },
      };
      ws.getCell(`D${rowNum}`).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FEF3C7" },
      };
    }
    rowNum++;
  });

  const peakHour = data.hourlySales.find(h => h.isPeak);
  if (peakHour) {
    rowNum++;
    ws.mergeCells(`A${rowNum}:F${rowNum}`);
    ws.getCell(`A${rowNum}`).value = `JAM TERSIBUK: ${peakHour.hour} (${peakHour.transactions} transaksi)`;
    ws.getCell(`A${rowNum}`).font = { bold: true, color: { argb: COLORS.accent } };
  }
  rowNum += 2;

  // === TOP 5 PRODUK TERLARIS ===
  ws.mergeCells(`A${rowNum}:F${rowNum}`);
  const topProductsHeader = ws.getCell(`A${rowNum}`);
  topProductsHeader.value = "TOP 5 PRODUK TERLARIS";
  setSectionHeaderStyle(topProductsHeader);
  rowNum++;

  ["#", "Produk", "Qty", "Revenue"].forEach((header, idx) => {
    const cell = ws.getCell(rowNum, idx + 2);
    cell.value = header;
    setHeaderStyle(cell);
  });
  rowNum++;

  data.topProducts.slice(0, 5).forEach((product, idx) => {
    ws.getCell(`B${rowNum}`).value = product.rank;
    ws.getCell(`C${rowNum}`).value = product.name;
    ws.getCell(`D${rowNum}`).value = `${product.quantity} ${product.unit}`;
    ws.getCell(`E${rowNum}`).value = formatCurrency(product.revenue);
    
    [2, 3, 4, 5].forEach(col => {
      setDataCellStyle(ws.getCell(rowNum, col), idx % 2 === 0);
    });
    rowNum++;
  });
  rowNum++;

  // === PENJUALAN PER KATEGORI ===
  ws.mergeCells(`A${rowNum}:F${rowNum}`);
  const categoryHeader = ws.getCell(`A${rowNum}`);
  categoryHeader.value = "PENJUALAN PER KATEGORI";
  setSectionHeaderStyle(categoryHeader);
  rowNum++;

  data.categorySales.forEach((cat, idx) => {
    ws.getCell(`B${rowNum}`).value = `${cat.icon} ${cat.category}:`;
    ws.getCell(`D${rowNum}`).value = formatCurrency(cat.amount);
    ws.getCell(`E${rowNum}`).value = `(${cat.percentage}%)`;
    setDataCellStyle(ws.getCell(`B${rowNum}`), idx % 2 === 0);
    setDataCellStyle(ws.getCell(`C${rowNum}`), idx % 2 === 0);
    setDataCellStyle(ws.getCell(`D${rowNum}`), idx % 2 === 0);
    setDataCellStyle(ws.getCell(`E${rowNum}`), idx % 2 === 0);
    rowNum++;
  });
  rowNum++;

  // === KASIR PERFORMANCE ===
  ws.mergeCells(`A${rowNum}:F${rowNum}`);
  const cashierHeader = ws.getCell(`A${rowNum}`);
  cashierHeader.value = "KASIR PERFORMANCE";
  setSectionHeaderStyle(cashierHeader);
  rowNum++;

  data.cashierPerformance.forEach((cashier, idx) => {
    ws.getCell(`B${rowNum}`).value = cashier.name;
    ws.getCell(`C${rowNum}`).value = `${cashier.transactions} trx`;
    ws.getCell(`D${rowNum}`).value = formatCurrency(cashier.amount);
    setDataCellStyle(ws.getCell(`B${rowNum}`), idx % 2 === 0);
    setDataCellStyle(ws.getCell(`C${rowNum}`), idx % 2 === 0);
    setDataCellStyle(ws.getCell(`D${rowNum}`), idx % 2 === 0);
    rowNum++;
  });
  rowNum++;

  // === DISCOUNT ===
  ws.mergeCells(`A${rowNum}:F${rowNum}`);
  const discountHeader = ws.getCell(`A${rowNum}`);
  discountHeader.value = "DISCOUNT DIBERIKAN";
  setSectionHeaderStyle(discountHeader);
  rowNum++;

  ws.getCell(`B${rowNum}`).value = "Total Discount:";
  ws.getCell(`D${rowNum}`).value = formatCurrency(data.discountSummary.totalDiscount);
  rowNum++;
  ws.getCell(`B${rowNum}`).value = "Rata-rata per trx:";
  ws.getCell(`D${rowNum}`).value = formatCurrency(data.discountSummary.avgPerTransaction);
  rowNum += 2;

  // === CATATAN ===
  ws.mergeCells(`A${rowNum}:F${rowNum}`);
  const notesHeader = ws.getCell(`A${rowNum}`);
  notesHeader.value = "CATATAN";
  setSectionHeaderStyle(notesHeader);
  rowNum++;

  data.notes.forEach(note => {
    ws.mergeCells(`A${rowNum}:F${rowNum}`);
    ws.getCell(`A${rowNum}`).value = note;
    ws.getCell(`A${rowNum}`).font = { size: 10 };
    rowNum++;
  });
  rowNum++;

  // Footer
  ws.mergeCells(`A${rowNum}:F${rowNum}`);
  ws.getCell(`A${rowNum}`).value = "═══════════════════════════════════";
  ws.getCell(`A${rowNum}`).font = { color: { argb: COLORS.primary }, size: 12 };

  return workbook;
}

// ===========================================
// LAPORAN PENJUALAN BULANAN
// ===========================================
export interface MonthlySalesData {
  month: string;
  year: number;
  businessName: string;
  summary: {
    totalTransactions: number;
    totalSales: number;
    avgPerDay: number;
    operationalDays: number;
  };
  grossProfit: {
    revenue: number;
    cogs: number;
    profit: number;
    margin: number;
  };
  weeklyTrend: {
    week: string;
    dates: string;
    amount: number;
    trend: "up" | "down" | "stable";
  }[];
  growth: {
    vsLastMonth: number;
    vsLastYear: number;
  };
  topProducts: {
    rank: number;
    name: string;
    quantity: number;
    unit: string;
    revenue: number;
  }[];
  categorySales: {
    category: string;
    icon: string;
    amount: number;
    percentage: number;
  }[];
  paymentMethods: {
    method: string;
    icon: string;
    amount: number;
    percentage: number;
  }[];
  customerMetrics: {
    totalCustomers: number;
    newCustomers: number;
    repeatRate: number;
    avgTransaction: number;
  };
  topCustomers: {
    rank: number;
    name: string;
    transactions: number;
    totalSpent: number;
  }[];
  cashierPerformance: {
    name: string;
    transactions: number;
    amount: number;
    isTop: boolean;
  }[];
  dailyAverage: {
    saturday: number;
    sunday: number;
    weekday: number;
  };
  insights: string[];
}

export async function generateMonthlySalesReport(data: MonthlySalesData): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = data.businessName;
  workbook.created = new Date();

  const ws = workbook.addWorksheet("Laporan Bulanan", {
    pageSetup: { paperSize: 9, orientation: "portrait" },
  });

  ws.columns = [
    { width: 5 },
    { width: 22 },
    { width: 12 },
    { width: 18 },
    { width: 15 },
    { width: 12 },
  ];

  let rowNum = 1;

  // Header
  ws.mergeCells(`A${rowNum}:F${rowNum}`);
  ws.getCell(`A${rowNum}`).value = "═══════════════════════════════════════════════════";
  ws.getCell(`A${rowNum}`).font = { color: { argb: COLORS.primary } };
  rowNum++;

  ws.mergeCells(`A${rowNum}:F${rowNum}`);
  const mainTitle = ws.getCell(`A${rowNum}`);
  mainTitle.value = "LAPORAN PENJUALAN BULANAN";
  setTitleStyle(mainTitle);
  rowNum++;

  ws.mergeCells(`A${rowNum}:F${rowNum}`);
  ws.getCell(`A${rowNum}`).value = "═══════════════════════════════════════════════════";
  ws.getCell(`A${rowNum}`).font = { color: { argb: COLORS.primary } };
  rowNum++;

  ws.mergeCells(`A${rowNum}:F${rowNum}`);
  ws.getCell(`A${rowNum}`).value = `Bulan: ${data.month} ${data.year}`;
  rowNum++;

  ws.mergeCells(`A${rowNum}:F${rowNum}`);
  ws.getCell(`A${rowNum}`).value = `Cabang: ${data.businessName}`;
  rowNum += 2;

  // RINGKASAN BULAN
  ws.mergeCells(`A${rowNum}:F${rowNum}`);
  const summaryHeader = ws.getCell(`A${rowNum}`);
  summaryHeader.value = "RINGKASAN BULAN";
  setSectionHeaderStyle(summaryHeader);
  rowNum++;

  const summaryRows = [
    ["Total Transaksi:", `${data.summary.totalTransactions.toLocaleString()} transaksi`],
    ["Total Penjualan:", formatCurrency(data.summary.totalSales)],
    ["Rata-rata per hari:", formatCurrency(data.summary.avgPerDay)],
    ["Hari operasional:", `${data.summary.operationalDays} hari`],
  ];

  summaryRows.forEach(([label, value], idx) => {
    ws.getCell(`B${rowNum}`).value = label;
    ws.getCell(`D${rowNum}`).value = value;
    ws.getCell(`D${rowNum}`).font = { bold: true };
    setDataCellStyle(ws.getCell(`B${rowNum}`), idx % 2 === 0);
    setDataCellStyle(ws.getCell(`C${rowNum}`), idx % 2 === 0);
    setDataCellStyle(ws.getCell(`D${rowNum}`), idx % 2 === 0);
    rowNum++;
  });
  rowNum++;

  // GROSS PROFIT
  ws.mergeCells(`A${rowNum}:F${rowNum}`);
  const profitHeader = ws.getCell(`A${rowNum}`);
  profitHeader.value = "GROSS PROFIT";
  setSectionHeaderStyle(profitHeader);
  rowNum++;

  const profitRows = [
    ["Total Revenue:", formatCurrency(data.grossProfit.revenue)],
    ["COGS (Biaya Pokok):", formatCurrency(data.grossProfit.cogs)],
    ["Gross Profit:", formatCurrency(data.grossProfit.profit)],
    ["Margin:", `${data.grossProfit.margin}%`],
  ];

  profitRows.forEach(([label, value], idx) => {
    ws.getCell(`B${rowNum}`).value = label;
    ws.getCell(`D${rowNum}`).value = value;
    ws.getCell(`D${rowNum}`).font = { bold: idx === 2 || idx === 3 };
    if (idx === 2) {
      ws.getCell(`D${rowNum}`).font = { bold: true, color: { argb: COLORS.success } };
    }
    setDataCellStyle(ws.getCell(`B${rowNum}`), idx % 2 === 0);
    setDataCellStyle(ws.getCell(`C${rowNum}`), idx % 2 === 0);
    setDataCellStyle(ws.getCell(`D${rowNum}`), idx % 2 === 0);
    rowNum++;
  });
  rowNum++;

  // TREN MINGGUAN
  ws.mergeCells(`A${rowNum}:F${rowNum}`);
  const trendHeader = ws.getCell(`A${rowNum}`);
  trendHeader.value = "TREN MINGGUAN";
  setSectionHeaderStyle(trendHeader);
  rowNum++;

  ["Minggu", "Periode", "Jumlah", "Trend"].forEach((h, idx) => {
    const cell = ws.getCell(rowNum, idx + 2);
    cell.value = h;
    setHeaderStyle(cell);
  });
  rowNum++;

  data.weeklyTrend.forEach((week, idx) => {
    ws.getCell(`B${rowNum}`).value = week.week;
    ws.getCell(`C${rowNum}`).value = week.dates;
    ws.getCell(`D${rowNum}`).value = formatCurrency(week.amount);
    ws.getCell(`E${rowNum}`).value = week.trend === "up" ? "⬆" : week.trend === "down" ? "⬇" : "→";
    ws.getCell(`E${rowNum}`).font = { 
      color: { argb: week.trend === "up" ? COLORS.success : week.trend === "down" ? COLORS.danger : "666666" } 
    };
    [2, 3, 4, 5].forEach(col => setDataCellStyle(ws.getCell(rowNum, col), idx % 2 === 0));
    rowNum++;
  });
  rowNum++;

  // GROWTH
  ws.mergeCells(`A${rowNum}:F${rowNum}`);
  const growthHeader = ws.getCell(`A${rowNum}`);
  growthHeader.value = "GROWTH";
  setSectionHeaderStyle(growthHeader);
  rowNum++;

  const growthIcon = (val: number) => val >= 0 ? "⬆" : "⬇";
  const growthColor = (val: number) => val >= 0 ? COLORS.success : COLORS.danger;

  ws.getCell(`B${rowNum}`).value = "vs Bulan Lalu:";
  ws.getCell(`D${rowNum}`).value = `${data.growth.vsLastMonth >= 0 ? "+" : ""}${data.growth.vsLastMonth.toFixed(1)}% ${growthIcon(data.growth.vsLastMonth)}`;
  ws.getCell(`D${rowNum}`).font = { bold: true, color: { argb: growthColor(data.growth.vsLastMonth) } };
  rowNum++;

  ws.getCell(`B${rowNum}`).value = "vs Tahun Lalu:";
  ws.getCell(`D${rowNum}`).value = `${data.growth.vsLastYear >= 0 ? "+" : ""}${data.growth.vsLastYear.toFixed(1)}% ${growthIcon(data.growth.vsLastYear)}`;
  ws.getCell(`D${rowNum}`).font = { bold: true, color: { argb: growthColor(data.growth.vsLastYear) } };
  rowNum += 2;

  // TOP 10 PRODUCTS
  ws.mergeCells(`A${rowNum}:F${rowNum}`);
  const topProdHeader = ws.getCell(`A${rowNum}`);
  topProdHeader.value = "TOP 10 PRODUCTS";
  setSectionHeaderStyle(topProdHeader);
  rowNum++;

  ["#", "Produk", "Qty", "Revenue"].forEach((h, idx) => {
    const cell = ws.getCell(rowNum, idx + 2);
    cell.value = h;
    setHeaderStyle(cell);
  });
  rowNum++;

  data.topProducts.slice(0, 10).forEach((prod, idx) => {
    ws.getCell(`B${rowNum}`).value = prod.rank;
    ws.getCell(`C${rowNum}`).value = prod.name;
    ws.getCell(`D${rowNum}`).value = `${prod.quantity.toLocaleString()} ${prod.unit}`;
    ws.getCell(`E${rowNum}`).value = formatCurrency(prod.revenue);
    [2, 3, 4, 5].forEach(col => setDataCellStyle(ws.getCell(rowNum, col), idx % 2 === 0));
    rowNum++;
  });
  rowNum++;

  // PENJUALAN PER KATEGORI
  ws.mergeCells(`A${rowNum}:F${rowNum}`);
  const catHeader = ws.getCell(`A${rowNum}`);
  catHeader.value = "PENJUALAN PER KATEGORI";
  setSectionHeaderStyle(catHeader);
  rowNum++;

  data.categorySales.forEach((cat, idx) => {
    ws.getCell(`B${rowNum}`).value = `${cat.icon} ${cat.category}:`;
    ws.getCell(`D${rowNum}`).value = formatCurrency(cat.amount);
    ws.getCell(`E${rowNum}`).value = `(${cat.percentage}%)`;
    [2, 3, 4, 5].forEach(col => setDataCellStyle(ws.getCell(rowNum, col), idx % 2 === 0));
    rowNum++;
  });
  rowNum++;

  // PAYMENT METHODS
  ws.mergeCells(`A${rowNum}:F${rowNum}`);
  const paymentHeader = ws.getCell(`A${rowNum}`);
  paymentHeader.value = "PAYMENT METHODS BULAN INI";
  setSectionHeaderStyle(paymentHeader);
  rowNum++;

  data.paymentMethods.forEach((pm, idx) => {
    ws.getCell(`B${rowNum}`).value = `${pm.icon} ${pm.method}:`;
    ws.getCell(`D${rowNum}`).value = formatCurrency(pm.amount);
    ws.getCell(`E${rowNum}`).value = `(${pm.percentage}%)`;
    [2, 3, 4, 5].forEach(col => setDataCellStyle(ws.getCell(rowNum, col), idx % 2 === 0));
    rowNum++;
  });
  rowNum++;

  // CUSTOMER METRICS
  ws.mergeCells(`A${rowNum}:F${rowNum}`);
  const custHeader = ws.getCell(`A${rowNum}`);
  custHeader.value = "CUSTOMER METRICS";
  setSectionHeaderStyle(custHeader);
  rowNum++;

  const custRows = [
    ["Total Customers:", `${data.customerMetrics.totalCustomers.toLocaleString()} orang`],
    ["New Customers:", `${data.customerMetrics.newCustomers} orang`],
    ["Repeat Rate:", `${data.customerMetrics.repeatRate}%`],
    ["Average Transaction:", formatCurrency(data.customerMetrics.avgTransaction)],
  ];

  custRows.forEach(([label, value], idx) => {
    ws.getCell(`B${rowNum}`).value = label;
    ws.getCell(`D${rowNum}`).value = value;
    [2, 3, 4].forEach(col => setDataCellStyle(ws.getCell(rowNum, col), idx % 2 === 0));
    rowNum++;
  });
  rowNum++;

  // TOP CUSTOMERS
  ws.mergeCells(`A${rowNum}:F${rowNum}`);
  const topCustHeader = ws.getCell(`A${rowNum}`);
  topCustHeader.value = "TOP 5 CUSTOMERS";
  setSectionHeaderStyle(topCustHeader);
  rowNum++;

  ["#", "Customer", "Trx", "Total"].forEach((h, idx) => {
    const cell = ws.getCell(rowNum, idx + 2);
    cell.value = h;
    setHeaderStyle(cell);
  });
  rowNum++;

  data.topCustomers.slice(0, 5).forEach((cust, idx) => {
    ws.getCell(`B${rowNum}`).value = cust.rank;
    ws.getCell(`C${rowNum}`).value = cust.name;
    ws.getCell(`D${rowNum}`).value = `${cust.transactions} trx`;
    ws.getCell(`E${rowNum}`).value = formatCurrency(cust.totalSpent);
    [2, 3, 4, 5].forEach(col => setDataCellStyle(ws.getCell(rowNum, col), idx % 2 === 0));
    rowNum++;
  });
  rowNum++;

  // KASIR PERFORMANCE
  ws.mergeCells(`A${rowNum}:F${rowNum}`);
  const kasirHeader = ws.getCell(`A${rowNum}`);
  kasirHeader.value = "KASIR PERFORMANCE";
  setSectionHeaderStyle(kasirHeader);
  rowNum++;

  data.cashierPerformance.forEach((cashier, idx) => {
    ws.getCell(`B${rowNum}`).value = cashier.name;
    ws.getCell(`C${rowNum}`).value = `${cashier.transactions.toLocaleString()} trx`;
    ws.getCell(`D${rowNum}`).value = formatCurrency(cashier.amount);
    ws.getCell(`E${rowNum}`).value = cashier.isTop ? "⭐" : "";
    [2, 3, 4, 5].forEach(col => setDataCellStyle(ws.getCell(rowNum, col), idx % 2 === 0));
    rowNum++;
  });
  rowNum++;

  // HARI TERLARIS
  ws.mergeCells(`A${rowNum}:F${rowNum}`);
  const dayHeader = ws.getCell(`A${rowNum}`);
  dayHeader.value = "HARI TERLARIS";
  setSectionHeaderStyle(dayHeader);
  rowNum++;

  ws.getCell(`B${rowNum}`).value = "Sabtu rata-rata:";
  ws.getCell(`D${rowNum}`).value = `${formatCurrency(data.dailyAverage.saturday)}/hari`;
  rowNum++;
  ws.getCell(`B${rowNum}`).value = "Minggu rata-rata:";
  ws.getCell(`D${rowNum}`).value = `${formatCurrency(data.dailyAverage.sunday)}/hari`;
  rowNum++;
  ws.getCell(`B${rowNum}`).value = "Weekday rata-rata:";
  ws.getCell(`D${rowNum}`).value = `${formatCurrency(data.dailyAverage.weekday)}/hari`;
  rowNum += 2;

  // INSIGHT & REKOMENDASI
  ws.mergeCells(`A${rowNum}:F${rowNum}`);
  const insightHeader = ws.getCell(`A${rowNum}`);
  insightHeader.value = "INSIGHT & REKOMENDASI";
  setSectionHeaderStyle(insightHeader);
  rowNum++;

  data.insights.forEach(insight => {
    ws.mergeCells(`A${rowNum}:F${rowNum}`);
    ws.getCell(`A${rowNum}`).value = insight;
    ws.getCell(`A${rowNum}`).font = { size: 10 };
    rowNum++;
  });

  rowNum++;
  ws.mergeCells(`A${rowNum}:F${rowNum}`);
  ws.getCell(`A${rowNum}`).value = "═══════════════════════════════════════════════════";
  ws.getCell(`A${rowNum}`).font = { color: { argb: COLORS.primary } };

  return workbook;
}

// ===========================================
// LAPORAN PRODUK
// ===========================================
export interface ProductReportData {
  period: { start: Date; end: Date };
  businessName: string;
  topProducts: {
    rank: number;
    name: string;
    quantity: number;
    unit: string;
    revenue: number;
  }[];
  slowMovingProducts: {
    name: string;
    quantity: number;
    lastSold: Date | null;
  }[];
  marginAnalysis: {
    name: string;
    sold: number;
    revenue: number;
    cogs: number;
    profit: number;
    margin: number;
  }[];
  insights: string[];
}

export async function generateProductReport(data: ProductReportData): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = data.businessName;
  
  // Sheet 1: Produk Terlaris
  const ws1 = workbook.addWorksheet("Produk Terlaris");
  ws1.columns = [{ width: 5 }, { width: 8 }, { width: 25 }, { width: 15 }, { width: 20 }];

  let row = 1;
  ws1.mergeCells(`A${row}:E${row}`);
  ws1.getCell(`A${row}`).value = "PRODUK TERLARIS";
  setTitleStyle(ws1.getCell(`A${row}`));
  row++;

  ws1.mergeCells(`A${row}:E${row}`);
  ws1.getCell(`A${row}`).value = `Periode: ${formatDate(data.period.start)} - ${formatDate(data.period.end)}`;
  setSubtitleStyle(ws1.getCell(`A${row}`));
  row += 2;

  ["RANK", "PRODUK", "QTY SOLD", "REVENUE"].forEach((h, idx) => {
    const cell = ws1.getCell(row, idx + 2);
    cell.value = h;
    setHeaderStyle(cell);
  });
  row++;

  data.topProducts.forEach((prod, idx) => {
    ws1.getCell(`B${row}`).value = `${prod.rank}.`;
    ws1.getCell(`C${row}`).value = prod.name;
    ws1.getCell(`D${row}`).value = `${prod.quantity.toLocaleString()} ${prod.unit}`;
    ws1.getCell(`E${row}`).value = formatCurrency(prod.revenue);
    [2, 3, 4, 5].forEach(col => setDataCellStyle(ws1.getCell(row, col), idx % 2 === 0));
    row++;
  });

  row += 2;
  ws1.mergeCells(`A${row}:E${row}`);
  ws1.getCell(`A${row}`).value = "INSIGHT:";
  ws1.getCell(`A${row}`).font = { bold: true };
  row++;

  data.insights.forEach(insight => {
    ws1.mergeCells(`A${row}:E${row}`);
    ws1.getCell(`A${row}`).value = `• ${insight}`;
    row++;
  });

  // Sheet 2: Produk Kurang Laris
  const ws2 = workbook.addWorksheet("Produk Kurang Laris");
  ws2.columns = [{ width: 5 }, { width: 25 }, { width: 15 }, { width: 15 }];

  row = 1;
  ws2.mergeCells(`A${row}:D${row}`);
  ws2.getCell(`A${row}`).value = "PRODUK KURANG LARIS";
  setTitleStyle(ws2.getCell(`A${row}`));
  row++;

  ws2.mergeCells(`A${row}:D${row}`);
  ws2.getCell(`A${row}`).value = "(Produk dengan penjualan < 50 pcs/bulan)";
  setSubtitleStyle(ws2.getCell(`A${row}`));
  row += 2;

  ["PRODUK", "QTY SOLD", "LAST SOLD"].forEach((h, idx) => {
    const cell = ws2.getCell(row, idx + 2);
    cell.value = h;
    setHeaderStyle(cell);
  });
  row++;

  data.slowMovingProducts.forEach((prod, idx) => {
    ws2.getCell(`B${row}`).value = prod.name;
    ws2.getCell(`C${row}`).value = `${prod.quantity} pcs`;
    ws2.getCell(`D${row}`).value = prod.lastSold ? formatDate(prod.lastSold, "short") : "N/A";
    [2, 3, 4].forEach(col => setDataCellStyle(ws2.getCell(row, col), idx % 2 === 0));
    row++;
  });

  row += 2;
  ws2.mergeCells(`A${row}:D${row}`);
  ws2.getCell(`A${row}`).value = "⚠ Pertimbangkan discontinue atau kurangi produksi produk ini";
  ws2.getCell(`A${row}`).font = { color: { argb: COLORS.warning } };

  // Sheet 3: Analisis Margin
  const ws3 = workbook.addWorksheet("Analisis Margin");
  ws3.columns = [{ width: 5 }, { width: 20 }, { width: 10 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 10 }];

  row = 1;
  ws3.mergeCells(`A${row}:G${row}`);
  ws3.getCell(`A${row}`).value = "ANALISIS MARGIN PRODUK";
  setTitleStyle(ws3.getCell(`A${row}`));
  row += 2;

  ["PRODUK", "SOLD", "REVENUE", "COGS", "PROFIT", "MARGIN"].forEach((h, idx) => {
    const cell = ws3.getCell(row, idx + 2);
    cell.value = h;
    setHeaderStyle(cell);
  });
  row++;

  data.marginAnalysis.forEach((prod, idx) => {
    ws3.getCell(`B${row}`).value = prod.name;
    ws3.getCell(`C${row}`).value = prod.sold;
    ws3.getCell(`D${row}`).value = formatCurrency(prod.revenue);
    ws3.getCell(`E${row}`).value = formatCurrency(prod.cogs);
    ws3.getCell(`F${row}`).value = formatCurrency(prod.profit);
    ws3.getCell(`G${row}`).value = `${prod.margin}%`;
    
    // Color code margin
    if (prod.margin >= 60) {
      ws3.getCell(`G${row}`).font = { color: { argb: COLORS.success }, bold: true };
    } else if (prod.margin < 40) {
      ws3.getCell(`G${row}`).font = { color: { argb: COLORS.danger }, bold: true };
    }
    
    [2, 3, 4, 5, 6, 7].forEach(col => setDataCellStyle(ws3.getCell(row, col), idx % 2 === 0));
    row++;
  });

  return workbook;
}

// ===========================================
// LAPORAN INVENTORY
// ===========================================
export interface InventoryReportData {
  asOfDate: Date;
  businessName: string;
  summary: {
    totalProducts: number;
    totalStock: number;
    stockValueCost: number;
    stockValuePrice: number;
  };
  stockStatus: {
    safe: number;
    low: number;
    outOfStock: number;
  };
  topStockProducts: {
    name: string;
    stock: number;
    unit: string;
  }[];
  lowStockProducts: {
    name: string;
    stock: number;
    minStock: number;
  }[];
  outOfStockProducts: string[];
  recommendations: string[];
}

export async function generateInventoryReport(data: InventoryReportData): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = data.businessName;

  const ws = workbook.addWorksheet("Ringkasan Stok");
  ws.columns = [{ width: 5 }, { width: 25 }, { width: 15 }, { width: 15 }, { width: 15 }];

  let row = 1;

  ws.mergeCells(`A${row}:E${row}`);
  ws.getCell(`A${row}`).value = "RINGKASAN STOK";
  setTitleStyle(ws.getCell(`A${row}`));
  row++;

  ws.mergeCells(`A${row}:E${row}`);
  ws.getCell(`A${row}`).value = `Per: ${formatDate(data.asOfDate, "full")}`;
  setSubtitleStyle(ws.getCell(`A${row}`));
  row += 2;

  // Summary
  const summaryRows = [
    ["TOTAL PRODUK:", `${data.summary.totalProducts} items`],
    ["TOTAL STOK:", `${data.summary.totalStock.toLocaleString()} units`],
    ["NILAI STOK (at cost):", formatCurrency(data.summary.stockValueCost)],
    ["NILAI STOK (at price):", formatCurrency(data.summary.stockValuePrice)],
  ];

  summaryRows.forEach(([label, value], idx) => {
    ws.getCell(`B${row}`).value = label;
    ws.getCell(`D${row}`).value = value;
    ws.getCell(`D${row}`).font = { bold: true };
    setDataCellStyle(ws.getCell(`B${row}`), idx % 2 === 0);
    setDataCellStyle(ws.getCell(`C${row}`), idx % 2 === 0);
    setDataCellStyle(ws.getCell(`D${row}`), idx % 2 === 0);
    row++;
  });
  row++;

  // Status Stok
  ws.mergeCells(`A${row}:E${row}`);
  const statusHeader = ws.getCell(`A${row}`);
  statusHeader.value = "STATUS STOK";
  setSectionHeaderStyle(statusHeader);
  row++;

  const safePercent = Math.round((data.stockStatus.safe / data.summary.totalProducts) * 100);
  const lowPercent = Math.round((data.stockStatus.low / data.summary.totalProducts) * 100);
  const outPercent = Math.round((data.stockStatus.outOfStock / data.summary.totalProducts) * 100);

  ws.getCell(`B${row}`).value = "✓ Stok Aman:";
  ws.getCell(`D${row}`).value = `${data.stockStatus.safe} items (${safePercent}%)`;
  ws.getCell(`D${row}`).font = { color: { argb: COLORS.success } };
  row++;

  ws.getCell(`B${row}`).value = "⚠ Stok Menipis:";
  ws.getCell(`D${row}`).value = `${data.stockStatus.low} items (${lowPercent}%)`;
  ws.getCell(`D${row}`).font = { color: { argb: COLORS.warning } };
  row++;

  ws.getCell(`B${row}`).value = "❌ Stok Habis:";
  ws.getCell(`D${row}`).value = `${data.stockStatus.outOfStock} items (${outPercent}%)`;
  ws.getCell(`D${row}`).font = { color: { argb: COLORS.danger } };
  row += 2;

  // Top Stock
  ws.mergeCells(`A${row}:E${row}`);
  const topHeader = ws.getCell(`A${row}`);
  topHeader.value = "TOP 10 STOK TERBANYAK";
  setSectionHeaderStyle(topHeader);
  row++;

  data.topStockProducts.slice(0, 10).forEach((prod, idx) => {
    ws.getCell(`B${row}`).value = `${idx + 1}. ${prod.name}`;
    ws.getCell(`D${row}`).value = `${prod.stock} ${prod.unit}`;
    setDataCellStyle(ws.getCell(`B${row}`), idx % 2 === 0);
    setDataCellStyle(ws.getCell(`C${row}`), idx % 2 === 0);
    setDataCellStyle(ws.getCell(`D${row}`), idx % 2 === 0);
    row++;
  });
  row++;

  // Low Stock
  ws.mergeCells(`A${row}:E${row}`);
  const lowHeader = ws.getCell(`A${row}`);
  lowHeader.value = "STOK MENIPIS (< Min Stock)";
  setSectionHeaderStyle(lowHeader);
  row++;

  data.lowStockProducts.forEach((prod, idx) => {
    ws.getCell(`B${row}`).value = `⚠ ${prod.name}`;
    ws.getCell(`D${row}`).value = `${prod.stock} pcs (min: ${prod.minStock})`;
    ws.getCell(`B${row}`).font = { color: { argb: COLORS.warning } };
    setDataCellStyle(ws.getCell(`B${row}`), idx % 2 === 0);
    setDataCellStyle(ws.getCell(`C${row}`), idx % 2 === 0);
    setDataCellStyle(ws.getCell(`D${row}`), idx % 2 === 0);
    row++;
  });
  row++;

  // Out of Stock
  ws.mergeCells(`A${row}:E${row}`);
  const outHeader = ws.getCell(`A${row}`);
  outHeader.value = "STOK HABIS";
  setSectionHeaderStyle(outHeader);
  row++;

  data.outOfStockProducts.forEach((name, idx) => {
    ws.getCell(`B${row}`).value = `❌ ${name}`;
    ws.getCell(`D${row}`).value = "0 pcs";
    ws.getCell(`B${row}`).font = { color: { argb: COLORS.danger } };
    setDataCellStyle(ws.getCell(`B${row}`), idx % 2 === 0);
    setDataCellStyle(ws.getCell(`C${row}`), idx % 2 === 0);
    setDataCellStyle(ws.getCell(`D${row}`), idx % 2 === 0);
    row++;
  });
  row++;

  // Recommendations
  ws.mergeCells(`A${row}:E${row}`);
  const recHeader = ws.getCell(`A${row}`);
  recHeader.value = "REKOMENDASI";
  setSectionHeaderStyle(recHeader);
  row++;

  data.recommendations.forEach(rec => {
    ws.mergeCells(`A${row}:E${row}`);
    ws.getCell(`A${row}`).value = `→ ${rec}`;
    row++;
  });

  return workbook;
}

// ===========================================
// LAPORAN CUSTOMER
// ===========================================
export interface CustomerReportData {
  period: { start: Date; end: Date };
  businessName: string;
  summary: {
    totalCustomers: number;
    newCustomers: number;
    repeatCustomers: number;
  };
  segmentation: {
    byFrequency: { segment: string; count: number; percentage: number }[];
    bySpending: { segment: string; count: number; percentage: number }[];
  };
  lifetime: {
    average: number;
    median: number;
    top10: number;
  };
  retention: {
    monthOverMonth: number;
    churnedCustomers: number;
  };
  topCustomers: {
    rank: number;
    name: string;
    transactions: number;
    totalSpent: number;
    lastVisit: Date;
  }[];
  insights: string[];
}

export async function generateCustomerReport(data: CustomerReportData): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = data.businessName;

  const ws = workbook.addWorksheet("Analisis Customer");
  ws.columns = [{ width: 5 }, { width: 25 }, { width: 15 }, { width: 18 }, { width: 15 }];

  let row = 1;

  ws.mergeCells(`A${row}:E${row}`);
  ws.getCell(`A${row}`).value = "ANALISIS CUSTOMER";
  setTitleStyle(ws.getCell(`A${row}`));
  row++;

  ws.mergeCells(`A${row}:E${row}`);
  ws.getCell(`A${row}`).value = `Periode: ${formatDate(data.period.start)} - ${formatDate(data.period.end)}`;
  setSubtitleStyle(ws.getCell(`A${row}`));
  row += 2;

  // Summary
  ws.getCell(`B${row}`).value = "TOTAL CUSTOMERS:";
  ws.getCell(`D${row}`).value = `${data.summary.totalCustomers.toLocaleString()} orang`;
  ws.getCell(`D${row}`).font = { bold: true };
  row++;

  ws.getCell(`B${row}`).value = "New Customers:";
  ws.getCell(`D${row}`).value = `${data.summary.newCustomers} orang (${Math.round((data.summary.newCustomers / data.summary.totalCustomers) * 100)}%)`;
  row++;

  ws.getCell(`B${row}`).value = "Repeat Customers:";
  ws.getCell(`D${row}`).value = `${data.summary.repeatCustomers.toLocaleString()} orang (${Math.round((data.summary.repeatCustomers / data.summary.totalCustomers) * 100)}%)`;
  row += 2;

  // Segmentation
  ws.mergeCells(`A${row}:E${row}`);
  const segHeader = ws.getCell(`A${row}`);
  segHeader.value = "CUSTOMER SEGMENTATION";
  setSectionHeaderStyle(segHeader);
  row++;

  ws.getCell(`B${row}`).value = "By Purchase Frequency:";
  ws.getCell(`B${row}`).font = { bold: true, italic: true };
  row++;

  data.segmentation.byFrequency.forEach((seg, idx) => {
    ws.getCell(`B${row}`).value = `- ${seg.segment}:`;
    ws.getCell(`D${row}`).value = `${seg.count.toLocaleString()} orang (${seg.percentage}%)`;
    setDataCellStyle(ws.getCell(`B${row}`), idx % 2 === 0);
    setDataCellStyle(ws.getCell(`C${row}`), idx % 2 === 0);
    setDataCellStyle(ws.getCell(`D${row}`), idx % 2 === 0);
    row++;
  });
  row++;

  ws.getCell(`B${row}`).value = "By Spending:";
  ws.getCell(`B${row}`).font = { bold: true, italic: true };
  row++;

  data.segmentation.bySpending.forEach((seg, idx) => {
    ws.getCell(`B${row}`).value = `- ${seg.segment}:`;
    ws.getCell(`D${row}`).value = `${seg.count.toLocaleString()} orang (${seg.percentage}%)`;
    setDataCellStyle(ws.getCell(`B${row}`), idx % 2 === 0);
    setDataCellStyle(ws.getCell(`C${row}`), idx % 2 === 0);
    setDataCellStyle(ws.getCell(`D${row}`), idx % 2 === 0);
    row++;
  });
  row++;

  // Lifetime Value
  ws.mergeCells(`A${row}:E${row}`);
  const ltvHeader = ws.getCell(`A${row}`);
  ltvHeader.value = "CUSTOMER LIFETIME VALUE";
  setSectionHeaderStyle(ltvHeader);
  row++;

  ws.getCell(`B${row}`).value = "Average:";
  ws.getCell(`D${row}`).value = formatCurrency(data.lifetime.average);
  row++;
  ws.getCell(`B${row}`).value = "Median:";
  ws.getCell(`D${row}`).value = formatCurrency(data.lifetime.median);
  row++;
  ws.getCell(`B${row}`).value = "Top 10%:";
  ws.getCell(`D${row}`).value = `${formatCurrency(data.lifetime.top10)}+`;
  row += 2;

  // Retention
  ws.mergeCells(`A${row}:E${row}`);
  const retHeader = ws.getCell(`A${row}`);
  retHeader.value = "RETENTION";
  setSectionHeaderStyle(retHeader);
  row++;

  ws.getCell(`B${row}`).value = "Month-over-month:";
  ws.getCell(`D${row}`).value = `${data.retention.monthOverMonth}%`;
  ws.getCell(`D${row}`).font = { bold: true, color: { argb: data.retention.monthOverMonth >= 70 ? COLORS.success : COLORS.warning } };
  row++;

  ws.getCell(`B${row}`).value = "Customer lost (churn):";
  ws.getCell(`D${row}`).value = `${data.retention.churnedCustomers} orang`;
  row += 2;

  // Top Customers
  ws.mergeCells(`A${row}:E${row}`);
  const topHeader = ws.getCell(`A${row}`);
  topHeader.value = "TOP 20 CUSTOMERS";
  setSectionHeaderStyle(topHeader);
  row++;

  ["RANK", "CUSTOMER", "TRX", "TOTAL SPENT", "LAST VISIT"].forEach((h, idx) => {
    const cell = ws.getCell(row, idx + 1);
    cell.value = h;
    setHeaderStyle(cell);
  });
  row++;

  data.topCustomers.forEach((cust, idx) => {
    ws.getCell(`A${row}`).value = `${cust.rank}.`;
    ws.getCell(`B${row}`).value = cust.name;
    ws.getCell(`C${row}`).value = cust.transactions;
    ws.getCell(`D${row}`).value = formatCurrency(cust.totalSpent);
    ws.getCell(`E${row}`).value = formatDate(cust.lastVisit, "short");
    [1, 2, 3, 4, 5].forEach(col => setDataCellStyle(ws.getCell(row, col), idx % 2 === 0));
    row++;
  });
  row++;

  // Insights
  ws.mergeCells(`A${row}:E${row}`);
  const insightHeader = ws.getCell(`A${row}`);
  insightHeader.value = "INSIGHT";
  setSectionHeaderStyle(insightHeader);
  row++;

  data.insights.forEach(insight => {
    ws.mergeCells(`A${row}:E${row}`);
    ws.getCell(`A${row}`).value = `• ${insight}`;
    row++;
  });

  return workbook;
}

// ===========================================
// LAPORAN LABA RUGI
// ===========================================
export interface ProfitLossData {
  period: { start: Date; end: Date };
  businessName: string;
  revenue: {
    sales: number;
    other: number;
    total: number;
  };
  cogs: number;
  grossProfit: number;
  grossMargin: number;
  operationalExpenses: {
    name: string;
    amount: number;
  }[];
  totalOperationalExpenses: number;
  operatingProfit: number;
  operatingMargin: number;
  otherExpenses: {
    name: string;
    amount: number;
  }[];
  netProfit: number;
  netMargin: number;
  comparison: {
    vsLastMonth: number;
    vsLastYear: number;
  };
}

export async function generateProfitLossReport(data: ProfitLossData): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = data.businessName;

  const ws = workbook.addWorksheet("Laba Rugi");
  ws.columns = [{ width: 5 }, { width: 30 }, { width: 20 }, { width: 15 }];

  let row = 1;

  ws.mergeCells(`A${row}:D${row}`);
  ws.getCell(`A${row}`).value = "LAPORAN LABA RUGI";
  setTitleStyle(ws.getCell(`A${row}`));
  row++;

  ws.mergeCells(`A${row}:D${row}`);
  ws.getCell(`A${row}`).value = `Periode: ${formatDate(data.period.start)} - ${formatDate(data.period.end)}`;
  setSubtitleStyle(ws.getCell(`A${row}`));
  row += 2;

  // PENDAPATAN
  ws.mergeCells(`A${row}:D${row}`);
  const revHeader = ws.getCell(`A${row}`);
  revHeader.value = "PENDAPATAN";
  setSectionHeaderStyle(revHeader);
  row++;

  ws.getCell(`B${row}`).value = "Penjualan:";
  ws.getCell(`C${row}`).value = formatCurrency(data.revenue.sales);
  setDataCellStyle(ws.getCell(`B${row}`));
  setDataCellStyle(ws.getCell(`C${row}`));
  row++;

  if (data.revenue.other > 0) {
    ws.getCell(`B${row}`).value = "Pendapatan Lain:";
    ws.getCell(`C${row}`).value = formatCurrency(data.revenue.other);
    setDataCellStyle(ws.getCell(`B${row}`));
    setDataCellStyle(ws.getCell(`C${row}`));
    row++;
  }

  ws.getCell(`B${row}`).value = "Total Pendapatan:";
  ws.getCell(`B${row}`).font = { bold: true };
  ws.getCell(`C${row}`).value = formatCurrency(data.revenue.total);
  ws.getCell(`C${row}`).font = { bold: true };
  ws.getCell(`C${row}`).border = { top: { style: "thin" }, bottom: { style: "double" } };
  row += 2;

  // COGS
  ws.mergeCells(`A${row}:D${row}`);
  const cogsHeader = ws.getCell(`A${row}`);
  cogsHeader.value = "BEBAN POKOK PENJUALAN (COGS)";
  setSectionHeaderStyle(cogsHeader);
  row++;

  ws.getCell(`B${row}`).value = "Bahan Baku:";
  ws.getCell(`C${row}`).value = formatCurrency(data.cogs);
  row++;

  ws.getCell(`B${row}`).value = "LABA KOTOR:";
  ws.getCell(`B${row}`).font = { bold: true };
  ws.getCell(`C${row}`).value = formatCurrency(data.grossProfit);
  ws.getCell(`C${row}`).font = { bold: true, color: { argb: COLORS.success } };
  row++;

  ws.getCell(`B${row}`).value = "Margin Kotor:";
  ws.getCell(`C${row}`).value = `${data.grossMargin}%`;
  row += 2;

  // Beban Operasional
  ws.mergeCells(`A${row}:D${row}`);
  const opexHeader = ws.getCell(`A${row}`);
  opexHeader.value = "BEBAN OPERASIONAL";
  setSectionHeaderStyle(opexHeader);
  row++;

  data.operationalExpenses.forEach((exp, idx) => {
    ws.getCell(`B${row}`).value = `${exp.name}:`;
    ws.getCell(`C${row}`).value = formatCurrency(exp.amount);
    setDataCellStyle(ws.getCell(`B${row}`), idx % 2 === 0);
    setDataCellStyle(ws.getCell(`C${row}`), idx % 2 === 0);
    row++;
  });

  ws.getCell(`B${row}`).value = "Total Beban Operasional:";
  ws.getCell(`B${row}`).font = { bold: true };
  ws.getCell(`C${row}`).value = formatCurrency(data.totalOperationalExpenses);
  ws.getCell(`C${row}`).font = { bold: true };
  ws.getCell(`C${row}`).border = { top: { style: "thin" } };
  row += 2;

  // Laba Operasional
  ws.getCell(`B${row}`).value = "LABA OPERASIONAL:";
  ws.getCell(`B${row}`).font = { bold: true };
  ws.getCell(`C${row}`).value = formatCurrency(data.operatingProfit);
  ws.getCell(`C${row}`).font = { bold: true, color: { argb: COLORS.success } };
  row++;

  ws.getCell(`B${row}`).value = "Margin Operasional:";
  ws.getCell(`C${row}`).value = `${data.operatingMargin}%`;
  row += 2;

  // Other Expenses
  if (data.otherExpenses.length > 0) {
    ws.mergeCells(`A${row}:D${row}`);
    const otherHeader = ws.getCell(`A${row}`);
    otherHeader.value = "BEBAN/PENDAPATAN LAIN";
    setSectionHeaderStyle(otherHeader);
    row++;

    data.otherExpenses.forEach((exp, idx) => {
      ws.getCell(`B${row}`).value = `${exp.name}:`;
      ws.getCell(`C${row}`).value = formatCurrency(exp.amount);
      setDataCellStyle(ws.getCell(`B${row}`), idx % 2 === 0);
      setDataCellStyle(ws.getCell(`C${row}`), idx % 2 === 0);
      row++;
    });
    row++;
  }

  // Net Profit
  ws.getCell(`B${row}`).value = "LABA BERSIH:";
  ws.getCell(`B${row}`).font = { bold: true, size: 12 };
  ws.getCell(`C${row}`).value = formatCurrency(data.netProfit);
  ws.getCell(`C${row}`).font = { bold: true, size: 12, color: { argb: data.netProfit >= 0 ? COLORS.success : COLORS.danger } };
  ws.getCell(`C${row}`).border = { top: { style: "thin" }, bottom: { style: "double" } };
  row++;

  ws.getCell(`B${row}`).value = "Margin Bersih:";
  ws.getCell(`C${row}`).value = `${data.netMargin}%`;
  row += 2;

  // Comparison
  ws.mergeCells(`A${row}:D${row}`);
  const compHeader = ws.getCell(`A${row}`);
  compHeader.value = "PERBANDINGAN";
  setSectionHeaderStyle(compHeader);
  row++;

  const growthIcon = (val: number) => val >= 0 ? "⬆" : "⬇";
  const growthColor = (val: number) => val >= 0 ? COLORS.success : COLORS.danger;

  ws.getCell(`B${row}`).value = "vs Bulan Lalu:";
  ws.getCell(`C${row}`).value = `${data.comparison.vsLastMonth >= 0 ? "+" : ""}${data.comparison.vsLastMonth.toFixed(1)}% ${growthIcon(data.comparison.vsLastMonth)}`;
  ws.getCell(`C${row}`).font = { bold: true, color: { argb: growthColor(data.comparison.vsLastMonth) } };
  row++;

  ws.getCell(`B${row}`).value = "vs Tahun Lalu:";
  ws.getCell(`C${row}`).value = `${data.comparison.vsLastYear >= 0 ? "+" : ""}${data.comparison.vsLastYear.toFixed(1)}% ${growthIcon(data.comparison.vsLastYear)}`;
  ws.getCell(`C${row}`).font = { bold: true, color: { argb: growthColor(data.comparison.vsLastYear) } };

  return workbook;
}
