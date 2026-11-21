<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# RIGSPACE — PANDUAN PENGEMBANGAN (WAJIB DIBACA SEBELUM MENULIS KODE)

> Dokumen ini adalah **satu-satunya sumber aturan** (SSOT) untuk developer & AI coding agent.
> Visi bisnis & roadmap ada di `docs/BUSINESS_STRATEGY.md`. Panduan deploy produksi ada di `docs/DEPLOYMENT.md`. Showcase UI interaktif ada di `/god-mode/styleguide`.

---

## 0. Konteks Produk & Branch

| Branch | Isi | Database lokal |
|---|---|---|
| `main` | **SaaS multi-tenant rigspace.id** (bisnis utama): tenant, template storefront, god-mode, Tailwind | `hadicomputer` |
| `hadicomputer` | Build single-client khusus klien Hadi Computer (tanpa tenant, tanpa Tailwind) | `hadicomputer_client` |

- Jangan membawa fitur multi-tenant ke branch `hadicomputer`, dan jangan membawa hack single-client ke `main`.
- `.env` tidak di-commit dan berlaku per folder — saat pindah branch, sesuaikan `DATABASE_URL`.
- Package manager: **npm** (`package-lock.json`). Jangan menjalankan `yarn` / `pnpm` di repo ini.
- Stack: Next.js 16 (App Router, `src/middleware.ts`), React 19, Prisma 7 + `@prisma/adapter-mariadb` (MySQL/MariaDB), JWT (`jose`), Tailwind v4 (tanpa preflight), `sharp`, `exceljs`.

---

## 1. Peta Kode Penting

| Area | Lokasi | Keterangan |
|---|---|---|
| Auth & guard API admin | `src/lib/auth.ts` | `authorizeAdmin()`, `requireAdminSession()`, `hasPermission()` |
| Guard API god-mode | `src/lib/god-auth.ts` | `authorizePlatform([...peran])`, `tenantScope()`, `requireGodSession()` (= superadmin) |
| Peran tim platform | `src/lib/platform-access.ts`, `src/components/god-mode/god-shell.tsx` | `canAccessGodPath()`, `pickTenantUpdate()`, `tenantHealth()`; `GodSidebar`/`GodPageFrame`/`useGodSession()` |
| Resolusi tenant storefront | `src/lib/tenant-resolver.ts`, `src/lib/platform-domain.ts` | id internal → (CMS) toko yang dikelola → `?store=`/cookie preview (**hanya tim login / host dev**) → custom domain → `{slug}.rigspace.id` → (dev saja) toko admin / toko pertama. Produksi tanpa fallback: `rigspace.id` = halaman platform, alamat lain = "Toko tidak ditemukan" (`resolution`) |
| Data storefront | `src/lib/live-repository.ts` | semua `getLive*()` otomatis dibatasi ke tenant aktif |
| Brand toko untuk metadata | `src/lib/store-brand.ts`, `src/lib/tenant-seo.ts` | nama, SEO, analitik, mode stok |
| Izin di UI | `src/components/admin/permissions.tsx` | `useCan()`, `ROUTE_PERMISSIONS`, `<AccessDenied>` |
| Daftar izin (checklist role) | `src/app/admin/user-role/page.tsx` → `PERMISSION_GROUPS` | |
| Role & owner helper | `src/lib/admin-roles.ts` | role sistem (`tenantId = null`) dipakai bersama, custom role per tenant |
| Respons standar tenant | `src/lib/tenant-scope.ts` | `notFoundResponse()`, `uniqueConflictResponse()` |
| SKU otomatis | `src/lib/product-sku.ts` | prefix per toko (`skuPrefix` atau inisial nama), nomor tidak pernah dipakai ulang |
| Stok | `src/lib/stock.ts` | `normalizeStock()`, `applyStockRule()`, `stockLabel()` |
| Gambar | `src/lib/image-optimizer.ts`, `src/lib/image-storage.ts` | semua upload lewat `storeImage()` |
| Fetch URL eksternal | `src/lib/remote-fetch.ts` | `fetchPublic()` dengan proteksi SSRF |
| Import/Export katalog | `src/lib/catalog-import/*` | kolom (`columns.ts`) = SSOT untuk template, parser & export |
| Starter Pack (data contoh) | `src/lib/starter-pack.ts`, `src/data/starter-pack.json`, `scripts/build-starter-pack.ts` | |
| Validasi SEO/analitik | `src/lib/store-seo.ts` | |
| Komponen UI admin | `src/components/admin/ui/*`, `src/components/ui/*` | lihat Bagian 9 |
| Testimoni pelanggan | `src/lib/testimonials.ts`, `src/components/testimonials-section.tsx`, `/admin/testimoni`, `/testimoni` | input manual admin (tanpa API Google); validasi `validateTestimonial()`, urutan beranda `selectHomeTestimonials()` (maks. 6, unggulan dulu); foto hanya `/uploads`; tampil di semua template via saklar `sections.testimonials`; link "ulasan Google" = `TenantSetting.googleReviewUrl`. **Dilarang** mengisi testimoni karangan untuk toko nyata |

