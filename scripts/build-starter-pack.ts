/**
 * Membangun src/data/starter-pack.json dari katalog tenant sumber (default: Hadi Computer).
 *
 * Starter Pack = data contoh untuk merchant baru (instant demo). Hasilnya dinetralkan:
 *  - semua sebutan nama toko sumber diganti placeholder {store}
 *  - hanya aset statis /images/... yang dipakai (foto upload milik toko sumber dibuang)
 *  - tanpa id, tenantId, SKU, atau data inquiry
 *
 * Jalankan ulang bila katalog contoh ingin diperbarui:
 *   npx tsx scripts/build-starter-pack.ts [slug-tenant-sumber]
 */
import "dotenv/config";
import { writeFileSync, mkdirSync } from "fs";
import path from "path";
import { prisma } from "../src/lib/db";

const SOURCE_SLUG = process.argv[2] || "hadicomputer";

const neutral = (s: string | null | undefined) =>
  (s || "")
    .replace(/Hadi Computer/g, "{store}")
    .replace(/\bHadi\b/g, "{store}");

const staticOnly = (url: string | null | undefined) => (url && url.startsWith("/images/") ? url : null);

async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { slug: SOURCE_SLUG }, select: { id: true, name: true } });
  if (!tenant) throw new Error(`Tenant ${SOURCE_SLUG} tidak ditemukan`);
  const tenantId = tenant.id;

  const [categories, brands, needs, products, banners, services] = await Promise.all([
    prisma.category.findMany({ where: { tenantId }, orderBy: { sortOrder: "asc" } }),
    prisma.brand.findMany({ where: { tenantId }, orderBy: { sortOrder: "asc" } }),
    prisma.productNeed.findMany({ where: { tenantId }, orderBy: { sortOrder: "asc" } }),
    prisma.product.findMany({
      where: { tenantId, deletedAt: null, publicationStatus: "PUBLISHED" },
      include: {
        category: { select: { slug: true } },
        brand: { select: { slug: true } },
        images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
        specs: { orderBy: { sortOrder: "asc" } },
        variants: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { code: "asc" },
    }),
    prisma.banner.findMany({ where: { tenantId }, include: { hotspots: { orderBy: { sortOrder: "asc" } } }, orderBy: { sortOrder: "asc" } }),
    prisma.service.findMany({ where: { tenantId }, orderBy: { sortOrder: "asc" } }),
  ]);

  const pack = {
    version: 1,
    generatedFrom: SOURCE_SLUG,
    generatedAt: new Date().toISOString().slice(0, 10),
    categories: categories.map((c) => ({
      name: c.name,
      slug: c.slug,
      icon: c.icon,
      description: neutral(c.description),
      sortOrder: c.sortOrder,
    })),
    brands: brands.map((b) => ({ name: b.name, slug: b.slug, logoUrl: staticOnly(b.logoUrl), sortOrder: b.sortOrder })),
    needs: needs.map((n) => ({ name: n.name, slug: n.slug, description: neutral(n.description), icon: n.icon, sortOrder: n.sortOrder })),
    products: products.map((p) => ({
      name: neutral(p.name),
      slug: p.slug,
      categorySlug: p.category.slug,
      brandSlug: p.brand.slug,
      summary: neutral(p.summary),
      description: neutral(p.description),
      condition: p.condition,
      basePrice: p.basePrice !== null ? Number(p.basePrice) : null,
      originalPrice: p.originalPrice !== null ? Number(p.originalPrice) : null,
      availability: p.availability,
      warranty: neutral(p.warranty),
      bonus: p.bonus ? neutral(p.bonus) : null,
      isFeatured: p.isFeatured,
      isBestSeller: p.isBestSeller,
      isPromo: p.isPromo,
      isNewArrival: p.isNewArrival,
      needs: Array.isArray(p.needs) ? p.needs : [],
      images: p.images.map((i) => staticOnly(i.url)).filter(Boolean),
      specs: p.specs.map((s) => ({ key: s.key, value: neutral(s.value) })),
      variants: p.variants.map((v) => ({
        name: v.name,
        price: v.price !== null ? Number(v.price) : null,
        originalPrice: v.originalPrice !== null ? Number(v.originalPrice) : null,
        availability: v.availability,
        isDefault: v.isDefault,
      })),
    })),
    banners: banners.map((b) => ({
      title: neutral(b.title),
      subtitle: neutral(b.subtitle),
      badgeText: neutral(b.badgeText),
      ctaLabel: b.ctaLabel,
      ctaUrl: b.ctaUrl,
      imageUrl: staticOnly(b.imageUrl) || "/images/banners/work.png",
      imageAlt: neutral(b.imageAlt),
      bgTheme: b.bgTheme,
      sortOrder: b.sortOrder,
      hotspots: b.hotspots.map((h) => ({ label: neutral(h.label), xPercent: h.xPercent, yPercent: h.yPercent })),
    })),
    services: services.map((s) => ({
      title: neutral(s.title),
      slug: s.slug,
      summary: neutral(s.summary),
      description: neutral(s.description),
      estimatedTime: s.estimatedTime,
      priceInfo: s.priceInfo,
      ctaWhatsappText: neutral(s.ctaWhatsappText),
      iconName: s.iconName,
      imageUrl: staticOnly(s.imageUrl),
      sortOrder: s.sortOrder,
    })),
  };

  const leftovers = JSON.stringify(pack).match(/Hadi/gi)?.length || 0;
  const out = path.join(process.cwd(), "src", "data", "starter-pack.json");
  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(pack, null, 2) + "\n");
  console.log(
    `Starter Pack: ${pack.products.length} produk, ${pack.categories.length} kategori, ${pack.brands.length} merek, ` +
      `${pack.banners.length} banner, ${pack.services.length} layanan -> ${path.relative(process.cwd(), out)} ` +
      `(sisa kata "Hadi": ${leftovers})`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
