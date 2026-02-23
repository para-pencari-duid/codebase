# Bakery POS — Single-Tenant Full-Feature Codebase

> **Tujuan Proyek:** Codebase referensi lengkap (single-tenant) yang mendokumentasikan seluruh fitur sistem POS modern untuk usaha F&B, Bakery, Retail, Laundry, Salon, dan Wholesale. Semua fitur aktif tanpa gating modul — dirancang untuk dipelajari dan diambil fungsinya ke project lain.

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 16.1.6 (App Router, Turbopack) |
| Language | TypeScript |
| UI | Tailwind CSS v4, shadcn/ui, Radix UI |
| Auth | NextAuth v5 (JWT strategy, Credentials provider) |
| ORM | Prisma v7.4.0 (adapter pg) |
| Database | PostgreSQL |
| State | React hooks (`useState`, `useEffect`) |
| Form | React Hook Form + Zod |
| Charts | Recharts |
| Export | ExcelJS |
| Upload | Native multipart (Next.js API) |
| WhatsApp | Custom Golang WhatsApp Gateway service |

---

## Cara Menjalankan

```bash
# 1. Install dependencies
npm install

# 2. Salin dan isi environment
cp .env.example .env
# Isi DATABASE_URL, AUTH_SECRET, AUTH_URL

# 3. Jalankan migrasi
npx prisma migrate dev

# 4. Seed data awal
node prisma/seed.js

# 5. Jalankan dev server
npm run dev
```

**Akun Default (setelah seed):**

| Email | Password | Role |
|---|---|---|
| admin@bakery.local | Admin2026! | OWNER |
| manager@bakery.local | Manager2026! | MANAGER |
| kasir@bakery.local | Kasir2026! | KASIR |

---

## Struktur Direktori

```
bakery-web/
├── app/
│   ├── (auth)/          → Login & Register
│   ├── (dashboard)/     → Semua halaman protected dashboard
│   ├── api/             → REST API endpoints (Next.js Route Handlers)
│   └── self-order/      → Halaman QR Self-Order publik
├── components/          → Komponen UI yang dapat digunakan ulang
├── lib/
│   ├── auth.ts          → Konfigurasi NextAuth
│   ├── db.ts            → Prisma client singleton
│   ├── whatsapp.ts      → WhatsApp gateway helper
│   ├── excel-reports.ts → Export Excel (ExcelJS)
│   └── utils.ts         → Utility functions
├── prisma/
│   ├── schema.prisma    → 65+ model database
│   └── seed.js          → Data awal single-tenant
└── types/               → TypeScript type augmentations
```

---

## Fitur Lengkap

### 1. Autentikasi & Manajemen Pengguna

#### Auth (`app/(auth)/`)
- **Login** (`/login`) — Email + password, JWT session, redirect ke dashboard
- **Register** (`/register`) — Daftar akun baru (role: OWNER/MANAGER/KASIR)
- **Session** — NextAuth v5 JWT; `session.user.id`, `name`, `role`

#### Users (`/users`, `/users/[userId]`)
- CRUD pengguna sistem
- Role: `OWNER`, `MANAGER`, `KASIR`
- Aktifkan/nonaktifkan akun
- Detail profil per user

**API:**
- `GET /api/users` — List semua user (paginated)
- `POST /api/users` — Buat user baru (hash bcrypt)
- `GET /api/users/[id]` — Detail user
- `PUT /api/users/[id]` — Update user
- `DELETE /api/users/[id]` — Hapus user

#### Permissions (`/permissions`)
- Manajemen hak akses berbasis role
- Model `RolePermission`: role + resource + action (CREATE/READ/UPDATE/DELETE)

**API:**
- `GET /api/permissions` — List semua permission
- `POST /api/permissions` — Buat/update permission

---

### 2. Kasir / POS (Point of Sale)

#### Halaman POS (`/pos`)
Antarmuka kasir full-featured dengan:
- **Pencarian produk** real-time dengan filter kategori
- **Keranjang belanja** — tambah, kurangi, hapus item
- **Modifier produk** — tambah topping/opsi tambahan per item (contoh: extra gula, ukuran)
- **Pilih pelanggan** — tautkan transaksi ke data pelanggan
- **Diskon** — terapkan diskon kode/persentase/nominal
- **Kalkulasi pajak** — otomatis (inklusif / eksklusif dari Settings)
- **Multi-payment** — tunai, QRIS, transfer, kartu; support split payment
- **Checkout & struk** — cetak struk, tampilkan QR QRIS
- **Loyalty points** — otomatis tambah/kurangi poin pelanggan