---

## 2. Multi-Tenant: Aturan Isolasi Data (TIDAK BOLEH DILANGGAR)

1. **Setiap route API admin WAJIB diawali `authorizeAdmin([...izin])`** dan memakai `auth.tenantId` dari hasilnya:
   ```ts
   const auth = await authorizeAdmin(["products:edit"]);
   if (!auth.ok) return auth.response;
   const items = await prisma.product.findMany({ where: { tenantId: auth.tenantId, deletedAt: null } });
   ```
2. **`tenantId` TIDAK PERNAH diambil dari body/query klien.** Selalu dari sesi.
3. **Update/Delete wajib cek kepemilikan dulu**, lalu balas 404 bila milik tenant lain (jangan bedakan "tidak ada" vs "milik toko lain"):
   ```ts
   const owned = await prisma.banner.findFirst({ where: { id, tenantId: auth.tenantId }, select: { id: true } });
   if (!owned) return notFoundResponse("Banner");
   ```
4. **Relasi lintas model juga dicek**: kategori/merek/role yang dipakai produk/user harus milik tenant yang sama.
5. **Unik per tenant**, bukan global: `@@unique([tenantId, slug])`, `@@unique([tenantId, code])`. Cari dengan `findFirst({ where: { tenantId, slug } })` atau kunci `tenantId_slug`.
6. **Storefront**: panggil `getLive*()` tanpa tenantId pun aman (otomatis tenant aktif). **Dilarang** fallback ke data statis/contoh toko lain — toko kosong harus tampil kosong (komponen wajib menangani array kosong).
7. **Route `/api/god-mode/*` WAJIB diawali `authorizePlatform([...peran])`** (default & `requireGodSession()` = SUPERADMIN saja) — middleware hanya melindungi halaman `/god-mode`, bukan API-nya.
   - Endpoint yang dibuka untuk tim penjualan memakai `authorizePlatform(ALL_PLATFORM_ROLES)` dan wajib memfilter tenant dengan `tenantScope(auth.session)` + cek kepemilikan `findScopedTenant()` → 404 untuk tenant di luar lingkupnya (MARKETING = miliknya; CMO = miliknya + milik marketing timnya via `session.teamIds`).
   - Field yang boleh diubah per peran ditentukan `pickTenantUpdate()` (marketing: nama, WA, alamat, jam buka, warna). Paket/status/fitur/domain/penugasan = superadmin.
   - `getGodSession()` hanya mengembalikan SUPERADMIN (keuangan, dsb.).
   - **CMS toko via god-mode** (`POST /api/god-mode/auth/impersonate` → cookie `IMPERSONATION_COOKIE`): superadmin semua toko; CMO/Marketing **hanya toko dalam `tenantScope()`**, dicek live tiap request di `requireAdminSession()` (tanpa fallback ke toko lain — di luar lingkup = 401, halaman `/admin` dialihkan ke `/god-mode/tenants?cms=ditolak`). Izin tim penjualan = `SALES_CMS_PERMISSIONS` (`src/lib/platform-cms.ts`, tanpa `users:manage`/`roles:manage`); izin CMS baru yang boleh dipakai tim penjualan wajib ditambahkan di sana juga.
