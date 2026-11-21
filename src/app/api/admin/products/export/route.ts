import { authorizeAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AVAILABILITY_LABELS, CONDITION_LABELS, PUBLICATION_LABELS } from "@/lib/catalog-import/columns";
import { buildCatalogWorkbook } from "@/lib/catalog-import/workbook";
import { getTenantCatalogLists, xlsxResponse } from "@/lib/catalog-import/tenant-lists";

/** Export seluruh katalog toko ke Excel (format sama dengan template -> bisa di-upload ulang). */
export async function GET() {
  const auth = await authorizeAdmin(["products:view"]);
  if (!auth.ok) return auth.response;

  const [lists, products, needs] = await Promise.all([
    getTenantCatalogLists(auth.tenantId),
    prisma.product.findMany({
      where: { tenantId: auth.tenantId, deletedAt: null },
      include: {
        category: { select: { name: true } },
        brand: { select: { name: true } },
        images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], select: { url: true } },
        specs: { orderBy: { sortOrder: "asc" }, select: { key: true, value: true } },
      },
      orderBy: { code: "asc" },
    }),
    prisma.productNeed.findMany({ where: { tenantId: auth.tenantId }, select: { slug: true, name: true } }),
  ]);
  const needName = new Map(needs.map((n) => [n.slug, n.name]));

  const rows = products.map((p) => ({
    code: p.code,
    name: p.name,
    category: p.category.name,
    brand: p.brand.name,
    condition: CONDITION_LABELS[p.condition],
    basePrice: p.basePrice !== null ? Number(p.basePrice) : null,
    originalPrice: p.originalPrice !== null ? Number(p.originalPrice) : null,
    availability: AVAILABILITY_LABELS[p.availability],
    stock: p.stock,
    publicationStatus: p.publicationStatus === "DRAFT" ? PUBLICATION_LABELS.DRAFT : PUBLICATION_LABELS.PUBLISHED,
    warranty: p.warranty,
    bonus: p.bonus || "",
    summary: p.summary,
    description: p.description,
    specs: p.specs.map((s) => `${s.key}: ${s.value}`).join(" | "),
    images: p.images.map((i) => i.url).join(" | "),
    needs: (Array.isArray(p.needs) ? (p.needs as string[]) : []).map((s) => needName.get(s) || s).join(", "),
    labels: [
      p.isFeatured && "Pilihan",
      p.isBestSeller && "Terlaris",
      p.isPromo && "Promo",
      p.isNewArrival && "Terbaru",
    ]
      .filter(Boolean)
      .join(", "),
  }));

  const buffer = await buildCatalogWorkbook({ ...lists, rows });
  const date = new Date().toISOString().slice(0, 10);
  return xlsxResponse(buffer, `katalog-${lists.storeSlug}-${date}.xlsx`);
}