**Komponen:**
- `components/pos/pos-client.tsx` — Utama POS interface
- `components/pos/checkout-dialog.tsx` — Dialog pembayaran
- `components/pos/modifier-picker.tsx` — Selector modifier
- `components/pos/receipt-dialog.tsx` — Preview & cetak struk

#### Shift Kasir (`/shifts`)
- Buka / tutup shift
- Saldo kas awal & akhir
- Rekap total penjualan, jumlah transaksi, metode pembayaran per shift

**API Shift:**
- `GET /api/shifts` — List shift (filter by date/status)
- `POST /api/shifts` — Buka shift baru
- `GET /api/shifts/current` — Ambil shift aktif saat ini
- `PUT /api/shifts/[id]` — Tutup shift / update
- `DELETE /api/shifts/[id]` — Hapus shift

---

### 3. Produk & Katalog

#### Produk (`/products`, `/products/[productId]`)
- Produk dengan **multi-varian** (contoh: Roti Tawar — Kecil, Besar)
- Setiap varian memiliki: SKU, harga, harga pokok, stok, barcode, atribut
- Upload gambar produk
- Tipe produk: `GOODS`, `SERVICE`, `BUNDLE`, `RAW_MATERIAL`
- Lacak stok per varian
- Lacak nomor seri (`serialTrack`)

**API Produk:**
- `GET /api/products` — List produk (filter, search, paginate)
- `POST /api/products` — Buat produk + varian sekaligus
- `GET /api/products/[id]` — Detail produk + semua varian
- `PUT /api/products/[id]` — Update produk
- `DELETE /api/products/[id]` — Hapus produk

#### Kategori Produk (`/products/categories`, `/products/categories/[categoryId]`)
- CRUD kategori dengan nama, deskripsi, warna label

**API Kategori:**
- `GET /api/categories` — List kategori
- `POST /api/categories` — Buat kategori
- `GET /api/categories/[id]` — Detail
- `PUT /api/categories/[id]` — Update
- `DELETE /api/categories/[id]` — Hapus

#### Modifier & Opsi (`/modifiers`)
- Grup modifier (contoh: "Ukuran", "Topping")
- Opsi per grup (contoh: Small -0, Medium +3000, Large +5000)
- Tautkan ke produk atau berlaku global

**API Modifier:**
- `GET /api/modifiers` — List modifier groups + options
- `POST /api/modifiers` — Buat modifier group
- `PUT /api/modifiers/[id]` — Update
- `DELETE /api/modifiers/[id]` — Hapus

---

### 4. Inventory & Stok

#### Inventory (`/inventory`)
- Tampilan stok semua varian produk
- Filter by kategori, status stok (normal / low / out)
- Alert stok menipis (threshold dari Settings)
- Riwayat pergerakan stok

**API:**
- `GET /api/inventory` — List inventory dengan stok realtime

#### Batch / Lot Tracking (`/inventory/batches`)
- Tracking produk per batch / lot number
- Tanggal produksi & kadaluwarsa (expiry)
- Alert batch mendekati/melewati expiry date

**API Batch:**
- `GET /api/batches` — List batch
- `POST /api/batches` — Buat batch baru
- `GET /api/batches/[id]` — Detail batch
- `PUT /api/batches/[id]` — Update batch
- `DELETE /api/batches/[id]` — Hapus batch
- `GET /api/batches/alerts` — Batch yang akan kadaluwarsa

#### Stock Opname (`/inventory/stock-opname`)
- Buat sesi penghitungan stok fisik
- Input stok per SKU vs stok sistem
- Kalkulasi variance otomatis
- Approve → otomatis adjust stok + buat `StockMovement`

**API Stock Opname:**
- `GET /api/stock-opname` — List sesi opname
- `POST /api/stock-opname` — Buat sesi baru
- `GET /api/stock-opname/[id]` — Detail sesi
- `PUT /api/stock-opname/[id]` — Update / approve sesi

