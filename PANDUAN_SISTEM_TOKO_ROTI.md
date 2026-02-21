# 📚 PANDUAN LENGKAP SISTEM TOKO ROTI

## 🎯 Apa itu Sistem Ini?

Sistem ini adalah **aplikasi lengkap untuk mengelola toko roti/bakery** dari A sampai Z. Bayangkan seperti asisten pintar yang membantu Anda menjalankan toko roti - mulai dari jualan di kasir, kelola stok barang, produksi roti, sampai lihat laporan untung-rugi.

---

## 🏪 ALUR BISNIS UTAMA

### Gambaran Besar (Big Picture)

```
┌─────────────────────────────────────────────────────────────┐
│  FLOW BISNIS TOKO ROTI                                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. BELI BAHAN BAKU (Tepung, Telur, Gula, dll)              │
│     ↓                                                         │
│  2. PRODUKSI ROTI (Bikin roti dari bahan baku)              │
│     ↓                                                         │
│  3. STOK MASUK KE TOKO (Roti siap dijual)                   │
│     ↓                                                         │
│  4. JUAL DI KASIR (POS - Point of Sale)                     │
│     ↓                                                         │
│  5. TERIMA UANG (Cash/Transfer/QRIS/Kartu)                  │
│     ↓                                                         │
│  6. TUTUP SHIFT (Hitung uang kasir)                         │
│     ↓                                                         │
│  7. LIHAT LAPORAN (Berapa untung/rugi)                      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎪 FITUR-FITUR LENGKAP

### 1. 🛒 **KASIR / POS (Point of Sale)**

**Untuk apa?**
Tempat kasir melayani pembeli - scan barang, hitung total, terima pembayaran.

**Cara kerja:**
1. **Buka Shift**: Kasir mulai kerja, input uang modal awal (misal Rp 500.000)
2. **Pilih Produk**: Klik produk yang dibeli pelanggan (misal: Roti Cokelat 3 pcs)
3. **Scan Diskon**: Kalau ada kode diskon, masukkan (misal: WEEKEND15)
4. **Pilih Customer**: Kalau pelanggan member, pilih namanya (untuk poin loyalitas)
5. **Terima Pembayaran**: Pilih metode bayar (Cash/Transfer/QRIS/Kartu)
6. **Print Struk**: Cetak atau kirim struk digital
7. **Tutup Shift**: Selesai kerja, hitung uang di kasir vs transaksi

**Contoh Real:**
- Ibu Siti beli 5 Roti Cokelat (@Rp 8.000) = Rp 40.000
- Pakai diskon WEEKEND15 = potongan Rp 6.000
- Total bayar = Rp 34.000
- Bayar pakai QRIS = scan → selesai
- Struk otomatis keluar

**Fitur Khusus:**
- **Pajak otomatis**: PPN 11% dihitung otomatis (kalau diaktifkan di Settings)
- **Stok otomatis berkurang**: Begitu kasir tekan "Bayar", stok langsung update
- **Kirim ke WhatsApp**: Struk bisa langsung dikirim ke HP pelanggan

---

### 2. 📦 **KELOLA PRODUK**

**Untuk apa?**
Daftar semua roti/kue yang dijual di toko.

**Cara kerja:**
1. **Tambah Produk Baru**: Input nama, harga jual, harga modal, stok
   - Contoh: Roti Cokelat, Harga Jual Rp 8.000, Modal Rp 4.500, Stok 100 pcs
2. **Kategori**: Kelompokkan produk (Roti Manis, Roti Tawar, Kue, Donat, dll)
3. **Upload Foto**: Biar kasir gampang kenali produknya
4. **Set Minimum Stok**: Alarm otomatis kalau stok tinggal sedikit
5. **Aktif/Non-aktif**: Produk musiman bisa di-hide tanpa hapus data

**Contoh Real:**
```
Nama Produk: Roti Cokelat Keju
Kategori: Roti Manis
Harga Jual: Rp 10.000
Harga Modal: Rp 5.200
Stok Saat Ini: 45 pcs
Minimum Stok: 20 pcs (alarm muncul kalau < 20)
Status: Aktif
```

**Fitur Khusus:**
- **Barcode/SKU**: Bisa scan barcode untuk cepat
- **Multiple images**: Upload banyak foto dari berbagai angle
- **Batch tracking**: Lacak tanggal expired per batch produksi

---

### 3. 🏷️ **KATEGORI PRODUK**

**Untuk apa?**
Mengelompokkan produk biar rapi dan gampang dicari.

**Contoh Kategori:**
- 🍞 Roti Manis (Roti Cokelat, Roti Keju, Roti Kelapa)
- 🍞 Roti Tawar (Roti Tawar Gandum, Roti Tawar Putih)
- 🎂 Kue (Bolu, Lapis Legit, Black Forest)
- 🥐 Pastry (Croissant, Danish, Puff Pastry)
- 🍩 Donat (Donat Gula, Donat Cokelat)
- ☕ Minuman (Kopi, Teh, Jus)

**Manfaat:**
- Kasir lebih cepat cari produk di POS
- Laporan penjualan bisa per kategori
- Customer gampang browse di display

---

### 4. 👥 **KELOLA PELANGGAN**

**Untuk apa?**
Simpan data pelanggan tetap untuk program loyalitas dan promo.

**Data yang Disimpan:**
- Nama lengkap
- Nomor HP (untuk kirim struk/promo via WhatsApp)
- Email (optional)
- Alamat (untuk delivery)
- Tanggal lahir (untuk birthday promo)
- Riwayat belanja

**Manfaat:**
- **Repeat Customer**: Tahu siapa yang sering beli
- **Member Card**: Bisa kasih kartu member dengan nomor unik
- **Promo Personal**: Kirim diskon ultah via WhatsApp
- **Analisis**: Tau siapa customer terbaik (top spender)

**Contoh Real:**
```
Nama: Ibu Ratna
HP: 081234567890
Total Belanja Bulan Ini: Rp 850.000 (15 transaksi)
Status: VIP Customer (belanja > Rp 500k/bulan)
Promo Otomatis: Diskon 10% next purchase
```

---

### 5. 🚚 **KELOLA SUPPLIER (Pemasok)**

**Untuk apa?**
Data supplier bahan baku (tepung, telur, gula, mentega, dll).

**Data yang Disimpan:**
- Nama supplier
- Kontak person
- Nomor HP/Email
- Alamat
- Produk yang disupply
- Riwayat pembelian
- Hutang (kalau tempo)

**Contoh Real:**
```
Nama Supplier: PT Tepung Sejahtera
Kontak: Pak Budi (0812-3456-7890)
Supply: Tepung Terigu, Tepung Gandum
Alamat: Jl. Raya Bekasi No. 123
Total Pembelian Bulan Ini: Rp 15.000.000
Status Pembayaran: Lunas
```

**Manfaat:**
- Tahu harus order ke siapa kalau stok habis
- Tracking harga bahan baku (naik/turun)
- Kelola hutang-piutang dengan supplier

---

### 6. 🥄 **BAHAN BAKU (Raw Materials)**

**Untuk apa?**
Kelola stok bahan mentah untuk produksi roti.

**Contoh Bahan Baku:**
- Tepung Terigu (25 kg)
- Telur (50 butir)
- Gula Pasir (10 kg)
- Mentega (5 kg)
- Cokelat Bubuk (2 kg)
- Ragi (500 gram)
- Garam (1 kg)

**Fitur Tracking:**
- **Stok Real-time**: Lihat sisa bahan baku
- **Expired Date**: Alarm kalau bahan mau expired
- **Batch Number**: Lacak dari supplier mana
- **Manufacture Date**: Kapan diproduksi
- **Minimum Stock**: Alarm kalau mau habis
- **Auto-deduct**: Stok otomatis berkurang saat produksi

**Contoh Real:**
```
Bahan: Tepung Terigu Segitiga Biru
Stok: 75 kg
Batch: TG-2024-001
Expired: 31 Desember 2026
Supplier: PT Tepung Sejahtera
Harga: Rp 12.000/kg
Minimum: 25 kg (perlu order lagi!)
```

---

### 7. 📖 **RESEP PRODUKSI**

**Untuk apa?**
Catat resep setiap produk - butuh bahan apa aja dan berapa banyak.

**Contoh Resep Roti Cokelat (20 pcs):**
```
Produk: Roti Cokelat (1 batch = 20 pcs)