8. Halaman server di `/admin` yang query Prisma langsung wajib memakai `requireAdminSession()` dan filter `tenantId`.

---

## 3. Auth, Izin & Role (RBAC)

- Izin dibaca **live dari database** pada setiap request (bukan dari JWT) — perubahan role langsung berlaku.
- Owner & superadmin god-mode = akses penuh (`*`). Hanya Owner yang boleh memberi/membuat role berakses penuh, dan toko tidak boleh kehilangan Owner aktif terakhir.
- **Menambah izin baru** (mis. `reports:view`) wajib di 4 tempat:
  1. `PERMISSION_GROUPS` di `src/app/admin/user-role/page.tsx` (checklist role)
  2. guard API: `authorizeAdmin(["reports:view"])`
  3. guard halaman: `ROUTE_PERMISSIONS` di `src/components/admin/permissions.tsx`
  4. tombol/aksi UI: `const can = useCan(); can("reports:view") && <Button…>`
- UI hanya **menyembunyikan**; penegakan sebenarnya selalu di API.
- **Standar password semua akun** (`AdminUser` & `PlatformUser`): `src/lib/password-policy.ts` — 8–72 karakter (batas byte bcrypt), tidak hanya spasi, tidak sama dengan email. Semua tempat membuat/reset/ubah password wajib memakai `passwordPolicyError()` / `passwordChangeError()` (API **dan** form). Ubah password sendiri: `POST /api/admin/auth/change-password` & `POST /api/god-mode/auth/change-password`, UI `ChangePasswordDialog`/`ChangePasswordForm` (`src/components/account/change-password-dialog.tsx`) di sidebar kedua shell. Superadmin bawaan env diubah lewat `GOD_MODE_PASSWORD`.
- **Tim platform (god-mode)** = tabel `PlatformUser` (peran `SUPERADMIN` | `CMO` | `MARKETING`), terpisah dari `AdminUser` toko. Struktur tim: `PlatformUser.managerId` (hanya MARKETING, atasan wajib CMO aktif — `resolveManagerId()` + `isAssignableManager()`); CMO turun peran → anggota timnya otomatis dilepas. Pemegang tenant (`acquiredById`) = MARKETING atau CMO aktif; hanya superadmin yang memindahkan. Hak field CMO = marketing (`pickTenantUpdate`). Superadmin bawaan dari env (`GOD_MODE_USER`/`GOD_MODE_PASSWORD`) tetap berlaku sebagai cadangan. Akun dicek live per request (nonaktif = langsung 401). Tenant milik marketing ditandai `Tenant.acquiredById`.
- Menambah halaman god-mode: daftarkan di `NAV` + `MARKETING_PATHS` (`src/lib/platform-access.ts`) bila marketing boleh membukanya, lalu pakai `GodPageFrame`/`GodSidebar` (jangan menyalin sidebar).

---

## 4. Konvensi Route API

- Bahasa pesan error: **Bahasa Indonesia**, aman ditampilkan ke user. Jangan bocorkan `err.message` Prisma/internal ke klien.
- Status: `400` input salah · `401` belum login · `403` tanpa izin · `404` tidak ada/milik tenant lain · `409` konflik unik (slug/SKU) · `413` file terlalu besar · `500` error tak terduga (log di server).
- Validasi & sanitasi semua input klien (lihat `sanitizeRow()` di import sebagai contoh) — jangan percaya tipe dari browser.
- `BigInt` (harga) diserialisasi ke `number` sebelum `NextResponse.json`.
- Setelah mengubah data yang tampil di etalase: `revalidatePath("/", "layout")` (+ `/katalog` bila perlu).
- Proses berat (import, banyak foto) dipecah per batch dari klien (lihat `IMPORT_BATCH_SIZE`) — jangan satu request panjang.

