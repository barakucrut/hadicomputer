# Hadi Computer

Prototype frontend katalog untuk approval client, dibuat dengan Next.js App Router, TypeScript, dan Plus Jakarta Sans. Seluruh produk dan harga adalah data contoh. CMS, login, MySQL, dan laporan belum diimplementasikan.

## Menjalankan lokal

Node.js 20.9+ (disarankan Node 22/24).

```sh
npm install
npm run dev
```

Buka http://localhost:3000. Jika port digunakan, lihat URL yang tercetak di terminal.

```sh
npm run typecheck
npm test
npm run build
npm start
```

Tidak membutuhkan `.env` atau database untuk prototype.

## Struktur

- `src/app`: halaman publik dan metadata. Katalog menerima filter pada query URL.
- `src/components`: komponen presentasi dan interaksi reusable.
- `src/styles-tokens.css`: warna, font, border, radius, dan shadow bersama.
- `src/lib/types.ts`: kontrak data frontend.
- `src/lib/repository.ts` dan `products.json`: adapter/data dummy yang dapat diganti Prisma.
- `src/lib/catalog.ts`: pencarian, filter, sorting, pagination, harga, dan pesan WhatsApp.
- `public/images`: logo asli, foto produk lokal, dan tiga visual kampanye hasil imagegen.
- [PRD v2](docs/PRD.md): keputusan desain, cakupan prototype, dan kebutuhan produksi.
- [Aset visual](docs/ASSETS.md): sumber foto dan prompt banner.
- [Pemeriksaan](docs/QA.md): hasil verifikasi prototype.

## Catatan demo

- WhatsApp membuka pratinjau pesan dan tombol salin; nomor owner belum tersedia.
- Alamat, jam, media sosial, dan peta aktual belum diisi. Ilustrasi peta tidak menunjukkan lokasi toko.
- `robots.txt` dan metadata melarang indexing prototype. Ubah kebijakan ini setelah data produksi terverifikasi.
- Jangan memakai data demo sebagai harga, stok, spesifikasi, atau klaim toko yang nyata.

## Tahap setelah approval

Sambungkan adapter data ke Prisma/MySQL, bangun CMS `/admin` beserta autentikasi, penyimpanan unggahan persisten, dan pencatatan klik WhatsApp. Pilih hosting serta backup sesuai PRD. Tidak ada integrasi checkout atau pembayaran.