Bahan yang Dibutuhkan:
- Tepung Terigu: 2 kg
- Telur: 10 butir
- Gula Pasir: 500 gram
- Mentega: 300 gram
- Cokelat Bubuk: 200 gram
- Ragi: 20 gram
- Garam: 10 gram

Instruksi Produksi:
1. Campur tepung + gula + ragi
2. Tambahkan telur dan mentega
3. Uleni sampai kalis
4. Diamkan 1 jam
5. Bentuk dan isi cokelat
6. Panggang 180°C selama 20 menit
```

**Manfaat:**
- **Konsistensi Rasa**: Semua produksi pakai takaran sama
- **Hitung Biaya**: Sistem otomatis hitung modal per produk
- **Monitoring Bahan**: Tahu butuh order bahan apa
- **Training**: Karyawan baru tinggal ikut resep

---

### 8. 🏭 **PRODUKSI**

**Untuk apa?**
Catat proses pembuatan roti dari bahan baku jadi produk jadi.

**Cara Kerja:**
1. **Buat Order Produksi**: Pilih mau produksi roti apa, berapa banyak
2. **Sistem Cek Bahan**: Otomatis cek apakah bahan baku cukup
3. **Proses Produksi**: Tandai sedang proses (PROCESSING)
4. **Selesai Produksi**: Produk masuk stok, bahan baku otomatis berkurang
5. **History**: Semua produksi tercatat untuk audit

**Contoh Real:**
```
Order Produksi #001
Tanggal: 18 Feb 2026, 05:00 AM
Status: COMPLETED

Item Diproduksi:
- Roti Cokelat: 100 pcs (5 batch @ 20 pcs)
- Roti Keju: 60 pcs (3 batch @ 20 pcs)

Bahan Terpakai:
- Tepung: 16 kg (dari stok 75 kg → sisa 59 kg)
- Telur: 80 butir (dari 150 → sisa 70)
- Gula: 4 kg (dari 10 kg → sisa 6 kg)
- dst...

Biaya Produksi: Rp 720.000
Output Value: Rp 1.280.000 (harga jual)
Estimasi Profit: Rp 560.000
```

**Manfaat:**
- **Tracking Real-time**: Tahu lagi produksi apa
- **Cost Analysis**: Hitung biaya produksi vs harga jual
- **Quality Control**: Catat catatan khusus per batch
- **Efisiensi**: Data mana produk paling menguntungkan

---

### 9. 🔄 **STOK OPNAME (Stock Taking)**

**Untuk apa?**
Hitung fisik barang di toko vs data di sistem - cocok atau ada selisih?

**Kapan Dilakukan:**
- Akhir bulan
- Sebelum audit
- Kalau curiga ada kehilangan

**Cara Kerja:**
1. **Jadwalkan Opname**: Set tanggal dan PIC (penanggung jawab)
2. **Mulai Hitung**: Staff hitung fisik semua produk di toko
3. **Input Hasil**: Masukkan hasil hitungan fisik
4. **Sistem Bandingkan**: Otomatis bandingkan fisik vs sistem
5. **Lihat Selisih**: 
   - Lebih = ada produk tidak tercatat (surplus)
   - Kurang = mungkin hilang/rusak/salah input (shortage)
6. **Catat Alasan**: Input kenapa bisa selisih
7. **Selesaikan**: Sistem otomatis adjust stok sesuai fisik

**Contoh Real:**
```
Stok Opname #SO-2026-002
Tanggal: 1 Maret 2026
PIC: Ibu Dewi (Manager)

Hasil:
┌──────────────────┬─────────┬──────────┬──────────┬─────────┐
│ Produk           │ Sistem  │ Fisik    │ Selisih  │ Alasan  │
├──────────────────┼─────────┼──────────┼──────────┼─────────┤
│ Roti Cokelat     │ 45 pcs  │ 43 pcs   │ -2 pcs   │ Rusak   │
│ Roti Keju        │ 30 pcs  │ 30 pcs   │ 0        │ -       │
│ Donat Gula       │ 20 pcs  │ 22 pcs   │ +2 pcs   │ Lupa    │
│                  │         │          │          │ input   │
└──────────────────┴─────────┴──────────┴──────────┴─────────┘

Setelah Selesai:
- Sistem update stok Roti Cokelat jadi 43 pcs
- Sistem update stok Donat Gula jadi 22 pcs
- Semua tercatat di history untuk audit
```

**Manfaat:**
- **Akurasi Data**: Stok di sistem sama dengan fisik
- **Detect Pencurian**: Bisa ketahuan kalau ada yang hilang
- **Audit Ready**: Data lengkap untuk pemeriksaan
- **Responsibility**: Tahu siapa yang bertanggung jawab

---

### 10. 🏪 **MULTI TOKO (Multi Store)**

**Untuk apa?**
Kalau punya banyak cabang toko, bisa kelola semua dari satu sistem.

**Fitur:**

#### 10.1 Management Toko
- Daftar semua cabang
- Set toko utama (main store)
- Manager per toko
- Kode toko unik

**Contoh:**
```
Toko 1: Bakery Sentral (Main Store)
- Kode: BKY-001
- Manager: Pak Ahmad
- Alamat: Jl. Sudirman No. 123
- Status: Aktif