#### Serial Number (`/serial-numbers`)
- Tracking nomor seri per unit produk
- Status: tersedia, terjual, dikembalikan, rusak

**API:**
- `GET /api/serial-numbers` — List serial number
- `POST /api/serial-numbers` — Daftarkan serial number
- `GET /api/serial-numbers/[serialId]` — Detail
- `PUT /api/serial-numbers/[serialId]` — Update status

---

### 5. Transaksi & Retur

#### Transaksi (`/transactions`)
- List semua transaksi dengan filter (tanggal, status, tipe)
- Detail payment per transaksi (multi-payment)
- Tipe transaksi: `SALE`, `B2B_INVOICE`, `SELF_ORDER`
- Auto-generate nomor transaksi
- Sync poin loyalty otomatis

**API:**
- `GET /api/transactions` — List transaksi (filter & paginate)
- `POST /api/transactions` — Buat transaksi baru (dari POS)

#### Retur (`/returns`)
- Return sebagian atau seluruh item dari transaksi
- Alasan retur: kerusakan, ketidaksesuaian, dll
- Otomatis kembalikan stok
- Catat refund (tunai / store credit)

**API:**
- `GET /api/returns` — List retur
- `POST /api/returns` — Buat retur baru
- `GET /api/returns/[id]` — Detail retur
- `PUT /api/returns/[id]` — Update status retur
- `DELETE /api/returns/[id]` — Batal retur

---

### 6. Pelanggan & Loyalitas

#### Pelanggan (`/customers`, `/customers/[customerId]`)
- CRUD data pelanggan: nama, telepon, email, alamat, tanggal lahir
- Tipe: `RETAIL`, `WHOLESALE`, `VIP`
- Segmentasi pelanggan (custom tag)
- Riwayat transaksi pelanggan
- Credit limit untuk pelanggan B2B
- Tautkan ke price list khusus

**API:**
- `GET /api/customers` — List (search, filter, paginate)
- `POST /api/customers` — Buat pelanggan
- `GET /api/customers/[id]` — Detail + histori transaksi
- `PUT /api/customers/[id]` — Update
- `DELETE /api/customers/[id]` — Hapus

#### Loyalty Points
- Akumulasi poin otomatis dari transaksi
- Penukaran poin sebagai diskon
- Riwayat poin (earn / redeem / expire)

**API:**
- `GET /api/loyalty/[customerId]` — Saldo poin pelanggan
- `POST /api/loyalty` — Tambah / kurangi poin manual
- `GET /api/loyalty` — List semua riwayat poin

---

### 7. Diskon & Promosi

#### Diskon (`/discounts`)
- Tipe: persentase (`PERCENTAGE`) / nominal (`FIXED`)
- Scope: produk tertentu, kategori, atau semua produk
- Kode voucher atau otomatis
- Batas penggunaan (max usage count)
- Periode berlaku (start date — end date)
- Validasi real-time saat checkout

**API:**
- `GET /api/discounts` — List diskon
- `POST /api/discounts` — Buat diskon
- `GET /api/discounts/[id]` — Detail
- `PUT /api/discounts/[id]` — Update
- `DELETE /api/discounts/[id]` — Hapus
- `POST /api/discounts/validate` — Validasi kode diskon saat checkout

---

### 8. Pre-Order / Job Ticket (Pesanan Khusus)

#### Pre-Order (`/pre-orders`)
Untuk usaha yang menerima pesanan custom (kue ulang tahun, bordir, laundry, dll):
- Buat job ticket dengan detail pesanan, ukuran, catatan desain
- Tanggal pengambilan / pengiriman
- Status: `PENDING` → `IN_PRODUCTION` → `READY` → `COMPLETED` / `CANCELLED`
- Uang muka (DP) dan pelunasan
- Notifikasi WhatsApp otomatis saat status berubah ke READY / CANCEL

**API:**
- `GET /api/pre-orders` — List (filter status, search)
- `POST /api/pre-orders` — Buat job ticket baru
- `GET /api/pre-orders/[id]` — Detail
- `PUT /api/pre-orders/[id]` — Update status / pembayaran (trigger WA notif)
- `DELETE /api/pre-orders/[id]` — Hapus

---

### 9. Produksi & BOM (Bill of Materials)

