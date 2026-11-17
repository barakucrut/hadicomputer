# RIGSPACE DEVELOPMENT RULES & UI STANDARDS
> **Single Source of Truth (SSOT) untuk Pengembangan Fitur, Komponen, dan Arsitektur Multi-Tenant Platform Rigspace (`rigspace.id`).**
> *Wajib dijadikan acuan mutlak oleh seluruh developer dan AI coding agents sebelum membuat atau mengubah kode.*

---

## 1. Golden Rule: Design Guide & `/admin` adalah Standar Baku UI/UX
- **Interactive Showcase & Design System**: Terletak di **`/god-mode/styleguide`** (source code: `src/app/god-mode/styleguide/page.tsx`).
- Setiap kali membuat halaman baru di **God-Mode (`/god-mode/*`)**, **Merchant CMS (`/admin/*`)**, atau panel internal lainnya, **selalu tiru komponen dan visual token yang ada di `/god-mode/styleguide` dan `/admin` sebagai standar baku**. Jangan pernah mengimprovisasi styling atau komponen baru jika panduan sudah menyediakannya.

---

## 2. Komponen & Design System UI

### A. Tombol Aksi Tabel (Action Buttons)
- **Ukuran & Bentuk**: Selalu kotak simetris `32x32px` dengan `border-radius: 8px`.
- **Class Standar**:
  - Tombol aksi umum (Lihat/Edit): `className="admin-action-btn"`
  - Tombol aksi destruktif (Hapus): `className="admin-action-btn delete"`
- **Icon**: Gunakan icon set terpadu (misal `HugeIconTrash`, `HugeIconEdit`, `HugeIconEye` dari `@/components/admin/ui/huge-icons` atau `lucide-react` dengan `size={16}`).
- **Pembungkus**: Selalu bungkus dalam `<div className="flex items-center justify-end gap-1.5">`.
- **Dilarang**: Jangan pernah menggunakan tombol ghost tanpa border/bg acak, atau teks raw icon tanpa container.

### B. Status & Kategori Badges
- **Selalu gunakan komponen `<Badge>`** dari `@/components/admin/ui/badge`.
- **Varian Resmi yang Didukung**:
  - `default` : Aksen Utama Platform / Merah Rigspace (`var(--red)`)
  - `secondary` : Netral / Abu-abu Elegan (`#f1f3ed`, text `#525854`)
  - `success` : Positif / Pemasukan / Status Aktif / Tersedia (`#dcfce7`, text `#15803d`)
  - `warning` : Peringatan / Pre-Order / Trial / Setup Fee (`#fef3c7`, text `#b45309`)
  - `destructive` : Bahaya / Pengeluaran / Habis / Suspended (`#fee2e2`, text `#dc2626`)
  - `info` : Informasi / Subscription / Addon / Domain (`#e0f2fe`, text `#0369a1`)
  - `purple` : Paket Enterprise / Jual Putus / Lisensi (`#f3e8ff`, text `#7e22ce`)
  - `outline` : Minimalis dengan border abu-abu
- **Dilarang**: Jangan pernah membuat `<span className="px-2 py-0.5 border border-gray-200 ...">` dengan styling ad-hoc inline. Selalu gunakan `<Badge variant="...">`.

### C. Konfirmasi Dialog & Modal (Zero Native Alert/Confirm)
- **Dilarang Keras**: **JANGAN PERNAH** menggunakan native browser `confirm(...)` atau `alert(...)` di mana pun.
- **Konfirmasi Aksi Destruktif (Hapus/Reset/Ubah Kritis)**:
  - Wajib menggunakan `<ConfirmDialog>` dari `@/components/admin/ui/confirm-dialog`.
  - Contoh penggunaan:
    ```tsx
    <ConfirmDialog
      open={Boolean(deleteTarget)}
      onOpenChange={(open) => !open && setDeleteTarget(null)}
      title="Hapus Data Ini?"
      description={`Apakah Anda yakin ingin menghapus "${deleteTarget?.name}"? Tindakan ini tidak dapat dibatalkan.`}
      confirmLabel="Ya, Hapus"
      onConfirm={handleExecuteDelete}
      loading={deleting}
    />
    ```
- **Modal Form & Dialog**:
  - Selalu gunakan Shadcn UI dialog dari `@/components/admin/ui/dialog` (`Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`).

### D. Notifikasi & Feedback (Toast)
- Gunakan `useToast()` dari `@/components/admin/ui/toast`.
  - `toast.success("Pesan berhasil")`
  - `toast.error("Pesan gagal")`
- Setiap halaman yang memanggil `useToast` harus berada di dalam `<ToastProvider>`.

### E. Tabel Data & Pagination
- **Pagination Wajib**: Seluruh tabel data di `/god-mode/*` maupun `/admin/*` wajib menyertakan komponen `<AdminPagination>` dari `@/components/admin/ui/pagination`.
- **Fitur Pagination Baku**: Menampilkan informasi total data (`Menampilkan 1 – 10 dari 48 data`), dropdown pemilihan ukuran halaman (`pageSizeOptions={[10, 20, 50]}`), tombol first/last/prev/next, dan tombol nomor halaman aktif.
- **Spacing Antar Section**: Jarak vertikal antar section maksimal **32px** (menggunakan gap 16px dengan divider `.admin-section-divider` border halus tanpa margin ganda).

