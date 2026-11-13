# PRD v2 — Hadi Computer

Status: prototype frontend untuk approval client. CMS dan MySQL belum dikerjakan.

## Tujuan dan tahapan

Katalog elektronik Hadi Computer membantu pembeli umum dan lokal menemukan perangkat, memahami spesifikasi serta kondisi, lalu berkonsultasi dengan owner melalui WhatsApp.

1. **Tahap sekarang:** seluruh halaman publik dengan Next.js, TypeScript, komponen reusable, dan data dummy lokal. Client menyetujui identitas visual, susunan konten, dan pengalaman ponsel sebelum backend dibangun.
2. **Setelah approval:** CMS `/admin`, autentikasi owner, MySQL dengan Prisma, penyimpanan gambar persisten, dan laporan klik.

Tidak ada akun buyer, keranjang, checkout, pembayaran online, atau pencatatan pesanan.

## Keputusan desain

- Clean retail: dominan putih, charcoal, abu-abu lembut, dan aksen merah logo. Panel gelap terbatas pada kampanye gaming.
- Plus Jakarta Sans, weight 400/500/600/700. Font disimpan melalui paket lokal agar tidak membutuhkan Google Fonts saat runtime.
- Logo menggunakan gambar asli yang diberikan client.
- Layout maksimum 1.280 px, grid empat produk desktop, tiga tablet, dan dua ponsel. Pada katalog dengan sidebar, grid menyesuaikan ruang yang tersedia.
- Kartu produk memakai area nama maksimal dua baris dan angka harga tabular. Komponen sama di beranda, katalog, dan produk terkait.
- Token bersama mengatur warna, tipografi, spacing, border, radius, dan shadow tipis (`--shadow-card`, `--shadow-sm`, `--shadow-md`).
- Standar tipografi menetapkan ukuran font minimum 12px di seluruh antarmuka (tidak ada elemen teks dengan font-size di bawah 12px, seperti catatan kaki, badge, atau section-note).
- Seluruh komponen formulir (Input, Select, Label, Slider) menggunakan pola komponen Shadcn UI dengan token desain konsisten: radius halus, border netral, fokus ring aksen merah toko, bayangan tipis, dan dropdown select dengan ikon chevron yang memiliki jarak/margin kanan 16px dari tepi.
- Komponen reusable mencakup container, tombol, input/select/slider berbasis Shadcn UI, badge, heading, breadcrumb, empty state, header, footer, hero slider, kategori, kartu/grid produk, filter, pagination, layanan, CTA WhatsApp, dan fallback gambar.
- Interaksi visual diperkaya animasi mikro halus (hover lift pada kartu kategori, kartu produk, tombol, dan transisi tautan navigasi).

## Hero dan banner

Satu slider lebar di dalam container dengan sudut membulat. Desktop: teks HTML di kiri, visual produk di kanan. Ponsel: teks di atas dan visual di bawah.

Tiga kampanye dummy memakai visual hasil imagegen yang konsisten:

1. Kerja/kuliah: laptop silver, suasana studio netral.
2. Gaming: setup PC dan monitor dengan pencahayaan merah/charcoal.
3. Bekas pilihan: laptop profesional dengan latar sage.

Judul, deskripsi, dan CTA bukan bagian gambar. Slider menyediakan panah, indikator garis, swipe horizontal, serta jeda. Autoplay enam detik berhenti saat hover atau interaksi; fokus keyboard menghentikan autoplay. Reduced motion menonaktifkan autoplay dan transisi.

Gambar banner adalah ilustrasi kampanye. Foto katalog harus konsisten dengan identitas setiap produk dummy. Aset kampanye dan produk disimpan di proyek, bukan bergantung pada URL luar saat runtime.

## Seluruh halaman publik

### Beranda `/`

Header/pencarian, navigasi, hero, ringkasan nilai katalog, kategori populer, produk pilihan, koleksi kebutuhan (kuliah/kerja/kreatif), produk terbaru, kampanye rakit PC, koleksi terlaris manual, servis, lokasi, dan footer. Bagian koleksi kosong disembunyikan.

### Katalog `/katalog`

