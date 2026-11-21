# Deploy rigspace.id ke Server

> Panduan memindahkan **kode + database + semua foto/banner** ke server produksi sehingga
> tampilan di server **persis sama** dengan lokal. Aturan pengembangan tetap di [`AGENTS.md`](../AGENTS.md).

---

## 1. Ukuran yang Dipindahkan (diukur 21 November 2026)

| Bagian | Isi | Ukuran | Cara kirim |
|---|---|---|---|
| Kode (git) | 392 file ter-track (src, prisma, docs, `public/images`, `public/platform`) | ±25 MB | `git push` / `git clone` |
| └ `public/images` | logo & foto bawaan prototype | 10 MB | ikut git |
| └ `public/platform` | gambar landing page rigspace.id | 272 KB | ikut git |
| └ `docs/` | dokumen, aset brand, screenshot | 11 MB | ikut git (tidak dipakai saat runtime) |
| **Foto upload** `public/uploads` | **521 file** | **23 MB** | **rsync** (bukan git) |
| └ `products/` | 502 file (hampir semua WebP) | 22 MB | |
| └ `logos/` | 14 file | 1,1 MB | |
| └ `banners/` | 5 file | 152 KB | |
| Database `hadicomputer` | 21 tabel, ±3 MB (lihat rincian di bawah) | ±3 MB, dump SQL ±1–2 MB | `mysqldump` → import |
| `.upload-backups/` | foto asli sebelum dioptimasi / dibersihkan (untuk rollback) | 3,3 MB | opsional |
| `node_modules` / `.next` | dibuat ulang di server | 837 MB / 580 MB | **jangan dikirim** |

**Total yang benar-benar dikirim: ±50 MB** (kode 25 MB + foto 23 MB + dump DB ±2 MB).

### Isi database saat ini

| Toko (slug) | Produk aktif | Banner |
|---|---|---|
| `plazabitcom` | 250 | 5 |
| `hadicomputer` | 22 | 3 |
| `ijencomputer` | 22 | 3 |
| `expocomp` | 22 | 3 |

Tabel terbesar: `products` 272 baris (1,8 MB), `product_images` 406, `product_specs` 655, `brands` 74,
`categories` 21, `banners` 14 (+ 12 hotspot), `platform_users` 4, `tenants` 4. Collation semua tabel
`utf8mb4_unicode_ci` (aman untuk MySQL 8+/9 maupun MariaDB 10.6+).

### Audit foto vs database

- Database merujuk **259 file** di `/uploads/...` (10,2 MB). **Semuanya ada di disk — 0 file hilang.**
- 262 file lain tidak dirujuk database (versi lama sebelum dirapikan, foto yang diganti). Tetap ikut
  dikirim agar rollback `scripts/clean-product-photos.ts --revert` masih bisa dipakai di server.
- Tidak ada URL `localhost`/IP lokal/tunnel di data produk, banner, atau pengaturan (hanya di
  `inquiry_logs` yang memang log kunjungan).

---

## 2. Kenapa Foto Tidak Lewat Git

`public/uploads` adalah **data milik toko** (hasil upload CMS), bukan kode. Isinya berubah setiap kali
merchant mengunggah, jadi:

- Dikirim dengan `rsync` dan disimpan di folder **persisten** di server (tidak boleh tertimpa/terhapus
  saat deploy kode baru).
- Wajib ikut backup harian bersama database — foto & database adalah satu paket.
- Catatan: 12 file lama di `public/uploads` masih ter-track git dari commit awal. Versi yang benar adalah
  yang di disk (dikirim via rsync). Disarankan dikeluarkan dari git (`git rm -r --cached public/uploads`
  + tambah `public/uploads/` ke `.gitignore`) supaya `git pull` di server tidak bentrok dengan foto.

---

## 3. Kebutuhan Server

- Node.js **22 LTS atau 24** (lokal: 24.0.0). `npm` saja (bukan yarn/pnpm).
- MySQL 8+/9 atau MariaDB 10.6+ (lokal: MySQL 9.2).
- Linux x64/arm64. `sharp` memakai binary native → **wajib `npm ci` di server**, jangan menyalin
  `node_modules` dari Mac.
- Reverse proxy (Nginx/Caddy) yang meneruskan header `Host`, `X-Forwarded-Host`, `X-Forwarded-Proto`
  (resolver toko membaca host dari header ini).
- Batas upload proxy **≥ 16 MB** (`MAX_INPUT_BYTES` = 15 MB), contoh Nginx `client_max_body_size 20m;`.
- Proses manager: PM2 atau systemd (`npm start` = `next start --hostname 0.0.0.0`, port 3000).

### DNS & SSL (Cloudflare)

| Record | Nilai |
|---|---|
| `A rigspace.id` | IP server |
| `A *.rigspace.id` | IP server (wildcard → semua etalase `{slug}.rigspace.id`) |

Sertifikat wildcard `*.rigspace.id` butuh DNS challenge (Cloudflare proxy + SSL "Full (strict)" +
Origin Certificate, atau certbot `--dns-cloudflare`).

---

## 4. Environment Variable Produksi

Buat `.env` di server (tidak pernah di-commit). Daftar lengkap ada di [`.env.example`](../.env.example).

