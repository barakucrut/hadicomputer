import ExcelJS from "exceljs";
import {
  AVAILABILITY_LABELS,
  CATALOG_COLUMNS,
  CONDITION_LABELS,
  PUBLICATION_LABELS,
  type ColumnKey,
} from "./columns";

type CellRow = Partial<Record<ColumnKey, string | number | null>>;

const BRAND_RED = "FFCC252B";
const INK = "FF111413";

function colLetter(index: number) {
  let n = index + 1;
  let s = "";
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/**
 * Workbook katalog: sheet "Produk" (header + data + dropdown), "Petunjuk", dan "Daftar" (sumber dropdown, tersembunyi).
 * Dipakai untuk template kosong maupun export katalog (format sama -> bisa di-upload ulang).
 */
export async function buildCatalogWorkbook({
  storeName,
  categories,
  brands,
  needs,
  rows,
}: {
  storeName: string;
  categories: string[];
  brands: string[];
  needs: string[];
  rows: CellRow[];
}): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "RigSpace";
  wb.created = new Date();

  // --- Sheet sumber dropdown (tersembunyi)
  const lists = wb.addWorksheet("Daftar", { state: "veryHidden" });
  const listColumns: Record<string, string[]> = {
    Kategori: categories.length ? categories : ["Laptop"],
    Merek: brands.length ? brands : ["Asus"],
    Kondisi: Object.values(CONDITION_LABELS),
    Ketersediaan: Object.values(AVAILABILITY_LABELS),
    Status: Object.values(PUBLICATION_LABELS),
  };
  const listRef: Record<string, string> = {};
  Object.entries(listColumns).forEach(([name, values], i) => {
    const letter = colLetter(i);
    lists.getCell(`${letter}1`).value = name;
    values.forEach((v, r) => (lists.getCell(`${letter}${r + 2}`).value = v));
    listRef[name] = `Daftar!$${letter}$2:$${letter}$${values.length + 1}`;
  });

  // --- Sheet produk
  const ws = wb.addWorksheet("Produk", { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = CATALOG_COLUMNS.map((c) => ({
    header: c.required ? `${c.header}*` : c.header,
    key: c.key,
    width: c.width,
  }));
  const header = ws.getRow(1);
  header.height = 22;
  header.eachCell((cell, colNumber) => {
    const def = CATALOG_COLUMNS[colNumber - 1];
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: def.required ? BRAND_RED : INK } };
    cell.alignment = { vertical: "middle" };
    cell.note = def.note;
  });

  rows.forEach((r) => ws.addRow(r));

  // Dropdown & format angka untuk 1000 baris
  const lastRow = Math.max(rows.length + 1, 1001);
  const dropdownFor: Partial<Record<ColumnKey, string>> = {
    category: listRef.Kategori,
    brand: listRef.Merek,
    condition: listRef.Kondisi,
    availability: listRef.Ketersediaan,
    publicationStatus: listRef.Status,
  };
  CATALOG_COLUMNS.forEach((c, i) => {
    const letter = colLetter(i);
    const ref = dropdownFor[c.key];
    for (let r = 2; r <= lastRow; r++) {
      const cell = ws.getCell(`${letter}${r}`);
      if (ref) {
        cell.dataValidation = {
          type: "list",
          allowBlank: true,
          formulae: [ref],
          // Kategori/merek baru tetap boleh diketik (dibuat otomatis saat import)
          showErrorMessage: c.key !== "category" && c.key !== "brand",
          errorTitle: "Pilihan tidak valid",
          error: "Pilih dari daftar.",
        };
      }
      if (c.key === "basePrice" || c.key === "originalPrice") cell.numFmt = "#,##0";
      if (c.key === "description" || c.key === "specs" || c.key === "images") {
        cell.alignment = { wrapText: true, vertical: "top" };
      }
    }
  });

  // --- Sheet petunjuk
  const help = wb.addWorksheet("Petunjuk");
  help.columns = [
    { header: "Kolom", key: "col", width: 18 },
    { header: "Keterangan", key: "note", width: 110 },
  ];
  help.getRow(1).font = { bold: true };
  help.addRow({ col: "Toko", note: storeName });
  help.addRow({ col: "Cara pakai", note: "Isi sheet 'Produk' mulai baris 2, lalu upload di CMS: Katalog Produk -> Import / Export. Kolom bertanda * wajib diisi." });
  help.addRow({ col: "Update massal", note: "Export katalog, ubah kolom (mis. Harga), lalu upload ulang file yang sama. Produk dengan SKU yang sudah ada akan di-update." });
  help.addRow({ col: "Kebutuhan", note: `Pilihan: ${needs.join(", ") || "-"}` });
  help.addRow({});
  CATALOG_COLUMNS.forEach((c) => help.addRow({ col: c.required ? `${c.header}*` : c.header, note: c.note }));
  help.getColumn(2).alignment = { wrapText: true };

  const out = await wb.xlsx.writeBuffer();
  return Buffer.from(out as ArrayBuffer);
}