- Pencarian nama/model, merek, dan kode.
- Filter kategori, merek, kondisi baru/bekas, ketersediaan, harga minimum/maksimum, koleksi, dan kebutuhan.
- Urut terbaru/harga naik/harga turun, pagination, reset filter, chip filter aktif, serta empty state.
- Parameter filter disimpan pada URL: `q`, `kategori`, `merek`, `kondisi`, `status`, `min`, `max`, `koleksi`, `kebutuhan`, `urut`, `page`.
- Harga pada daftar mengikuti varian default bila ada. Produk tanpa nominal tetap muncul; tidak masuk filter rentang harga dan selalu ditempatkan terakhir pada kedua pengurutan harga.
- Sidebar filter desktop berukuran lebar 300px untuk kelegaan ruang form, dan berubah menjadi drawer filter pada ponsel.
- Filter rentang harga dilengkapi dual range slider interaktif berbasis Shadcn UI yang tersinkronisasi langsung dengan input nilai minimum dan maksimum.
- Sidebar desktop berubah menjadi drawer filter pada ponsel.

### Detail produk `/produk/[slug]`

Galeri foto, kode, merek, kategori, kondisi, harga, varian, ketersediaan, spesifikasi, deskripsi, garansi, catatan unit bekas, dan produk terkait dari kategori sama.

Pilihan varian mengubah harga, status, dan konteks WhatsApp. Produk habis tetap terlihat, dengan CTA tanya ketersediaan. Halaman ponsel mempunyai CTA tetap di bawah layar. Slug tidak dikenal mengembalikan 404.

### Layanan `/layanan` dan `/layanan/[slug]`

Servis/perawatan serta jasa rakit PC, masing-masing berisi ringkasan, cakupan, informasi harga, tahapan konsultasi, visual ilustratif, dan CTA WhatsApp. Tidak ada konfigurator PC atau pemesanan jadwal otomatis.

### Lokasi `/lokasi` dan kontak `/kontak`

Area informasi alamat, jam operasional, foto/peta, WhatsApp, email, serta media sosial resmi. Karena belum ada data terverifikasi, prototype memakai pemberitahuan belum dikonfirmasi dan ilustrasi peta yang jelas bukan lokasi sebenarnya. Tidak menampilkan alamat, nomor, rating, atau klaim toko fiktif.

## Data dan perilaku prototype

- 24 produk contoh: laptop, PC desktop/mini PC, smartphone, tablet, dan aksesori; mencakup baru/bekas, varian, tersedia/preorder/habis, harga nominal, dan hubungi untuk harga.
- Tiga banner dan dua layanan.
- Tipe utama: `Product`, `ProductVariant`, `Availability`, `Condition`, `Service`, `Banner`, `StoreSettings`.
- Adapter `repository` memisahkan sumber data dari tampilan agar dapat diganti Prisma setelah approval.
- Kondisi fisik barang bekas berbeda menjadi produk terpisah. Varian hanya untuk konfigurasi dalam produk yang sama.
- Semua produk/harga/spesifikasi/garansi/kondisi contoh diberi penjelasan demo, bukan penawaran aktual.
- CTA WhatsApp membuka dialog pratinjau pesan yang dapat disalin sampai nomor resmi tersedia. Produk membawa nama, kode, varian bila ada, harga, dan URL; layanan membawa nama serta URL. Tidak mengirim pesan otomatis.
- Navigasi, slider, filter, pagination, galeri, varian, dan dialog harus bekerja. Tidak ada tombol palsu atau tautan tanpa tujuan.
- Prototype tidak diindeks mesin pencari (`noindex`, `nofollow`, dan robots disallow). Metadata judul/description dan Open Graph disiapkan; sitemap produksi menunggu data terbit.

## CMS dan produksi setelah approval

Satu aplikasi Next.js + MySQL dengan Prisma. Tampilan serta login CMS di `/admin` terpisah dari website publik; satu peran owner penuh tanpa registrasi publik.

Owner dapat menambah, mengedit, menduplikasi, mendraft, menerbitkan, serta mengarsipkan produk; mengelola varian, foto, spesifikasi, garansi, kategori, merek, label, layanan, banner, urutan koleksi, visibilitas bagian, kontak, jam buka, media sosial, dan footer. Susunan tipe bagian beranda tetap; bukan page builder bebas.

Pisahkan:

- Publikasi: draft/tampil/arsip. Draft dan arsip tidak dapat diakses lewat detail publik.
- Ketersediaan: tersedia/preorder/habis. Tanpa jumlah stok.
- Label promosi manual: terbaru/terlaris/promo/pilihan Hadi. Terlaris bukan hasil pencatatan penjualan.
- Harga: nominal rupiah atau hubungi untuk harga, termasuk per varian.

