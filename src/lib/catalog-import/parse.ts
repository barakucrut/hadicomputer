import ExcelJS from "exceljs";
import { CATALOG_COLUMNS, LABEL_FLAGS, MAX_IMPORT_ROWS, matchColumn, type ColumnKey } from "./columns";
import type { Availability, Condition, ImportRow, Publication } from "./types";
import { normalizeStock } from "../stock";

export class ImportFileError extends Error {}

type RawRecord = { rowNumber: number; values: Partial<Record<ColumnKey, string>> };

/* ------------------------------------------------------------------ */
/* Pembacaan file                                                      */
/* ------------------------------------------------------------------ */

/** Nilai sel ExcelJS (rich text, hyperlink, formula, tanggal) -> string. */
function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object") {
    const v = value as unknown as Record<string, unknown>;
    if (Array.isArray(v.richText)) return (v.richText as { text: string }[]).map((r) => r.text).join("");
    if ("hyperlink" in v) return String(v.text ?? v.hyperlink ?? "");
    if ("result" in v) return v.result === undefined || v.result === null ? "" : String(v.result);
    if ("text" in v) return String(v.text ?? "");
  }
  return String(value);
}

function recordsFromMatrix(matrix: string[][]): RawRecord[] {
  // Cari baris header: baris pertama (dari 10 teratas) yang memuat kolom "nama produk"
  let headerIndex = -1;
  let keys: (ColumnKey | null)[] = [];
  for (let i = 0; i < Math.min(matrix.length, 10); i++) {
    const mapped = matrix[i].map((h) => matchColumn(h));
    if (mapped.includes("name")) {
      headerIndex = i;
      keys = mapped;
      break;
    }
  }
  if (headerIndex === -1) {
    throw new ImportFileError(
      'Kolom "Nama Produk" tidak ditemukan. Gunakan template dari tombol "Unduh Template".'
    );
  }

  const records: RawRecord[] = [];
  for (let i = headerIndex + 1; i < matrix.length; i++) {
    const row = matrix[i];
    if (!row || row.every((c) => !String(c ?? "").trim())) continue;
    const values: RawRecord["values"] = {};
    keys.forEach((key, col) => {
      if (key && values[key] === undefined) values[key] = String(row[col] ?? "").trim();
    });
    records.push({ rowNumber: i + 1, values });
  }
  if (records.length === 0) throw new ImportFileError("File tidak berisi baris produk.");
  if (records.length > MAX_IMPORT_ROWS) {
    throw new ImportFileError(`Maksimal ${MAX_IMPORT_ROWS} produk per file (file berisi ${records.length}).`);
  }
  return records;
}

/** Parser CSV sederhana yang mendukung kutip, baris baru di dalam sel, dan pemisah , atau ; */
export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^﻿/, "");
  const firstLine = clean.split(/\r?\n/, 1)[0] || "";
  const delimiter = (firstLine.match(/;/g)?.length || 0) > (firstLine.match(/,/g)?.length || 0) ? ";" : ",";

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && clean[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export async function readCatalogFile(fileName: string, buffer: Buffer): Promise<RawRecord[]> {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".csv") || lower.endsWith(".txt")) {
    return recordsFromMatrix(parseCsv(buffer.toString("utf8")));
  }
  if (lower.endsWith(".xlsx")) {
    const wb = new ExcelJS.Workbook();
    try {
      await wb.xlsx.load(buffer as unknown as ArrayBuffer);
    } catch {
      throw new ImportFileError("File Excel tidak dapat dibaca. Pastikan formatnya .xlsx.");
    }
    // Sheet pertama yang memiliki header "Nama Produk"
    for (const ws of wb.worksheets) {
      const matrix: string[][] = [];
      ws.eachRow({ includeEmpty: true }, (r, n) => {
        const values = Array.isArray(r.values) ? (r.values as ExcelJS.CellValue[]).slice(1) : [];
        matrix[n - 1] = values.map(cellText);
      });
      for (let i = 0; i < matrix.length; i++) matrix[i] = matrix[i] || [];
      try {
        return recordsFromMatrix(matrix);
      } catch (err) {
        if (ws === wb.worksheets[wb.worksheets.length - 1]) throw err;
      }
    }
    throw new ImportFileError("Sheet produk tidak ditemukan.");
  }
  if (lower.endsWith(".xls")) {
    throw new ImportFileError("Format .xls lama tidak didukung. Simpan ulang sebagai .xlsx atau .csv.");
  }
  throw new ImportFileError("Format file tidak didukung. Gunakan .xlsx atau .csv.");
}

