# Lokkah — Multi-Tenant SaaS POS & Business Management Platform

**Lokkah** adalah platform manajemen bisnis berbasis SaaS (Software as a Service) yang dibangun untuk mendukung berbagai jenis usaha: kafe, bakery, laundry, salon, retail, wholesaler, dan franchise. Setiap tenant mendapatkan lingkungan yang terisolasi dengan modul yang dapat disesuaikan sesuai jenis bisnis.

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Bahasa** | TypeScript |
| **Database** | PostgreSQL |
| **ORM** | Prisma v7 (dengan adapter `@prisma/adapter-pg`) |
| **Auth** | NextAuth v5 (JWT Strategy, Credentials Provider) |
| **UI** | Tailwind CSS v4, shadcn/ui, Lucide Icons |
| **State / Cart** | Custom hook (`use-cart.ts`) |
| **Notifikasi** | WhatsApp via WA Service (self-hosted) |
| **Export** | Excel via `exceljs` |
| **Hashing** | `bcryptjs` |

---

## Cara Menjalankan

### Prasyarat

- Node.js 20+
- PostgreSQL 15+
- (Opsional) WA Service untuk notifikasi WhatsApp

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Konfigurasi environment
cp .env.example .env
# Edit .env: isi DATABASE_URL, AUTH_SECRET, AUTH_URL, PLATFORM_ADMIN_EMAIL

# 3. Jalankan migrasi database
npx prisma migrate deploy

# 4. Generate Prisma Client
npx prisma generate

# 5. Seed data awal (8 tenant contoh + subscription plans)
node prisma/seed.js

# 6. Jalankan dev server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

### Akun Bawaan (Hasil Seed)

| Tenant | Email | Password | Tipe |
|---|---|---|---|
| Kopi Kita Cafe | `owner@kopikita.com` | `admin123` | FnB |
| Roti Bahagia Bakery | `owner@rotibahagia.com` | `admin123` | Bakery |
| Bersih Kilat Laundry | `owner@bersihkilat.com` | `admin123` | Laundry |
| Toko Segar Mart | `owner@segarmart.com` | `admin123` | Retail |
| Cantik Salon & Spa | `owner@cantiksalon.com` | `admin123` | Salon |
| Sentral Grosir | `owner@sentralgrosir.com` | `admin123` | Wholesale |
| FreshBites Franchise | `owner@freshbites.com` | `admin123` | Franchise |
| Platform Admin (SaaS) | `admin@platform.local` | `SuperAdmin2026!` | Platform |

---

## Arsitektur Multi-Tenant

Setiap **Tenant** memiliki:
- Data yang sepenuhnya terisolasi berdasarkan `tenantId`
- Daftar modul aktif (`activeModules`) yang menentukan fitur yang bisa diakses
- Pengaturan sendiri (`Settings`) — pajak, mata uang, loyalitas, QRIS, dll.
- Tidak ada data yang bocor antar tenant

### Modul Aktif Per Jenis Bisnis

| Tipe Bisnis | Modul Aktif |
|---|---|
| FnB / Kafe | `POS`, `TABLE`, `BOM` |
| Bakery | `POS`, `BOM` |
| Laundry | `POS`, `JOB_TICKET` |
| Retail | `POS` |
| Salon | `POS`, `BOOKING` |
| Wholesale | `POS`, `B2B`, `TIER_PRICING` |
| Franchise | `POS`, `MULTI_STORE` |

---

## Role & Hak Akses

| Role | Deskripsi |
|---|---|
| `OWNER` | Akses penuh: semua menu, pengaturan, laporan, user management |
| `MANAGER` | Akses operasional: POS, inventaris, laporan, produksi, shift |
| `KASIR` | Akses terbatas: hanya POS + shift sendiri |

Selain itu, terdapat sistem **Granular Role Permission** (Tier 6) yang memungkinkan override hak akses per resource per user.

---

## Fitur Lengkap — Tier 1 s/d Tier 6

Sistem dibangun secara berlapis dalam 6 tier, di mana setiap tier menambahkan kompleksitas dan kapabilitas bisnis yang lebih tinggi.