| Variabel | Wajib | Keterangan |
|---|---|---|
| `DATABASE_URL` | ✅ | `mysql://user:pass@host:3306/hadicomputer` |
| `ADMIN_JWT_SECRET` | ✅ | acak ≥ 32 karakter (`openssl rand -base64 48`) |
| `GOD_MODE_JWT_SECRET` | ✅ | acak, **berbeda** dari `ADMIN_JWT_SECRET` |
| `DEMO_LINK_SECRET` | ✅ | acak; mengganti nilainya = semua link demo lama mati |
| `GOD_MODE_USER` / `GOD_MODE_PASSWORD` | ✅ | superadmin cadangan; password kuat (8–72 karakter) |
| `NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN` | ✅ | `rigspace.id` (dibaca saat build) |
| `NEXT_PUBLIC_SITE_URL` | ✅ | `https://rigspace.id` |
| `NEXT_PUBLIC_PLATFORM_GA_ID` | – | GA4 platform; kosong = nonaktif |

> ⚠️ Kode punya secret cadangan bawaan untuk development. **Di produksi ketiga secret wajib diisi**,
> kalau tidak siapa pun yang membaca repo bisa memalsukan sesi login.
> `NEXT_PUBLIC_*` ditanam saat `npm run build` — ubah nilainya = build ulang.

---

## 5. Langkah Deploy Pertama (data persis seperti lokal)

### 5.1 Di laptop (sumber)

```bash
# a. Pastikan semua kode sudah di-commit & di-push
git status && git push origin <branch>

# b. Dump database lengkap (struktur + data)
mysqldump --single-transaction --routines --triggers --no-tablespaces \
  --default-character-set=utf8mb4 -u <user> -p hadicomputer > rigspace-db.sql

# c. Manifest checksum semua foto (untuk membuktikan foto di server identik)
find public/uploads -type f ! -name .DS_Store -print0 | sort -z | xargs -0 shasum -a 256 > uploads.sha256
wc -l uploads.sha256   # harus 521 (per 21 Nov 2026)
```

### 5.2 Kirim ke server

```bash
# Foto (persis, termasuk hapus file yang sudah tidak ada di lokal)
rsync -avz --checksum --exclude '.DS_Store' public/uploads/ user@server:/srv/rigspace/shared/uploads/

# Dump DB & manifest
rsync -avz rigspace-db.sql uploads.sha256 user@server:/srv/rigspace/shared/
```

### 5.3 Di server

```bash
cd /srv/rigspace
git clone <repo> app && cd app && git checkout <branch>

# Folder foto persisten → dihubungkan ke lokasi yang dibaca aplikasi
# (hapus dulu salinan dari git agar symlink tidak terbuat DI DALAM folder lama)
rm -rf public/uploads && ln -s /srv/rigspace/shared/uploads public/uploads

# .env produksi (lihat Bagian 4)
nano .env

# Dependensi (sharp & Prisma butuh binary Linux)
npm ci

# Database: BACKUP dulu bila sudah ada isinya, lalu import
mysqldump -u <user> -p hadicomputer > /srv/rigspace/shared/backup-sebelum-deploy.sql   # bila DB sudah ada
mysql -u <user> -p -e "CREATE DATABASE IF NOT EXISTS hadicomputer CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
mysql -u <user> -p hadicomputer < /srv/rigspace/shared/rigspace-db.sql

# Pastikan schema = kode (output harus kosong / "No difference")
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script

# Build & jalankan
npm run build
pm2 start npm --name rigspace -- start && pm2 save
```

### 5.4 Verifikasi "persis sama"

```bash
# Semua foto identik (setiap baris harus OK, tidak ada FAILED)
cd /srv/rigspace/app && sha256sum -c /srv/rigspace/shared/uploads.sha256 | grep -v ': OK$' || echo "SEMUA FOTO IDENTIK"
find public/uploads/ -type f | wc -l     # 521
```

Lalu buka di browser:

- [ ] `https://rigspace.id` → landing page (hero, gambar template, form Minta Demo).
- [ ] `https://plazabitcom.rigspace.id` → 5 banner & foto produk sama dengan lokal.
- [ ] Toko lain (`hadicomputer`, `ijencomputer`, `expocomp`) → 3 banner masing-masing.
- [ ] `https://alamat-ngawur.rigspace.id` → "Toko tidak ditemukan".
- [ ] `/admin` & `/god-mode` bisa login; upload 1 foto uji → tampil → hapus lagi.
- [ ] Toko berstatus DEMO tampil "Segera hadir" untuk pengunjung anonim.

---

## 6. Deploy Berikutnya (server sudah berisi data nyata)

Setelah live, **jangan menimpa database & foto server dengan data lokal** — data merchant di server
lebih baru. Yang dikirim hanya kode + perubahan schema:

```bash
cd /srv/rigspace/app
mysqldump -u <user> -p hadicomputer > /srv/rigspace/shared/backup-$(date +%F).sql
git pull
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script > /tmp/x.sql
cat /tmp/x.sql          # BACA dulu, pastikan tidak ada DROP yang tidak disengaja
npx prisma db execute --file /tmp/x.sql
npm ci && npm run build && pm2 restart rigspace
```

File SQL perubahan schema yang sudah pernah dibuat disimpan di [`docs/deploy/sql/`](deploy/sql/)
sebagai referensi (urut tanggal). Cara paling aman tetap `migrate diff` terhadap database server,
karena hasilnya selalu sesuai kondisi server saat itu.

## 7. Backup Rutin

- Harian: `mysqldump` + `rsync` folder `shared/uploads` ke penyimpanan lain (keduanya satu paket).
- Simpan minimal 7 hari terakhir; uji restore sesekali.