---

## 5. Keamanan (Checklist Wajib)

- **Upload file**: selalu `storeImage()` (validasi isi file, buang EXIF/GPS, resize ≤1900px, WebP; SVG disanitasi). Dilarang `writeFile` langsung dari input user.
- **Fetch URL dari input user** (foto import, katalog website): selalu `fetchPublic()` — memblokir localhost, IP privat, metadata cloud, redirect berbahaya, file raksasa.
- **Data milik tenant yang masuk `<script>`/`<head>`**: JSON-LD wajib di-escape (`JSON.stringify(x).replace(/</g, "\\u003c")`); ID analitik/verifikasi wajib lolos regex ketat (`src/lib/store-seo.ts`). Dilarang `dangerouslySetInnerHTML` berisi teks bebas dari tenant.
- Secret production (`ADMIN_JWT_SECRET`, `GOD_MODE_JWT_SECRET`, `DEMO_LINK_SECRET`, `GOD_MODE_USER`/`GOD_MODE_PASSWORD`) wajib dari env — kode punya nilai cadangan khusus development yang tidak boleh dipakai di server. Variabel env baru wajib ditambahkan ke `.env.example` (tanpa nilai rahasia) dan tabel env di `docs/DEPLOYMENT.md`.
- Jangan pernah `alert()`/`confirm()` browser (lihat 9.C).

---

## 6. Database & Prisma

1. **Mengubah `prisma/schema.prisma`** — DB lokal dipakai bersama data nyata, jadi:
   1. `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script > /tmp/x.sql` → **baca SQL-nya**.
   2. Bila tidak ada `DROP` yang tidak disengaja: `npx prisma db execute --file /tmp/x.sql`.
   3. `npx prisma generate`.
   4. Restart dev server (Prisma Client di-cache di memori): `touch next.config.ts` memicu restart otomatis `next dev`.
      Bila masih muncul `PrismaClientValidationError` / field tidak dikenal, cache Turbopack masih memuat client lama:
      `rm -rf .next && touch next.config.ts`.
   - **Dilarang** `prisma db push --accept-data-loss` tanpa membaca daftar data yang akan hilang.
2. **Produk memakai soft delete** (`deletedAt`). Semua query produk untuk tampilan wajib `deletedAt: null`. Slug produk terhapus diberi akhiran `--deleted-…`; SKU-nya tetap tercatat.
3. **SKU**: gunakan `getNextSku(tenantId)` / `isSkuTaken(tenantId, code)`; tangani `isUniqueViolation(err, "code")` dengan retry.
4. **Stok** (`Product.stock`, `null` = tidak dilacak): selalu lewat `applyStockRule()` — stok 0 = HABIS, restock dari HABIS = TERSEDIA.
5. **Data contoh** (`isSample = true`) hanya dari Starter Pack; toko dengan data contoh otomatis `noindex`.
6. Production butuh perubahan schema yang sama (SQL di atas) sebelum deploy kode baru. Simpan SQL-nya di `docs/deploy/sql/YYYY-MM-DD-NN-nama.sql` (jangan hanya di folder sementara), lalu ikuti `docs/DEPLOYMENT.md` Bagian 6.

---

## 7. Storefront (Etalase Publik)

