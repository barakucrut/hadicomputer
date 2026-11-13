# Product Requirements Document (PRD) — CMS & Database Hadi Computer

**Versi:** 1.0  
**Status:** Siap Implementasi  
**Target Rilis:** Backend & CMS Admin Panel Hadi Computer  
**Tech Stack:** Next.js (App Router), MySQL, Prisma ORM, Shadcn UI, Tailwind CSS, TypeScript  

---

## 1. Ringkasan Eksekutif & Prinsip Desain

### 1.1 Latar Belakang & Tujuan
CMS (Content Management System) Hadi Computer adalah panel administrasi khusus untuk pemilik/owner toko guna mengelola seluruh katalog showcase produk elektronik (laptop baru/bekas, PC, aksesori), banner promosi interaktif (termasuk hotspot bonus fisik), informasi layanan jasa servis/rakit PC, pengaturan toko, serta analitik interaksi WhatsApp secara mandiri tanpa menyentuh kode program.

### 1.2 Batasan & Sifat Sistem
1. **Showcase-Only (Tanpa Keranjang / Checkout / Payment Gateway):** Sistem murni katalog display. Transaksi, negosiasi, dan kesepakatan jual-beli dilakukan langsung via chat personal WhatsApp.
2. **Ketersediaan Bukan Jumlah Stok:** Tidak ada pengurangan stok angka (stock count). Pengelola hanya memilih 3 status ketersediaan: `TERSEDIA`, `PREORDER`, atau `HABIS`.
3. **Database MySQL:** Menggunakan database relasional MySQL yang dihubungkan melalui Prisma ORM.
4. **Penyimpanan File Lokal (Local Server Storage):** Gambar diunggah langsung ke penyimpanan server lokal (`public/uploads/products/`, `public/uploads/banners/`) dengan kompresi otomatis `.jpg` (untuk kompatibilitas WhatsApp crawler preview) dan `.webp` (untuk kecepatan render web).
5. **Autentikasi Mandiri:** Satu peran (`OWNER`/`ADMIN`), tanpa registrasi publik. Akses dibatasi pada route `/admin`.

---

## 2. Design System & Standar Tampilan CMS

Seluruh komponen antarmuka admin wajib menggunakan **Shadcn UI** dengan penyesuaian token visual yang identik dengan website publik Hadi Computer:

### 2.1 Palet Warna & Token Visual
| Token | Nilai Hex | Penggunaan di CMS |
| :--- | :--- | :--- |
| **Brand Primary (Red Accent)** | `#cc252b` | Tombol CTA utama, badge promo, active tab indicator, focus ring, logo highlight |
| **Text Primary (Ink)** | `#111413` | Teks judul, heading tabel, label input |
| **Text Secondary (Muted)** | `#525854` | Deskripsi form, metadata, subjudul, placeholder |
| **Background Dasar** | `#f8f7f4` | Latar belakang seluruh halaman CMS (`bg-[#f8f7f4]`) |
| **Surface Card/Dialog** | `#ffffff` | Background kartu, dropdown menu, modal dialog, popover |
| **Border Netral** | `#e5e3dd` | Garis batas tabel, pembatas form input, divider |
| **Promo Green (Success)** | `#16a34a` | Angka harga promo, status "Tersedia", badge diskon |
| **Amber Warning** | `#d97706` | Status "Preorder", alert peringatan unit bekas |
| **Muted Dark / Danger** | `#dc2626` | Status "Habis", tombol hapus, badge arsip |

