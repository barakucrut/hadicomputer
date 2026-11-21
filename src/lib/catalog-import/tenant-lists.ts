import { prisma } from "../db";

/** Nama kategori, merek, kebutuhan & toko — untuk dropdown template/export. */
export async function getTenantCatalogLists(tenantId: string) {
  const [tenant, categories, brands, needs] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true, slug: true } }),
    prisma.category.findMany({ where: { tenantId }, select: { name: true }, orderBy: { sortOrder: "asc" } }),
    prisma.brand.findMany({ where: { tenantId }, select: { name: true }, orderBy: { name: "asc" } }),
    prisma.productNeed.findMany({ where: { tenantId }, select: { name: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  return {
    storeName: tenant?.name || "Toko",
    storeSlug: tenant?.slug || "toko",
    categories: categories.map((c) => c.name),
    brands: brands.map((b) => b.name),
    needs: needs.map((n) => n.name),
  };
}

export function xlsxResponse(buffer: Buffer, fileName: string) {
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