- **Landing page platform** (`rigspace.id`, dev: `rigspace.localhost:3000`): `src/components/platform/landing/*` — wording/harga/template di `content.ts` (satu sumber; tanpa angka/testimoni karangan, fitur belum jadi wajib label *segera*), CSS ter-scope `.rsl` (**jangan pakai nama class generik** seperti `hero`/`eyebrow` — bentrok dengan `globals.css`; pakai prefiks `rsl-`), animasi `[data-reveal]` hanya aktif setelah JS & mati saat reduced-motion. Form "Minta Demo" → `POST /api/platform/demo-request` (validasi `parseDemoRequest`, honeypot, batas 5/jam per IP, IP tidak disimpan) → `DemoRequest` milik CMO aktif pertama (`getSalesContact()`); tombol WhatsApp sales = nomor HP akun CMO itu. Kotak masuk: `/god-mode/permintaan-demo` (superadmin & CMO). **GA4 landing**: property platform (`NEXT_PUBLIC_PLATFORM_GA_ID`) dengan `tenant = "platform"`; event didefinisikan di `landing/tracking.ts` (`LANDING_EVENTS`) — elemen server cukup diberi `{...track(E.ctaClick, {location})}`, `LandingTracker` yang mengirim. Event baru wajib masuk `LANDING_EVENTS`; **dilarang mengirim data pribadi** (nama toko, nomor WA, kota) ke GA.
- **Mode Demo** (`Tenant.siteStatus` DEMO/LIVE, `src/lib/demo-access.ts`): tenant baru otomatis DEMO — etalase terkunci ("Segera hadir", tanpa nama toko, noindex) kecuali untuk tim god-mode, admin toko itu, atau pemegang link `https://{slug}.rigspace.id/demo/{token}` (route `src/app/demo/[token]`, cookie HMAC per tenant, berlaku 30 hari). Link dibuat ulang = link & akses lama mati. Kunjungan link (kecuali tim) dicatat di `DemoView` (tanpa IP). Link: `/api/god-mode/tenants/[id]/demo-link` (semua peran, toko dalam lingkup); aktivasi/kembali ke demo: `/site-status` (superadmin saja). Penguncian ada di resolver (`resolution: "demo-locked"` → toko kosong netral), jadi semua `getLive*`/API ikut terkunci.
- **Domain platform** dari env `NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN` (bawaan `rigspace.id`) via `platformRootDomain()` / `tenantStorefrontHost(slug)` — dilarang menulis domain statis (dulu `.tokopc.id`). Slug toko baru wajib lolos `tenantSlugError()` (format + `RESERVED_SLUGS`). Jangan memberi `resolveStorefrontTenant()` argumen dari input pengunjung — pakai `opts.previewSlug` (dicek hak preview-nya).
- **Tidak boleh ada nama toko yang di-hardcode** ("Hadi Computer", dsb.). Gunakan `store.name` / `useStoreSettings()` (client) / `getStoreBrand()` (metadata server). Fallback netral: `"Toko"` / `"kak"`.
- Metadata halaman memakai `generateMetadata()` + nama toko; `title.template` di layout sudah menambahkan `| Nama Toko`.
- **Favicon**: toko memakai `TenantSetting.faviconUrl` (CMS → Pengaturan → Identitas Toko, folder upload `favicons`, API hanya menerima path `/uploads/`); kosong = ikon Rigspace (`public/rigspace-icon.svg` + `rigspace-apple-icon.png`, `RIGSPACE_ICONS` di `src/app/layout.tsx`). **Jangan menaruh `icon.*`/`apple-icon.*` di `src/app/`** — ikon berbasis file selalu menimpa `generateMetadata` sehingga favicon toko tidak pernah tampil (ikon CMS di `src/app/{admin,god-mode}/` boleh).
- SEO, sitemap, robots per domain dari `getStorefrontSeo()`; jangan menulis URL/domain statis.
- Semua template (Precision — default toko baru, Classic, Editorial Gallery, Gaming Arena) wajib aman untuk data kosong (tanpa banner/produk/layanan/merek/portofolio).
- Mendaftarkan template baru: `STOREFRONT_TEMPLATES` (`src/lib/storefront-template.ts`) → export di `templates/index.ts` → `src/app/page.tsx` → shell header/footer di `src/app/layout.tsx` → `TEMPLATE_OPTIONS` di `/admin/pengaturan`. Logika data template ditaruh di file murni (contoh `templates/precision/model.ts`) agar bisa dites.
- Harga coret hanya tampil bila `originalPrice > price` (banner & produk); jangan menampilkan diskon palsu.
- **Studio Banner** (`bgTheme = "studio"`): foto produk diproses `createCutoutFromUpload()` (`src/lib/product-cutout.ts`) — bingkai poster dipotong, latar putih dibuang; foto poster/latar ramai ditolak dengan pesan jelas. Buat otomatis untuk demo toko: `npx tsx scripts/create-studio-banners.ts <slug> --apply [--replace]`.
- Header Precision: pencarian dengan saran langsung (`shells/precision-search.tsx`, memakai `/api/search`) & mega menu Katalog/Layanan; datanya dari `getLiveMenuData()` (dipanggil layout hanya untuk template Precision). Nama kategori ditampilkan lewat `prettyCategoryName()`, ikon lewat `<CategoryIcon>`; merek generik ("Lainnya") disaring `isGenericBrand()`.
- Harga coret banner/hero hanya dari data nyata (harga normal produk atau isian banner). **Dilarang** mengarang harga normal demi kesan diskon (UU Perlindungan Konsumen); data contoh Starter Pack boleh disimulasikan karena bertanda `isSample`.
- Animasi template memakai kelas `pc-*` di `globals.css` (scoped `body[data-template="precision"]`) dan wajib mati saat `prefers-reduced-motion`. Elemen `[data-reveal]` hanya disembunyikan setelah JS aktif (konten tetap tampil tanpa JS).
- Label stok memakai `product.stockLabel` (dihitung di repository sesuai mode toko) — jangan menghitung ulang di komponen.
- Event analitik: `trackEvent()` dari `@/components/storefront-analytics` (contoh: klik WhatsApp = `generate_lead`).
- Font storefront dinamis via `--font`; warna aksen via `--red` / Tailwind `bg-brand`/`text-brand`.
- **Tombol aksi utama di template (CTA, WhatsApp, submit pencarian) wajib `bg-brand`**, jangan hitam/hijau hardcode — kalau tidak, ganti warna tema di god-mode/pengaturan tidak terlihat. Teks di atasnya pakai `text-brand-ink` (putih/hitam otomatis dari `brandInk()` di `src/lib/brand-color.ts`), bukan `text-white`, supaya aksen terang (kuning, hijau muda) tetap terbaca. Panggung studio boleh tetap `#0b0d0c`.
- **Warna sekunder** (`TenantSetting.secondaryColor`, bawaan `#111413`) = permukaan seperti topbar info & footer: `bg-brand-2` + teks `text-brand-2-ink` (opasitas `/70` dsb. untuk teks redup) + label/ikon kecil `text-brand-2-accent`. Semua variabel warna dibuat `brandCssVars()` (`src/lib/brand-color.ts`, validasi hex via `safeHex()`); **tidak ada pilihan warna ikon/teks untuk merchant**, selalu dihitung dari kontras.