---

## Tier 1 — Core Business Operations

Fondasi utama yang dimiliki oleh **semua** jenis tenant. Mencakup semua operasi bisnis harian.

### Point of Sale (POS)
- Kasir berbasis layar sentuh dan keyboard
- Pencarian produk real-time (nama, SKU, barcode scan)
- Keranjang belanja dengan multi-item, edit qty, hapus item
- **Item Modifier / Add-on**: tambahan seperti "Level Gula", "Extra Shot", "Pilihan Ukuran" — bisa wajib atau opsional, bisa pilih banyak
- Penerapan diskon otomatis (kode promo, persentase, nominal)
- **Split Payment**: satu transaksi bisa bayar dengan beberapa metode (Tunai + QRIS, dsb.)
- Metode pembayaran: Tunai, Transfer Bank, QRIS (statis/dinamis), Debit Card, Kredit Card, e-Wallet, Poin Loyalitas
- Kembalian otomatis untuk pembayaran tunai
- Struk digital (tampil di layar + bisa dicetak)
- Pembatalan / void transaksi
- Penukaran poin loyalitas saat checkout

### Katalog Produk (Universal Item Catalog)
- Satu model `Item` yang mencakup: **produk jual**, **jasa**, **bahan baku produksi**, dan **bundel/paket**
- Variant produk (ukuran, warna, rasa, dll.) — setiap item sederhana otomatis punya 1 variant "Default"
- Harga beli (`cost`) dan harga jual (`price`) per variant
- SKU dan barcode unik per tenant
- Kategori produk dengan warna dan ikon
- Upload gambar produk (multiple)
- Status aktif/nonaktif
- Lacak stok per variant (bukan per item induk)
- Pengaturan stok minimum untuk notifikasi low stock

### Inventaris & Manajemen Stok
- Kartu stok per variant: setiap mutasi (masuk/keluar/penyesuaian) tercatat
- **Batch / Lot Tracking**: lacak nomor batch, tanggal produksi, tanggal kadaluwarsa, dan biaya per batch
- **Stock Opname**: jadwalkan, catat stok fisik, bandingkan dengan sistem, proses selisih
- Transfer stok antar gudang / toko (untuk multi-store)
- Notifikasi otomatis saat stok di bawah ambang minimum

### Bill of Materials (BOM)
- Definisikan resep / formula untuk setiap produk jadi
- Setiap BOM berisi daftar bahan baku (`BomItem`) dengan kuantitas dan satuan
- Waktu persiapan (`prepTime`) dan waktu produksi (`cookTime`)
- `yield` — berapa unit yang dihasilkan per satu kali proses
- BOM dapat diassign ke item jenis `GOODS` maupun `BUNDLE`
- Menjadi dasar kalkulasi biaya produksi

### Production Order (Perintah Produksi)
- Buat jadwal produksi harian/mingguan
- Status produksi: `PLANNED` → `IN_PROGRESS` → `COMPLETED` / `CANCELLED`
- Setiap order memuat item yang diproduksi (`ProductionOrderItem`) beserta target qty, qty aktual, dan qty waste
- Material used (`ProductionMaterial`) dihitung berdasarkan BOM
- Kalkulasi total biaya produksi otomatis
- Riwayat produksi lengkap

### Job Ticket (Pesanan Kustom / Pre-Order)
- Cocok untuk: cuci sepatu, custom cake, servis elektronik, jahit, dll.
- Setiap tiket memiliki: nama & no. pelanggan, judul pekerjaan, deskripsi, gambar referensi, harga satuan, qty
- **Sistem DP (Down Payment)**: catat uang muka, metode pembayaran DP, tanggal bayar DP
- **Pelunasan**: sisa pembayaran dan metode pelunasan
- Tanggal jatuh tempo (`dueDate`) dan tipe pengambilan: `PICKUP` atau `DELIVERY`
- Status alur kerja: `PENDING` → `CONFIRMED` → `PROCESSING` → `READY` → `COMPLETED` / `CANCELLED`
- Integrasi dengan data pelanggan tersimpan
- Notifikasi WhatsApp ke pelanggan per perubahan status

