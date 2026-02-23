const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcryptjs");

require("dotenv").config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱  Starting seed...\n");

  // ── 1. Settings (singleton) ─────────────────────────────────────────────
  const existingSettings = await prisma.settings.findFirst();
  let settings;
  if (existingSettings) {
    console.log("⚙️   Settings already exists, skipping.");
    settings = existingSettings;
  } else {
    settings = await prisma.settings.create({
      data: {
        businessName: "Bakery Roti Manis",
        businessAddress: "Jl. Raya No. 1, Jakarta",
        businessPhone: "0812-3456-7890",
        businessEmail: "hello@bakery.local",
        taxRate: 11,
        taxIncluded: false,
        currency: "IDR",
        receiptHeader: "Bakery Roti Manis\nTerima kasih telah berbelanja!",
        receiptFooter: "Simpan struk ini sebagai bukti transaksi.",
        lowStockThreshold: 10,
      },
    });
    console.log("⚙️   Settings created.");
  }

  // ── 2. Store (main) ──────────────────────────────────────────────────────
  const existingStore = await prisma.store.findFirst({ where: { code: "MAIN" } });
  let store;
  if (existingStore) {
    console.log("🏪  Main store already exists, skipping.");
    store = existingStore;
  } else {
    store = await prisma.store.create({
      data: {
        code: "MAIN",
        name: "Bakery Roti Manis - Toko Utama",
        address: settings.businessAddress,
        phone: settings.businessPhone,
        isActive: true,
        isMainStore: true,
      },
    });
    console.log("🏪  Main store created.");
  }

  // ── 3. Users ─────────────────────────────────────────────────────────────
  const usersData = [
    { name: "Admin Owner",  email: "admin@bakery.local",   password: "Admin2026!",   role: "OWNER" },
    { name: "Manajer Toko", email: "manager@bakery.local", password: "Manager2026!", role: "MANAGER" },
    { name: "Kasir Satu",   email: "kasir@bakery.local",   password: "Kasir2026!",   role: "KASIR" },
  ];

  for (const u of usersData) {
    const exists = await prisma.user.findUnique({ where: { email: u.email } });
    if (exists) {
      console.log(`👤  User ${u.email} already exists, skipping.`);
      continue;
    }
    const hashedPassword = await bcrypt.hash(u.password, 10);
    await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        password: hashedPassword,
        role: u.role,
        isActive: true,
      },
    });
    console.log(`👤  User created: ${u.email} (${u.role})`);
  }

  // ── 4. Item Categories ───────────────────────────────────────────────────
  const categoriesData = [
    { name: "Roti",     description: "Aneka roti tawar dan roti manis",  color: "#F59E0B" },
    { name: "Kue Tart", description: "Kue ultah, wedding cake, dll",     color: "#EC4899" },
    { name: "Pastry",   description: "Croissant, danish, puff pastry",   color: "#8B5CF6" },
    { name: "Minuman",  description: "Kopi, teh, jus segar",             color: "#10B981" },
    { name: "Snack",    description: "Kue kering, cookies, biscuit",     color: "#EF4444" },
  ];

  const categoryMap = {};
  for (const c of categoriesData) {
    let cat = await prisma.itemCategory.findFirst({ where: { name: c.name } });
    if (!cat) {
      cat = await prisma.itemCategory.create({
        data: { name: c.name, description: c.description, color: c.color, isActive: true },
      });
      console.log(`📂  Category created: ${c.name}`);
    }
    categoryMap[c.name] = cat.id;
  }

  // ── 5. Items & Variants ──────────────────────────────────────────────────
  const itemsData = [
    {
      category: "Roti", name: "Roti Tawar", sku: "RTW-001", description: "Roti tawar soft & lembut", type: "GOODS",
      variants: [
        { name: "Roti Tawar Kecil (250g)", sku: "RTW-001-S", price: 12000, cost: 6000,  stock: 50 },
        { name: "Roti Tawar Besar (500g)", sku: "RTW-001-L", price: 22000, cost: 11000, stock: 30 },
      ],
    },
    {
      category: "Roti", name: "Roti Coklat", sku: "RCK-001", description: "Roti manis isi coklat", type: "GOODS",
      variants: [
        { name: "Roti Coklat per Pcs", sku: "RCK-001", price: 6000, cost: 2500, stock: 80 },
      ],
    },
    {
      category: "Kue Tart", name: "Kue Ulang Tahun", sku: "KUT-001", description: "Kue ulang tahun custom, full frosting", type: "GOODS",
      variants: [
        { name: 'Kue Tart 18cm (6")',  sku: "KUT-001-S", price: 185000, cost: 90000,  stock: 5 },
        { name: 'Kue Tart 22cm (8")',  sku: "KUT-001-M", price: 245000, cost: 120000, stock: 5 },
        { name: 'Kue Tart 26cm (10")', sku: "KUT-001-L", price: 325000, cost: 160000, stock: 3 },
      ],
    },
    {
      category: "Pastry", name: "Croissant", sku: "CRS-001", description: "Croissant butter original", type: "GOODS",
      variants: [
        { name: "Croissant Original", sku: "CRS-001-O", price: 18000, cost: 8000, stock: 40 },
        { name: "Croissant Coklat",   sku: "CRS-001-C", price: 20000, cost: 9000, stock: 35 },
        { name: "Croissant Keju",     sku: "CRS-001-K", price: 20000, cost: 9000, stock: 30 },
      ],
    },
    {
      category: "Minuman", name: "Kopi", sku: "KOP-001", description: "Kopi panas & dingin", type: "GOODS",
      variants: [
        { name: "Americano Panas",  sku: "KOP-001-AP", price: 15000, cost: 5000, stock: 999 },
        { name: "Americano Dingin", sku: "KOP-001-AD", price: 18000, cost: 6000, stock: 999 },
        { name: "Latte Panas",      sku: "KOP-001-LP", price: 20000, cost: 7000, stock: 999 },
        { name: "Latte Dingin",     sku: "KOP-001-LD", price: 23000, cost: 8000, stock: 999 },
      ],
    },
    {
      category: "Snack", name: "Nastar", sku: "NST-001", description: "Kue nastar nanas, khas lebaran", type: "GOODS",
      variants: [
        { name: "Nastar per Toples (300g)", sku: "NST-001-T", price: 75000, cost: 35000, stock: 20  },
        { name: "Nastar per Pcs",           sku: "NST-001-P", price: 3000,  cost: 1200,  stock: 200 },
      ],
    },
  ];

  for (const item of itemsData) {
    const catId = categoryMap[item.category];
    let existingItem = await prisma.item.findFirst({ where: { name: item.name } });
    if (!existingItem) {
      existingItem = await prisma.item.create({
        data: { sku: item.sku, name: item.name, description: item.description, type: item.type, categoryId: catId, isActive: true, basePrice: item.variants[0].price, baseCost: item.variants[0].cost, unit: "pcs" },
      });
      console.log(`🛒  Item created: ${item.name}`);
    }
    for (const v of item.variants) {
      const existingVariant = await prisma.itemVariant.findUnique({ where: { sku: v.sku } });
      if (!existingVariant) {
        await prisma.itemVariant.create({
          data: { itemId: existingItem.id, name: v.name, sku: v.sku, price: v.price, cost: v.cost, stock: v.stock, isActive: true },
        });
        console.log(`   ↳ Variant: ${v.name}`);
      }
    }
  }

  // ── 6. Sample Customers ──────────────────────────────────────────────────
  const customersData = [
    { name: "Budi Santoso", phone: "08123456789", email: "budi@mail.com" },
    { name: "Siti Rahayu",  phone: "08234567890", email: "siti@mail.com" },
    { name: "Eko Prasetyo", phone: "08345678901", email: null            },
  ];

  for (const c of customersData) {
    const exists = await prisma.customer.findFirst({ where: { phone: c.phone } });
    if (!exists) {
      await prisma.customer.create({
        data: { name: c.name, phone: c.phone, email: c.email, isActive: true },
      });
      console.log(`👥  Customer created: ${c.name}`);
    }
  }

  // ── 7. Supplier ──────────────────────────────────────────────────────────
  const existingSupplier = await prisma.supplier.findFirst({ where: { name: "PT Terigu Nusantara" } });
  if (!existingSupplier) {
    await prisma.supplier.create({
      data: {
        name: "PT Terigu Nusantara",
        phone: "021-12345678",
        email: "order@terigunusantara.com",
        address: "Jl. Industri No. 5, Tangerang",
        isActive: true,
      },
    });
    console.log("🚚  Supplier created.");
  }

  console.log("\n✅  Seed completed!\n");
  console.log("📋  Login credentials:");
  console.log("    admin@bakery.local   / Admin2026!   (OWNER)");
  console.log("    manager@bakery.local / Manager2026! (MANAGER)");
  console.log("    kasir@bakery.local   / Kasir2026!   (KASIR)");
}

main()
  .catch((e) => { console.error("❌  Seed failed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
