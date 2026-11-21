export type Condition = "BARU" | "BEKAS";
export type Availability = "TERSEDIA" | "PREORDER" | "HABIS";
export type Publication = "PUBLISHED" | "DRAFT";

/** Satu baris produk yang sudah dinormalisasi (siap divalidasi & disimpan). */
export interface ImportRow {
  rowNumber: number;
  code: string;
  name: string;
  category: string;
  brand: string;
  condition: Condition;
  basePrice: number | null;
  originalPrice: number | null;
  availability: Availability;
  /** null = stok tidak dilacak */
  stock: number | null;
  publicationStatus: Publication;
  warranty: string;
  bonus: string;
  summary: string;
  description: string;
  specs: { key: string; value: string }[];
  images: string[];
  needs: string[];
  isFeatured: boolean;
  isBestSeller: boolean;
  isPromo: boolean;
  isNewArrival: boolean;
}

export interface RowIssue {
  rowNumber: number;
  level: "error" | "warning";
  message: string;
}

export interface ImportOptions {
  /** Buat kategori/merek yang belum ada secara otomatis */
  createMissing: boolean;
  /** Produk dengan SKU yang sama di-update (bila false: baris tersebut dilewati) */
  updateExisting: boolean;
}

export interface RowPlan {
  rowNumber: number;
  action: "create" | "update" | "skip";
  name: string;
  code: string;
  category: string;
  brand: string;
  basePrice: number | null;
  imageCount: number;
}

export interface ImportPreview {
  source: string;
  rows: ImportRow[];
  plans: RowPlan[];
  issues: RowIssue[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
    create: number;
    update: number;
    skip: number;
    newCategories: string[];
    newBrands: string[];
  };
}

export interface RowResult {
  rowNumber: number;
  status: "created" | "updated" | "skipped" | "failed";
  code?: string;
  name: string;
  message?: string;
  imageWarnings?: string[];
}