### Shift Kasir
- Buka shift dengan saldo awal kas
- Seluruh transaksi tercatat dalam shift yang aktif
- Tutup shift: masukkan saldo akhir kas aktual, sistem hitung selisih (`variance`)
- Rekap per shift: total penjualan, total per metode pembayaran (tunai, QRIS, transfer, kartu), jumlah transaksi
- Filter laporan berdasarkan shift

### Manajemen Pengguna
- CRUD user (Owner, Manager, Kasir) dalam lingkup tenant sendiri
- Aktivasi / nonaktifkan akun
- Ganti password
- Setiap transaksi, pengeluaran, produksi tercatat siapa user yang membuatnya

### Pelanggan
- Database pelanggan: nama, telepon, email, alamat, tanggal lahir, catatan
- Tipe pelanggan: `RETAIL` atau `WHOLESALE`
- Segmentasi otomatis: `VIP`, `AT_RISK`, `NEW`, `REGULAR`
- Credit limit untuk pelanggan wholesale (piutang B2B)
- Riwayat transaksi per pelanggan
- **Program Loyalitas (Poin)**:
  - Konfigurasi: berapa rupiah untuk 1 poin, nilai tukar 1 poin ke rupiah
  - Akumulasi poin per transaksi
  - Redeem poin saat checkout
  - Riwayat poin: earn, redeem, expire, penyesuaian manual

### Supplier & Pembelian
- Database supplier: nama, telepon, email, alamat, kontak PIC
- Buat Purchase Order: pilih supplier, item yang dibeli, qty, harga beli
- Status pembayaran pembelian: `UNPAID`, `PARTIAL`, `PAID`
- Riwayat pembelian per supplier
- Stok otomatis bertambah saat pembelian diproses

### Transaksi B2B / Invoice Tempo
- Tipe transaksi `B2B_INVOICE` untuk pelanggan wholesale
- Jatuh tempo pembayaran (`dueDate`)
- Status piutang: `PAID`, `PARTIAL`, `UNPAID`
- Lacak dan tagih piutang pelanggan

### Diskon & Promosi
- Buat diskon dengan nama, kode promo (opsional), tipe (persen / nominal)
- Batasan: min. pembelian, maks. potongan, tanggal mulai-berakhir, batas penggunaan
- Counter pemakaian otomatis

### Pengeluaran
- Catat pengeluaran operasional harian
- Kategori: Gaji, Utilitas, Bahan Baku, Supplies, Sewa, Perawatan, Marketing, Transportasi, Pajak, Lain-lain
- Metode pembayaran, referensi, lampiran bukti
- Terintegrasi dengan laporan laba rugi

### Laporan
- **Dashboard**: ringkasan hari ini (omzet, transaksi, produk terlaris, grafik)
- **Laporan Penjualan**: per hari, minggu, bulan, per kasir, per kategori produk
- **Laporan Inventaris**: stok saat ini, fast-moving vs slow-moving
- **Laporan Keuangan**: ringkasan pemasukan vs pengeluaran
- **Laporan Produksi**: output vs target, waste
- Export ke Excel (`.xlsx`)

### Pengaturan Toko
- Informasi bisnis: nama, alamat, telepon, email, logo
- Konfigurasi pajak (PPN): rate, inclusive/exclusive
- Header dan footer struk cetak
- QRIS statis (embed konten text QR)
- Pengaturan notifikasi WhatsApp
- Ambang batas stok minimum global

### Notifikasi
- Sistem notifikasi in-app per tenant
- Tipe: `LOW_STOCK`, `OUT_OF_STOCK`, `NEW_ORDER`, `SYSTEM`
- Opsional push via WhatsApp: transaksi baru, stok menipis, laporan harian, backup

### Retur / Pengembalian Barang
- Proses retur dari transaksi yang sudah selesai
- Pilih item yang dikembalikan, qty, alasan
- Status approval: `PENDING` → `APPROVED` / `REJECTED` → `COMPLETED`
- Opsi: kembalikan ke stok atau tidak
- Metode refund (tunai, transfer, dll.)