### 2.2 Tipografi & Kaidah Tampilan
- **Font Family:** `Plus Jakarta Sans`, sans-serif (menggunakan `@fontsource-variable/plus-jakarta-sans`).
- **Ukuran Font Minimum:** 12px (tidak ada elemen teks sekunder, badge, atau tooltip di bawah 12px).
- **Radius Sudut (Border Radius):** `8px` (`rounded-lg` / `rounded-md`) seragam untuk kartu, tombol, dan input.
- **Komponen Shadcn UI yang Digunakan:**
  - `Table`, `TableHeader`, `TableRow`, `TableCell`: Tabel data produk, kategori, merek, dan inquiry log.
  - `Dialog`, `DialogContent`, `DialogHeader`: Modal pop-up form cepat (kategori, merek, hotspot).
  - `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`: Validasi input berbasis Zod.
  - `Input`, `Textarea`, `Select`: Field teks, angka rupiah, deskripsi, dan dropdown pilihan.
  - `Switch`, `Checkbox`: Toggle status terbit (Draft/Published) dan badge promosi (Promo, Pilihan, Terlaris).
  - `Badge`: Label status ketersediaan, kondisi (Baru/Bekas), dan tag bonus.
  - `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`: Pengelompokan tab navigasi form produk dan analitik.
  - `DropdownMenu`: Menu opsi per baris tabel (Edit, Duplikat, Nonaktifkan, Hapus).
  - `Toast` (Sonner): Notifikasi sukses/gagal penyimpanan data.

---

## 3. Arsitektur Database (Prisma Schema - MySQL)

Berikut adalah struktur skema lengkap Prisma ORM untuk MySQL (`prisma/schema.prisma`):

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ----------------------------------------------------
// 1. AUTENTIKASI ADMIN / OWNER
// ----------------------------------------------------
model AdminUser {
  id           String    @id @default(cuid())
  email        String    @unique @db.VarChar(191)
  passwordHash String    @db.VarChar(255)
  name         String    @db.VarChar(100)
  role         String    @default("OWNER") @db.VarChar(30)
  lastLoginAt  DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@map("admin_users")
}

// ----------------------------------------------------
// 2. KATEGORI & MEREK
// ----------------------------------------------------
model Category {
  id          String    @id @default(cuid())
  name        String    @db.VarChar(100)
  slug        String    @unique @db.VarChar(100)
  icon        String?   @db.VarChar(50) // e.g. "laptop", "monitor", "cpu"
  description String?   @db.Text
  sortOrder   Int       @default(0)
  isActive    Boolean   @default(true)
  products    Product[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@map("categories")
}

model Brand {
  id        String    @id @default(cuid())
  name      String    @db.VarChar(100)
  slug      String    @unique @db.VarChar(100)
  logoUrl   String?   @db.VarChar(255)
  sortOrder Int       @default(0)
  isActive  Boolean   @default(true)
  products  Product[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@map("brands")
}

// ----------------------------------------------------
// 3. PRODUK & DETAIL KATALOG
// ----------------------------------------------------
enum ProductCondition {
  BARU
  BEKAS
}

enum AvailabilityStatus {
  TERSEDIA
  PREORDER
  HABIS
}

enum PublicationStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model Product {
  id                String             @id @default(cuid())
  code              String             @unique @db.VarChar(50) // e.g. "HADI-LPT-001"
  slug              String             @unique @db.VarChar(150)
  name              String             @db.VarChar(200)
  summary           String             @db.VarChar(255) // Deskripsi ringkas 1-2 kalimat
  description       String             @db.Text         // Deskripsi lengkap
  condition         ProductCondition   @default(BARU)
  basePrice         BigInt?            // null = Hubungi Owner untuk Harga
  originalPrice     BigInt?            // Harga coret untuk kalkulasi diskon/hemat
  availability      AvailabilityStatus @default(TERSEDIA)
  warranty          String             @default("Garansi Toko 1 Bulan") @db.VarChar(100)
  bonus             String?            @db.VarChar(255) // e.g. "Free Sleeve Case + Mouse Gaming"
  
  // Tagging & Kurasi Tampilan Beranda
  isFeatured        Boolean            @default(false)  // Masuk "Pilihan Hadi"
  isBestSeller      Boolean            @default(false)  // Masuk "Terlaris"
  isPromo           Boolean            @default(false)  // Masuk "Promo Minggu Ini"
  isNewArrival      Boolean            @default(false)  // Masuk "Produk Terbaru"
  needs             Json?                               // Array string e.g. ["kuliah", "kerja", "gaming"]
  
  // Status Publikasi
  publicationStatus PublicationStatus  @default(PUBLISHED)
  
  // Relasi
  categoryId        String
  category          Category           @relation(fields: [categoryId], references: [id])
  brandId           String
  brand             Brand              @relation(fields: [brandId], references: [id])
  
  variants          ProductVariant[]
  images            ProductImage[]
  specs             ProductSpec[]
  inquiryLogs       InquiryLog[]

  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt

  @@index([categoryId])
  @@index([brandId])
  @@index([publicationStatus, availability])
  @@map("products")
}

model ProductVariant {
  id            String             @id @default(cuid())
  productId     String
  product       Product            @relation(fields: [productId], references: [id], onDelete: Cascade)
  name          String             @db.VarChar(100) // e.g. "RAM 16GB / 512GB SSD"
  price         BigInt?            // null = mengikuti basePrice atau hubungi owner
  originalPrice BigInt?
  availability  AvailabilityStatus @default(TERSEDIA)
  isDefault     Boolean            @default(false)
  sortOrder     Int                @default(0)
  createdAt     DateTime           @default(now())
  updatedAt     DateTime           @updatedAt

  @@index([productId])
  @@map("product_variants")
}

model ProductImage {
  id        String   @id @default(cuid())
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  url       String   @db.VarChar(255) // /uploads/products/filename.jpg
  altText   String?  @db.VarChar(150)
  isPrimary Boolean  @default(false)
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())

  @@index([productId])
  @@map("product_images")
}

model ProductSpec {
  id        String   @id @default(cuid())
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  key       String   @db.VarChar(100) // e.g. "Processor", "RAM", "Kartu Grafis"
  value     String   @db.VarChar(255) // e.g. "Intel Core i7-13700H"
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())

  @@index([productId])
  @@map("product_specs")
}

