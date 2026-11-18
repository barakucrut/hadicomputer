import { prisma } from "./db";
import type { Banner, Product, Service, StoreSettings } from "./types";
import { resolveStorefrontTenant } from "./tenant-resolver";
import {
  banners,
  categories,
  getProduct,
  getProducts,
  getService,
  services,
  store,
} from "./repository";

async function withTimeout<T>(promise: Promise<T>, ms = 2000): Promise<T> {
  let timeoutId: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("Database timeout")), ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getLiveProducts(tenantId?: string): Promise<Product[]> {
  try {
    const whereClause: any = { publicationStatus: "PUBLISHED", deletedAt: null };
    if (tenantId) {
      whereClause.tenantId = tenantId;
    }

    const dbProducts = await withTimeout(
      prisma.product.findMany({
        where: whereClause,
        include: {
          category: true,
          brand: true,
          images: { orderBy: { sortOrder: "asc" } },
          variants: { orderBy: { sortOrder: "asc" } },
          specs: { orderBy: { sortOrder: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      })
    );

    if (dbProducts && dbProducts.length > 0) {
      return dbProducts.map((p) => {
        const labels: string[] = [];
        if (p.isFeatured) labels.push("Pilihan Toko");
        if (p.isBestSeller) labels.push("Terlaris");
        const hasDiscount =
          (p.originalPrice !== null && p.basePrice !== null && p.originalPrice > p.basePrice) ||
          p.variants.some((v) => v.originalPrice !== null && v.price !== null && v.originalPrice > v.price);
        if (p.isPromo || hasDiscount) labels.push("Promo");
        if (p.isNewArrival) labels.push("Terbaru");

        const sortedImages = [...p.images].sort((a, b) => {
          if (a.isPrimary && !b.isPrimary) return -1;
          if (!a.isPrimary && b.isPrimary) return 1;
          return a.sortOrder - b.sortOrder;
        });

        return {
          id: p.id,
          slug: p.slug,
          code: p.code,
          name: p.name,
          brand: p.brand?.name || "Lainnya",
          category: p.category?.slug || "laptop",
          condition: (p.condition.toLowerCase() as any) || "baru",
          price: p.basePrice !== null ? Number(p.basePrice) : null,
          originalPrice: p.originalPrice !== null ? Number(p.originalPrice) : null,
          bonus: p.bonus,
          availability: (p.availability.toLowerCase() as any) || "tersedia",
          images:
            sortedImages.length > 0
              ? sortedImages.map((img) => img.url)
              : ["/images/banners/promo-bundle.png"],
          summary: p.summary,
          description: p.description,
          warranty: p.warranty,
          conditionNote: undefined,
          specs: p.specs.map((s) => ({ name: s.key, value: s.value })),
          variants: p.variants.map((v) => ({
            id: v.id,
            name: v.name,
            price: v.price !== null ? Number(v.price) : null,
            originalPrice: v.originalPrice !== null ? Number(v.originalPrice) : null,
            availability: (v.availability.toLowerCase() as any) || "tersedia",
          })),
          labels,
          needs: (p.needs as any) || [],
          publishedAt: p.createdAt.toISOString(),
        };
      });
    }
  } catch (err) {
    // If DB is offline or table empty, return static JSON
  }
  return getProducts();
}

export async function getLiveProduct(slug: string, tenantId?: string): Promise<Product | undefined> {
  try {
    const products = await getLiveProducts(tenantId);
    const found = products.find((p) => p.slug === slug);
    if (found) return found;
  } catch {
    // Fallback
  }
  return getProduct(slug);
}

export async function getLiveBanners(tenantId?: string): Promise<Banner[]> {
  try {
    const whereClause: any = { isActive: true };
    if (tenantId) {
      whereClause.tenantId = tenantId;
    }

    const dbBanners = await withTimeout(
      prisma.banner.findMany({
        where: whereClause,
        include: { hotspots: true },
        orderBy: { sortOrder: "asc" },
      })
    );

    if (dbBanners && dbBanners.length > 0) {
      return dbBanners.map((b) => ({
        id: b.id,
        eyebrow: b.badgeText || "PROMO SPESIAL MINGGU INI",
        title: b.title,
        description: b.subtitle || "",
        mobileTitle: b.title,
        mobileDescription: b.subtitle || "",
        image: b.imageUrl,
        href: b.ctaUrl || "#",
        cta: b.ctaLabel || "Lihat Promo",
        theme: (b.bgTheme as any) || "dark",
        hotspots: b.hotspots.map((h) => ({
          label: h.label,
          x: h.xPercent,
          y: h.yPercent,
        })),
      }));
    }
  } catch {
    // Fallback
  }
  return banners;
}

export async function getLiveCategories(tenantId?: string) {
  try {
    const whereClause: any = { isActive: true };
    if (tenantId) {
      whereClause.tenantId = tenantId;
    }

    const dbCats = await withTimeout(
      prisma.category.findMany({
        where: whereClause,
        orderBy: { sortOrder: "asc" },
      })
    );
    if (dbCats && dbCats.length > 0) {
      return dbCats.map((c) => ({
        name: c.name,
        value: c.slug,
        icon: c.icon || "laptop",
        description: c.description || "",
      }));
    }
  } catch {
    // Fallback
  }
  return categories;
}

export async function getLiveStoreSettings(tenantId?: string): Promise<StoreSettings> {
  try {
    const storefront = await resolveStorefrontTenant(tenantId);
    return storefront.settings;
  } catch {
    return store;
  }
}

export async function getLiveServices(tenantId?: string): Promise<Service[]> {
  try {
    const whereClause: any = { isActive: true };
    if (tenantId) {
      whereClause.tenantId = tenantId;
    }

    const dbServices = await withTimeout(
      prisma.service.findMany({
        where: whereClause,
        orderBy: { sortOrder: "asc" },
      })
    );
    if (dbServices && dbServices.length > 0) {
      return dbServices.map((s) => ({
        slug: s.slug,
        name: s.title,
        eyebrow: "LAYANAN PROFESIONAL",
        summary: s.summary,
        description: s.description,
        image: s.imageUrl || "/images/banners/work.png",
        price: null,
        inclusions: [
          s.priceInfo,
          s.estimatedTime,
          "Konsultasi langsung via WhatsApp",
          "Pemeriksaan dan diagnosis transparan",
        ].filter(Boolean),
        steps: [
          "Ceritakan kendala lewat WhatsApp",
          "Konfirmasi jadwal dan bawa perangkat",
          "Terima estimasi sebelum pengerjaan",
          "Pemeriksaan akhir dan serah terima",
        ],
      }));
    }
  } catch {
    // Fallback
  }
  return services;
}

export async function getLiveService(slug: string, tenantId?: string): Promise<Service | undefined> {
  try {
    const all = await getLiveServices(tenantId);
    const found = all.find((s) => s.slug === slug);
    if (found) return found;
  } catch {
    // Fallback
  }
  return getService(slug);
}

export async function getLiveBrands(tenantId?: string): Promise<Array<{ id: string; name: string; slug: string }>> {
  try {
    const whereClause: any = { isActive: true };
    if (tenantId) {
      whereClause.tenantId = tenantId;
    }

    const dbBrands = await withTimeout(
      prisma.brand.findMany({
        where: whereClause,
        orderBy: { sortOrder: "asc" },
      })
    );
    if (dbBrands && dbBrands.length > 0) {
      return dbBrands.map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
      }));
    }
  } catch {
    // Fallback
  }
  return [];
}

