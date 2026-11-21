/**
 * Definisi kolom katalog — dipakai bersama oleh template Excel, parser CSV/XLSX,
 * dan export, supaya file hasil export bisa langsung di-upload ulang (round trip).
 */

export type ColumnKey =
  | "code"
  | "name"
  | "category"
  | "brand"
  | "condition"
  | "basePrice"
  | "originalPrice"
  | "availability"
  | "stock"
  | "publicationStatus"
  | "warranty"
  | "bonus"
  | "summary"
  | "description"
  | "specs"
  | "images"
  | "needs"
  | "labels";

export interface ColumnDef {
  key: ColumnKey;
  header: string;
  required?: boolean;
  width: number;
  note: string;
  /** Nama kolom alternatif yang dikenali (dari sistem lain: marketplace, POS, WooCommerce) */
  aliases: string[];
}

export const CATALOG_COLUMNS: ColumnDef[] = [
  { key: "code", header: "SKU", width: 14, note: "Opsional. Kosongkan agar dibuat otomatis. Jika SKU sudah ada, produk tersebut akan di-update.", aliases: ["kode", "kode unit", "kode produk", "sku produk", "product code", "item code"] },
  { key: "name", header: "Nama Produk", required: true, width: 42, note: "Wajib. Nama lengkap produk.", aliases: ["nama", "name", "product name", "judul", "title", "nama barang"] },
  { key: "category", header: "Kategori", required: true, width: 18, note: "Wajib. Nama kategori (dropdown). Kategori baru bisa dibuat otomatis saat import.", aliases: ["category", "categories", "kategori produk"] },
  { key: "brand", header: "Merek", required: true, width: 16, note: "Wajib. Nama merek (dropdown). Merek baru bisa dibuat otomatis saat import.", aliases: ["brand", "merk", "brands", "manufacturer"] },
  { key: "condition", header: "Kondisi", width: 10, note: "Baru / Bekas. Default: Baru.", aliases: ["condition", "kondisi barang"] },
  { key: "basePrice", header: "Harga", width: 14, note: "Angka rupiah, mis. 12500000. Kosongkan = 'Hubungi untuk harga'.", aliases: ["price", "harga jual", "regular price", "sale price", "harga (rp)"] },
  { key: "originalPrice", header: "Harga Coret", width: 14, note: "Opsional. Harga sebelum diskon (lebih besar dari Harga).", aliases: ["harga normal", "original price", "compare at price", "harga asli"] },
  { key: "availability", header: "Ketersediaan", width: 13, note: "Tersedia / Preorder / Habis. Default: Tersedia.", aliases: ["availability", "stok status", "stock status", "status stok"] },
  { key: "stock", header: "Stok", width: 8, note: "Opsional. Jumlah unit. Kosong = stok tidak dilacak. 0 = otomatis Habis.", aliases: ["stock", "qty", "jumlah", "jumlah stok", "stok tersedia", "quantity", "stock quantity"] },
  { key: "publicationStatus", header: "Status", width: 10, note: "Tampil / Draft. Default: Tampil.", aliases: ["status", "publish", "publikasi", "published"] },
  { key: "warranty", header: "Garansi", width: 22, note: "Opsional, mis. 'Garansi Resmi 2 Tahun'.", aliases: ["warranty", "garansi produk"] },
  { key: "bonus", header: "Bonus", width: 22, note: "Opsional, mis. 'Tas + Mouse Wireless'.", aliases: ["gift", "hadiah"] },
  { key: "summary", header: "Ringkasan", width: 36, note: "Opsional. Satu kalimat singkat di bawah nama produk.", aliases: ["short description", "ringkasan singkat", "tagline", "deskripsi singkat"] },
  { key: "description", header: "Deskripsi", width: 48, note: "Opsional. Deskripsi lengkap.", aliases: ["description", "deskripsi produk", "detail"] },
  { key: "specs", header: "Spesifikasi", width: 48, note: "Format: Kunci: Nilai | Kunci: Nilai. Mis. 'CPU: Core i5-13450HX | RAM: 16GB | SSD: 512GB'.", aliases: ["specs", "specification", "spesifikasi produk", "spek"] },
  { key: "images", header: "Foto (URL)", width: 48, note: "Satu atau lebih URL foto, pisahkan dengan | atau baris baru. Foto pertama jadi foto utama.", aliases: ["images", "image", "foto", "gambar", "image url", "foto produk", "photo"] },
  { key: "needs", header: "Kebutuhan", width: 18, note: "Opsional, pisahkan koma: Kerja, Kuliah, Kreatif, Gaming, Harian.", aliases: ["needs", "kebutuhan pengguna", "use case"] },
  { key: "labels", header: "Label", width: 18, note: "Opsional, pisahkan koma: Pilihan, Terlaris, Promo, Terbaru.", aliases: ["labels", "koleksi", "tag", "tags"] },
];

export const MAX_IMPORT_ROWS = 1000;
export const IMPORT_BATCH_SIZE = 20;

export const CONDITION_LABELS = { BARU: "Baru", BEKAS: "Bekas" } as const;
export const AVAILABILITY_LABELS = { TERSEDIA: "Tersedia", PREORDER: "Preorder", HABIS: "Habis" } as const;
export const PUBLICATION_LABELS = { PUBLISHED: "Tampil", DRAFT: "Draft" } as const;
export const LABEL_FLAGS = {
  Pilihan: "isFeatured",
  Terlaris: "isBestSeller",
  Promo: "isPromo",
  Terbaru: "isNewArrival",
} as const;

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/\*/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** Petakan judul kolom file (bebas, case-insensitive) ke ColumnKey. */
export function matchColumn(header: string): ColumnKey | null {
  const h = norm(header);
  if (!h) return null;
  for (const col of CATALOG_COLUMNS) {
    if (norm(col.header) === h || col.aliases.some((a) => norm(a) === h)) return col.key;
  }
  return null;
}