Toko 2: Bakery Timur (Cabang)
- Kode: BKY-002
- Manager: Bu Sarah
- Alamat: Jl. Raya Bekasi No. 45
- Status: Aktif
```

#### 10.2 Transfer Stok Antar Toko
**Skenario Real:**
- Toko Sentral punya stok Roti Cokelat banyak (200 pcs)
- Toko Timur stoknya hampir habis (10 pcs)
- **Solusi**: Transfer 50 pcs dari Sentral ke Timur

**Cara Kerja:**
1. **Buat Request Transfer**:
   - Dari: Toko Sentral
   - Ke: Toko Timur
   - Produk: Roti Cokelat 50 pcs
   - Alasan: Restock cabang
   
2. **Status: PENDING** (menunggu approval)

3. **Approve Transfer**:
   - Manager Sentral approve = barang siap dikirim
   
4. **Status: IN_TRANSIT** (dalam perjalanan)

5. **Terima di Toko Tujuan**:
   - Staff Timur terima barang
   - Cek kondisi: Baik/Rusak
   - Confirm penerimaan
   
6. **Status: COMPLETED**
   - Stok Sentral: 200 → 150 pcs
   - Stok Timur: 10 → 60 pcs
   - Semua tercatat history

**Manfaat:**
- **Stock Balance**: Toko yang sepi bantu toko yang ramai
- **Minimize Waste**: Produk mau expired di satu toko bisa dipindah
- **Tracking Lengkap**: Semua perpindahan tercatat
- **Accountability**: Tahu siapa kirim, siapa terima

---

### 11. 🔙 **RETUR BARANG**

**Untuk apa?**
Tangani pengembalian barang dari customer atau internal.

**Jenis Retur:**

#### 11.1 Retur dari Customer
**Contoh Kasus:**
- Customer beli Roti Cokelat tapi ternyata expired
- Customer beli kue ulang tahun tapi salah rasa

**Flow Proses:**
```
1. Customer datang bawa barang + struk
   ↓
2. Kasir buat form retur
   - Nomor transaksi: TRX-2026-001234
   - Produk: Roti Cokelat 2 pcs
   - Alasan: Expired
   - Kondisi: Rusak
   ↓
3. Approval (Manager/Owner)
   - APPROVE → lanjut proses
   - REJECT → tolak retur, kasih kompensasi lain
   ↓
4. Proses Pengembalian:
   - Uang kembali ke customer: Rp 16.000
   - Atau tukar barang baru
   ↓
5. Update Stok:
   - Kalau barang masih bagus → return to stock
   - Kalau rusak → catat sebagai kerugian
   ↓
6. COMPLETED - Retur selesai
```

**Status Retur:**
- **PENDING**: Baru diajukan, tunggu keputusan
- **APPROVED**: Disetujui, bisa proses
- **REJECTED**: Ditolak, kasih alasan
- **COMPLETED**: Selesai, uang/barang sudah dikembalikan

**Manfaat:**
- **Customer Satisfaction**: Customer happy karena ditangani baik
- **Tracking**: Tahu berapa banyak retur per bulan
- **Quality Control**: Kalau sering retur, ada masalah produksi
- **Financial**: Tahu kerugian dari retur

---

### 12. 📅 **BATCH & EXPIRED TRACKING**

**Untuk apa?**
Melacak setiap batch produksi dengan tanggal kadaluarsa.

**Kenapa Penting?**
Roti/kue punya masa simpan terbatas (1-7 hari). Harus tahu:
- Produk mana yang mau expired
- Harus dijual duluan (FIFO - First In First Out)
- Berapa kerugian dari barang expired

**Cara Kerja:**
```
Setiap Produksi Dapat Batch Number:

Batch: CHOCO-2026-02-18-01
Produk: Roti Cokelat
Qty: 100 pcs
Tanggal Produksi: 18 Feb 2026, 05:00
Expired: 21 Feb 2026 (3 hari simpan)
Status: Active
```

**Alert Otomatis:**
- **H-2 expired**: Notifikasi "50 pcs Roti Cokelat akan expired 2 hari lagi"
- **H-1 expired**: Alert merah "URGENT: 50 pcs expired besok!"
- **Hari H**: Sistem auto-tandai expired, tidak bisa dijual
- **Diskon Otomatis**: Bisa set auto diskon 50% untuk produk H-1

**Laporan:**
- Daftar produk mau expired hari ini
- History expired per bulan (berapa kerugian)
- Efektivitas produksi (berapa % terjual vs expired)

**Contoh Laporan Expired:**
```
Bulan Februari 2026:
┌────────────────┬──────────┬─────────────┬──────────────┐
│ Produk         │ Expired  │ Nilai       │ % dari Total │
├────────────────┼──────────┼─────────────┼──────────────┤
│ Roti Cokelat   │ 15 pcs   │ Rp 120.000  │ 2.5%         │
│ Donat Gula     │ 8 pcs    │ Rp 48.000   │ 1.8%         │
│ Croissant      │ 12 pcs   │ Rp 180.000  │ 3.2%         │
├────────────────┼──────────┼─────────────┼──────────────┤
│ TOTAL          │ 35 pcs   │ Rp 348.000  │ 2.5% waste   │
└────────────────┴──────────┴─────────────┴──────────────┘

Action: Waste masih normal (<5%), pertahankan!
```

---

### 13. ⏰ **SHIFT KASIR**

**Untuk apa?**
Kelola shift kerja kasir - buka shift, transaksi, tutup shift, hitung uang.

**Flow Harian Kasir:**

#### Pagi (Opening Shift)
```
07:00 - Kasir Dewi datang
07:05 - Login ke sistem
07:10 - Buka Shift Baru:
        - Input modal awal: Rp 500.000
        - Foto uang di laci kasir (optional)
        - Status: OPEN
        
07:15 - Siap melayani customer
```

#### Siang (Transaksi)
```
07:15-15:00 - Layani customer (total 45 transaksi)
              - Jual berbagai produk
              - Terima Cash/Transfer/QRIS/Kartu
              - Sistem otomatis catat semua
