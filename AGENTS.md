<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# RIGSPACE PLATFORM DEVELOPMENT RULES (MANDATORY)

1. **STANDAR UTAMA: `/admin` ADALAH SINGLE SOURCE OF TRUTH (SSOT)**
   - Setiap komponen di `/god-mode/*` atau panel baru WAJIB mengikuti standar komponen yang ada di `/admin`.
   - Action buttons tabel wajib berukuran 32x32px (`.admin-action-btn`, `.admin-action-btn.delete`) menggunakan icon set terpadu (`HugeIconTrash`, `HugeIconEdit`, dll).

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

*Detail lengkap terdokumentasi di file `DEVELOPMENT_RULES.md`.*
