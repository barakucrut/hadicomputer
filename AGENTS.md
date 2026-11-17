<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# RIGSPACE PLATFORM DEVELOPMENT RULES (MANDATORY)

1. **STANDAR UTAMA: DESIGN GUIDE & `/admin` ADALAH SINGLE SOURCE OF TRUTH (SSOT)**
   - **DESIGN GUIDE RESMI & INTERACTIVE SHOWCASE TERLETAK DI: `/god-mode/styleguide` (file: `src/app/god-mode/styleguide/page.tsx`).**
   - Setiap kali membuat komponen baru, form input, tabel data, tombol, modal dialog, status badge, atau pagination di seluruh halaman `/god-mode/*` maupun `/admin/*`, **WAJIB MENIRU & MENGIKUTI STANDAR YANG TERTAMPIL DI `/god-mode/styleguide` DAN `/admin`**.
   - Action buttons tabel wajib berukuran 32x32px (`.admin-action-btn`, `.admin-action-btn.delete`) menggunakan icon set terpadu (`HugeIconTrash`, `HugeIconEdit`, `Trash2`, `Pencil`, dll).
   - Seluruh tabel data wajib menyertakan pagination standar `<AdminPagination>` dari `@/components/admin/ui/pagination`.

2. **STATUS & CATEGORY BADGES**
   - Selalu gunakan komponen `<Badge variant="...">` dari `@/components/admin/ui/badge`.
   - Varian yang didukung: `default`, `secondary`, `success`, `warning`, `destructive`, `info`, `purple`, `outline`.
   - DILARANG membuat badge dengan inline class `border border-gray-200 ...` ad-hoc.

3. **ZERO NATIVE ALERT / CONFIRM**
   - DILARANG KERAS menggunakan `alert(...)` atau `confirm(...)` browser!
   - Untuk konfirmasi aksi destruktif/hapus, WAJIB menggunakan `<ConfirmDialog>` dari `@/components/admin/ui/confirm-dialog`.
   - Untuk notifikasi feedback, gunakan `useToast()` / `toast.success()`, `toast.error()` dari `@/components/admin/ui/toast`.

4. **FONT LOCKING: PLUS JAKARTA SANS**
   - Seluruh halaman CMS `/admin/*` dan `/god-mode/*` dikunci strictly ke **Plus Jakarta Sans** (`!important`).
   - Font kustom merchant hanya berlaku di Storefront frontend publik etalase pembeli.

5. **MULTI-TENANT DATA ISOLATION**
   - Seluruh query database untuk data toko wajib menyertakan filter `where: { tenantId }`.

6. **CHOICE CARDS, COLOR PRESETS & DRAG-DROP DROPZONE**
   - Kartu pilihan opsi (misal font, opsi paket) wajib menggunakan `.admin-choice-card` dengan icon centang aktif besar berukuran 16px (`.admin-choice-indicator`).
   - Preset warna tema wajib berupa tombol chip `.admin-color-preset-btn` dengan swatch kotak dan outline aktif.
   - Form unggah file/logo wajib menggunakan dropzone `.admin-dropzone` terpadu: saat file terunggah, kotak menampilkan thumbnail di tengah, nama file, dan tombol `[ ✕ Remove file ]` untuk menghapus dan mengunggah kembali.

7. **SPACING, FORM CONTROLS & MINIMALIST BORDER RULES**
   - **Jarak Antar Komponen**: Setiap komponen WAJIB memiliki jarak minimal 8px – 16px (dilarang dempet). Jarak vertikal antar baris input form wajib tepat 16px (`gap: 16px` / `space-y-4`).
   - **Border Bottom / Divider Spacing**: Setiap garis pemisah (`border-t`, `border-b`, divider), konten di atas dan di bawahnya WAJIB berjarak 16px.
   - **Border State Aktif**: Garis border state aktif wajib tipis, minimalis, dan clean (maksimal `1.5px`), dilarang menggunakan ring/shadow tebal berlebih.
   - **Tipografi Form**: Seluruh teks input, select, dan label form wajib berukuran 12px (`text-xs`).
   - **Notice / Warning Alert**: Keterangan batasan format atau peringatan (seperti batasan 'PNG / SVG Maks 2MB') WAJIB berwarna merah (`text-red-600`).

*Detail lengkap terdokumentasi di file `DEVELOPMENT_RULES.md`.*