```

#### Sore (Closing Shift)
```
15:00 - Customer terakhir selesai
15:05 - Kasir klik "Tutup Shift"
15:10 - Hitung uang fisik di laci kasir
15:15 - Input ke sistem:
        
        Sistem Hitung Otomatis:
        ┌─────────────────────────────────────┐
        │ REKAPITULASI SHIFT                  │
        ├─────────────────────────────────────┤
        │ Modal Awal:      Rp    500.000      │
        │ Penjualan Cash:  Rp  2.350.000      │
        │ Penjualan QRIS:  Rp  1.200.000      │
        │ Transfer:        Rp    800.000      │
        │ Kartu:           Rp    150.000      │
        ├─────────────────────────────────────┤
        │ Total Transaksi: 45 transaksi       │
        │ Total Penjualan: Rp  4.500.000      │
        ├─────────────────────────────────────┤
        │ Uang Seharusnya: Rp  2.850.000      │
        │ (Modal + Cash Sales)                │
        │                                      │
        │ Uang Dihitung Kasir: Rp 2.845.000   │
        ├─────────────────────────────────────┤
        │ SELISIH: -Rp 5.000 (Kurang)         │
        └─────────────────────────────────────┘
        
        Catatan Kasir: "Kembalian salah ke customer"
        
15:20 - Submit & Tutup Shift
15:25 - Setor uang ke manager
```

**Manfaat:**
- **Accountability**: Tiap kasir tanggung jawab uangnya sendiri
- **Tracking**: Tahu kasir mana yang sering selisih
- **Security**: Kalau ada kekurangan besar, langsung ketahuan
- **Performance**: Lihat kasir mana paling produktif

---

### 14. 💰 **PENGELUARAN (Expenses)**

**Untuk apa?**
Catat semua biaya operasional toko sehari-hari.

**Kategori Pengeluaran:**
- **GAJI**: Gaji karyawan bulanan
- **SEWA**: Sewa toko/ruko
- **LISTRIK & AIR**: Utilities
- **BAHAN BAKU**: Belanja tepung, telur, dll
- **MARKETING**: Iklan, promo, banner
- **PEMELIHARAAN**: Service oven, AC, dll
- **TRANSPORT**: Ongkir, bensin delivery
- **LAIN-LAIN**: Biaya tak terduga

**Contoh Pencatatan:**
```
Tanggal: 1 Feb 2026
Kategori: LISTRIK & AIR
Jumlah: Rp 2.500.000
Metode Bayar: Transfer
Vendor: PT PLN
Invoice: PLN-2026-02-001
Catatan: "Tagihan listrik bulan Januari 2026"
Dibayar oleh: Pak Ahmad (Owner)
Status: Lunas
```

**Laporan Pengeluaran Bulanan:**
```
FEBRUARI 2026
┌──────────────────┬─────────────────┬────────┐
│ Kategori         │ Total           │ Porsi  │
├──────────────────┼─────────────────┼────────┤
│ Gaji             │ Rp 15.000.000   │ 35%    │
│ Sewa             │ Rp  5.000.000   │ 12%    │
│ Listrik & Air    │ Rp  2.500.000   │  6%    │
│ Bahan Baku       │ Rp 18.000.000   │ 42%    │
│ Marketing        │ Rp  1.000.000   │  2%    │
│ Pemeliharaan     │ Rp    800.000   │  2%    │
│ Lain-lain        │ Rp    500.000   │  1%    │
├──────────────────┼─────────────────┼────────┤
│ TOTAL            │ Rp 42.800.000   │ 100%   │
└──────────────────┴─────────────────┴────────┘
```

**Manfaat:**
- **Budget Control**: Tahu kemana uang pergi
- **Cost Cutting**: Cari pengeluaran yang bisa dipangkas
- **Tax Ready**: Data lengkap untuk lapor pajak
- **Profit Real**: Untung bersih = Pendapatan - Pengeluaran

---

### 15. 🎁 **DISKON & PROMO**

**Untuk apa?**
Buat program diskon untuk tarik customer dan tingkatkan penjualan.

**Jenis Diskon:**

#### 15.1 Diskon Persentase
```
Kode: WEEKEND15
Nama: "Diskon Weekend"
Tipe: 15% OFF
Minimum Belanja: Rp 50.000
Max Diskon: Rp 50.000
Periode: Setiap Sabtu-Minggu
Limit: 100x pakai
Status: Aktif
```

#### 15.2 Diskon Nominal Tetap
```
Kode: CASHBACK10K
Nama: "Cashback 10 Ribu"
Tipe: Rp 10.000 OFF
Minimum Belanja: Rp 100.000
Periode: 1-28 Feb 2026
Limit: Unlimited
Status: Aktif
```

#### 15.3 Diskon Produk Spesifik
```
Kode: BUYROTI2
Nama: "Beli 2 Gratis 1"
Tipe: Buy 2 Get 1
Apply ke: Kategori Roti Manis
Periode: Setiap hari jam 17:00-19:00 (happy hour)
```

**Cara Pakai (Customer):**
```
Di kasir:
1. Kasir scan produk
2. Total: Rp 125.000
3. Kasir tanya "Ada kode diskon?"
4. Customer: "CASHBACK10K"
5. Sistem validasi:
   ✓ Kode valid
   ✓ Minimum belanja tercapai (Rp 125k > Rp 100k)
   ✓ Masih dalam periode
   ✓ Belum exceed limit
6. Diskon applied: -Rp 10.000
7. Total bayar: Rp 115.000
```

**Laporan Efektivitas Promo:**
```
Promo Performance Week 3 Feb 2026:
┌─────────────────┬──────────┬────────────────┬────────────┐
│ Kode            │ Dipakai  │ Total Diskon   │ Transaksi  │
├─────────────────┼──────────┼────────────────┼────────────┤
│ WEEKEND15       │ 87x      │ Rp 3.250.000   │ Rp 28.5jt  │
│ CASHBACK10K     │ 45x      │ Rp   450.000   │ Rp  5.2jt  │
│ OPENING20       │ 234x     │ Rp 8.900.000   │ Rp 52.3jt  │
└─────────────────┴──────────┴────────────────┴────────────┘

ROI Analysis:
- Total Biaya Diskon: Rp 12.600.000
- Total Transaksi: Rp 86.000.000
- Rata² Transaksi naik 35% vs non-promo
- Recommended: Lanjutkan WEEKEND15 & OPENING20
```

---

### 16. 📊 **LAPORAN LENGKAP**

**Untuk apa?**
Lihat performa bisnis dalam berbagai sudut pandang.

#### 16.1 Laporan Harian
**Apa yang Ditampilkan:**
```
📅 LAPORAN HARIAN - 18 Feb 2026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 RINGKASAN
• Total Transaksi: 127 transaksi
• Total Penjualan: Rp 9.850.000
• Rata² per Transaksi: Rp 77.559
• Total Item Terjual: 456 pcs
• Customer Unik: 98 orang

