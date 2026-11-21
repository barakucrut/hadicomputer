import { prisma } from "./db";
import { getNextSku, isUniqueViolation } from "./product-sku";
import { simulateStrikePrice } from "./strike-price";
import pack from "../data/starter-pack.json";

/**
 * Starter Pack: data contoh untuk merchant baru supaya storefront langsung
 * terlihat "jadi" saat demo. Semua data ditandai isSample = true dan bisa dihapus
 * sekali klik dari dashboard toko (lihat clearSampleData).
 */

type Pack = typeof pack;

const fill = (s: string | null | undefined, store: string) => (s ? s.replace(/\{store\}/g, store) : s ?? null);

export interface StarterPackResult {
  products: number;
  categories: number;
  brands: number;
  banners: number;
  services: number;
  skipped?: string;
}

/** Isi toko dengan Starter Pack. Aman dipanggil ulang: dilewati bila toko sudah punya produk. */
export async function seedStarterPack(tenantId: string): Promise<StarterPackResult> {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } });
  if (!tenant) throw new Error("Tenant tidak ditemukan");
  const store = tenant.name;
  const data = pack as Pack;

  const existingProducts = await prisma.product.count({ where: { tenantId, deletedAt: null } });
  if (existingProducts > 0) {
    return { products: 0, categories: 0, brands: 0, banners: 0, services: 0, skipped: "Toko sudah memiliki produk" };
  }

  // 1. Kategori, merek & kebutuhan (dipakai ulang bila slug sudah ada)
  const categoryId = new Map<string, string>();
  for (const c of data.categories) {
    const row = await prisma.category.upsert({
      where: { tenantId_slug: { tenantId, slug: c.slug } },
      update: {},
      create: { tenantId, name: c.name, slug: c.slug, icon: c.icon, description: fill(c.description, store), sortOrder: c.sortOrder },
      select: { id: true },
    });
    categoryId.set(c.slug, row.id);
  }
  const brandId = new Map<string, string>();
  for (const b of data.brands) {
    const row = await prisma.brand.upsert({
      where: { tenantId_slug: { tenantId, slug: b.slug } },
      update: {},
      create: { tenantId, name: b.name, slug: b.slug, logoUrl: b.logoUrl, sortOrder: b.sortOrder },
      select: { id: true },
    });
    brandId.set(b.slug, row.id);
  }
  await prisma.productNeed.createMany({
    data: data.needs.map((n) => ({ tenantId, name: n.name, slug: n.slug, description: fill(n.description, store), icon: n.icon, sortOrder: n.sortOrder, isActive: true })),
    skipDuplicates: true,
  });

  // 2. Produk contoh (SKU mengikuti prefix toko, mis. PBJ-0001)
  let products = 0;
  for (const [productIndex, p] of data.products.entries()) {
    // Harga coret contoh: dipakai bila data pack belum punya harga normal
    const strike = p.originalPrice ?? simulateStrikePrice(p.basePrice, productIndex);
    const cId = categoryId.get(p.categorySlug);
    const bId = brandId.get(p.brandSlug);
    if (!cId || !bId) continue;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        await prisma.product.create({
          data: {
            tenantId,
            isSample: true,
            code: await getNextSku(tenantId),
            slug: p.slug,
            name: fill(p.name, store)!,
            summary: fill(p.summary, store)!,
            description: fill(p.description, store)!,
            condition: p.condition as "BARU" | "BEKAS",
            basePrice: p.basePrice !== null ? BigInt(p.basePrice) : null,
            originalPrice: strike !== null ? BigInt(strike) : null,
            availability: p.availability as "TERSEDIA" | "PREORDER" | "HABIS",
            warranty: fill(p.warranty, store)!,
            bonus: fill(p.bonus, store),
            isFeatured: p.isFeatured,
            isBestSeller: p.isBestSeller,
            isPromo: p.isPromo,
            isNewArrival: p.isNewArrival,
            needs: p.needs,
            categoryId: cId,
            brandId: bId,
            images: {
              create: (p.images as string[]).map((url, i) => ({ url, altText: fill(p.name, store)!.slice(0, 150), isPrimary: i === 0, sortOrder: i })),
            },
            specs: { create: p.specs.map((s, i) => ({ key: s.key, value: fill(s.value, store)!, sortOrder: i })) },
            variants: {
              create: p.variants.map((v, i) => ({
                name: v.name,
                price: v.price !== null ? BigInt(v.price) : null,
                originalPrice: v.originalPrice !== null ? BigInt(v.originalPrice) : null,
                availability: v.availability as "TERSEDIA" | "PREORDER" | "HABIS",
                isDefault: v.isDefault,
                sortOrder: i,
              })),
            },
          },
        });
        products++;
        break;
      } catch (err) {
        if (!isUniqueViolation(err, "code") && !isUniqueViolation(err, "slug")) throw err;
        if (isUniqueViolation(err, "slug")) break; // slug sudah dipakai produk asli toko -> lewati contoh ini
      }
    }
  }

  // 3. Banner & layanan contoh
  for (const b of data.banners) {
    await prisma.banner.create({
      data: {
        tenantId,
        isSample: true,
        title: fill(b.title, store)!,
        subtitle: fill(b.subtitle, store),
        badgeText: fill(b.badgeText, store),
        ctaLabel: b.ctaLabel,
        ctaUrl: b.ctaUrl,
        imageUrl: b.imageUrl,
        imageAlt: fill(b.imageAlt, store)!,
        bgTheme: b.bgTheme,
        sortOrder: b.sortOrder,
        hotspots: { create: b.hotspots.map((h, i) => ({ label: fill(h.label, store)!, xPercent: h.xPercent, yPercent: h.yPercent, sortOrder: i })) },
      },
    });
  }
  let services = 0;
  for (const s of data.services) {
    try {
      await prisma.service.create({
        data: {
          tenantId,
          isSample: true,
          title: fill(s.title, store)!,
          slug: s.slug,
          summary: fill(s.summary, store)!,
          description: fill(s.description, store)!,
          estimatedTime: s.estimatedTime,
          priceInfo: s.priceInfo,
          ctaWhatsappText: fill(s.ctaWhatsappText, store)!,
          iconName: s.iconName,
          imageUrl: s.imageUrl,
          sortOrder: s.sortOrder,
        },
      });
      services++;
    } catch (err) {
      if (!isUniqueViolation(err, "slug")) throw err;
    }
  }

  return {
    products,
    categories: data.categories.length,
    brands: data.brands.length,
    banners: data.banners.length,
    services,
  };
}