#### Resep & BOM (`/production`)
- Buat resep (BOM) per produk: daftar bahan baku + kuantitas
- Multi-level BOM (bahan baku bisa berupa produk lain)

#### Bahan Baku (`Raw Materials`)
- Kelola bahan baku di katalog item (tipe `RAW_MATERIAL`)
- SKU, stok, minimum stok, supplier default

**API Raw Materials:**
- `GET /api/raw-materials` — List bahan baku
- `POST /api/raw-materials` — Tambah bahan baku
- `GET /api/raw-materials/[id]` — Detail
- `PUT /api/raw-materials/[id]` — Update
- `DELETE /api/raw-materials/[id]` — Hapus

#### Resep (`/production/recipes/new`, `/production/recipes/[id]`)
- Buat & edit resep produksi

**API Resep:**
- `GET /api/recipes` — List resep
- `POST /api/recipes` — Buat resep
- `GET /api/recipes/[id]` — Detail resep + BOM items
- `PUT /api/recipes/[id]` — Update
- `DELETE /api/recipes/[id]` — Hapus

#### Perintah Produksi (`/production/orders/new`, `/production/orders/[id]`)
- Buat production order berdasarkan resep
- Input kuantitas yang akan diproduksi
- Status: `PLANNED` → `IN_PROGRESS` → `COMPLETED`
- Saat complete → otomatis deduct stok bahan baku + tambah stok produk jadi

**API Produksi:**
- `GET /api/production` — List production orders
- `POST /api/production` — Buat production order
- `GET /api/production/[id]` — Detail
- `PUT /api/production/[id]` — Update status (trigger stock movement)
- `DELETE /api/production/[id]` — Hapus

---

### 10. Multi-Store & Transfer Stok

#### Manajemen Toko (`/stores`)
- CRUD data toko / cabang
- Tandai toko utama (`isMainStore`)
- Stok per toko (`StoreInventory`)

#### Transfer Stok (`/stores/transfers`)
- Buat transfer request antar toko
- Status: `PENDING` → `IN_TRANSIT` → `COMPLETED`
- Otomatis adjust stok kedua toko saat complete

**API Stores:**
- `GET /api/stores` — List toko
- `POST /api/stores` — Tambah toko

**API Transfer:**
- `GET /api/stores/transfers` — List transfer
- `POST /api/stores/transfers` — Buat transfer baru

---

### 11. Manajemen Meja & QR Self-Order (F&B)

#### Meja (`/tables`)
- CRUD meja (nomor, nama, kapasitas, lantai)
- Status: `AVAILABLE`, `OCCUPIED`, `RESERVED`, `MAINTENANCE`
- Generate QR token unik per meja

#### Table Order (`/kitchen`)
- Buka order baru per meja
- Tambah item ke order yang sedang berjalan
- Status order: `OPEN` → `PAID` / `CANCELLED`
- Integrasi ke Kitchen Display System (KDS)

**API Meja:**
- `GET /api/tables` — List meja
- `POST /api/tables` — Tambah meja
- `GET /api/tables/[tableId]` — Detail
- `PUT /api/tables/[tableId]` — Update status/info
- `DELETE /api/tables/[tableId]` — Hapus

**API Table Order:**
- `GET /api/table-orders` — List orders
- `POST /api/table-orders` — Buka order baru
- `GET /api/table-orders/[orderId]` — Detail
- `PUT /api/table-orders/[orderId]` — Update (tambah item, ubah status)

#### QR Self-Order (`/self-order/[token]`)
- Halaman **publik** (tidak perlu login) yang diakses tamu via QR code
- Menampilkan menu aktif lengkap dengan foto & harga
- Tamu pilih item, isi nama & jumlah tamu, kirim order
- Order masuk ke Kitchen Ticket secara otomatis

**API Self-Order:**
- `GET /api/self-order/[token]` — Ambil data meja + menu
- `POST /api/self-order/[token]` — Kirim order dari tamu

#### Kitchen Display System / KDS (`/kitchen`)
- List semua kitchen ticket yang pending
- Update status: `PENDING` → `PREPARING` → `READY` → `SERVED`
- Filter by source: `POS`, `SELF_ORDER`, `TABLE`

**API Kitchen:**
- `GET /api/kitchen` — List kitchen tickets
- `PUT /api/kitchen/[ticketId]` — Update status ticket