---

## 8. Gambar, Import & Data Contoh

- Folder upload resmi: `products`, `banners`, `services`, `testimonials`, `brands`, `logos`, `favicons` (`UPLOAD_FOLDERS`). Folder lain jatuh ke `products`.
- `public/uploads` = **data milik toko, bukan kode**. Hanya ikut git untuk **deploy pertama**; sesudahnya dikeluarkan dari git (`.gitignore`) dan di server berada di folder persisten (`shared/uploads`, symlink) yang ikut backup bersama database. Mengeluarkannya dari git wajib mengikuti urutan `docs/DEPLOYMENT.md` Bagian 6.1 — `git pull` biasa akan menghapus foto di server.
- File lama di server bisa dioptimasi ulang: `npm run optimize:uploads` (dry run) / `-- --apply` (backup ke `.upload-backups/`).
- Foto katalog berbingkai poster (bingkai warna + logo/nama toko) dirapikan dengan `npx tsx scripts/clean-product-photos.ts <slug>` (pratinjau) / `--apply` (foto baru, foto lama tidak dihapus; rollback `--revert .upload-backups/clean-photos-*.json`). Logika di `src/lib/product-photo-clean.ts`: produk tunggal dipusatkan di kanvas putih & logo toko dibuang; poster brand hanya dibuang bingkainya.
- Import katalog: tambah kolom baru cukup di `src/lib/catalog-import/columns.ts` + `types.ts` + `normalizeRecord`/`sanitizeRow` + engine + export.
- Starter Pack diperbarui dengan `npx tsx scripts/build-starter-pack.ts` (nama toko sumber otomatis jadi `{store}`).