const DEFAULT_NEEDS = [
  { id: "need-kerja", name: "Kerja", slug: "kerja", description: "Perangkat andalan untuk hari produktif", icon: "briefcase" },
  { id: "need-kuliah", name: "Kuliah", slug: "kuliah", description: "Dari tugas pertama sampai ide besar", icon: "graduation-cap" },
  { id: "need-kreatif", name: "Kreatif", slug: "kreatif", description: "Teman untuk mewujudkan imajinasimu", icon: "palette" },
  { id: "need-gaming", name: "Gaming", slug: "gaming", description: "Performa tinggi untuk bermain game", icon: "gamepad" },
  { id: "need-harian", name: "Harian", slug: "harian", description: "Aktivitas ringan & santai setiap hari", icon: "home" },
];

export async function getLiveNeeds(tenantId?: string): Promise<Array<{ id: string; name: string; slug: string; description: string; icon: string }>> {
  try {
    const whereClause: any = { isActive: true };
    if (tenantId) {
      whereClause.tenantId = tenantId;
    }

    const dbNeeds = await withTimeout<any[]>(
      (prisma as any).productNeed.findMany({
        where: whereClause,
        orderBy: { sortOrder: "asc" },
      })
    );
    if (Array.isArray(dbNeeds) && dbNeeds.length > 0) {
      return dbNeeds.map((n: any) => ({
        id: n.id,
        name: n.name,
        slug: n.slug,
        description: n.description || "",
        icon: n.icon || "tag",
      }));
    }
  } catch {
    // Fallback
  }
  return DEFAULT_NEEDS;
}
