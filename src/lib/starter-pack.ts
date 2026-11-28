import { prisma } from "./db";
import { getNextSku, isUniqueViolation } from "./product-sku";
import { simulateStrikePrice } from "./strike-price";
import { parseLocale } from "./i18n";
import { convertSamplePrice, formatMoney, parseCurrency, type CurrencyCode } from "./i18n/currency";
import pack from "../data/starter-pack.json";

/**
 * Starter Pack: data contoh untuk merchant baru supaya storefront langsung
 * terlihat "jadi" saat demo. Semua data ditandai isSample = true dan bisa dihapus
 * sekali klik dari dashboard toko (lihat clearSampleData).
 */

type Pack = typeof pack;

const fill = (s: string | null | undefined, store: string) => (s ? s.replace(/\{store\}/g, store) : s ?? null);

const EN_CATEGORY_NAMES: Record<string, string> = {
  laptop: "Laptops",
  "pc-desktop": "Desktop PCs",
  "rakit-pc": "Custom PCs",
  monitor: "Monitors",
  printer: "Printers",
  aksesoris: "Accessories",
  komponen: "PC Components",
  "laptop-bekas": "Refurbished Laptops",
};

function localizeWarranty(w: string, en: boolean): string {
  if (!en) return w;
  if (/resmi/i.test(w)) return "Official 1–2 Year Warranty";
  if (/toko/i.test(w)) return "Store Warranty Included";
  return "Official Hardware Warranty";
}

function localizeCta(label: string | null | undefined, en: boolean): string {
  if (!en) return label || "Lihat Promo";
  if (!label) return "Explore Deals";
  if (/katalog|produk/i.test(label)) return "Browse Catalog";
  if (/servis|layanan/i.test(label)) return "View Services";
  if (/wa|whatsapp|tanya|konsultasi/i.test(label)) return "Chat on WhatsApp";
  return "Explore Deals";
}

function localizePriceInfo(info: string | null | undefined, currency: CurrencyCode, en: boolean): string {
  if (!info) return en ? "Contact for estimate" : "Hubungi untuk estimasi";
  if (!en && currency === "IDR") return info;
  const digits = Number(info.replace(/[^\d]/g, ""));
  if (Number.isFinite(digits) && digits > 0) {
    const converted = convertSamplePrice(digits, currency);
    if (converted !== null) {
      return en ? `From ${formatMoney(converted, currency, "en")}` : `Mulai ${formatMoney(converted, currency, "id")}`;
    }
  }
  return en ? "Contact for estimate" : info;
}

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
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true, settings: { select: { locale: true, currency: true } } },
  });
  if (!tenant) throw new Error("Tenant tidak ditemukan");
  const store = tenant.name;
  const locale = parseLocale(tenant.settings?.locale) ?? "id";
  const currency: CurrencyCode = parseCurrency(tenant.settings?.currency) ?? "IDR";
  const en = locale === "en";
  const data = pack as Pack;

  const existingProducts = await prisma.product.count({ where: { tenantId, deletedAt: null } });
  if (existingProducts > 0) {
    return { products: 0, categories: 0, brands: 0, banners: 0, services: 0, skipped: "Toko sudah memiliki produk" };
  }

  // 1. Kategori, merek & kebutuhan (dipakai ulang bila slug sudah ada)
  const categoryId = new Map<string, string>();
  for (const c of data.categories) {
    const catName = en ? EN_CATEGORY_NAMES[c.slug] || c.name : c.name;
    const row = await prisma.category.upsert({
      where: { tenantId_slug: { tenantId, slug: c.slug } },
      update: {},
      create: {
        tenantId,
        name: catName,
        slug: c.slug,
        icon: c.icon,
        description: en ? `Explore ${catName.toLowerCase()} at ${store}.` : fill(c.description, store),
        sortOrder: c.sortOrder,
      },
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
    const rawStrike = p.originalPrice ?? simulateStrikePrice(p.basePrice, productIndex);
    const basePrice = convertSamplePrice(p.basePrice, currency);
    const strike = convertSamplePrice(rawStrike, currency);
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
            summary: en ? `Ready-to-ship unit from ${store} with full warranty.` : fill(p.summary, store)!,
            description: en
              ? `${fill(p.name, store)} — inspected and backed by ${store}. Contact us via WhatsApp for availability and bundle options.`
              : fill(p.description, store)!,
            condition: p.condition as "BARU" | "BEKAS",
            basePrice: basePrice !== null ? BigInt(basePrice) : null,
            originalPrice: strike !== null && basePrice !== null && strike > basePrice ? BigInt(strike) : null,
            availability: p.availability as "TERSEDIA" | "PREORDER" | "HABIS",
            warranty: localizeWarranty(fill(p.warranty, store)!, en),
            bonus: en && p.bonus ? "Free Setup & Carry Bag" : fill(p.bonus, store),
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
              create: p.variants.map((v, i) => {
                const vPrice = convertSamplePrice(v.price, currency);
                const vOrig = convertSamplePrice(v.originalPrice, currency);
                return {
                  name: v.name,
                  price: vPrice !== null ? BigInt(vPrice) : null,
                  originalPrice: vOrig !== null && vPrice !== null && vOrig > vPrice ? BigInt(vOrig) : null,
                  availability: v.availability as "TERSEDIA" | "PREORDER" | "HABIS",
                  isDefault: v.isDefault,
                  sortOrder: i,
                };
              }),
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
        subtitle: en ? `Featured hardware deals curated by ${store}.` : fill(b.subtitle, store),
        badgeText: en ? "FEATURED" : fill(b.badgeText, store),
        ctaLabel: localizeCta(b.ctaLabel, en),
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
          summary: en ? `Professional diagnostics & repair service by ${store}.` : fill(s.summary, store)!,
          description: en
            ? `Experienced technicians at ${store} handle diagnostics, upgrades, and repairs with transparent pricing.`
            : fill(s.description, store)!,
          estimatedTime: en ? "1–2 business days" : s.estimatedTime,
          priceInfo: localizePriceInfo(s.priceInfo, currency, en),
          ctaWhatsappText: en
            ? `Hi ${store}, I'd like to inquire about ${fill(s.title, store)}.`
            : fill(s.ctaWhatsappText, store)!,
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