### WhatsApp Integration
- Kirim notifikasi otomatis ke owner: transaksi, stok, laporan
- Kirim update status Job Ticket ke pelanggan
- Konfigurasi per tenant via halaman `Settings`

### Backup Data
- Trigger backup manual dari halaman pengaturan
- Riwayat backup tersimpan

---

## Tier 2 — F&B & Service Extensions

Fitur lanjutan khusus untuk bisnis **FnB (kafe, restoran)** dan **salon/jasa dengan reservasi**.

### Table Management (Manajemen Meja)
- Database meja: nomor, nama, kapasitas, lantai/area, status
- Status meja real-time: `AVAILABLE`, `OCCUPIED`, `RESERVED`, `CLEANING`
- QR Code unik per meja untuk self-order (pelanggan scan sendiri)
- Buka pesanan meja (`TableOrder`): catat nama tamu, jumlah tamu, kasir pembuka
- Tambah item ke pesanan meja yang sedang berjalan tanpa harus checkout dulu
- Status pesanan meja: `OPEN` → `BILL_REQUESTED` → `PAID` / `CANCELLED`
- Checkout: konversi TableOrder menjadi Transaction

### Kitchen Display System (KDS)
- Layar dapur digital sebagai pengganti kertas tiket
- Setiap pesanan meja / POS menghasilkan `KitchenTicket`
- Status tiket dapur: `PENDING` → `PREPARING` → `READY` → `SERVED`
- Priority ordering (pesanan mendesak)
- Per item dalam tiket memiliki status individual
- Sumber tiket: `TABLE` (dari meja), `POS` (dari kasir), `SELF_ORDER` (dari QR)
- Dapur bisa update status tanpa akses ke POS

### Booking / Appointment (Reservasi)
- Cocok untuk: salon, spa, klinik, jadwal servis
- Buat reservasi: pelanggan, jenis layanan, staf yang bertugas, toko, tanggal & jam
- Durasi service dan jam selesai otomatis (`endTime`)
- Status booking: `PENDING` → `CONFIRMED` → `IN_PROGRESS` → `COMPLETED` / `CANCELLED` / `NO_SHOW`
- Catat uang muka (`depositPaid`) dan total tagihan
- Reminder otomatis (WA)
- Link ke transaksi saat pembayaran selesai

---

## Tier 3 — Retail & Wholesale Advanced

Fitur untuk bisnis **retail modern** dan **grosir / distributor**.

### Tier Pricing / Price List
- Buat beberapa daftar harga berbeda (misalnya: Harga Retail, Harga Grosir, Harga Agen)
- Assign daftar harga ke pelanggan tertentu
- Per price list: atur harga override per variant, minimum qty
- POS otomatis mengambil harga dari price list pelanggan yang sedang bertransaksi

### Consignment / Titip Jual
- Catat barang titipan dari konsinyir (pemasok / mitra)
- Lacak qty titip, qty terjual, qty dikembalikan
- Harga konsinyasi vs harga jual
- Komisi konsinyir (persentase)
- Status: `ACTIVE` → `SETTLED` (sudah dibayar) / `RETURNED`

### Serial Number Tracking
- Aktifkan tracking serial number per item (misal: elektronik, peralatan)
- Setiap unit punya nomor seri unik
- Status seri: `IN_STOCK`, `SOLD`, `RETURNED`, `DEFECTIVE`, `RESERVED`
- Lacak: nomor referensi pembelian, ID transaksi penjualan, pelanggan, tanggal jual/retur

### Batch Tracking (Lot / Kedaluwarsa)
- Setiap pengiriman bahan / produk bisa dicatat sebagai batch terpisah
- Simpan: nomor batch, tanggal produksi, tanggal kadaluwarsa, biaya, supplier
- FEFO otomatis (First Expired First Out)
- Diskon otomatis untuk batch mendekati expired
- Inventory deduction yang akurat per batch

---

## Tier 4 — Accounting & Finance

Fitur keuangan terintegrasi untuk tenant yang membutuhkan **pembukuan formal**.