💳 METODE PEMBAYARAN
• Cash:     Rp 4.200.000 (43%)
• Transfer: Rp 2.800.000 (28%)
• QRIS:     Rp 2.100.000 (21%)
• Kartu:    Rp   750.000 (8%)

⏰ PENJUALAN PER JAM (Peak Hours)
08:00-09:00: 12 trx | Rp 850.000
12:00-13:00: 18 trx | Rp 1.200.000 ⭐ PEAK
17:00-18:00: 15 trx | Rp 980.000

🏆 TOP 5 PRODUK TERLARIS
1. Roti Cokelat      - 85 pcs | Rp 680.000
2. Roti Keju         - 62 pcs | Rp 558.000
3. Donat Gula        - 48 pcs | Rp 288.000
4. Croissant         - 35 pcs | Rp 525.000
5. Roti Tawar Gandum - 28 pcs | Rp 336.000

📁 PENJUALAN PER KATEGORI
🍞 Roti Manis:  Rp 4.200.000 (43%)
🍞 Roti Tawar:  Rp 1.500.000 (15%)
🎂 Kue:         Rp 2.300.000 (23%)
🥐 Pastry:      Rp 1.200.000 (12%)
🍩 Donat:       Rp   650.000 (7%)

👤 PERFORMA KASIR
Dewi:  45 trx | Rp 3.500.000
Sarah: 38 trx | Rp 2.900.000
Budi:  44 trx | Rp 3.450.000 ⭐ TOP

💰 DISKON
Total Diskon Hari Ini: Rp 450.000
Rata² Diskon: Rp 3.543/transaksi

📝 CATATAN PENTING
✓ Hari biasa (weekday)
⚠ Stok Roti Cokelat menipis (sisa 15 pcs)
⚠ Stok Mentega menipis (sisa 2 kg)
```

**Export:** Bisa download Excel untuk sharing ke owner.

---

#### 16.2 Laporan Mingguan
**Apa yang Ditampilkan:**
```
📅 LAPORAN MINGGUAN
Week 3: 12-18 Februari 2026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 PERFORMA MINGGU INI
• Total Transaksi: 856 transaksi
• Total Penjualan: Rp 68.500.000
• Rata² per Hari: Rp 9.785.714
• Growth vs Minggu Lalu: +12.5% 📈

📈 TREN HARIAN
Senin   12: Rp  8.2jt | 105 trx
Selasa  13: Rp  8.9jt | 118 trx
Rabu    14: Rp  9.1jt | 122 trx
Kamis   15: Rp  9.8jt | 128 trx ⭐ BEST
Jumat   16: Rp 10.2jt | 135 trx ⭐ BEST
Sabtu   17: Rp 11.8jt | 142 trx ⭐ PEAK
Minggu  18: Rp 10.5jt | 106 trx

💡 INSIGHT
✓ Weekend penjualan naik 18%
✓ Jumat-Sabtu perlu stok lebih banyak
⚠ Senin-Selasa agak sepi, bisa buat promo
```

---

#### 16.3 Laporan Bulanan
**Apa yang Ditampilkan:**
```
📅 LAPORAN BULANAN
Februari 2026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 RINGKASAN BULAN
• Total Transaksi: 3.245 transaksi
• Total Penjualan: Rp 285.000.000
• Hari Operasional: 28 hari
• Rata² per Hari: Rp 10.178.571

💰 GROSS PROFIT
• Pendapatan:        Rp 285.000.000
• Biaya Produksi:    Rp 114.000.000 (40%)
• ─────────────────────────────────
• Laba Kotor:        Rp 171.000.000 (60%)

📈 PERTUMBUHAN
• vs Januari 2026:    +8.5% 📈
• vs Feb 2025:       +28.3% 📈
• Target Bulanan:     Rp 250jt ✓ TERCAPAI 114%

🏆 TOP 10 PRODUK BULAN INI
1. Roti Cokelat:     1.250 pcs | Rp 10.000.000
2. Roti Keju:          980 pcs | Rp  8.820.000
3. Donat Gula:         850 pcs | Rp  5.100.000
4. Croissant:          720 pcs | Rp 10.800.000
5. Roti Tawar Gandum:  680 pcs | Rp  8.160.000
...

📁 PENJUALAN PER KATEGORI
🍞 Roti Manis:  Rp 120.000.000 (42%)
🎂 Kue:         Rp  65.000.000 (23%)
🥐 Pastry:      Rp  55.000.000 (19%)
🍞 Roti Tawar:  Rp  30.000.000 (11%)
🍩 Donat:       Rp  15.000.000 (5%)

👥 CUSTOMER METRICS
• Total Customer: 1.245 orang
• New Customer: 156 orang (13%)
• Repeat Rate: 67% (baik!)
• VIP Customer (>Rp 1jt): 45 orang

💳 METODE PEMBAYARAN
• Cash:     Rp 125.000.000 (44%)
• Transfer: Rp  80.000.000 (28%)
• QRIS:     Rp  60.000.000 (21%)
• Kartu:    Rp  20.000.000 (7%)

👤 TOP CASHIER
1. Dewi:  950 trx | Rp 85.000.000 ⭐
2. Budi:  920 trx | Rp 82.000.000
3. Sarah: 875 trx | Rp 78.000.000

📊 ANALISIS RATA² PENJUALAN
• Sabtu:  Rp 12.5jt (paling tinggi)
• Minggu: Rp 11.8jt
• Weekday: Rp 9.2jt

💡 INSIGHTS & REKOMENDASI
✓ Pertumbuhan stabil 8.5%
✓ Repeat customer rate bagus (67%)
✓ Weekend = 22% dari total penjualan
⚠ Pertimbangkan tambah produksi weekend
✓ Program loyalty bisa tingkatkan retention
```

---

#### 16.4 Laporan Produk
**Apa yang Ditampilkan:**
```
📦 LAPORAN ANALISIS PRODUK
Periode: 1-28 Februari 2026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏆 TOP 20 BEST SELLERS
┌────┬─────────────────────┬──────┬────────┬────────────┐
│ #  │ Produk              │ Qty  │ Unit   │ Revenue    │
├────┼─────────────────────┼──────┼────────┼────────────┤
│ 1  │ Roti Cokelat        │ 1250 │ pcs    │ Rp 10.0jt  │
│ 2  │ Roti Keju           │  980 │ pcs    │ Rp  8.8jt  │
│ 3  │ Donat Gula          │  850 │ pcs    │ Rp  5.1jt  │
│ 4  │ Croissant           │  720 │ pcs    │ Rp 10.8jt  │
│ 5  │ Roti Tawar Gandum   │  680 │ pcs    │ Rp  8.2jt  │
...