// ----------------------------------------------------
// 4. BANNER HERO & INTERACTIVE HOTSPOTS
// ----------------------------------------------------
model Banner {
  id        String          @id @default(cuid())
  title     String          @db.VarChar(150)
  subtitle  String?         @db.VarChar(255)
  badgeText String?         @db.VarChar(100) // e.g. "🔥 Promo Spesial Minggu Ini"
  ctaLabel  String?         @db.VarChar(50)  // e.g. "Klaim Promo via WhatsApp"
  ctaUrl    String?         @db.VarChar(255)
  imageUrl  String          @db.VarChar(255) // /uploads/banners/hero-promo.jpg
  imageAlt  String          @db.VarChar(150)
  bgTheme   String          @default("dark") @db.VarChar(20) // "dark" atau "light"
  sortOrder Int             @default(0)
  isActive  Boolean         @default(true)
  hotspots  BannerHotspot[]
  createdAt DateTime        @default(now())
  updatedAt DateTime        @updatedAt

  @@map("banners")
}

model BannerHotspot {
  id        String   @id @default(cuid())
  bannerId  String
  banner    Banner   @relation(fields: [bannerId], references: [id], onDelete: Cascade)
  label     String   @db.VarChar(100) // e.g. "🎁 FREE Gaming Mouse"
  xPercent  Float    // Posisi X dalam persen 0.0 - 100.0%
  yPercent  Float    // Posisi Y dalam persen 0.0 - 100.0%
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())

  @@index([bannerId])
  @@map("banner_hotspots")
}

// ----------------------------------------------------
// 5. LAYANAN & SERVIS
// ----------------------------------------------------
model Service {
  id                 String       @id @default(cuid())
  title              String       @db.VarChar(150) // e.g. "Servis & Perawatan Laptop"
  slug               String       @unique @db.VarChar(150)
  summary            String       @db.VarChar(255)
  description        String       @db.Text
  estimatedTime      String       @db.VarChar(100) // e.g. "1 - 3 Hari Kerja"
  priceInfo          String       @db.VarChar(100) // e.g. "Mulai Rp 75.000 (Sesuai Kerusakan)"
  ctaWhatsappText    String       @db.VarChar(255)
  iconName           String?      @db.VarChar(50)
  imageUrl           String?      @db.VarChar(255)
  isActive           Boolean      @default(true)
  sortOrder          Int          @default(0)
  inquiryLogs        InquiryLog[]
  createdAt          DateTime     @default(now())
  updatedAt          DateTime     @updatedAt

  @@map("services")
}

