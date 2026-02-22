const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcryptjs");

require("dotenv").config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─────────────────────────────────────────────────────────────────────────────
// Mapping businessType → activeModules (sama dengan register form)
// ─────────────────────────────────────────────────────────────────────────────
const BUSINESS_MODULES = {
  FNB:       ["POS", "TABLE", "BOM"],
  BAKERY:    ["POS", "BOM"],
  LAUNDRY:   ["POS", "JOB_TICKET"],
  RETAIL:    ["POS"],
  SALON:     ["POS", "BOOKING"],
  WHOLESALE: ["POS", "B2B", "TIER_PRICING"],
  FRANCHISE: ["POS", "MULTI_STORE"],
  OTHER:     ["POS"],
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper: buat satu tenant
// ─────────────────────────────────────────────────────────────────────────────
async function createTenant({ name, slug, address, phone, email, businessType, users: userDefs, categories: catDefs, items: itemDefs, customers: customerDefs }) {
  const activeModules = BUSINESS_MODULES[businessType];
  console.log(`\n🏢  [${businessType}] ${name}`);
  console.log(`    Modules: ${activeModules.join(", ")}`);

  const tenant = await prisma.tenant.create({
    data: { name, slug, address, phone, email, isActive: true, activeModules },
  });

  await prisma.settings.create({
    data: {
      tenantId: tenant.id,
      businessName: name,
      businessAddress: address,
      businessPhone: phone,
      businessEmail: email,
      taxRate: 11,
      taxIncluded: false,
      currency: "IDR",
      receiptHeader: `${name}\nTerima kasih telah berbelanja!`,
      receiptFooter: "Simpan struk ini sebagai bukti transaksi.",
      lowStockThreshold: 10,
    },
  });

  const pwd = await bcrypt.hash("admin123", 10);
  const createdUsers = {};
  for (const u of userDefs) {
    const user = await prisma.user.create({
      data: { tenantId: tenant.id, email: u.email, name: u.name, password: pwd, role: u.role, phone: u.phone || null, isActive: true },
    });
    createdUsers[u.key] = user;
  }

  const createdCats = {};
  for (const c of catDefs) {
    const cat = await prisma.itemCategory.create({
      data: { tenantId: tenant.id, name: c.name, icon: c.icon || null, color: c.color || null, isActive: true },
    });
    createdCats[c.key] = cat;
  }

  const createdItems = {};
  for (const def of itemDefs) {
    const item = await prisma.item.create({
      data: {
        tenantId: tenant.id,
        sku: `${slug.slice(0, 4).toUpperCase()}-${def.sku}`,
        name: def.name,
        type: def.type,
        categoryId: createdCats[def.catKey]?.id || null,
        basePrice: def.price,
        baseCost: def.cost,
        unit: def.unit,
        isActive: true,
        taxable: true,
      },
    });
    const variant = await prisma.itemVariant.create({
      data: {
        tenantId: tenant.id,
        itemId: item.id,
        sku: `${slug.slice(0, 4).toUpperCase()}-${def.sku}-DEF`,
        name: "Default",
        price: def.price,
        cost: def.cost,
        stock: def.stock ?? 0,
        minStock: def.minStock ?? 5,
        isActive: true,
        attributes: "{}",
      },
    });
    createdItems[def.key] = { item, variant };
  }

  const createdCustomers = [];
  for (const c of (customerDefs || [])) {
    const customer = await prisma.customer.create({
      data: {
        tenantId: tenant.id, name: c.name, phone: c.phone, email: c.email || null,
        customerType: c.type || "RETAIL", creditLimit: c.creditLimit || null, isActive: true,
      },
    });
    createdCustomers.push(customer);
  }

  await prisma.store.create({
    data: { tenantId: tenant.id, code: "MAIN", name: `${name} - Toko Utama`, isActive: true, isMainStore: true },
  });

  console.log(`    ✅ Users: ${Object.keys(createdUsers).length} | Items: ${Object.keys(createdItems).length} | Customers: ${createdCustomers.length}`);
  return { tenant, users: createdUsers, items: createdItems, customers: createdCustomers };
}

// ─────────────────────────────────────────────────────────────────────────────
// Seed POS transactions (N hari)
// ─────────────────────────────────────────────────────────────────────────────
async function seedTransactions(tenantId, cashierId, variants, customers, days = 14) {
  const payMethods = ["CASH", "TRANSFER", "QRIS"];
  const now = new Date();
  let count = 0;

  for (let day = days; day >= 0; day--) {
    const txDate = new Date(now);
    txDate.setDate(txDate.getDate() - day);
    const dailyTx = 2 + Math.floor(Math.random() * 4);

    for (let i = 0; i < dailyTx; i++) {
      const picked = [...variants].sort(() => 0.5 - Math.random()).slice(0, 1 + Math.floor(Math.random() * 2));
      const payMethod = payMethods[Math.floor(Math.random() * payMethods.length)];
      const customer = Math.random() < 0.3 && customers.length ? customers[Math.floor(Math.random() * customers.length)] : null;

      let subtotal = 0;
      const txItems = picked.map(({ item, variant }) => {
        const qty = 1 + Math.floor(Math.random() * 3);
        const price = Number(variant.price);
        subtotal += price * qty;
        return { variantId: variant.id, itemName: item.name, variantName: "Default", qty, price, sub: price * qty };
      });

      const total = subtotal;
      const txCreated = new Date(txDate);
      txCreated.setHours(8 + Math.floor(Math.random() * 10));
      count++;
      const txNo = `TRX-${String(count).padStart(5, "0")}`;

      await prisma.transaction.create({
        data: {
          tenantId, transactionNo: txNo, type: "POS_RECEIPT",
          userId: cashierId, customerId: customer?.id || null,
          subtotal, tax: 0, discount: 0, total,
          paymentMethod: payMethod, paymentAmount: total, changeAmount: 0,
          paymentStatus: "PAID", status: "COMPLETED", createdAt: txCreated,
          items: {
            create: txItems.map(ti => ({
              variantId: ti.variantId, itemName: ti.itemName, variantName: ti.variantName,
              quantity: ti.qty, price: ti.price, discount: 0, subtotal: ti.sub,
            })),
          },
        },
      });
    }
  }
  return count;
}

// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🌱 Seeding — 8 tipe usaha\n");

  // ══════════════════════════════════════════════════════════════════
  // 1. FNB — Kafe / Restoran  |  Modules: POS + TABLE + BOM
  // ══════════════════════════════════════════════════════════════════
  const fnb = await createTenant({
    name: "Kopi Kita Cafe",
    slug: "kopi-kita-cafe",
    address: "Jl. Sudirman No. 10, Jakarta Pusat",
    phone: "021-10000001",
    email: "owner@kopikita.com",
    businessType: "FNB",
    users: [
      { key: "owner",   email: "owner@kopikita.com",  name: "Rian Pratama", role: "OWNER", phone: "08100000001" },
      { key: "cashier", email: "kasir@kopikita.com",  name: "Dina Kasir",   role: "KASIR", phone: "08100000002" },
    ],
    categories: [
      { key: "kopi",    name: "Kopi",     icon: "☕", color: "#6B4226" },
      { key: "minuman", name: "Non-Kopi", icon: "🥤", color: "#2196F3" },
      { key: "makanan", name: "Makanan",  icon: "🍽️", color: "#4CAF50" },
    ],
    items: [
      { key: "espresso",       sku: "KPI-001", name: "Espresso",        type: "GOODS", catKey: "kopi",    price: 20000,  cost: 5000,  stock: 100, unit: "gelas" },
      { key: "latte",          sku: "KPI-002", name: "Caffe Latte",     type: "GOODS", catKey: "kopi",    price: 28000,  cost: 8000,  stock: 100, unit: "gelas" },
      { key: "cappuccino",     sku: "KPI-003", name: "Cappuccino",      type: "GOODS", catKey: "kopi",    price: 30000,  cost: 9000,  stock: 100, unit: "gelas" },
      { key: "matcha",         sku: "MIN-001", name: "Matcha Latte",    type: "GOODS", catKey: "minuman", price: 32000,  cost: 10000, stock: 100, unit: "gelas" },
      { key: "lemon_tea",      sku: "MIN-002", name: "Lemon Tea",       type: "GOODS", catKey: "minuman", price: 18000,  cost: 4000,  stock: 100, unit: "gelas" },
      { key: "croissant",      sku: "MKN-001", name: "Croissant",       type: "GOODS", catKey: "makanan", price: 22000,  cost: 10000, stock: 30,  unit: "pcs" },
      { key: "avocado_toast",  sku: "MKN-002", name: "Avocado Toast",  type: "GOODS", catKey: "makanan", price: 35000,  cost: 14000, stock: 20,  unit: "pcs" },
    ],
    customers: [
      { name: "Budi Santoso", phone: "08100000010", type: "RETAIL" },
      { name: "Siti Rahayu",  phone: "08100000011", type: "RETAIL" },
    ],
  });
  const fnbTx = await seedTransactions(fnb.tenant.id, fnb.users.cashier.id, Object.values(fnb.items), fnb.customers);
  console.log(`    ✅ Transactions: ${fnbTx}`);

  // ══════════════════════════════════════════════════════════════════
  // 2. BAKERY — Toko Roti / Kue  |  Modules: POS + BOM
  // ══════════════════════════════════════════════════════════════════
  const bakery = await createTenant({
    name: "Roti Bahagia Bakery",
    slug: "roti-bahagia",
    address: "Jl. Roti Enak No. 1, Bandung",
    phone: "022-20000001",
    email: "owner@rotibahagia.com",
    businessType: "BAKERY",
    users: [
      { key: "owner",   email: "owner@rotibahagia.com",  name: "Evi Kusuma",  role: "OWNER", phone: "08200000001" },
      { key: "cashier", email: "kasir@rotibahagia.com",  name: "Fajar Kasir", role: "KASIR", phone: "08200000002" },
    ],
    categories: [
      { key: "roti",  name: "Roti",       icon: "🍞", color: "#F5A623" },
      { key: "kue",   name: "Kue & Cake", icon: "🎂", color: "#E91E8C" },
      { key: "bahan", name: "Bahan Baku", icon: "🌾", color: "#8BC34A" },
    ],
    items: [
      { key: "roti_tawar",   sku: "RTI-001", name: "Roti Tawar Original", type: "GOODS", catKey: "roti", price: 18000,  cost: 7000,   stock: 50,  unit: "pcs" },
      { key: "roti_coklat",  sku: "RTI-002", name: "Roti Cokelat Keju",   type: "GOODS", catKey: "roti", price: 22000,  cost: 9000,   stock: 40,  unit: "pcs" },
      { key: "croissant",    sku: "RTI-003", name: "Croissant Mentega",   type: "GOODS", catKey: "roti", price: 25000,  cost: 11000,  stock: 30,  unit: "pcs" },
      { key: "black_forest", sku: "KUE-001", name: "Black Forest 22cm",   type: "GOODS", catKey: "kue",  price: 280000, cost: 120000, stock: 5,   unit: "buah" },
      { key: "brownies",     sku: "KUE-002", name: "Brownies Cokelat",    type: "GOODS", catKey: "kue",  price: 45000,  cost: 18000,  stock: 15,  unit: "loyang" },
    ],
    customers: [
      { name: "Andi Pelanggan", phone: "08200000010", type: "RETAIL" },
      { name: "CV Kantin Jaya", phone: "08200000011", type: "WHOLESALE", creditLimit: 5000000 },
    ],
  });
  await prisma.jobTicket.create({
    data: { tenantId: bakery.tenant.id, ticketNo: "JOB-BKR-001", customerName: "Rina Maharani", customerPhone: "08200999001", title: "Kue Ultah 3 Tier", description: "Fondant, nama: Happy Birthday Budi", quantity: 1, unitPrice: 500000, totalPrice: 500000, dpAmount: 250000, dpPaidAt: new Date(), remainingAmount: 250000, dueDate: new Date(Date.now() + 7 * 86400000), deliveryType: "PICKUP", status: "CONFIRMED", createdBy: bakery.users.owner.id },
  });
  const bakTx = await seedTransactions(bakery.tenant.id, bakery.users.cashier.id, Object.values(bakery.items), bakery.customers);
  console.log(`    ✅ Transactions: ${bakTx} | Job tickets: 1`);

  // ══════════════════════════════════════════════════════════════════
  // 3. LAUNDRY — Laundry / Servis  |  Modules: POS + JOB_TICKET
  // ══════════════════════════════════════════════════════════════════
  const laundry = await createTenant({
    name: "Bersih Kilat Laundry",
    slug: "bersih-kilat",
    address: "Jl. Kebersihan No. 5, Surabaya",
    phone: "031-30000001",
    email: "owner@bersihkilat.com",
    businessType: "LAUNDRY",
    users: [
      { key: "owner",   email: "owner@bersihkilat.com", name: "Susanto Laundry", role: "OWNER", phone: "08300000001" },
      { key: "cashier", email: "kasir@bersihkilat.com", name: "Wati Kasir",      role: "KASIR", phone: "08300000002" },
    ],
    categories: [
      { key: "cuci",    name: "Cuci & Setrika", icon: "👕", color: "#2196F3" },
      { key: "ekspres", name: "Ekspres",        icon: "⚡", color: "#FF9800" },
      { key: "ekstra",  name: "Layanan Ekstra", icon: "✨", color: "#9C27B0" },
    ],
    items: [
      { key: "reguler",  sku: "LDR-001", name: "Cuci Setrika Reguler (per kg)", type: "SERVICE", catKey: "cuci",    price: 7000,  cost: 2000,  stock: 0, unit: "kg" },
      { key: "ekspres",  sku: "LDR-002", name: "Cuci Ekspres 6 Jam (per kg)",   type: "SERVICE", catKey: "ekspres", price: 12000, cost: 3000,  stock: 0, unit: "kg" },
      { key: "selimut",  sku: "LDR-003", name: "Cuci Selimut / Bed Cover",      type: "SERVICE", catKey: "ekstra",  price: 35000, cost: 8000,  stock: 0, unit: "pcs" },
      { key: "jas",      sku: "LDR-004", name: "Dry Clean Jas / Gaun",          type: "SERVICE", catKey: "ekstra",  price: 65000, cost: 20000, stock: 0, unit: "pcs" },
    ],
    customers: [
      { name: "Keluarga Pak Hasan", phone: "08300000010", type: "RETAIL" },
      { name: "Hotel Melati",       phone: "08300000012", type: "WHOLESALE", creditLimit: 3000000 },
    ],
  });
  await prisma.jobTicket.createMany({
    data: [
      { tenantId: laundry.tenant.id, ticketNo: "JOB-LDR-001", customerName: "Pak Hasan",    customerPhone: "08300000010", title: "5kg Reguler + 2 Selimut",      description: "",                      quantity: 1,  unitPrice: 105000,  totalPrice: 105000,  dpAmount: 0,      remainingAmount: 105000,  dueDate: new Date(Date.now() + 2 * 86400000), deliveryType: "PICKUP",   status: "PROCESSING", createdBy: laundry.users.cashier.id },
      { tenantId: laundry.tenant.id, ticketNo: "JOB-LDR-002", customerName: "Hotel Melati", customerPhone: "08300000012", title: "50kg Linen Hotel Mingguan",    description: "Harga kontrak bulanan", quantity: 1,  unitPrice: 300000,  totalPrice: 300000,  dpAmount: 150000, dpPaidAt: new Date(), remainingAmount: 150000,  dueDate: new Date(Date.now() + 1 * 86400000), deliveryType: "DELIVERY", status: "CONFIRMED",  createdBy: laundry.users.owner.id },
    ],
  });
  console.log(`    ✅ Job tickets: 2 (no POS transactions for pure service)`);

  // ══════════════════════════════════════════════════════════════════
  // 4. RETAIL — Minimarket  |  Modules: POS
  // ══════════════════════════════════════════════════════════════════
  const retail = await createTenant({
    name: "Toko Segar Mart",
    slug: "segar-mart",
    address: "Jl. Pasar Lama No. 22, Bekasi",
    phone: "021-40000001",
    email: "owner@segarmart.com",
    businessType: "RETAIL",
    users: [
      { key: "owner",   email: "owner@segarmart.com",  name: "Hartono Pemilik", role: "OWNER", phone: "08400000001" },
      { key: "cashier", email: "kasir@segarmart.com",  name: "Yuli Kasir",      role: "KASIR", phone: "08400000002" },
    ],
    categories: [
      { key: "minuman",  name: "Minuman",       icon: "🥤", color: "#2196F3" },
      { key: "snack",    name: "Snack",         icon: "🍿", color: "#FF9800" },
      { key: "sembako",  name: "Sembako",       icon: "🛒", color: "#4CAF50" },
      { key: "personal", name: "Personal Care", icon: "🧴", color: "#9C27B0" },
    ],
    items: [
      { key: "aqua_600",  sku: "MNM-001", name: "Aqua 600ml",            type: "GOODS", catKey: "minuman",  price: 4000,  cost: 2500,  stock: 200, unit: "botol" },
      { key: "teh_botol", sku: "MNM-002", name: "Teh Botol Sosro 450ml", type: "GOODS", catKey: "minuman",  price: 5500,  cost: 4000,  stock: 150, unit: "botol" },
      { key: "indomie",   sku: "SKB-001", name: "Indomie Goreng",        type: "GOODS", catKey: "sembako",  price: 3500,  cost: 2800,  stock: 300, unit: "pcs" },
      { key: "beras_5kg", sku: "SKB-002", name: "Beras 5kg",             type: "GOODS", catKey: "sembako",  price: 75000, cost: 65000, stock: 50,  unit: "karung" },
      { key: "biskuit",   sku: "SNK-001", name: "Biskuit Roma Krem",     type: "GOODS", catKey: "snack",    price: 9500,  cost: 7500,  stock: 100, unit: "pcs" },
      { key: "chitato",   sku: "SNK-002", name: "Chitato Rasa Sapi",     type: "GOODS", catKey: "snack",    price: 13000, cost: 10000, stock: 80,  unit: "pcs" },
      { key: "shampoo",   sku: "PRS-001", name: "Shampoo Sunsilk 170ml", type: "GOODS", catKey: "personal", price: 22000, cost: 17000, stock: 60,  unit: "botol" },
    ],
    customers: [
      { name: "Ibu Sari",    phone: "08400000010", type: "RETAIL" },
      { name: "Pak Bambang", phone: "08400000011", type: "RETAIL" },
    ],
  });
  const retailTx = await seedTransactions(retail.tenant.id, retail.users.cashier.id, Object.values(retail.items), retail.customers, 14);
  console.log(`    ✅ Transactions: ${retailTx}`);

  // ══════════════════════════════════════════════════════════════════
  // 5. SALON — Salon & Spa  |  Modules: POS + BOOKING
  // ══════════════════════════════════════════════════════════════════
  const salon = await createTenant({
    name: "Cantik Salon & Spa",
    slug: "cantik-salon",
    address: "Ruko Harmoni Blok D-5, Tangerang",
    phone: "021-50000001",
    email: "owner@cantiksalon.com",
    businessType: "SALON",
    users: [
      { key: "owner",   email: "owner@cantiksalon.com",   name: "Melati Pemilik",    role: "OWNER", phone: "08500000001" },
      { key: "cashier", email: "kasir@cantiksalon.com",   name: "Rini Resepsionis",  role: "KASIR", phone: "08500000002" },
      { key: "staff",   email: "stylist@cantiksalon.com", name: "Indah Stylist",     role: "KASIR", phone: "08500000003" },
    ],
    categories: [
      { key: "rambut", name: "Perawatan Rambut", icon: "✂️", color: "#E91E8C" },
      { key: "wajah",  name: "Perawatan Wajah",  icon: "💆", color: "#FF9800" },
      { key: "produk", name: "Produk Salon",      icon: "🧴", color: "#2196F3" },
    ],
    items: [
      { key: "potong",     sku: "RBT-001", name: "Potong Rambut",         type: "SERVICE", catKey: "rambut", price: 50000,  cost: 10000,  stock: 0,  unit: "kali" },
      { key: "creambath",  sku: "RBT-002", name: "Creambath + Blow",       type: "SERVICE", catKey: "rambut", price: 120000, cost: 30000,  stock: 0,  unit: "kali" },
      { key: "coloring",   sku: "RBT-003", name: "Bleach + Coloring",      type: "SERVICE", catKey: "rambut", price: 350000, cost: 80000,  stock: 0,  unit: "kali" },
      { key: "facial",     sku: "WJH-001", name: "Facial Wajah 60 Menit",  type: "SERVICE", catKey: "wajah",  price: 180000, cost: 40000,  stock: 0,  unit: "kali" },
      { key: "shampoo_pro",sku: "PRD-001", name: "Shampoo Kerastase 250ml",type: "GOODS",   catKey: "produk", price: 250000, cost: 180000, stock: 20, unit: "botol" },
    ],
    customers: [
      { name: "Ibu Ratna",        phone: "08500000010", type: "RETAIL" },
      { name: "Mbak Tika",        phone: "08500000011", type: "RETAIL" },
      { name: "Bu Direktur Lena", phone: "08500000012", type: "RETAIL" },
    ],
  });
  await prisma.booking.createMany({
    data: [
      { tenantId: salon.tenant.id, bookingNo: "BK-SLN-001", customerId: salon.customers[0]?.id, customerName: "Ibu Ratna",        customerPhone: "08500000010", date: new Date(Date.now() + 1 * 86400000), startTime: new Date(new Date(Date.now() + 1 * 86400000).setHours(10, 0, 0, 0)), duration: 90,  staffId: salon.users.staff.id, serviceName: "Creambath + Blow",  status: "CONFIRMED", notes: "Alergi produk berminyak" },
      { tenantId: salon.tenant.id, bookingNo: "BK-SLN-002", customerId: salon.customers[1]?.id, customerName: "Mbak Tika",        customerPhone: "08500000011", date: new Date(Date.now() + 2 * 86400000), startTime: new Date(new Date(Date.now() + 2 * 86400000).setHours(13, 0, 0, 0)), duration: 120, staffId: salon.users.staff.id, serviceName: "Facial + Manikur",  status: "PENDING",   notes: "" },
      { tenantId: salon.tenant.id, bookingNo: "BK-SLN-003", customerId: salon.customers[2]?.id, customerName: "Bu Direktur Lena", customerPhone: "08500000012", date: new Date(Date.now() + 3 * 86400000), startTime: new Date(new Date(Date.now() + 3 * 86400000).setHours(15, 0, 0, 0)), duration: 180, staffId: salon.users.staff.id, serviceName: "Bleach + Coloring", status: "CONFIRMED", notes: "VIP" },
    ],
  });
  const salonProducts = Object.values(salon.items).filter(i => i.item.type === "GOODS");
  const salonTx = salonProducts.length
    ? await seedTransactions(salon.tenant.id, salon.users.cashier.id, salonProducts, salon.customers, 7)
    : 0;
  console.log(`    ✅ Bookings: 3 | Transactions: ${salonTx}`);

  // ══════════════════════════════════════════════════════════════════
  // 6. WHOLESALE — Grosir  |  Modules: POS + B2B + TIER_PRICING
  // ══════════════════════════════════════════════════════════════════
  const wholesale = await createTenant({
    name: "Grosir Nusantara",
    slug: "grosir-nusantara",
    address: "Gudang Cakung Blok F-12, Jakarta Timur",
    phone: "021-60000001",
    email: "owner@grosir.com",
    businessType: "WHOLESALE",
    users: [
      { key: "owner",   email: "owner@grosir.com",   name: "Benny Hartono", role: "OWNER",   phone: "08600000001" },
      { key: "manager", email: "manager@grosir.com", name: "Linda Sales",   role: "MANAGER", phone: "08600000002" },
      { key: "cashier", email: "kasir@grosir.com",   name: "Dodi Kasir",    role: "KASIR",   phone: "08600000003" },
    ],
    categories: [
      { key: "sembako",  name: "Sembako",        icon: "🌾", color: "#4CAF50" },
      { key: "minuman",  name: "Minuman",         icon: "🥤", color: "#2196F3" },
      { key: "snack",    name: "Snack & Makanan", icon: "🍿", color: "#FF9800" },
    ],
    items: [
      { key: "beras_25kg",    sku: "SMB-001", name: "Beras Premium 25kg",       type: "GOODS", catKey: "sembako", price: 350000,  cost: 300000,  stock: 200, unit: "karung", minStock: 20 },
      { key: "gula_50kg",     sku: "SMB-002", name: "Gula Pasir 50kg",          type: "GOODS", catKey: "sembako", price: 750000,  cost: 680000,  stock: 100, unit: "karung", minStock: 10 },
      { key: "minyak_goreng", sku: "SMB-003", name: "Minyak Goreng 18L",        type: "GOODS", catKey: "sembako", price: 280000,  cost: 250000,  stock: 150, unit: "jerigen",minStock: 20 },
      { key: "aqua_dus",      sku: "MNM-001", name: "Aqua Dus 600ml (24 botol)",type: "GOODS", catKey: "minuman", price: 52000,   cost: 43000,   stock: 500, unit: "dus",    minStock: 50 },
      { key: "indomie_dus",   sku: "SNK-001", name: "Indomie Goreng Dus (40)",  type: "GOODS", catKey: "snack",   price: 130000,  cost: 115000,  stock: 300, unit: "dus",    minStock: 30 },
    ],
    customers: [
      { name: "Toko Pak Ahmad",      phone: "08600000010", type: "RETAIL" },
      { name: "CV Warung Makan Jaya",phone: "08600000011", type: "WHOLESALE", creditLimit: 20000000 },
      { name: "PT Swalayan Makmur",  phone: "08600000012", type: "WHOLESALE", creditLimit: 50000000 },
    ],
  });
  const priceList = await prisma.priceList.create({
    data: { tenantId: wholesale.tenant.id, name: "Harga Reseller", description: "Min. order 10 karton", isDefault: false, isActive: true, minOrderQty: 10 },
  });
  await prisma.priceListItem.create({
    data: { priceListId: priceList.id, variantId: wholesale.items.beras_25kg.variant.id, price: 330000, minQty: 10 },
  });
  const wholeTx = await seedTransactions(wholesale.tenant.id, wholesale.users.cashier.id, Object.values(wholesale.items), wholesale.customers, 14);
  console.log(`    ✅ Transactions: ${wholeTx} | Price lists: 1`);

  // ══════════════════════════════════════════════════════════════════
  // 7. FRANCHISE — Multi-Cabang  |  Modules: POS + MULTI_STORE
  // ══════════════════════════════════════════════════════════════════
  const franchise = await createTenant({
    name: "Warmindo Mas Bro",
    slug: "warmindo-mas-bro",
    address: "Kantor Pusat: Jl. Franchise No. 1, Yogyakarta",
    phone: "0274-70000001",
    email: "owner@warmindo.com",
    businessType: "FRANCHISE",
    users: [
      { key: "owner",   email: "owner@warmindo.com",   name: "Mas Bro Owner",  role: "OWNER",   phone: "08700000001" },
      { key: "manager", email: "manager@warmindo.com", name: "Area Manager",   role: "MANAGER", phone: "08700000002" },
      { key: "cashier", email: "kasir@warmindo.com",   name: "Kasir Cabang 1", role: "KASIR",   phone: "08700000003" },
    ],
    categories: [
      { key: "mie",     name: "Mie & Nasi", icon: "🍜", color: "#FF6B00" },
      { key: "minuman", name: "Minuman",    icon: "🥤", color: "#2196F3" },
    ],
    items: [
      { key: "mie_goreng",  sku: "MIE-001", name: "Mie Goreng Special", type: "GOODS", catKey: "mie",     price: 15000, cost: 5000, stock: 200, unit: "porsi" },
      { key: "nasi_goreng", sku: "MIE-002", name: "Nasi Goreng Telur",  type: "GOODS", catKey: "mie",     price: 17000, cost: 6000, stock: 200, unit: "porsi" },
      { key: "mie_kuah",    sku: "MIE-003", name: "Mie Kuah Ayam",      type: "GOODS", catKey: "mie",     price: 14000, cost: 5000, stock: 200, unit: "porsi" },
      { key: "es_teh",      sku: "MIN-001", name: "Es Teh Manis",       type: "GOODS", catKey: "minuman", price: 5000,  cost: 1500, stock: 500, unit: "gelas" },
      { key: "es_jeruk",    sku: "MIN-002", name: "Es Jeruk",           type: "GOODS", catKey: "minuman", price: 8000,  cost: 2500, stock: 300, unit: "gelas" },
    ],
    customers: [
      { name: "Pak Doni Reguler",  phone: "08700000010", type: "RETAIL" },
      { name: "Bu Wati Langganan", phone: "08700000011", type: "RETAIL" },
    ],
  });
  await prisma.store.createMany({
    data: [
      { tenantId: franchise.tenant.id, code: "CAB-YGY-01", name: "Warmindo - Cabang Malioboro", isActive: true, isMainStore: false, address: "Jl. Malioboro No. 55, Yogyakarta", phone: "0274-70000002" },
      { tenantId: franchise.tenant.id, code: "CAB-SLO-01", name: "Warmindo - Cabang Solo",      isActive: true, isMainStore: false, address: "Jl. Slamet Riyadi No. 12, Solo",  phone: "0271-70000003" },
    ],
  });
  const franchiseTx = await seedTransactions(franchise.tenant.id, franchise.users.cashier.id, Object.values(franchise.items), franchise.customers, 14);
  console.log(`    ✅ Transactions: ${franchiseTx} | Stores: 3 (1 pusat + 2 cabang)`);

  // ══════════════════════════════════════════════════════════════════
  // 8. OTHER — Toko Umum  |  Modules: POS
  // ══════════════════════════════════════════════════════════════════
  const other = await createTenant({
    name: "Toko Serba Ada",
    slug: "toko-serba-ada",
    address: "Jl. Umum No. 1, Semarang",
    phone: "024-80000001",
    email: "owner@tokoserba.com",
    businessType: "OTHER",
    users: [
      { key: "owner",   email: "owner@tokoserba.com",  name: "Pak Umum Pemilik", role: "OWNER", phone: "08800000001" },
      { key: "cashier", email: "kasir@tokoserba.com",  name: "Kasir Umum",       role: "KASIR", phone: "08800000002" },
    ],
    categories: [
      { key: "atk",     name: "Alat Tulis", icon: "✏️", color: "#607D8B" },
      { key: "aksesoris", name: "Aksesoris",icon: "🎀", color: "#E91E8C" },
    ],
    items: [
      { key: "pulpen",    sku: "ATK-001", name: "Pulpen Pilot",   type: "GOODS", catKey: "atk", price: 5000, cost: 3000, stock: 100, unit: "pcs" },
      { key: "buku_a5",   sku: "ATK-002", name: "Buku Tulis A5",  type: "GOODS", catKey: "atk", price: 8000, cost: 5500, stock: 80,  unit: "pcs" },
      { key: "penggaris", sku: "ATK-003", name: "Penggaris 30cm", type: "GOODS", catKey: "atk", price: 6000, cost: 4000, stock: 60,  unit: "pcs" },
    ],
    customers: [
      { name: "Pelajar Budi", phone: "08800000010", type: "RETAIL" },
    ],
  });
  const otherTx = await seedTransactions(other.tenant.id, other.users.cashier.id, Object.values(other.items), other.customers, 7);
  console.log(`    ✅ Transactions: ${otherTx}`);

  // ══════════════════════════════════════════════════════════════════
  // SUMMARY
  // ══════════════════════════════════════════════════════════════════
  console.log("\n\n🎉 Seed selesai! 8 tipe usaha berhasil dibuat.\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const summary = [
    { no: 1, type: "FNB      ", name: "Kopi Kita Cafe",       login: "owner@kopikita.com",    modules: BUSINESS_MODULES.FNB.join(", ") },
    { no: 2, type: "BAKERY   ", name: "Roti Bahagia Bakery",  login: "owner@rotibahagia.com", modules: BUSINESS_MODULES.BAKERY.join(", ") },
    { no: 3, type: "LAUNDRY  ", name: "Bersih Kilat Laundry", login: "owner@bersihkilat.com", modules: BUSINESS_MODULES.LAUNDRY.join(", ") },
    { no: 4, type: "RETAIL   ", name: "Toko Segar Mart",      login: "owner@segarmart.com",   modules: BUSINESS_MODULES.RETAIL.join(", ") },
    { no: 5, type: "SALON    ", name: "Cantik Salon & Spa",   login: "owner@cantiksalon.com", modules: BUSINESS_MODULES.SALON.join(", ") },
    { no: 6, type: "WHOLESALE", name: "Grosir Nusantara",     login: "owner@grosir.com",      modules: BUSINESS_MODULES.WHOLESALE.join(", ") },
    { no: 7, type: "FRANCHISE", name: "Warmindo Mas Bro",     login: "owner@warmindo.com",    modules: BUSINESS_MODULES.FRANCHISE.join(", ") },
    { no: 8, type: "OTHER    ", name: "Toko Serba Ada",       login: "owner@tokoserba.com",   modules: BUSINESS_MODULES.OTHER.join(", ") },
  ];
  for (const t of summary) {
    console.log(`${t.no}. [${t.type}] ${t.name}`);
    console.log(`   Login  : ${t.login} / admin123`);
    console.log(`   Modules: ${t.modules}`);
    console.log("────────────────────────────────────────────────────────────────────────");
  }
  console.log("\nPassword semua akun: admin123\n");
}

main()
  .catch((e) => { console.error("❌ Seed error:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