---

### 12. Supplier & Pembelian

#### Supplier (`/suppliers`)
- CRUD data supplier: nama, telepon, email, alamat, term pembayaran
- Riwayat pembelian dari supplier

**API:**
- `GET /api/suppliers` — List supplier
- `POST /api/suppliers` — Tambah supplier
- `GET /api/suppliers/[id]` — Detail
- `PUT /api/suppliers/[id]` — Update
- `DELETE /api/suppliers/[id]` — Hapus

---

### 13. Booking & Jadwal (Salon / Jasa)

#### Booking (`/bookings (placeholder)`)
- Buat booking layanan dengan: pelanggan, staff, layanan, tanggal/jam
- Status: `PENDING` → `CONFIRMED` → `COMPLETED` / `CANCELLED` / `NO_SHOW`
- Penugasan staff ke booking

**API:**
- `GET /api/bookings` — List booking
- `POST /api/bookings` — Buat booking
- `GET /api/bookings/[bookingId]` — Detail
- `PUT /api/bookings/[bookingId]` — Update status/staff

---

### 14. Tier Harga & Price List (Wholesale)

#### Price List (`/price-lists`)
- Buat daftar harga khusus per segmen pelanggan (Grosir, VIP, dll)
- Harga override per varian produk dalam list tersebut
- Tautkan price list ke pelanggan → otomatis berlaku saat transaksi

**API:**
- `GET /api/price-lists` — List price lists
- `POST /api/price-lists` — Buat price list
- `GET /api/price-lists/[listId]` — Detail + items
- `PUT /api/price-lists/[listId]` — Update

---

### 15. Konsinyasi

#### Konsinyasi (`/consignments`)
- Buat perjanjian konsinyasi dengan consignee (penerima produk)
- Item yang dititipkan + kuantitas + harga jual
- Status: `ACTIVE` → `SETTLED` / `CANCELLED`
- Rekonsiliasi penjualan vs sisa barang

**API:**
- `GET /api/consignments` — List konsinyasi
- `POST /api/consignments` — Buat konsinyasi
- `GET /api/consignments/[consignId]` — Detail
- `PUT /api/consignments/[consignId]` — Update / selesaikan

---

### 16. Akuntansi Double-Entry

#### Chart of Accounts (`/accounting`)
- CRUD akun (Aset, Liabilitas, Ekuitas, Pendapatan, Beban)
- Tipe akun: `ASSET`, `LIABILITY`, `EQUITY`, `REVENUE`, `EXPENSE`
- Nomor akun custom

**API:**
- `GET /api/accounts` — List akun
- `POST /api/accounts` — Buat akun

#### Journal Entry
- Setiap transaksi POS otomatis membuat journal entry double-entry
- Manual journal entry support

**API:**
- `GET /api/journal-entries` — List journal entries
- `POST /api/journal-entries` — Buat manual journal

#### Rekonsiliasi Bank (`/bank-recon`)
- CRUD rekening bank (`BankAccount`)
- Import / input mutasi rekening (`BankStatement`)
- Cocokkan transaksi sistem vs mutasi bank

**API:**
- `GET /api/bank-accounts` — List rekening
- `POST /api/bank-accounts` — Tambah rekening
- `GET /api/bank-statements` — List mutasi
- `POST /api/bank-statements` — Input mutasi

#### Tarif Pajak (`/tax-rates`)
- CRUD tarif pajak: nama, persentase
- Tautkan ke produk untuk pajak berbeda per SKU

**API:**
- `GET /api/tax-rates` — List tarif
- `POST /api/tax-rates` — Buat tarif

---

### 17. Pengeluaran (Expenses)

#### Pengeluaran (`/expenses`)
- Catat pengeluaran operasional harian
- Kategori pengeluaran, nominal, tanggal, catatan
- Lampirkan bukti (upload gambar/PDF)
- Ringkasan pengeluaran per periode

**API:**
- `GET /api/expenses` — List (filter tanggal, kategori)
- `POST /api/expenses` — Catat pengeluaran
- `GET /api/expenses/[id]` — Detail
- `PUT /api/expenses/[id]` — Update
- `DELETE /api/expenses/[id]` — Hapus
- `GET /api/expenses/summary` — Ringkasan total per kategori