// ----------------------------------------------------
// 6. PENGATURAN TOKO (SINGLETON RECORD)
// ----------------------------------------------------
model StoreSetting {
  id                         String   @id @default("default")
  storeName                  String   @default("Hadi Computer") @db.VarChar(100)
  tagline                    String   @default("Pusat Laptop & Komputer Terpercaya") @db.VarChar(200)
  whatsappNumber             String   @default("6285769000007") @db.VarChar(30)
  whatsappDefaultTemplate    String   @db.Text
  address                    String   @db.Text
  mapsEmbedUrl               String?  @db.Text
  openHours                  String   @db.VarChar(200)
  socialInstagram            String?  @db.VarChar(100)
  socialTiktok               String?  @db.VarChar(100)
  socialFacebook             String?  @db.VarChar(100)
  announcementText           String?  @db.VarChar(255)
  isAnnouncementActive       Boolean  @default(false)
  updatedAt                  DateTime @updatedAt

  @@map("store_settings")
}

// ----------------------------------------------------
// 7. TRACKING INTERAKSI & LEAD WHATSAPP
// ----------------------------------------------------
enum InquiryType {
  PRODUCT
  SERVICE
  GENERAL
}

model InquiryLog {
  id             String      @id @default(cuid())
  inquiryType    InquiryType @default(PRODUCT)
  productId      String?
  product        Product?    @relation(fields: [productId], references: [id], onDelete: SetNull)
  serviceId      String?
  service        Service?    @relation(fields: [serviceId], references: [id], onDelete: SetNull)
  variantName    String?     @db.VarChar(100)
  priceAtInquiry BigInt?
  visitorIp      String?     @db.VarChar(50)
  userAgent      String?     @db.VarChar(255)
  referrer       String?     @db.VarChar(255)
  createdAt      DateTime    @default(now())

  @@index([inquiryType])
  @@index([productId])
  @@index([serviceId])
  @@index([createdAt])
  @@map("inquiry_logs")
}
```

---

## 4. Informasi Struktur Halaman CMS (`/admin`)

### 4.1 Halaman Login (`/admin/login`)
- **Tampilan:** Form terpusat minimalis dengan logo Hadi Computer dan styling Shadcn Card.
- **Field:** Email & Password.
- **Fitur:** Proteksi Rate Limiting (maks 5x percobaan gagal per 15 menit), password di-hash menggunakan `bcryptjs`, dan sesi disimpan dalam HTTP-Only encrypted cookie.

### 4.2 Dashboard Utama (`/admin`)
- **Ringkasan Kartu Metrik:**
  - Total Klik WhatsApp Hari Ini, Minggu Ini, & Bulan Ini (dari `InquiryLog`).
  - Total Produk Aktif (Tersedia, Preorder, Habis).
  - Produk Paling Banyak Ditanyakan via WhatsApp (Top 5 Inquired Products).
- **Aksi Cepat (Quick Actions):** Tombol "Tambah Produk Baru", "Ganti Banner Promo", "Lihat Log WhatsApp".

### 4.3 Manajemen Produk (`/admin/produk`)
- **Tabel Data Produk (Shadcn Table):**
  - Kolom: Foto Thumbnail, Nama & Kode Produk, Kategori, Kondisi (Baru/Bekas), Harga & Diskon, Status Ketersediaan, Status Terbit (Draft/Published), Total Inquiry, Aksi.
  - **Filter Cepat:** Tab status (Semua, Published, Draft, Habis), Filter Kategori, Filter Merek, Input Pencarian Real-time.
  - **Bulk Action:** Ubah ketersediaan massal, Hapus terpilih, Arsipkan terpilih.

### 4.4 Form Tambah & Edit Produk (`/admin/produk/baru` & `/admin/produk/[id]`)
- **Pengelompokan Form:**
  1. **Informasi Dasar:** Nama Produk, Kode Unit (auto-generate atau manual), Kategori (Dropdown), Merek (Dropdown), Kondisi (Radio: Baru / Bekas Berkualitas).
  2. **Harga & Penawaran:**
     - Toggle "Hubungi untuk Harga" vs Input Nominal Rupiah.
     - Harga Normal / Coret (untuk kalkulasi otomatis penghematan & diskon `[-XX%]`).
     - Teks Bonus Hadiah Langsung (misal: `Free Sleeve Case + Mouse Gaming`).
     - Status Ketersediaan (`TERSEDIA`, `PREORDER`, `HABIS`).
     - Garansi (Default: "Garansi Toko 1 Bulan" atau custom).
  3. **Manajemen Varian (Opsional):**
     - Dynamic Table untuk menambah varian (misal: "RAM 8GB / SSD 256GB" vs "RAM 16GB / SSD 512GB") dengan override harga dan ketersediaan masing-masing.
  4. **Galeri Foto (Penyimpanan Lokal):**
     - Area drag-and-drop unggah foto.
     - Pratinjau langsung, tombol atur urutan (drag/reorder), dan radio button penentu "Foto Utama" (Primary Image).
     - Otomatis membuat versi `.jpg` (untuk OpenGraph WhatsApp) dan `.webp` (untuk efisiensi web).
  5. **Spesifikasi Teknis:**
     - Dynamic Key-Value list (Processor, RAM, Storage, Layar, VGA, Baterai, Kelengkapan).
  6. **Tagging Koleksi & Promo:**
     - Checkbox: "Promo Minggu Ini", "Pilihan Hadi", "Terlaris", "Produk Baru".
     - Pilihan Kebutuhan: Kuliah, Kerja/Office, Gaming/Editing.

### 4.5 Editor Banner & Hotspots Interaktif (`/admin/banner`)
- **Tampilan Kanvas Interaktif:**
  - Menampilkan pratinjau gambar banner hero.
  - Admin dapat **mengklik langsung pada titik gambar** untuk meletakkan hotspot bonus (misal: di atas gambar mouse untuk tag `🎁 FREE Gaming Mouse`, di atas kaos untuk tag `🎁 FREE Kaos Hadi`).
  - Koordinat X dan Y (dalam persen 0–100%) otomatis tersimpan ke tabel `BannerHotspot`.
  - Pratinjau langsung animasi pulsing hotspot.

### 4.6 Kategori & Merek (`/admin/kategori` & `/admin/merek`)
- Tampilan tabel dengan tombol `+ Tambah` yang membuka **Shadcn Dialog**.
- Input Nama, Slug otomatis, Ikon/Logo, dan urutan sorting (`sortOrder`).

### 4.7 Analitik Inquiry WhatsApp (`/admin/inquiry-analytics`)
- Grafik tren interaksi WhatsApp per hari/minggu.
- Tabel riwayat log: Tanggal & Waktu, Jenis Inquiry (Produk/Layanan/Umum), Nama Item, Varian yang Dipilih, Estimasi Nilai Produk, Referrer/Device.
- Tombol **Export CSV** untuk evaluasi pembukuan dan riset minat pasar offline owner.

### 4.8 Pengaturan Toko (`/admin/pengaturan`)
- Nomor WhatsApp Resmi Toko (otomatis mengupdate semua tombol WA di web publik).
- Format Template Pesan Konsultasi WhatsApp default.
- Alamat Lengkap, Link Google Maps Embed, dan Jam Operasional.
- Tautan Akun Media Sosial (Instagram, TikTok, Facebook).
- Teks Pengumuman Baris Atas (Top Announcement Bar) + Toggle Aktif/Nonaktif.

---

## 5. Mesin Penyimpanan File & Optimasi Media Lokal

### 5.1 Alur Unggah File
1. File diunggah melalui formulir CMS via API Route Next.js (`/api/admin/upload`).
2. Validasi ketat di sisi server:
   - MIME Type yang diizinkan: `image/jpeg`, `image/png`, `image/webp`.
   - Ukuran maksimum: `5 MB` per file.
3. Pemrosesan Gambar (menggunakan library `sharp`):
   - **File Primary JPG:** Dikonversi ke JPEG berkualitas tinggi (dimensi 1000x1000 atau 1200x630, kompresi ~150KB) dan disimpan ke `public/uploads/products/[slug]-primary.jpg` untuk kepastian preview link WhatsApp dan Facebook.
   - **File WebP:** Dikonversi ke WebP modern teroptimasi untuk konsumsi cepat di website katalog.
4. Nama file menggunakan slug produk dan hash timestamp unik untuk mencegah penimpaan file (contoh: `macbook-pro-14-1731301234-1.jpg`).

---

## 6. Standar Integrasi WhatsApp & Tracking

### 6.1 Skema Pencatatan Log Tanpa Hambatan (Non-Blocking)
Ketika pengunjung mengklik tombol WhatsApp di halaman detail produk atau layanan:
1. Skrip client-side memicu `navigator.sendBeacon` atau fetch asinkron ke endpoint `/api/inquiry/track` dengan payload:
   ```json
   {
     "inquiryType": "PRODUCT",
     "productId": "prod_123",
     "variantName": "RAM 16GB / 512GB",
     "priceAtInquiry": 22499000
   }
   ```
2. Link WhatsApp `https://wa.me/...` langsung terbuka di tab baru tanpa delay, memastikan pengalaman pengguna tetap instan meskipun server tracking mengalami latensi.