### Chart of Accounts (Bagan Akun)
- Struktur akun hierarki (akun induk → akun anak)
- Tipe akun: `ASSET`, `LIABILITY`, `EQUITY`, `INCOME`, `EXPENSE`
- Normal balance: DEBIT / CREDIT
- Saldo berjalan per akun (`currentBalance`)
- Akun sistem (dibuat otomatis) vs akun manual
- Flag akun aktif/nonaktif

### Jurnal & Double-Entry Bookkeeping
- Setiap transaksi, pengeluaran, dan penggajian menghasilkan `JournalEntry`
- Setiap entry terdiri dari beberapa `JournalLine` (debit/kredit)
- Referensi sumber (`sourceType`, `sourceId`) untuk traceability
- Status: draft → posted
- Nomor jurnal otomatis per tenant

### Rekonsiliasi Bank
- Input data rekening bank (nama bank, nomor rekening)
- Upload / input mutasi rekening (`BankStatement`)
- Cocokkan mutasi dengan transaksi sistem
- Status: reconciled / belum
- Hitung selisih kas secara akurat

### Manajemen Pajak
- Buat multiple rate pajak: PPN 12%, PPh 23, dll.
- Flag inclusive (harga sudah termasuk pajak) atau exclusive
- Set default rate
- Assign rate per item

### Payroll (Penggajian)
- Database karyawan: posisi, departemen, tanggal masuk, gaji pokok, rekening bank
- Absensi harian: `PRESENT`, `ABSENT`, `LATE`, `HALF_DAY`, `HOLIDAY`, `LEAVE`
- Buat periode penggajian (bulanan atau custom)
- Kalkulasi otomatis per karyawan: hari kerja, hari hadir, tunjangan, potongan, gaji bersih
- Status penggajian: `DRAFT` → `PROCESSED` → `PAID`
- Rekap slip gaji per karyawan

---

## Tier 5 — Marketing & Customer Engagement

Alat pemasaran langsung untuk meningkatkan retensi dan menarik pelanggan kembali.

### Marketing Campaign
- Buat kampanye blast pesan ke segmen pelanggan tertentu
- Channel: **WhatsApp**, Email, SMS
- Target segmen: semua pelanggan, VIP, pelanggan berisiko churn (`AT_RISK`), pelanggan baru, atau custom
- Jadwalkan pengiriman (`scheduledAt`) atau kirim langsung
- Status: `DRAFT` → `SCHEDULED` → `SENDING` → `SENT`
- Lacak per penerima: status pengiriman, waktu kirim, error jika gagal
- Counter: total penerima, berhasil, gagal

### Customer Feedback / NPS
- Kirim link / QR feedback ke pelanggan setelah transaksi
- Rating bintang 1–5 + komentar teks
- Channel pengiriman: WhatsApp, QR Code, Link langsung
- Lacak per transaksi dan per pelanggan
- Laporan agregat: rata-rata rating, distribusi bintang
- Opsional: tampilkan feedback secara publik (testimonial)

---

## Tier 6 — Platform & Integration

Kapabilitas level platform untuk integrasi eksternal, otomatisasi, dan manajemen SaaS.

### Webhooks
- Daftarkan endpoint URL eksternal untuk menerima event real-time
- Pilih event yang ingin di-subscribe: `transaction.created`, `order.paid`, dll.
- Secret key per endpoint untuk verifikasi signature
- Log setiap pengiriman webhook: payload, status HTTP, response body
- Retry otomatis jika pengiriman gagal (`nextRetryAt`)
- Riwayat log per endpoint

### Marketplace Integration
- Integrasi ke marketplace Indonesia: **Tokopedia**, **Shopee**, **GoFood**, **GrabFood**, **Traveloka**
- Simpan API Key, API Secret, Access Token per platform per tenant
- Sinkronisasi pesanan masuk dari marketplace ke sistem lokal (`MarketplaceOrder`)
- Status sinkronisasi dan waktu sync terakhir
- Konversi marketplace order ke Transaction internal