---

### 18. Karyawan & Penggajian

#### Karyawan (`/employees`)
- CRUD data karyawan: nama, jabatan, departemen, gaji pokok, nomor rekening
- Aktif/nonaktif

**API:**
- `GET /api/employees` — List karyawan
- `POST /api/employees` — Tambah karyawan
- `GET /api/employees/[employeeId]` — Detail
- `PUT /api/employees/[employeeId]` — Update
- `DELETE /api/employees/[employeeId]` — Hapus

#### Absensi
- Catat check-in / check-out karyawan per hari
- Status: `PRESENT`, `ABSENT`, `LATE`, `HALF_DAY`, `HOLIDAY`, `LEAVE`
- Unique per karyawan per tanggal

**API:**
- `GET /api/attendance` — List absensi
- `POST /api/attendance` — Input absensi
- `PUT /api/attendance` — Update

#### Penggajian (`/payroll`)
- Buat periode penggajian (bulanan/mingguan)
- Hitung gaji per karyawan: gaji pokok + tunjangan − potongan
- Status periode: `DRAFT` → `APPROVED` → `PAID`

**API:**
- `GET /api/payroll` — List payroll periods
- `POST /api/payroll` — Buat periode gaji
- `GET /api/payroll/[periodId]` — Detail periode + entri per karyawan
- `PUT /api/payroll/[periodId]` — Update / approve / tandai paid

---

### 19. Marketing & Feedback

#### Kampanye Marketing (`/marketing`)
- Buat kampanye: nama, deskripsi, tipe (SMS/WhatsApp/Email), konten pesan
- Pilih target audience: semua pelanggan / segmen / list manual
- Status: `DRAFT` → `SCHEDULED` → `SENT`
- Lacak jumlah penerima

**API:**
- `GET /api/marketing/campaigns` — List kampanye
- `POST /api/marketing/campaigns` — Buat kampanye
- `GET /api/marketing/campaigns/[id]` — Detail + recipients
- `PUT /api/marketing/campaigns/[id]` — Update / send

#### Feedback & NPS (`/feedback`)
- Catat feedback & rating dari pelanggan
- Tautkan ke transaksi atau bebas
- Score NPS (Net Promoter Score)

**API:**
- `GET /api/feedback` — List feedback
- `POST /api/feedback` — Submit feedback

---

### 20. Analitik Lanjutan (`/analytics`)

- Tren penjualan per periode (hari/minggu/bulan)
- Performa per produk & kategori
- Analisis pelanggan baru vs returning
- Margin kotor per produk
- Customer lifetime value (CLV)

**API:**
- `GET /api/analytics` — Data analitik (query param: period, type)

---

### 21. Laporan (`/reports`)

- **Laporan Penjualan** — Total transaksi per periode, per kasir, per produk
- **Laporan HPP** — Harga pokok penjualan & margin
- **Laporan Pengeluaran** — Rekap pengeluaran per kategori
- **Laporan Stok** — Pergerakan stok, nilai stok akhir
- **Laporan Shift** — Rekap per shift kasir
- **Export Excel** — Semua laporan bisa di-export ke `.xlsx`

**API:**
- `GET /api/reports` — Data laporan (query: type, startDate, endDate)
- `GET /api/reports/export` — Export laporan ke Excel (stream response)

---

### 22. Dashboard (`/dashboard`)

Ringkasan bisnis satu halaman:
- **Stats cards** — Pendapatan hari ini, total transaksi, pelanggan baru, rata-rata order
- **Revenue Chart** — Grafik pendapatan 7/30 hari (Recharts)
- **Sales by Category** — Pie chart penjualan per kategori
- **Top Products** — 5 produk terlaris
- **Customer Insights** — Pelanggan baru vs returning
- **Expense Analytics** — Pengeluaran vs pendapatan

**API Dashboard:**
- `GET /api/dashboard/stats` — KPI utama
- `GET /api/dashboard/revenue` — Data grafik pendapatan
- `GET /api/dashboard/sales-by-category` — Breakdown per kategori
- `GET /api/dashboard/top-products` — Top 5 produk
- `GET /api/dashboard/customers` — Insight pelanggan

---

### 23. Notifikasi

