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
| **Foto upload** `public/uploads` | **521 file** | **23 MB** | **ikut git khusus deploy pertama**, lalu dikeluarkan (Bagian 2) |
| └ `products/` | 502 file (hampir semua WebP) | 22 MB | |
| └ `logos/` | 14 file | 1,1 MB | |
| └ `banners/` | 5 file | 152 KB | |
| Database `hadicomputer` | 21 tabel, ±3 MB (lihat rincian di bawah) | ±3 MB, dump SQL ±1–2 MB | `mysqldump` → import |
| `.upload-backups/` | foto asli sebelum dioptimasi / dibersihkan (untuk rollback) | 3,3 MB | opsional |
| `node_modules` / `.next` | dibuat ulang di server | 837 MB / 580 MB | **jangan dikirim** |

**Total yang benar-benar dikirim: ±50 MB** (repo ±48 MB termasuk foto + dump DB ±2 MB).

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

## 2. Foto: Ikut Git Sekali, Lalu Dikeluarkan

`public/uploads` adalah **data milik toko** (hasil upload CMS), bukan kode. Untuk deploy pertama foto
sengaja **ikut git** agar server cukup `git clone` dan hasilnya persis lokal. Setelah itu foto harus
keluar dari git, karena merchant mulai mengunggah langsung di server.

> ⚠️ **Bahaya utama:** commit yang mengeluarkan `public/uploads` dari git, bila di-`git pull` begitu saja di
> server, akan **menghapus semua foto dari disk server**. Wajib ikuti urutan di Bagian 6.1.

Alur lengkap:

1. Deploy pertama: commit seluruh `public/uploads` → push → clone di server (Bagian 5).
2. Di server: salin foto ke folder persisten `/srv/rigspace/shared/uploads`.
3. Di laptop: `git rm -r --cached public/uploads` + `public/uploads/` di `.gitignore` → commit → push.
4. Di server: `git pull`, lalu `public/uploads` diganti symlink ke folder persisten. Sejak itu foto aman
   dari deploy apa pun dan ikut backup harian bersama database.

Sebelum commit foto: pastikan pekerjaan merapikan foto (mis. Bitcom) sudah selesai, dan dump database
diambil **sesudah** commit foto, supaya isi database cocok dengan foto yang dikirim.

---

## 3. Kebutuhan Server

- Node.js **22 LTS atau 24** (lokal: 24.0.0). `npm` saja (bukan yarn/pnpm).
- MySQL 8+/9 atau MariaDB 10.6+ (lokal: MySQL 9.2).
- Linux x64/arm64. `sharp` memakai binary native → **wajib `npm ci` di server**, jangan menyalin
  `node_modules` dari Mac.
- Akses baca ke repo GitHub `barakucrut/hadicomputer` (private) lewat **deploy key** (Bagian 4.1).
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

### 4.1 Deploy Key GitHub (akses clone dari server)

Deploy key = SSH key milik **server**, hanya untuk **satu repo**, **read-only**. Lebih aman daripada
memakai akun/token pribadi: bila server bermasalah, cukup hapus key-nya di GitHub.

```bash
# Di server (sebagai user yang menjalankan aplikasi)
ssh-keygen -t ed25519 -C "rigspace-server-deploy" -f ~/.ssh/rigspace_deploy -N ""
cat ~/.ssh/rigspace_deploy.pub        # salin isinya

cat >> ~/.ssh/config <<'CFG'
Host github-rigspace
  HostName github.com
  User git
  IdentityFile ~/.ssh/rigspace_deploy
  IdentitiesOnly yes
CFG

ssh -T github-rigspace                # balasan "successfully authenticated" = berhasil
```

Di GitHub: repo → **Settings → Deploy keys → Add deploy key** → tempel isi `.pub`, beri judul
"rigspace server", **jangan centang "Allow write access"**. Private key (`rigspace_deploy` tanpa `.pub`)
tidak pernah keluar dari server.

Clone memakai alias host di atas: `git clone git@github-rigspace:barakucrut/hadicomputer.git app`.

---

## 5. Langkah Deploy Pertama (data persis seperti lokal)

### 5.1 Di laptop (sumber)

```bash
# a. Commit kode + seluruh foto, lalu push branch yang akan di-deploy
git add -A && git commit -m "chore(deploy): snapshot foto upload untuk deploy pertama"
git push -u origin <branch>

# b. Dump database lengkap (struktur + data) — diambil SESUDAH commit foto
mysqldump --single-transaction --routines --triggers --no-tablespaces \
  --default-character-set=utf8mb4 -u <user> -p hadicomputer > rigspace-db.sql

# c. Manifest checksum semua foto (untuk membuktikan foto di server identik)
find public/uploads -type f ! -name .DS_Store -print0 | sort -z | xargs -0 shasum -a 256 > uploads.sha256
wc -l uploads.sha256   # harus 521 (per 21 Nov 2026)
```

### 5.2 Kirim dump DB ke server

Dump database **tidak** masuk git (berisi data akun & hash password).

```bash
scp rigspace-db.sql uploads.sha256 user@server:/srv/rigspace/shared/
```

### 5.3 Di server

```bash
mkdir -p /srv/rigspace/shared && cd /srv/rigspace
git clone git@github-rigspace:barakucrut/hadicomputer.git app && cd app && git checkout <branch>

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

### 6.1 Sekali saja: mengeluarkan foto dari git (urutan wajib)

```bash
# 1) SERVER — amankan foto ke folder persisten SEBELUM pull apa pun
cd /srv/rigspace/app
cp -a public/uploads /srv/rigspace/shared/uploads
find /srv/rigspace/shared/uploads -type f | wc -l     # >= 521

# 2) LAPTOP — keluarkan dari git (file di laptop TIDAK terhapus)
git rm -r --cached public/uploads
echo "public/uploads/" >> .gitignore
git commit -m "chore(deploy): keluarkan public/uploads dari git" && git push

# 3) SERVER — pull (foto di public/uploads ikut terhapus oleh git), lalu pasang symlink
git pull
rm -rf public/uploads && ln -s /srv/rigspace/shared/uploads public/uploads
pm2 restart rigspace
sha256sum -c /srv/rigspace/shared/uploads.sha256 | grep -v ': OK$' || echo "SEMUA FOTO IDENTIK"
```

Foto yang sempat diunggah merchant di antara langkah 1 dan 3 ikut tersalin bila langkah 1 diulang
tepat sebelum `git pull` (gunakan `rsync -a public/uploads/ /srv/rigspace/shared/uploads/`).

### 6.2 Deploy kode rutin

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
