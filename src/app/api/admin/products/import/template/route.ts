import { authorizeAdmin } from "@/lib/auth";
import { buildCatalogWorkbook } from "@/lib/catalog-import/workbook";
import { getTenantCatalogLists, xlsxResponse } from "@/lib/catalog-import/tenant-lists";

/** Template Excel kosong dengan dropdown kategori/merek milik toko + 1 baris contoh. */
export async function GET() {
  const auth = await authorizeAdmin(["products:create", "products:edit"]);
  if (!auth.ok) return auth.response;

  const lists = await getTenantCatalogLists(auth.tenantId);
  const buffer = await buildCatalogWorkbook({
    ...lists,
    rows: [
      {
        code: "",
        name: "Contoh: ASUS Vivobook 14 A1404VA Core i5 16GB 512GB",
        category: lists.categories[0] || "Laptop",
        brand: lists.brands[0] || "Asus",
        condition: "Baru",
        basePrice: 9_499_000,
        originalPrice: 10_299_000,
        availability: "Tersedia",
        publicationStatus: "Draft",
        warranty: "Garansi Resmi 2 Tahun",
        bonus: "Tas + Mouse Wireless",
        summary: "Laptop tipis untuk kerja & kuliah",
        description: "Hapus baris contoh ini sebelum upload, atau biarkan berstatus Draft.",
        specs: "CPU: Core i5-1335U | RAM: 16GB DDR4 | SSD: 512GB NVMe | Layar: 14\" FHD",
        images: "https://contoh.com/foto-1.jpg | https://contoh.com/foto-2.jpg",
        needs: "Kerja, Kuliah",
        labels: "Terbaru",
      },
    ],
  });
  return xlsxResponse(buffer, `template-produk-${lists.storeSlug}.xlsx`);
}