#### Notifikasi In-App (`/notifications`)
- Alert stok menipis
- Notifikasi pre-order selesai
- Notifikasi sistem lainnya
- Tandai sudah dibaca / hapus

**API:**
- `GET /api/notifications` — List notifikasi (filter read/unread)
- `POST /api/notifications` — Buat notifikasi
- `PUT /api/notifications/[id]` — Tandai terbaca
- `DELETE /api/notifications/[id]` — Hapus

---

### 24. WhatsApp Integration

#### Setup WA (`/settings` → tab WhatsApp)
- QR scan untuk koneksi WhatsApp Business
- Status koneksi realtime (polling)
- Konfigurasi jenis notifikasi yang dikirim via WA

#### Notifikasi WA Otomatis
| Event | Trigger | Penerima |
|---|---|---|
| Struk transaksi | Setiap transaksi POS berhasil | Nomor HP pelanggan |
| Pre-order siap | Status job ticket → READY | Nomor HP pemesan |
| Pre-order batal | Status job ticket → CANCELLED | Nomor HP pemesan |
| Low stock alert | Stok < threshold | Nomor HP owner (dari Settings) |

**API WhatsApp:**
- `POST /api/whatsapp/init` — Inisialisasi session, kembalikan QR code
- `GET /api/whatsapp/status` — Cek status koneksi (mendukung polling dengan `?tenantId=...`)
- `POST /api/whatsapp/disconnect` — Putuskan koneksi
- `POST /api/whatsapp/reset` — Reset session
- `POST /api/whatsapp/send` — Kirim pesan manual ke nomor tujuan

**Helper lib/whatsapp.ts:**
- `initWhatsAppSession(sessionId)` — Init WA session ke gateway
- `checkWhatsAppStatus(sessionId)` — Polling status
- `disconnectWhatsApp(sessionId)` — Logout
- `sendWhatsAppMessage(sessionId, phone, message)` — Kirim pesan + rate limit
- `sendWhatsAppNotification(phone, label, message)` — Fire-and-forget
- `sendNotificationIfEnabled(phone, message, type)` — Kirim jika notif type aktif
- `getOrCreateTenantId()` — Generate/ambil WA session ID dari Settings

---

### 25. Marketplace Integration

#### Marketplace (`/marketplace`)
- Connect ke marketplace eksternal (Tokopedia, Shopee, dll) via API token
- Satu koneksi per platform (`platform @unique`)
- Sinkronisasi pesanan marketplace masuk ke `MarketplaceOrder`

**API:**
- `GET /api/marketplace` — List integrasi aktif
- `POST /api/marketplace` — Tambah / update integrasi (upsert by platform)
- `GET /api/marketplace/[id]` — Detail
- `PUT /api/marketplace/[id]` — Update token/status

---

### 26. Webhook

#### Webhook Endpoint (`/webhooks`)
- Daftarkan URL external untuk menerima event dari sistem
- Event: `transaction.created`, `preorder.updated`, `stock.low`, dll
- Log setiap pengiriman webhook + status response

**API:**
- `GET /api/webhooks` — List webhook endpoints
- `POST /api/webhooks` — Daftarkan endpoint baru
- `GET /api/webhooks/[id]` — Detail + logs
- `PUT /api/webhooks/[id]` — Update
- `DELETE /api/webhooks/[id]` — Hapus

---

### 27. Pengaturan Sistem (`/settings`)

Pengaturan singleton (satu record untuk seluruh sistem):

| Grup | Pengaturan |
|---|---|
| Bisnis | Nama, alamat, telepon, email, logo |
| Transaksi | Tax rate, pajak inklusif/eksklusif, mata uang |
| Struk | Header struk, footer struk |
| Stok | Low stock threshold |
| WhatsApp | Enable/disable, jenis notifikasi aktif |
| Backup | Jadwal backup otomatis |

**API:**
- `GET /api/settings` — Ambil settings
- `PUT /api/settings` — Update settings umum
- `PATCH /api/settings` — Update pengaturan WhatsApp

---

### 28. Backup Data

**API:**
- `GET /api/backup` — Download backup database dalam format JSON
- Digunakan oleh fitur backup otomatis dan manual di halaman Settings

---

### 29. Upload File

**API:**
- `POST /api/upload` — Upload gambar produk / bukti pengeluaran
- Disimpan di `public/uploads/`
- Kembalikan URL path untuk disimpan ke database