---

## 9. Design System CMS (`/admin/*` & `/god-mode/*`)

**Standar baku = `/god-mode/styleguide` + halaman `/admin` yang sudah ada.** Jangan improvisasi bila komponen sudah tersedia.

### A. Komponen wajib
| Kebutuhan | Komponen |
|---|---|
| Tombol | `Button` (`@/components/admin/ui/button`) — varian `default`/`outline`/`ghost`/`destructive`, size `sm`/`default` |
| Badge status | `Badge variant="default|secondary|success|warning|destructive|info|purple|outline"` — dilarang span ad-hoc |
| Kartu | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` |
| Tabel | `Table`, `TableHeader`, `TableRow`, `TableHead`, `TableBody`, `TableCell` + **wajib** `<AdminPagination>` |
| Tab | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` (`.admin-tabs-list` / `.admin-tab-trigger`) |
| Modal | `Dialog` + `DialogHeader/Title/Description/Footer` (`className`/`style` untuk lebar, `dismissible={!saving}`) |
| Konfirmasi hapus | `<ConfirmDialog>` — **zero native `alert`/`confirm`** |
| Notifikasi | `useToast()` → `toast.success()` / `toast.error()` |
| Form | `Input`, `Label`, `Select`, `CurrencyInput` (`@/components/ui`), `Switch` (`@/components/admin/ui/switch`) |
| Ikon aksi tabel | `HugeIconEdit`, `HugeIconTrash`, `HugeIconEye` |

### B. Tombol aksi tabel
- Kotak 32×32px, radius 8px: `className="admin-action-btn"` / `"admin-action-btn delete"`, ikon `size={16}`.
- Bungkus `<div className="flex items-center justify-end gap-1.5">`.

### C. Dialog & konfirmasi
```tsx
<ConfirmDialog
  open={Boolean(deleteTarget)}
  onOpenChange={(open) => !open && setDeleteTarget(null)}
  title="Hapus Data Ini?"
  description={`Yakin menghapus "${deleteTarget?.name}"? Tindakan ini tidak dapat dibatalkan.`}
  confirmLabel="Ya, Hapus"
  onConfirm={handleExecuteDelete}
  loading={deleting}
/>
```

### D. Kartu pilihan, preset warna & dropzone
- Pilihan opsi: `.admin-choice-card` (+ `.is-active`) dengan `.admin-choice-indicator` (lingkaran 24px, ikon centang 16px).
- Preset warna: `.admin-color-preset-btn` (+ `.is-active`) dengan swatch `.admin-color-preset-swatch`, label, hex uppercase.
- Upload: `.admin-dropzone` (garis putus-putus, `.is-dragging` saat drag). Setelah terunggah, kotak yang sama menampilkan thumbnail/ikon di tengah, nama & ukuran file, dan tombol `[ ✕ Remove file ]`.

### E. Spacing, border & tipografi form
- Jarak antar komponen 8–16px (dilarang dempet); antar baris form tepat 16px (`space-y-4` / `gap-4`).
- **Setiap divider/`border-b` wajib `margin-bottom: 16px` (`mb-4`)**; konten di atas & bawah garis berjarak ≥16px.
- Jarak antar section ≤32px.
- **Jangan mendefinisikan ulang utility Tailwind** (`space-y-*`, `mt-*`, dll.) di `admin.css`/`globals.css`. Di `main` Tailwind v4 sudah aktif; definisi ganda `space-y-*` membuat margin dobel (pernah terjadi: semua jarak CMS jadi 2×).
- Border state aktif tipis (≤1.5px), tanpa ring/shadow tebal.
- Teks input/select/label: 12px (`text-xs`).
- **Hint/subtitle di bawah input: 11px merah** (`.admin-form-hint`). Peringatan batasan format juga merah (`text-red-600`).
- Password: wrapper `.admin-password-wrapper` + tombol `.admin-password-toggle-btn` (tengah vertikal kanan, input `pr-10`).