Satu toko dan satu nomor WhatsApp owner. Klik WhatsApp dicatat menurut produk/jasa dan rentang tanggal; kegagalan pencatatan tidak menghalangi pembukaan WhatsApp. Klik bukan pengunjung unik, bukti pesan terkirim, atau penjualan.

Foto tersimpan persisten, referensi di database. Semua akses database dan pemeriksaan izin berlangsung di server. Unggahan divalidasi tipe/ukuran. Konten terbit dapat diperbarui tanpa deployment ulang. Sitemap hanya memuat halaman publik yang diterbitkan.

Hosting produksi ditentukan kemudian dan harus mendukung Next.js server, MySQL, file persisten, HTTPS, serta backup. Impor spreadsheet, artikel, ulasan, integrasi stok, konfigurator PC, dan pelacakan transaksi ditunda.

## Kriteria penerimaan tahap prototype

- Seluruh halaman publik dapat dijelajahi; slug tidak dikenal memakai 404.
- Visual, font, spacing, kartu, dan tombol konsisten.
- Pencarian serta kombinasi filter bekerja, termasuk hasil kosong, pagination, dan penempatan harga kosong.
- Pilihan varian konsisten antara harga, ketersediaan, dan pesan.
- Slider mendukung keyboard, swipe, pause, dan reduced motion.
- Dialog dapat ditutup dengan tombol dan Escape, serta mendukung salin pesan/fallback manual.
- Aset foto lokal tersedia; kegagalan gambar memiliki fallback.
- Pemeriksaan pada 360, 390, 768, dan 1.440 px tanpa overflow horizontal; fokus keyboard terlihat dan input berlabel.
- Typecheck, tes perilaku katalog/pesan, dan production build lulus.
- Client menyetujui arah visual dan pengalaman ponsel sebelum CMS dimulai.

## Asumsi

Bahasa Indonesia, rupiah, satu toko, satu nomor owner, satu peran admin. Informasi resmi toko dan daftar produk nyata belum diberikan. Seluruh persetujuan tahap ini berlaku untuk prototype lokal; belum ada publikasi atau backend produksi.

## Status implementasi tahap pertama

Prototype seluruh halaman publik telah dibangun dengan data lokal: 24 produk, 51 file foto galeri, tiga visual banner hasil imagegen, dan dua layanan. Navigasi, slider, pencarian/filter, pagination, pilihan varian, galeri, dan pratinjau pesan tersedia. Hasil pemeriksaan dicatat di [QA](QA.md).

Status berikutnya adalah peninjauan desain oleh client. CMS dan MySQL tetap ditunda sampai approval.

### Perluasan katalog PC — 10 November 2026

Delapan desktop/mini PC dari referensi resmi MSI dan ASUS ditambahkan ke kategori `pc` (PC Desktop). Navigasi kategori, tab produk pilihan, filter katalog, detail, produk terkait, dan pesan WhatsApp memakai alur komponen yang sama. Beranda mendapat koleksi PC empat kartu dengan tautan menuju seluruh delapan PC. Filter kebutuhan mendukung Gaming. Sumber foto dan spesifikasi dicatat di ASSETS.md; harga dan konfigurasi demo tetap ditandai contoh.

### Penyempurnaan beranda mobile — 11 November 2026

Pada layar di bawah 768 px, header menampilkan jam buka, logo, menu, dan pencarian dalam ruang yang lebih ringkas. Banner memakai judul dan deskripsi singkat, visual yang sama, dan kontrol sentuh 44 × 44 px. Setelah banner dan dua manfaat utama, pengunjung langsung melihat kategori sebelum promo.

Kartu memakai kisi dua kolom dengan harga rupiah, kondisi, ketersediaan, dan diskon yang mudah dipindai. Tampilan awal merangkum 12 produk berbeda dari promo, produk pilihan, terbaru, dan PC; koleksi favorit tidak diulang. Tab kategori dan tautan ke katalog tetap memberi akses ke produk lainnya. Layanan, lokasi, dan footer diringkas. Tombol WhatsApp mengambang memberi akses ke konsultasi umum selama pengunjung berada di beranda mobile.

Layout, koleksi, dan naskah desktop yang telah disetujui client dipertahankan. Komponen slider, kategori, dan kartu digunakan kembali untuk kedua ukuran layar. CMS dan MySQL tetap di luar tahap ini.