### 6.2 Format Pesan Konsultasi WhatsApp
Pesan otomatis tersusun rapi membawa konteks lengkap:
```text
Halo Hadi Computer, saya tertarik dengan produk ini:
- Nama: Apple MacBook Pro 14 Inch Space Grey
- Varian: 16 GB RAM / 512 GB SSD
- Kondisi: Baru
- Harga: Rp 22.499.000 (Hemat Rp 9.000.000)
- Bonus: Free Sleeve Case + USB-C Hub
Link: https://hadicomputer.com/produk/apple-macbook-pro-14-inch-space-grey

Apakah unit ini masih tersedia? Terima kasih!
```

---

## 7. Rencana & Urutan Eksekusi Backend

1. **Inisialisasi Database & Prisma:**
   - Install `prisma` dan `@prisma/client`.
   - Setup file koneksi `.env` (`DATABASE_URL="mysql://root:password@localhost:3306/hadicomputer"`).
   - Generate migration awal dan sinkronisasi skema ke database MySQL.
2. **Setup Shadcn UI Admin Shell:**
   - Install komponen Shadcn UI yang diperlukan: `table`, `dialog`, `sheet`, `form`, `input`, `textarea`, `select`, `switch`, `dropdown-menu`, `tabs`, `sonner`.
   - Buat layout admin di `src/app/admin/layout.tsx` lengkap dengan sidebar navigasi, header status toko, dan tombol logout.
3. **Migrasi Data Awal (Seeding Script):**
   - Buat script `prisma/seed.ts` untuk mengimpor seluruh data 24 produk, 3 banner, dan layanan dari `products.json` ke MySQL sehingga katalog tidak kosong saat pertama kali beralih ke database.
4. **Implementasi Halaman CMS CRUD:**
   - Produk (List, Create, Edit, Delete, Toggle Ketersediaan).
   - Banner & Interactive Hotspot Canvas.
   - Kategori & Merek.
   - Pengaturan Toko & Log WhatsApp.
5. **Switching Frontend:**
   - Ubah `src/lib/repository.ts` dari pembacaan file JSON lokal menjadi query Prisma langsung via server components.