### F. Kartu Pilihan Opsi & Preset Warna (Choice Cards & Swatches)
- **Selectable Choice Card**: Opsi pilihan kartu (misal: pemilihan font, metode, atau paket) wajib menggunakan class `.admin-choice-card` dan `.admin-choice-card.is-active`. Wajib menyertakan indikator centang besar berukuran lingkaran 24px dengan icon check 16px (`.admin-choice-indicator`).
- **Color Preset Chips**: Pilihan preset warna tema wajib menggunakan button `.admin-color-preset-btn` dan `.admin-color-preset-btn.is-active` yang memiliki swatch warna persegi (`.admin-color-preset-swatch`), label nama warna, dan kode hex uppercase.

### G. Drag & Drop File Upload Dropzone
- **Area Dropzone Terpadu**: Input unggah file/logo wajib menyediakan area drag-and-drop `.admin-dropzone` dengan garis batas putus-putus (`border: 1.5px dashed #c9cdbf`), icon upload, dan reaksi visual saat berkas diseret ke atasnya (`.is-dragging`).
- **State File Terunggah (Thumbnail + Remove File)**: Saat file berhasil diunggah, kotak dropzone awal yang sama langsung menampilkan thumbnail gambar di tengah (dengan latar motif catur `.admin-logo-preview-box`), nama file, ukuran file, dan tombol `[ ✕ Remove file ]`. Ketika tombol remove ditekan, kotak otomatis kembali ke state siap menerima file baru.

### H. Spacing, Jarak Vertikal Form, & Border Minimalis
- **Jarak Antar Komponen**: Setiap komponen WAJIB memiliki jarak minimal 8px – 16px (dilarang dempet). Jarak vertikal antar baris input form wajib tepat 16px (`gap: 16px` / `space-y-4`).
- **Border Bottom / Divider Spacing**: Setiap garis pemisah (`border-t`, `border-b`, divider), konten di atas dan di bawahnya WAJIB berjarak 16px.
- **Border State Aktif**: Garis border state aktif wajib tipis, minimalis, dan clean (maksimal `1.5px`), dilarang menggunakan ring/shadow tebal bertumpuk.
- **Tipografi Form**: Seluruh teks input, select, dan label form wajib berukuran 12px (`text-xs`).
- **Form Subtitle & Helper Hint**: Seluruh teks keterangan, subtitle, atau instruksi petunjuk di bawah form input WAJIB berukuran 11px dan berwarna merah (`.admin-form-hint` / `text-red-600 text-[11px]`).
- **Notice / Warning Alert**: Keterangan batasan format atau peringatan (seperti batasan 'PNG / SVG Maks 2MB') WAJIB berwarna merah (`text-red-600`).
- **Password Input & Toggle Eye**: Input password dengan toggle mata wajib menggunakan wrapper `.admin-password-wrapper` dan tombol `.admin-password-toggle-btn` agar icon mata tersemat rapi di dalam input sisi kanan.

---

## 3. Tipografi & Font Locking

1. **CMS Admin & God-Mode Panel**:
   - Seluruh teks di `/admin/*` dan `/god-mode/*` **DIKUNCI PERMANEN ke font "Plus Jakarta Sans"** (`!important`).
   - Jangan pernah membiarkan pilihan font toko merchant mengubah tampilan dashboard admin atau god-mode.
   - Pengecualian satu-satunya adalah elemen live preview yang ditandai dengan attribute `data-preview-font="true"`.
2. **Storefront Frontend (Etalase Publik Pembeli)**:
   - Menggunakan dynamic CSS variable `--font` yang dikonfigurasi per tenant (`fontFamily`: *Inter*, *Plus Jakarta Sans*, *Outfit*, *Poppins*, *Space Grotesk*).

---

## 4. Multi-Tenant Architecture & Data Isolation

1. **Scoping `tenantId`**:
   - Setiap query database (`findMany`, `findFirst`, `create`, `update`, `delete`) untuk produk, kategori, banner, transaksi toko, dan setting WA **WAJIB menyertakan `where: { tenantId }`**.
   - Dilarang membocorkan data antar tenant toko.
2. **God-Mode Scoping**:
   - God-Mode adalah level platform engine (`/god-mode/*`).
   - Hanya God-Mode yang boleh mengakses tabel platform-wide: `Tenant`, `TenantSetting`, dan `PlatformTransaction`.
   - God-Mode dapat mengimpersonasi tenant melalui cookie `god_impersonated_tenant_id` dan session `platform_god_session`.

---

## 5. Database, Prisma & Dev Server Restart Rules

1. **Koneksi Database**:
   - MySQL/MariaDB menggunakan adapter `@prisma/adapter-mariadb` melalui `src/lib/db.ts`.
2. **Penambahan Model/Field Baru**:
   - Saat mengubah `prisma/schema.prisma`:
     1. Jalankan `npx prisma db push`
     2. Jalankan `npx prisma generate`
     3. **PENTING**: Dev server Next.js (`npm run dev`) menyimpan singleton `PrismaClient` di memory (`global.__prisma`). Restart `npm run dev` di terminal agar Prisma Client baru terbaca dan tidak menyebabkan error `reading 'findMany'` atau `reading 'create'`.

---

## 6. Standar Verifikasi Kode (Pre-Commit Checklist)

Sebelum melakukan commit atau menyatakan fitur selesai:
1. Jalankan **`npm run typecheck`** (`tsc --noEmit`) — pastikan exit code `0` tanpa error type.
2. Jalankan **`npm test`** — pastikan seluruh unit test lolos 100%.
3. Pastikan tidak ada `console.log` liar, syntax error, kurung kurawal berlebih, atau `confirm()`/`alert()` browser.
4. Tulis pesan commit yang rapi dan semantik:
   - `feat(...)`: fitur baru
   - `fix(...)`: perbaikan bug
   - `style(...)`: perbaikan UI/CSS/styling
   - `docs(...)`: dokumentasi