/* ------------------------------------------------------------------ */
/* Normalisasi nilai                                                   */
/* ------------------------------------------------------------------ */

/** "Rp 12.500.000", "12,500,000.00", "12500000", "12.5jt" -> 12500000 */
export function parsePrice(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number") return Number.isFinite(raw) && raw > 0 ? Math.round(raw) : null;
  let s = String(raw).toLowerCase().replace(/rp\.?|idr|\s/g, "");
  if (!s || s === "-" || /hubungi|call|tanya/.test(s)) return null;

  const juta = /(jt|juta)$/.test(s);
  const ribu = /(rb|ribu|k)$/.test(s);
  s = s.replace(/(jt|juta|rb|ribu|k)$/, "");

  if (juta || ribu) {
    const n = Number(s.replace(",", "."));
    return Number.isFinite(n) && n > 0 ? Math.round(n * (juta ? 1_000_000 : 1_000)) : null;
  }
  // Buang desimal di akhir (",00" / ".00"), lalu semua pemisah ribuan
  s = s.replace(/[.,]\d{1,2}$/, "");
  const digits = s.replace(/\D/g, "");
  if (!digits) return null;
  const n = Number(digits);
  return n > 0 ? n : null;
}

function pickEnum<T extends string>(raw: string, map: Record<string, T>, fallback: T): T {
  const v = raw.toLowerCase().trim();
  if (!v) return fallback;
  for (const [needle, value] of Object.entries(map)) if (v.includes(needle)) return value;
  return fallback;
}

export function parseCondition(raw = ""): Condition {
  return pickEnum<Condition>(raw, { bekas: "BEKAS", second: "BEKAS", used: "BEKAS", seken: "BEKAS", refurb: "BEKAS" }, "BARU");
}
export function parseAvailability(raw = ""): Availability {
  return pickEnum<Availability>(
    raw,
    { habis: "HABIS", kosong: "HABIS", "out of stock": "HABIS", outofstock: "HABIS", sold: "HABIS", pre: "PREORDER", inden: "PREORDER", backorder: "PREORDER" },
    "TERSEDIA"
  );
}
export function parsePublication(raw = ""): Publication {
  return pickEnum<Publication>(raw, { draft: "DRAFT", sembunyi: "DRAFT", hidden: "DRAFT", private: "DRAFT", tidak: "DRAFT" }, "PUBLISHED");
}

/** "CPU: i5 | RAM: 16GB" atau per baris -> [{key, value}] */
export function parseSpecs(raw = ""): { key: string; value: string }[] {
  return raw
    .split(/\||\r?\n|;(?=\s*[^:;]+:)/)
    .map((part) => {
      const idx = part.indexOf(":");
      if (idx <= 0) return null;
      const key = part.slice(0, idx).trim().slice(0, 100);
      const value = part.slice(idx + 1).trim().slice(0, 255);
      return key && value ? { key, value } : null;
    })
    .filter((x): x is { key: string; value: string } => Boolean(x))
    .slice(0, 40);
}