🐌 SLOW MOVING (Perlu Perhatian)
┌─────────────────────┬──────┬────────────┐
│ Produk              │ Qty  │ Last Sold  │
├─────────────────────┼──────┼────────────┤
│ Kue Lapis Legit     │   12 │ 15 Feb     │
│ Roti Gandum Kismis  │   18 │ 12 Feb     │
│ Pie Nanas           │   25 │ 10 Feb     │
└─────────────────────┴──────┴────────────┘

💰 ANALISIS MARGIN
┌─────────────────┬──────┬──────────┬──────────┬──────────┬────────┐
│ Produk          │ Sold │ Revenue  │ COGS     │ Profit   │ Margin │
├─────────────────┼──────┼──────────┼──────────┼──────────┼────────┤
│ Roti Cokelat    │ 1250 │ Rp 10jt  │ Rp 5.6jt │ Rp 4.4jt │ 44%    │
│ Croissant       │  720 │ Rp 10.8jt│ Rp 3.9jt │ Rp 6.9jt │ 64% ⭐ │
│ Donat Gula      │  850 │ Rp 5.1jt │ Rp 2.8jt │ Rp 2.3jt │ 45%    │
│ Roti Tawar      │  680 │ Rp 8.2jt │ Rp 3.4jt │ Rp 4.8jt │ 59%    │
└─────────────────┴──────┴──────────┴──────────┴──────────┴────────┘

💡 REKOMENDASI
✓ Top 10 produk = 68% dari total revenue
✓ Croissant paling profitable (margin 64%)
⚠ 3 produk margin rendah (<40%), review pricing
⚠ 10 produk slow-moving, pertimbangkan diskon/promo
✓ Fokus produksi ke high-margin products
```

---

#### 16.5 Laporan Inventory
**Apa yang Ditampilkan:**
```
📦 LAPORAN INVENTORY
Per tanggal: 18 Februari 2026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 SUMMARY
• Total Produk: 45 item
• Total Stok: 2.850 pcs
• Nilai Stok (Modal): Rp 15.200.000
• Nilai Stok (Jual): Rp 28.500.000

🚦 STATUS STOK
• Aman (>20 pcs):      32 produk ✓
• Menipis (10-20 pcs): 8 produk  ⚠
• Kritis (<10 pcs):    3 produk  🚨
• Habis (0 pcs):       2 produk  ❌

📈 TOP 10 STOK TERBANYAK
1. Roti Tawar Putih:    280 pcs
2. Donat Cokelat:       245 pcs
3. Roti Manis:          180 pcs
...

📉 STOK MENIPIS (Perlu Restock)
🚨 URGENT:
• Roti Cokelat Keju: 5 pcs (min: 20)
• Croissant Plain:   8 pcs (min: 15)
• Kue Bolu Pandan:   3 pcs (min: 10)

⚠ WARNING:
• Donat Gula:       15 pcs (min: 25)
• Roti Kelapa:      12 pcs (min: 20)

❌ HABIS (Perlu Produksi Segera):
• Pie Apel:         0 pcs
• Kue Lapis Legit:  0 pcs

💡 REKOMENDASI
⚠ Produksi segera: 2 produk habis
⚠ Tambah produksi: 8 produk menipis
✓ Review minimum stock level berkala
✓ Pertimbangkan buffer stock untuk weekend
```

---

#### 16.6 Laporan Customer
**Apa yang Ditampilkan:**
```
👥 LAPORAN ANALISIS CUSTOMER
Periode: 1-28 Februari 2026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 RINGKASAN
• Total Customer: 1.245 orang
• New Customer: 156 orang (13%)
• Repeat Customer: 834 orang (67%)

🎯 SEGMENTASI BY FREQUENCY
Loyal (>10 trx/bulan):      45 orang (4%) 🌟
Regular (5-10 trx/bulan):   180 orang (14%)
Occasional (2-4 trx/bulan): 520 orang (42%)
One-time (1 trx):           500 orang (40%)

💰 SEGMENTASI BY SPENDING
VIP (>Rp 1jt):                45 orang (4%) 👑
High Value (Rp 500k-1jt):     125 orang (10%)
Medium (Rp 200k-500k):        450 orang (36%)
Low (<Rp 200k):               625 orang (50%)

💳 LIFETIME VALUE
• Average: Rp 228.000
• Median: Rp 185.000
• Top 10%: Rp 1.285.000

🏆 TOP 20 CUSTOMER
┌────┬──────────────────┬──────┬──────────────┬─────────────┐
│ #  │ Nama             │ Trx  │ Total Spent  │ Last Visit  │
├────┼──────────────────┼──────┼──────────────┼─────────────┤
│ 1  │ Ibu Ratna        │  28  │ Rp 3.250.000 │ 18 Feb 2026 │
│ 2  │ Pak Budi H       │  25  │ Rp 2.890.000 │ 17 Feb 2026 │
│ 3  │ Ibu Sari         │  22  │ Rp 2.450.000 │ 18 Feb 2026 │
│ 4  │ Bu Dewi K        │  20  │ Rp 2.100.000 │ 16 Feb 2026 │
│ 5  │ Pak Ahmad        │  18  │ Rp 1.980.000 │ 18 Feb 2026 │
...

📈 RETENTION
• Retention Rate: 72% (baik!)
• Churned Customer: 89 orang
• Average Visit Frequency: 3x/bulan

💡 INSIGHTS & REKOMENDASI
✓ Top 20 customers = 15% dari total revenue
✓ Retention rate baik (72%)
⚠ 40% one-time customer, perlu strategy retention
✓ 45 VIP customers - program loyalty recommended
✓ Akuisisi customer baru sedang bagus (156 baru)

🎁 RECOMMENDED ACTIONS
• Buat tier membership (Silver/Gold/Platinum)
• Birthday voucher untuk customer
• Exclusive promo untuk VIP
• WhatsApp blast untuk new products
```

---

#### 16.7 Laporan Laba Rugi (P&L)
**Apa yang Ditampilkan:**
```
💰 LAPORAN LABA RUGI
Periode: 1-28 Februari 2026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 PENDAPATAN
┌──────────────────────────────────────┐
│ Penjualan:            Rp 285.000.000 │
│ Pendapatan Lain:      Rp          0  │
│ ───────────────────────────────────  │
│ TOTAL PENDAPATAN:     Rp 285.000.000 │
└──────────────────────────────────────┘

📉 HARGA POKOK PENJUALAN (COGS)
┌──────────────────────────────────────┐
│ Biaya Bahan Baku:     Rp  95.000.000 │
│ Biaya Produksi:       Rp  19.000.000 │
│ ───────────────────────────────────  │
│ TOTAL COGS:           Rp 114.000.000 │
└──────────────────────────────────────┘

