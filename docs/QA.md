# Pemeriksaan prototype

Tanggal: 10 November 2026 (Asia/Jakarta). Status: siap ditinjau client, belum disetujui untuk produksi.

## Pemeriksaan otomatis

- `npm run typecheck`: lulus.
- `npm run build`: lulus; 27 halaman statis dihasilkan, katalog memakai rendering sesuai query URL.
- `npm test`: 9 tes lulus. Mencakup filter gabungan, pencarian kosong, harga kosong selalu terakhir, rentang harga, pagination, koleksi/kebutuhan, varian, konteks pesan, slug unik, dan keberadaan 40 foto galeri.
- HTTP `/produk/produk-tidak-ada`: 404.
- `/robots.txt`: `User-Agent: *`, `Disallow: /`; metadata juga noindex/nofollow.

## Pemeriksaan browser

Tujuh rute utama diperiksa pada lebar **360, 390, 768, dan 1.440 px**: beranda, katalog, detail produk bervarian, layanan, detail rakit PC, lokasi, dan kontak. Seluruh 28 kombinasi menampilkan konten utama tanpa overflow horizontal; tidak ada foto yang selesai dimuat dengan natural width nol pada saat pemeriksaan.

Interaksi yang dicoba:

- Perpindahan hero menggunakan panah dan indikator; interaksi menghentikan autoplay.
- Menu navigasi ponsel dan navigasi menuju katalog.
- Drawer filter kategori laptop + kondisi bekas menghasilkan tiga produk yang sesuai dan parameter tersimpan di URL.
- Urutan harga naik/turun, lalu halaman kedua. Harga kosong berada setelah produk bernominal.
- Pencarian produk yang tidak ada menampilkan empty state.
- Varian 32 GB / 1 TB menampilkan Rp21.999.000 dan preorder; pesan membawa konfigurasi yang sama.
- Varian 32 GB / 2 TB menampilkan hubungi untuk harga, stok habis, dan CTA tanya ketersediaan.
- Galeri berganti ke foto kedua.
- Dialog pesan dapat disalin dan ditutup dengan Escape. Tidak ada pesan dikirim ke WhatsApp.
- Pemeriksaan visual beranda desktop dan ponsel serta halaman katalog/detail ponsel.

## Preview tersimpan

- [Beranda desktop](screenshots/home-desktop.png)
- [Beranda lengkap](screenshots/home-full.png)
- [Beranda ponsel](screenshots/home-mobile.png)

## Batas pemeriksaan

Pengujian dilakukan di browser desktop dengan emulasi ukuran layar, bukan perangkat fisik. Swipe dan reduced-motion sudah diimplementasikan; gesture pada perangkat sentuh fisik serta preferensi OS belum diuji langsung. Fallback gambar tersedia pada komponen; pemeriksaan otomatis memastikan file sumber ada, tanpa sengaja menghapus aset untuk memicu fallback.

Belum ada backend, CMS, login, database, statistik klik, domain produksi, atau pengiriman pesan ke nomor owner. Semua harga, spesifikasi, kondisi unit, garansi, dan cakupan layanan adalah contoh untuk approval. Foto toko dan data kontak resmi belum diberikan.

## Pemeriksaan revisi beranda mobile — 11 November 2026

- Pada lebar 320, 360, 390, 430, dan 767 px, beranda tampil tanpa overflow horizontal. Banner 430 px dengan enam kontrol berukuran 44 × 44 px. Gambar yang selesai dimuat tidak menunjukkan kegagalan. Pada 768 px, layout kembali ke versi desktop.
- Pada 390 px, kategori tampil sebelum promo, dan 12 kartu pada koleksi awal memiliki tautan produk berbeda. Tab PC, tautan kategori, pencarian, navigasi menu, dan tautan banner ke promo diuji. Fokus keyboard terlihat, dan Enter mengaktifkan pilihan banner.
- Tautan WhatsApp mengarah ke nomor toko dengan pesan konsultasi. Percakapan tidak dibuka dan tidak ada pesan yang dikirim.
- Pembanding desktop pada 1.440 px menunjukkan urutan, posisi judul, tinggi banner, dan tinggi halaman yang sama sebelum dan sesudah revisi.
- Typecheck frontend dan 9 tes katalog lulus. Production build lulus dengan 36 halaman statis sebelum berkas seed Prisma masuk ke workspace. Typecheck seluruh proyek saat pemeriksaan akhir menemukan error tipe di `prisma/seed.ts`, di luar revisi beranda.
- Preview: [beranda mobile](screenshots/home-mobile-refined.png) dan [kartu promo mobile](screenshots/home-mobile-promo.png).

## Pembaruan katalog PC — 10 November 2026

Delapan produk PC ditambahkan (24 produk total), dengan 11 foto tambahan dari produsen (51 file foto produk total). Tes pagination menggunakan jumlah produk agar tetap sesuai ketika konten bertambah. Sembilan tes, pemeriksaan tipe, dan build produksi lulus dengan 35 halaman statis.

Pemeriksaan browser menunjukkan delapan kartu pada `/katalog?kategori=pc`, seluruh foto PC termuat, dan tidak ada overflow horizontal pada ukuran desktop. Detail mini PC MSI Cubi N ADL menampilkan spesifikasi dan koleksi PC beranda tersedia. Pemeriksaan ini menggunakan server pengembangan yang sudah aktif; server tersebut tidak dihentikan.

- [Katalog PC](screenshots/pc-catalog.png)
- [Koleksi PC di beranda](screenshots/pc-home.png)

Sumber resmi setiap model dan foto dicatat di ASSETS.md. Harga, stok, dan konfigurasi demo tetap merupakan data contoh.

## Perbaikan rentang harga

Aturan input filter kini mengecualikan `type="range"` dengan `:where()` agar tidak meningkatkan specificity dan menimpa gaya kolom pencarian/harga. Slider memakai latar transparan, tanpa border/padding/min-height input teks; area handle native disejajarkan dengan handle visual dan fokus keyboard tetap terlihat.

Diverifikasi di desktop dan drawer ponsel 390 px: kedua slider setinggi 28 px dengan latar transparan; input pencarian dan harga tetap tanpa border ganda. Tombol panah keyboard mengubah minimum ke Rp500.000 dan maksimum ke Rp24.500.000, label serta kolom nilai mengikuti. Penerapan minimum Rp500.000 menghasilkan 19 produk berharga nominal. Build produksi lulus.

[Preview perbaikan slider](screenshots/price-slider-fixed.png).

## Format angka pada filter harga

Input minimum/maksimum memakai komponen `CurrencyInput` bersama: pemisah ribuan titik, keyboard numerik pada ponsel, awalan Rp dengan jarak 4 px, dan nilai GET tanpa pemisah melalui hidden input. Posisi kursor dijaga saat format berubah.

Diperiksa di browser: input `2500000` tampil `2.500.000`, tempelan `Rp 15.500.000` tampil `15.500.000`, dan slider mengubah nilai menjadi `3.000.000`. Penerapan rentang mengirim `min=3000000&max=15500000` dan menghasilkan sembilan produk. Typecheck dan build produksi lulus.