export function parseList(raw = "", separator = /[,|\n]/): string[] {
  return raw
    .split(separator)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseImages(raw = ""): string[] {
  return Array.from(new Set(parseList(raw, /[|\n\s]+/).filter((u) => /^https?:\/\//i.test(u) || u.startsWith("/"))))
    .slice(0, 10);
}

const clip = (s: string | undefined, max: number) => (s || "").trim().slice(0, max);

/** Raw record (string per kolom) -> ImportRow siap divalidasi. */
export function normalizeRecord(rec: RawRecord): ImportRow {
  const v = rec.values;
  const labels = parseList(v.labels || "").map((l) => l.toLowerCase());
  const has = (name: keyof typeof LABEL_FLAGS) => labels.some((l) => l.startsWith(name.toLowerCase().slice(0, 5)));
  return {
    rowNumber: rec.rowNumber,
    code: clip(v.code, 50).toUpperCase(),
    name: clip(v.name, 200),
    category: clip(v.category, 100),
    brand: clip(v.brand, 100),
    condition: parseCondition(v.condition),
    basePrice: parsePrice(v.basePrice),
    originalPrice: parsePrice(v.originalPrice),
    availability: parseAvailability(v.availability),
    stock: normalizeStock(v.stock),
    publicationStatus: parsePublication(v.publicationStatus),
    warranty: clip(v.warranty, 100),
    bonus: clip(v.bonus, 255),
    summary: clip(v.summary, 255),
    description: clip(v.description, 20000),
    specs: parseSpecs(v.specs),
    images: parseImages(v.images),
    needs: parseList(v.needs).slice(0, 10),
    isFeatured: has("Pilihan"),
    isBestSeller: has("Terlaris"),
    isPromo: has("Promo"),
    isNewArrival: has("Terbaru"),
  };
}

/**
 * Bersihkan ImportRow yang datang dari klien (batch commit) — jangan percaya tipe dari browser.
 */
export function sanitizeRow(input: unknown): ImportRow | null {
  if (!input || typeof input !== "object") return null;
  const r = input as Record<string, unknown>;
  const str = (k: string, max: number) => (typeof r[k] === "string" ? (r[k] as string).trim().slice(0, max) : "");
  const num = (k: string) => (typeof r[k] === "number" && Number.isFinite(r[k]) && (r[k] as number) > 0 ? Math.round(r[k] as number) : null);
  const bool = (k: string) => r[k] === true;
  const arr = (k: string, max: number) =>
    Array.isArray(r[k]) ? (r[k] as unknown[]).filter((x): x is string => typeof x === "string").slice(0, max) : [];
  const specs = Array.isArray(r.specs)
    ? (r.specs as unknown[])
        .map((s) => (s && typeof s === "object" ? (s as Record<string, unknown>) : null))
        .filter((s): s is Record<string, unknown> => Boolean(s && typeof s.key === "string" && typeof s.value === "string"))
        .map((s) => ({ key: String(s.key).slice(0, 100), value: String(s.value).slice(0, 255) }))
        .slice(0, 40)
    : [];
  return {
    rowNumber: typeof r.rowNumber === "number" ? r.rowNumber : 0,
    code: str("code", 50).toUpperCase(),
    name: str("name", 200),
    category: str("category", 100),
    brand: str("brand", 100),
    condition: r.condition === "BEKAS" ? "BEKAS" : "BARU",
    basePrice: num("basePrice"),
    originalPrice: num("originalPrice"),
    availability: r.availability === "HABIS" || r.availability === "PREORDER" ? (r.availability as Availability) : "TERSEDIA",
    stock: normalizeStock(r.stock),
    publicationStatus: r.publicationStatus === "DRAFT" ? "DRAFT" : "PUBLISHED",
    warranty: str("warranty", 100),
    bonus: str("bonus", 255),
    summary: str("summary", 255),
    description: str("description", 20000),
    specs,
    images: arr("images", 10).filter((u) => /^https?:\/\//i.test(u) || u.startsWith("/")),
    needs: arr("needs", 10),
    isFeatured: bool("isFeatured"),
    isBestSeller: bool("isBestSeller"),
    isPromo: bool("isPromo"),
    isNewArrival: bool("isNewArrival"),
  };
}

export { CATALOG_COLUMNS };