/** Jumlah data contoh yang masih ada di toko. */
export async function countSampleData(tenantId: string) {
  const [products, banners, services] = await Promise.all([
    prisma.product.count({ where: { tenantId, isSample: true, deletedAt: null } }),
    prisma.banner.count({ where: { tenantId, isSample: true } }),
    prisma.service.count({ where: { tenantId, isSample: true } }),
  ]);
  return { products, banners, services, total: products + banners + services };
}

/**
 * Hapus seluruh data contoh toko (permanen — data contoh tidak punya nilai riwayat).
 * Kategori & merek bawaan yang sudah tidak dipakai produk mana pun ikut dihapus.
 */
export async function clearSampleData(tenantId: string) {
  const sampleProducts = await prisma.product.findMany({ where: { tenantId, isSample: true }, select: { id: true } });
  const ids = sampleProducts.map((p) => p.id);

  const result = await prisma.$transaction(async (tx) => {
    await tx.inquiryLog.updateMany({ where: { productId: { in: ids } }, data: { productId: null } });
    const products = await tx.product.deleteMany({ where: { id: { in: ids } } });
    const banners = await tx.banner.deleteMany({ where: { tenantId, isSample: true } });
    const sampleServices = await tx.service.findMany({ where: { tenantId, isSample: true }, select: { id: true } });
    await tx.inquiryLog.updateMany({ where: { serviceId: { in: sampleServices.map((s) => s.id) } }, data: { serviceId: null } });
    await tx.serviceCase.deleteMany({ where: { tenantId, isSample: true } });
    const services = await tx.service.deleteMany({ where: { tenantId, isSample: true } });

    const packCategorySlugs = (pack as Pack).categories.map((c) => c.slug);
    const packBrandSlugs = (pack as Pack).brands.map((b) => b.slug);
    const categories = await tx.category.deleteMany({ where: { tenantId, slug: { in: packCategorySlugs }, products: { none: {} } } });
    const brands = await tx.brand.deleteMany({ where: { tenantId, slug: { in: packBrandSlugs }, products: { none: {} } } });

    return { products: products.count, banners: banners.count, services: services.count, categories: categories.count, brands: brands.count };
  });
  return result;
}