---

### 30. QRIS Payment

**API:**
- `POST /api/qris/generate` — Generate QR code QRIS untuk nominal tertentu
- Digunakan di checkout POS saat metode pembayaran = QRIS

---

## Database Schema (65+ Model)

```
Auth & User           → User, RolePermission
Produk                → ItemCategory, Item, ItemVariant, ItemModifierGroup, ItemModifierOption
Transaksi             → Transaction, TransactionPayment, TransactionItem, TransactionItemModifier
Stok                  → StockMovement, ItemBatch, StoreInventory, StoreTransfer, StoreTransferItem
Produksi              → BillOfMaterial, BomItem, ProductionOrder, ProductionOrderItem, ProductionMaterial
Pre-Order             → JobTicket, JobTicketItem
Serial                → SerialNumber
Pelanggan             → Customer, LoyaltyPoint, PointHistory
Supplier              → Supplier, Purchase, PurchaseItem
Diskon                → Discount
Meja & Self-Order     → Table, TableOrder, TableOrderItem, KitchenTicket, KitchenTicketItem
Multi-Store           → Store
Booking               → Booking
Price List            → PriceList, PriceListItem
Konsinyasi            → Consignment, ConsignmentItem
Akuntansi             → Account, JournalEntry, JournalLine, BankAccount, BankStatement, TaxRate
Pengeluaran           → Expense
Shift                 → Shift
Retur                 → Return, ReturnItem
Stock Opname          → StockOpname, StockOpnameItem
Karyawan & Payroll    → Employee, Attendance, PayrollPeriod, PayrollEntry
Marketing             → MarketingCampaign, CampaignRecipient, CustomerFeedback
Webhook               → WebhookEndpoint, WebhookLog
Marketplace           → MarketplaceIntegration, MarketplaceOrder
Notifikasi            → Notification
Pengaturan            → Settings (singleton)
```

---

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/bakery_pos?schema=public"

# Auth
AUTH_SECRET="your-secret-key-min-32-chars"
AUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST=true
NEXTAUTH_URL="http://localhost:3000"

# WhatsApp Gateway (Golang service)
WA_SERVICE_URL="http://localhost:4000"
WA_SECRET_KEY="your-wa-secret-key"
```

---

## Role & Akses

| Fitur | OWNER | MANAGER | KASIR |
|---|:---:|:---:|:---:|
| POS / Kasir | ✅ | ✅ | ✅ |
| Buka / Tutup Shift | ✅ | ✅ | ✅ |
| Lihat Laporan | ✅ | ✅ | ❌ |
| CRUD Produk | ✅ | ✅ | ❌ |
| CRUD Pelanggan | ✅ | ✅ | ✅ |
| Manajemen Stok | ✅ | ✅ | ❌ |
| Pengeluaran | ✅ | ✅ | ❌ |
| Karyawan & Gaji | ✅ | ❌ | ❌ |
| Pengaturan Sistem | ✅ | ❌ | ❌ |
| Manajemen Pengguna | ✅ | ❌ | ❌ |
| WhatsApp Setup | ✅ | ❌ | ❌ |
| Akuntansi | ✅ | ✅ | ❌ |

> Catatan: Tabel ini panduan umum. Kontrol akses granular dapat dikonfigurasi melalui `RolePermission` di menu Permissions.

---

## Catatan Arsitektur

- **Single-tenant** — tidak ada `tenantId` di database. Satu instance = satu bisnis.
- **Settings singleton** — satu record `Settings` untuk seluruh sistem, diakses via `findFirst()`.
- **WA session ID** — bukan tenant ID database. Dihasilkan oleh `getOrCreateTenantId()` dan disimpan di `settings.whatsappTenantId`.
- **Stock movement** — setiap perubahan stok (penjualan, produksi, opname, retur, transfer) membuat record `StockMovement` untuk audit trail.
- **Multi-payment** — satu transaksi bisa memiliki beberapa `TransactionPayment` (split payment tunai + QRIS, dll).
- **App Router** — semua page dan API menggunakan Next.js App Router (tidak ada `pages/` directory).
- **Auth guard** — `app/(dashboard)/layout.tsx` memvalidasi session sebelum render; redirect ke `/login` jika belum auth.