✅ LABA KOTOR
┌──────────────────────────────────────┐
│ Pendapatan - COGS:    Rp 171.000.000 │
│ Margin:               60% ✓          │
└──────────────────────────────────────┘

📊 BIAYA OPERASIONAL
┌──────────────────────────────────────┐
│ Gaji & Upah:          Rp  28.500.000 │
│ Sewa:                 Rp   5.000.000 │
│ Listrik & Air:        Rp   2.500.000 │
│ Marketing:            Rp   2.850.000 │
│ Pemeliharaan:         Rp     800.000 │
│ Transport:            Rp   1.200.000 │
│ Lain-lain:            Rp   1.500.000 │
│ ───────────────────────────────────  │
│ TOTAL BIAYA OP:       Rp  42.350.000 │
└──────────────────────────────────────┘

✅ LABA OPERASIONAL
┌──────────────────────────────────────┐
│ Laba Kotor - Biaya:   Rp 128.650.000 │
│ Margin:               45% ✓          │
└──────────────────────────────────────┘

💰 LABA BERSIH
┌──────────────────────────────────────┐
│ LABA BERSIH:          Rp 128.650.000 │
│ Net Margin:           45.1% ⭐       │
└──────────────────────────────────────┘

📈 PERBANDINGAN
• vs Januari 2026:     +15.2% 📈
• vs Feb 2025:         +32.5% 📈
• Target Laba:         Rp 100jt ✓ TERCAPAI 129%

💡 CATATAN
✓ Margin sangat sehat (45%)
✓ COGS terkontrol di 40%
✓ Biaya operasional efisien (15%)
✓ Growth konsisten setiap bulan
```

---

### 17. 💬 **INTEGRASI WHATSAPP**

**Untuk apa?**
Komunikasi otomatis dengan customer via WhatsApp.

**Fitur:**

#### 17.1 Kirim Struk Digital
```
Setelah transaksi di kasir:

Kasir: "Bu, mau struk digital dikirm WA?"
Customer: "Ya boleh"
Kasir: Input nomor HP 0812-3456-7890

[Sistem kirim otomatis ke WhatsApp]

━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧁 BAKERY SENTRAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━

No. Transaksi: TRX-2026-001234
Tanggal: 18 Feb 2026, 14:30
Kasir: Dewi
Customer: Ibu Siti

──────────────────────────────
ITEM
──────────────────────────────
Roti Cokelat      5x @ 8.000
                        40.000

Donat Gula        3x @ 6.000
                        18.000
──────────────────────────────
Subtotal:              58.000
Diskon (WEEKEND15):    -8.700
Pajak (11%):            5.423
──────────────────────────────
TOTAL:             Rp 54.723

Dibayar (QRIS):    Rp 55.000
Kembalian:         Rp    277

━━━━━━━━━━━━━━━━━━━━━━━━━━━
Terima kasih sudah belanja! 🙏
Kunjungi kami lagi ya ❤

🏪 Jl. Sudirman No. 123
📞 021-1234-5678
━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### 17.2 Notifikasi Promo
```
[Broadcast ke semua customer member]

━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 PROMO WEEKEND SPECIAL! 🎉
━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hai Ibu Ratna! 👋

Khusus weekend ini:
🍞 DISKON 20% semua Roti Manis
🍩 Buy 2 Get 1 untuk Donat
🎂 Free Mini Cake min. belanja 100rb

Kode: WEEKEND20
Periode: 24-25 Feb 2026
Lokasi: Semua cabang

Jangan lewatkan! 
Sampai jumpa di toko ya! 🧁

━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### 17.3 Birthday Voucher
```
[Otomatis terkirim H-3 ulang tahun customer]

━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎂 HAPPY BIRTHDAY! 🎉
━━━━━━━━━━━━━━━━━━━━━━━━━━━

Dear Ibu Siti,

Selamat ulang tahun! 🎈
Semoga panjang umur & sehat selalu 🙏

Kami ada hadiah spesial untuk Anda:

🎁 VOUCHER Rp 50.000
Kode: BDAY-SITI-2026
Valid: 21-28 Feb 2026

Klaim di kasir ya!
See you soon! ❤

━━━━━━━━━━━━━━━━━━━━━━━━━━━
Bakery Sentral
📍 Jl. Sudirman 123
📞 021-1234-5678
━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### 17.4 Stok Notification (Internal)
```
[Otomatis ke manager kalau stok kritis]

━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠ ALERT: STOK KRITIS!
━━━━━━━━━━━━━━━━━━━━━━━━━━━

Pak Ahmad,

Beberapa produk stok menipis:

🚨 URGENT:
• Roti Cokelat Keju: 5 pcs
• Croissant: 8 pcs

⚠ WARNING:
• Donat Gula: 15 pcs
• Roti Kelapa: 12 pcs

Action: Perlu produksi hari ini

Dashboard: bakery.com/inventory
━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 18. 👤 **KELOLA USER (Karyawan)**

**Untuk apa?**
Kelola akun karyawan dengan berbagai level akses.

**Level Akses:**

#### 18.1 OWNER (Pemilik)
**Bisa Akses Semua:**
- ✓ Lihat semua laporan keuangan
- ✓ Setting harga & diskon
- ✓ Approve pengeluaran besar
- ✓ Kelola user/karyawan
- ✓ Backup & restore data
- ✓ Setting sistem

#### 18.2 MANAGER
**Bisa Akses:**
- ✓ Approve retur customer
- ✓ Close shift kasir
- ✓ Kelola inventory
- ✓ Buat order produksi
- ✓ Lihat laporan harian/mingguan
- ✗ Tidak bisa ubah harga
- ✗ Tidak bisa kelola user

#### 18.3 KASIR
**Bisa Akses:**
- ✓ Transaksi di POS
- ✓ Cek stok produk
- ✓ Input customer
- ✓ Scan diskon
- ✗ Tidak bisa lihat laporan keuangan
- ✗ Tidak bisa approve retur
- ✗ Tidak bisa ubah harga

**Contoh Management:**
```
┌──────────┬─────────────┬─────────┬──────────┬────────┐
│ Nama     │ Role        │ HP      │ Status   │ Aksi   │
├──────────┼─────────────┼─────────┼──────────┼────────┤
│ Pak Ahmad│ OWNER       │ 0812... │ Aktif    │ Edit   │
│ Bu Maya  │ MANAGER     │ 0813... │ Aktif    │ Edit   │
│ Dewi     │ KASIR       │ 0815... │ Aktif    │ Edit   │
│ Sarah    │ KASIR       │ 0816... │ Aktif    │ Edit   │
│ Budi     │ KASIR       │ 0817... │ Aktif    │ Edit   │
│ Rina     │ KASIR       │ 0818... │ Inactive │ Aktifkan│
└──────────┴─────────────┴─────────┴──────────┴────────┘
```

---

### 19. ⚙️ **SETTINGS (Pengaturan)**

**Untuk apa?**
Kustomisasi sistem sesuai kebutuhan toko.

**Pengaturan yang Bisa Diubah:**

#### 19.1 Informasi Bisnis
```
Nama Usaha: Bakery Sentral
Alamat: Jl. Sudirman No. 123, Jakarta
Telepon: 021-1234-5678
Email: info@bakerysentral.com
Website: www.bakerysentral.com
Logo: [Upload]
```

#### 19.2 Pajak
```
Aktifkan PPN: ✓ Ya
Rate Pajak: 11%
Tax Included: ✓ Termasuk dalam harga
```

#### 19.3 Stok
```
Low Stock Threshold: 15 pcs
Alert Email: manager@bakery.com
Auto Alert WhatsApp: ✓ Aktif
```

#### 19.4 Notifikasi
```
Email Notifications: ✓ Aktif
WhatsApp Notifications: ✓ Aktif
Push Notifications: ✓ Aktif