### F. Font locking
- `/admin/*` & `/god-mode/*` **dikunci ke Plus Jakarta Sans** (`!important`). Font pilihan merchant hanya berlaku di storefront (kecuali preview bertanda `data-preview-font="true"`).

### G. Pola halaman CMS
- Header: `h1/h2` `text-2xl font-black tracking-tight` + deskripsi `text-sm text-[#525854]`, tombol aksi di kanan.
- KPI: `Card` + `CardContent p-5`, label uppercase `text-xs tracking-wider`, ikon dalam kotak 32px.
- Setiap panel pengaturan baru = komponen tersendiri dengan endpoint sendiri (contoh: `src/components/admin/settings/advanced-settings-panels.tsx`), bukan menambah halaman raksasa.
- State kosong, loading (`Memuat data...`), dan error wajib ditangani.

---

## 10. Definition of Done — Setiap Fitur Baru

- [ ] **Tenant**: semua query ber-`tenantId` dari sesi; kepemilikan dicek sebelum update/delete; unik per tenant.
- [ ] **Izin**: API `authorizeAdmin([...])`, UI `useCan()`, halaman `ROUTE_PERMISSIONS`, izin baru terdaftar di `PERMISSION_GROUPS`.
- [ ] **Keamanan**: input divalidasi; upload via `storeImage()`; URL eksternal via `fetchPublic()`; tidak ada teks tenant tanpa escape di `<script>`.
- [ ] **UI**: komponen standar Bagian 9; empty/loading/error state; dicek di lebar 375px & 1440px tanpa overflow horizontal.
- [ ] **Storefront**: tanpa nama toko hardcode; aman untuk data kosong di semua template (Precision, Classic, Editorial Gallery, Gaming Arena).
- [ ] **Database**: perubahan schema via diff SQL yang dibaca dulu; `prisma generate`; dev server di-restart.
- [ ] **Tes**: unit test untuk logika murni di `tests/*.test.ts` (runner `node:test` via `tsx`).
- [ ] **Verifikasi**: `npm run typecheck` dan `npm test` lolos; fitur dicoba nyata di browser/API.
- [ ] **Dokumentasi**: aturan baru → dokumen ini; progres fitur → `docs/BUSINESS_STRATEGY.md`.
- [ ] **Deploy**: SQL schema tersimpan di `docs/deploy/sql/`; env baru tercatat di `.env.example` & `docs/DEPLOYMENT.md`.
- [ ] **Commit semantik**: `feat(...)`, `fix(...)`, `style(...)`, `docs(...)`, `refactor(...)`, `chore(...)`.

---

## 11. Deploy & Produksi

- Panduan lengkap (ukuran data, env, DNS wildcard, langkah pertama & berikutnya, verifikasi): **`docs/DEPLOYMENT.md`**.
- Deploy pertama = `git clone` lewat **deploy key read-only** (kode + foto `public/uploads` ikut git sekali) + dump database (tidak lewat git) → hasil persis lokal, dibuktikan dengan `sha256sum -c` manifest foto.
- Setelah live: **jangan menimpa database/foto server dengan data lokal** — hanya kode + SQL schema yang sudah dibaca (`migrate diff` terhadap DB server), selalu didahului backup.
- `node_modules` & `.next` tidak pernah dikirim; `npm ci` + `npm run build` di server (`sharp`/Prisma butuh binary Linux). `NEXT_PUBLIC_*` ditanam saat build.
- Reverse proxy wajib meneruskan `Host`/`X-Forwarded-Host`/`X-Forwarded-Proto` (resolver toko & URL SEO membaca header ini) dan mengizinkan body upload ≥ 16 MB.