### Granular Role Permissions
- Override hak akses default per role atau per user spesifik
- Resource yang bisa dikontrol: `pos`, `reports`, `users`, `settings`, `inventory`, dll.
- Aksi yang bisa di-grant/deny: `read`, `write`, `delete`
- Rule di level role berlaku untuk semua user dengan role tersebut
- Rule di level user mengoverride rule role

### SaaS Subscription & Billing
- **3 paket langganan**:

  | Paket | Harga Bulanan | Harga Tahunan | Max User | Max Toko | Max Produk |
  |---|---|---|---|---|---|
  | **Basic** | Rp 99.000 | Rp 990.000 | 3 | 1 | 200 |
  | **Pro** | Rp 299.000 | Rp 2.990.000 | 10 | 3 | 2.000 |
  | **Enterprise** | Rp 799.000 | Rp 7.990.000 | ∞ | ∞ | ∞ |

- Status berlangganan: `TRIAL`, `ACTIVE`, `PAST_DUE`, `CANCELLED`, `EXPIRED`
- Siklus tagihan: bulanan atau tahunan (hemat 2 bulan jika tahunan)
- Invoice otomatis per siklus
- Halaman **Billing & Langganan** (`/billing`) untuk tenant: lihat paket, ganti paket, riwayat invoice
- Panel **Admin SaaS** (`/admin`) untuk platform owner: monitor semua tenant, MRR, toggle aktif/nonaktif tenant

---

## Ringkasan Tier

| Tier | Nama | Modul Kunci | Target Pengguna |
|---|---|---|---|
| **Tier 1** | Core Operations | POS, BOM, Produksi, Job Ticket, Shift, Inventaris, Pelanggan, Supplier, Diskon, Laporan | Semua bisnis |
| **Tier 2** | F&B & Service | Meja, KDS, Booking | Kafe, Restoran, Salon |
| **Tier 3** | Retail & Wholesale | Tier Pricing, Konsinyasi, Serial Number, Batch | Retail, Grosir, Distributor |
| **Tier 4** | Accounting | Bagan Akun, Jurnal, Rekonsiliasi Bank, Pajak, Penggajian | Semua (lanjutan) |
| **Tier 5** | Marketing | Kampanye Blast, Feedback / NPS | Semua (lanjutan) |
| **Tier 6** | Platform | Webhook, Marketplace, Permission, SaaS Billing | Enterprise / Developer |

---

## Struktur Folder

```
app/
  (auth)/           → Halaman login & register
  (dashboard)/      → Semua halaman operasional (dilindungi auth)
    pos/            → Point of Sale
    products/       → Katalog item & kategori
    inventory/      → Stok, batch, opname
    production/     → BOM & Production Order
    pre-orders/     → Job Ticket
    customers/      → Manajemen pelanggan & loyalitas
    suppliers/      → Supplier & pembelian
    transactions/   → Riwayat transaksi
    returns/        → Proses retur
    discounts/      → Diskon & promo
    expenses/       → Pengeluaran
    shifts/         → Shift kasir
    reports/        → Laporan & export
    notifications/  → Notifikasi in-app
    users/          → Manajemen user tenant
    stores/         → Manajemen toko (multi-store)
    settings/       → Pengaturan toko, WA, backup
    billing/        → Langganan & invoice tenant
    admin/          → Panel SaaS admin (platform owner only)
  api/              → REST API routes (Next.js Route Handlers)
components/         → Komponen React reusable
lib/                → Auth, DB, utils, whatsapp helper
prisma/
  schema.prisma     → Schema database lengkap
  seed.js           → Data awal (8 tenant + subscription plans)
  migrations/       → Riwayat migrasi database
```

---

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/your_db?schema=public"

# Auth (NextAuth v5)
AUTH_SECRET="ganti-dengan-string-random-panjang"
AUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST=true
NEXTAUTH_URL="http://localhost:3000"   # backward compat

# Platform SaaS Admin
PLATFORM_ADMIN_EMAIL="admin@platform.local"

# WhatsApp Service (opsional)
WA_SERVICE_URL="http://localhost:4000"
WA_SECRET_KEY="your-wa-secret-key"
```