Notifikasi untuk:
✓ Stok menipis
✓ Produk mau expired
✓ Shift closing variance
✓ Daily sales summary
✓ Retur approval needed
```

#### 19.5 Struk
```
Nama di Struk: BAKERY SENTRAL
Tagline: "Roti Segar Setiap Hari"
Footer: "Terima kasih & sampai jumpa lagi!"
Show Tax Breakdown: ✓ Ya
Show Cashier Name: ✓ Ya
Auto Print: ✓ Ya
```

---

## 🎯 PROSES BISNIS LENGKAP: SATU HARI DI TOKO ROTI

### 05:00 - Produksi Pagi
```
1. Staff produksi login
2. Cek order produksi hari ini (dari manager)
3. Cek stok bahan baku di sistem
4. Ambil bahan sesuai resep
5. Mulai produksi (status: PROCESSING)
6. Roti matang → packing
7. Input ke sistem: 200 pcs Roti Cokelat selesai
8. Sistem otomatis:
   - Stok produk +200 pcs
   - Stok bahan baku berkurang
   - Catat biaya produksi
```

### 07:00 - Opening Toko
```
1. Kasir Dewi datang
2. Login ke sistem
3. Cek list produksi pagi (sudah jadi berapa)
4. Atur display produk di etalase
5. Buka Shift di sistem:
   - Input modal: Rp 500.000
   - Foto uang di laci
   - Klik "Start Shift"
6. Toko siap buka!
```

### 07:30-15:00 - Operasional Harian
```
Customer 1 (08:15):
- Ibu Siti beli 5 Roti Cokelat
- Dewi scan produk di POS
- Total: Rp 40.000
- Ada diskon WEEKEND15? Tidak (bukan weekend)
- Bayar Cash Rp 50.000
- Kembalian Rp 10.000
- Print struk
- Stok otomatis: Roti Cokelat 200→195 pcs

Customer 2 (08:45):
- Pak Budi (member) beli berbagai roti
- Total: Rp 125.000
- Pakai diskon CASHBACK10K
- Jadi bayar: Rp 115.000
- Bayar QRIS scan
- Kirim struk digital ke WA
- Points loyalty +115 poin

[... 100+ transaksi lainnya ...]

[Siang: 12:00]
- Manager cek dashboard di HP
- Monitoring penjualan real-time
- Stok beberapa produk mulai menipis
- Order produksi tambahan untuk sore

[Sore: 14:00]
- Customer komplain Roti Cokelat expired
- Kasir buat form retur
- Manager approve retur
- Refund Rp 16.000
- Produk rusak dibuang
- Sistem catat kerugian

[Menjelang tutup: 14:30]
- Produk mau expired besok dikasih diskon 50%
- Update harga di sistem
- Annonce "PROMO JAM 3 SORE"
- Ludes terjual (reduce waste!)
```

### 15:00 - Closing Shift
```
1. Customer terakhir selesai
2. Kunci pintu toko
3. Dewi tutup shift:
   - Klik "Close Shift"
   - Hitung fisik uang di laci
   - Input: Rp 2.845.000
   - Sistem hitung:
     * Seharusnya: Rp 2.850.000
     * Selisih: -Rp 5.000
   - Input alasan: "Kembalian salah"
4. Print laporan shift
5. Setor uang ke manager
6. Logout
```

### 16:00 - Manager Review
```
1. Manager login
2. Approve semua retur hari ini
3. Review shift kasir (lihat siapa selisih)
4. Cek stok inventory
5. Buat order produksi besok:
   - Roti Cokelat: 250 pcs (laris!)
   - Roti Keju: 150 pcs
   - Donat: 100 pcs
6. Approve order produksi
7. WhatsApp broadcast promo besok
```

### 18:00 - Owner Review
```
1. Owner buka dashboard dari rumah
2. Lihat laporan harian:
   - Penjualan: Rp 9.850.000 ✓
   - Transaksi: 127 ✓
   - Shift variance: -Rp 5.000 (masih OK)
3. Lihat trend mingguan: naik 12% 📈
4. Cek laporan laba-rugi bulan ini
5. Plan marketing strategy bulan depan
6. Export Excel untuk sharing ke investor
```

---

## 📱 AKSES SISTEM

### Desktop (Komputer Kasir)
- Akses penuh di toko
- Transaksi POS
- Print struk
- Scan barcode

### Mobile (HP Manager/Owner)
- Dashboard monitoring
- Approve retur
- Lihat laporan
- Notifikasi real-time

### Tablet (Staff Produksi)
- Input produksi
- Cek resep
- Update stok bahan baku

---

## 🎓 KESIMPULAN

Sistem ini adalah **"ASISTEN PINTAR ALL-IN-ONE"** untuk toko roti yang:

✅ **Memudahkan Kasir** - POS sederhana & cepat
✅ **Membantu Manager** - Monitoring stok & produksi
✅ **Melindungi Owner** - Laporan lengkap & akurat
✅ **Meningkatkan Penjualan** - Promo & loyalty program
✅ **Efisiensi Operasional** - Otomasi banyak proses
✅ **Data-Driven Decision** - Keputusan berdasarkan data real

**Tidak perlu IT expert untuk pakai sistem ini!**
Semua dibuat sesederhana mungkin untuk orang awam.

---

🎉 **Selamat menggunakan sistem Bakery Management!** 🧁

Jika ada pertanyaan, hubungi support tim. 📞
