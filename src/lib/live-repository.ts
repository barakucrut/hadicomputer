import { prisma } from "./db";
import type { Banner, Product, Service, ServiceCaseItem, StoreSettings } from "./types";
import { resolveStorefrontTenant } from "./tenant-resolver";
import { stockLabel } from "./stock";

/**
 * Tenant aktif untuk query storefront. Bila pemanggil tidak memberi tenantId,
 * tenant diresolusi dari request (domain/subdomain/preview) — data toko lain
 * tidak pernah ikut tampil.
 */
async function activeTenantId(tenantId?: string): Promise<string> {
  if (tenantId) return tenantId;
  return (await resolveStorefrontTenant()).id;
}

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
    whereClause.tenantId = await activeTenantId(tenantId);

    // Mode tampilan stok toko (hidden / exact / limited)
    const stockSetting = await prisma.tenantSetting.findUnique({
      where: { tenantId: whereClause.tenantId },
      select: { stockDisplay: true, lowStockThreshold: true },
    });
    const stockMode = (stockSetting?.stockDisplay || "hidden") as "hidden" | "exact" | "limited";
    const lowThreshold = stockSetting?.lowStockThreshold ?? 3;

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
          stock: p.stock,
          stockLabel: p.availability === "HABIS" ? null : stockLabel(p.stock, stockMode, lowThreshold),
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
    // DB error: jangan pernah menampilkan katalog contoh/toko lain
  }
  return [];
}

export async function getLiveProduct(slug: string, tenantId?: string): Promise<Product | undefined> {
  try {
    const products = await getLiveProducts(tenantId);
    const found = products.find((p) => p.slug === slug);
    if (found) return found;
  } catch {
    // Fallback
  }
  return undefined;
}

export async function getLiveBanners(tenantId?: string): Promise<Banner[]> {
  try {
    const whereClause: any = { isActive: true };
    whereClause.tenantId = await activeTenantId(tenantId);

    const dbBanners = await withTimeout(
      prisma.banner.findMany({
        where: whereClause,
        include: {
          hotspots: true,
          // Produk tertaut (hanya yang masih tampil di etalase)
          product: {
            select: {
              slug: true,
              basePrice: true,
              originalPrice: true,
              publicationStatus: true,
              deletedAt: true,
              images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1, select: { url: true } },
              specs: { orderBy: { sortOrder: "asc" }, take: 3, select: { value: true } },
            },
          },
        },
        orderBy: { sortOrder: "asc" },
      })
    );

    return dbBanners
      .map((b) => {
        const product = b.product && !b.product.deletedAt && b.product.publicationStatus === "PUBLISHED" ? b.product : null;
        const toNum = (v: bigint | null | undefined) => (v !== null && v !== undefined ? Number(v) : null);
        const image = b.imageUrl || product?.images[0]?.url || "";
        return {
          id: b.id,
          eyebrow: b.badgeText || "PROMO SPESIAL MINGGU INI",
          title: b.title,
          description: b.subtitle || "",
          mobileTitle: b.title,
          mobileDescription: b.subtitle || "",
          image,
          href: b.ctaUrl || (product ? `/produk/${product.slug}` : "#"),
          cta: b.ctaLabel || (product ? "Lihat Produk" : "Lihat Promo"),
          theme: b.bgTheme === "studio" ? "dark" : ((b.bgTheme as Banner["theme"]) || "dark"),
          style: b.bgTheme === "studio" ? "studio" : "photo",
          hotspots: b.hotspots.map((h) => ({ label: h.label, x: h.xPercent, y: h.yPercent })),
          placement: b.placement === "tile" ? "tile" : "hero",
          price: product ? toNum(product.basePrice) : toNum(b.price),
          originalPrice: product ? toNum(product.originalPrice) : toNum(b.originalPrice),
          specs: product ? product.specs.map((sp) => sp.value) : [],
          productSlug: product?.slug ?? null,
        } satisfies Banner;
      })
      .filter((b) => Boolean(b.image));
  } catch (err) {
    // DB error: tampil tanpa banner (dicatat di server)
    console.error("[getLiveBanners]", err instanceof Error ? err.message : err);
  }
  return [];
}

export async function getLiveCategories(tenantId?: string) {
  try {
    const whereClause: any = { isActive: true };
    whereClause.tenantId = await activeTenantId(tenantId);

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
  return [];
}

export async function getLiveStoreSettings(tenantId?: string): Promise<StoreSettings> {
  // Tanpa fallback statis: menampilkan kontak toko lain jauh lebih buruk daripada halaman error
  const storefront = await resolveStorefrontTenant(tenantId);
  return storefront.settings;
}

export async function getLiveServices(tenantId?: string): Promise<Service[]> {
  try {
    const whereClause: any = { isActive: true };
    whereClause.tenantId = await activeTenantId(tenantId);

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
  return [];
}

export async function getLiveService(slug: string, tenantId?: string): Promise<Service | undefined> {
  try {
    const all = await getLiveServices(tenantId);
    const found = all.find((s) => s.slug === slug);
    if (found) return found;
  } catch {
    // Fallback
  }
  return undefined;
}

export async function getLiveBrands(
  tenantId?: string
): Promise<Array<{ id: string; name: string; slug: string; logoUrl: string | null; productCount: number }>> {
  try {
    const whereClause: any = { isActive: true };
    whereClause.tenantId = await activeTenantId(tenantId);

    const dbBrands = await withTimeout(
      prisma.brand.findMany({
        where: whereClause,
        include: { _count: { select: { products: { where: { deletedAt: null, publicationStatus: "PUBLISHED" } } } } },
        orderBy: { sortOrder: "asc" },
      })
    );
    return dbBrands.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      logoUrl: b.logoUrl || null,
      productCount: b._count.products,
    }));
  } catch {
    // Fallback
  }
  return [];
}

/** Portofolio servis yang dipublikasikan toko (terbaru dulu). */
export async function getLiveServiceCases(tenantId?: string, limit = 6): Promise<ServiceCaseItem[]> {
  try {
    const rows = await withTimeout(
      prisma.serviceCase.findMany({
        where: { tenantId: await activeTenantId(tenantId), isPublished: true },
        include: { service: { select: { title: true, slug: true } } },
        orderBy: [{ completedAt: "desc" }, { createdAt: "desc" }],
        take: limit,
      })
    );
    return rows.map((c) => ({
      id: c.id,
      title: c.title,
      device: c.device,
      summary: c.summary,
      durationText: c.durationText,
      completedAt: c.completedAt ? c.completedAt.toISOString() : null,
      images: Array.isArray(c.images) ? (c.images as string[]).filter((u) => typeof u === "string") : [],
      serviceName: c.service?.title ?? null,
      serviceSlug: c.service?.slug ?? null,
    }));
  } catch {
    return [];
  }
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
    whereClause.tenantId = await activeTenantId(tenantId);

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

/** Profil toko untuk template Precision: tahun berdiri & chip pencarian cepat. */
export async function getLiveStoreProfile(tenantId?: string): Promise<{ foundedYear: number | null; quickSearches: string[] }> {
  try {
    const setting = await prisma.tenantSetting.findUnique({
      where: { tenantId: await activeTenantId(tenantId) },
      select: { foundedYear: true, quickSearches: true },
    });
    return {
      foundedYear: setting?.foundedYear ?? null,
      quickSearches: Array.isArray(setting?.quickSearches)
        ? (setting!.quickSearches as unknown[]).filter((x): x is string => typeof x === "string")
        : [],
    };
  } catch {
    return { foundedYear: null, quickSearches: [] };
  }
}

import { isGenericBrand } from "@/components/storefront/templates/precision/model";

export interface StorefrontMenuData {
  categories: Array<{ name: string; slug: string; icon: string; count: number }>;
  brands: Array<{ name: string; logoUrl: string | null; count: number }>;
  services: Array<{ slug: string; name: string; summary: string }>;
  /** Produk sorotan untuk mega menu: dari Studio Banner utama pertama (bila ada) */
  featured: {
    title: string;
    image: string;
    href: string;
    price: number | null;
    originalPrice: number | null;
    studio: boolean;
  } | null;
  quickSearches: string[];
}

/** Data ringan untuk header (mega menu & dropdown pencarian) template Precision. */
export async function getLiveMenuData(tenantId?: string): Promise<StorefrontMenuData> {
  const empty: StorefrontMenuData = { categories: [], brands: [], services: [], featured: null, quickSearches: [] };
  try {
    const tid = await activeTenantId(tenantId);
    const visible = { tenantId: tid, deletedAt: null, publicationStatus: "PUBLISHED" as const };
    const [cats, counts, brands, services, banner, profile] = await withTimeout(
      Promise.all([
        prisma.category.findMany({ where: { tenantId: tid, isActive: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true, slug: true, icon: true } }),
        prisma.product.groupBy({ by: ["categoryId"], where: visible, _count: { _all: true } }),
        prisma.brand.findMany({
          where: { tenantId: tid, isActive: true },
          select: { name: true, logoUrl: true, _count: { select: { products: { where: { deletedAt: null, publicationStatus: "PUBLISHED" } } } } },
        }),
        prisma.service.findMany({ where: { tenantId: tid, isActive: true }, orderBy: { sortOrder: "asc" }, take: 6, select: { slug: true, title: true, summary: true } }),
        prisma.banner.findFirst({
          where: { tenantId: tid, isActive: true, placement: "hero" },
          orderBy: [{ bgTheme: "desc" }, { sortOrder: "asc" }],
          select: {
            title: true,
            imageUrl: true,
            ctaUrl: true,
            bgTheme: true,
            price: true,
            originalPrice: true,
            product: { select: { slug: true, basePrice: true, originalPrice: true, deletedAt: true, publicationStatus: true, images: { take: 1, orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], select: { url: true } } } },
          },
        }),
        getLiveStoreProfile(tid),
      ]),
      2500
    );
    const countBy = new Map(counts.map((c) => [c.categoryId, c._count._all]));
    const toNum = (v: bigint | null | undefined) => (v !== null && v !== undefined ? Number(v) : null);
    const product = banner?.product && !banner.product.deletedAt && banner.product.publicationStatus === "PUBLISHED" ? banner.product : null;
    const image = banner?.imageUrl || product?.images[0]?.url || "";
    return {
      categories: cats
        .map((c) => ({ name: c.name, slug: c.slug, icon: c.icon || "", count: countBy.get(c.id) || 0 }))
        .filter((c) => c.count > 0),
      brands: brands
        .map((b) => ({ name: b.name, logoUrl: b.logoUrl || null, count: b._count.products }))
        .filter((b) => b.count > 0 && !isGenericBrand(b.name))
        .sort((a, b) => b.count - a.count)
        .slice(0, 12),
      services: services.map((s) => ({ slug: s.slug, name: s.title, summary: s.summary })),
      featured:
        banner && image
          ? {
              title: banner.title,
              image,
              href: banner.ctaUrl || (product ? `/produk/${product.slug}` : "/katalog"),
              price: product ? toNum(product.basePrice) : toNum(banner.price),
              originalPrice: product ? toNum(product.originalPrice) : toNum(banner.originalPrice),
              studio: banner.bgTheme === "studio",
            }
          : null,
      quickSearches: profile.quickSearches,
    };
  } catch (err) {
    console.error("[getLiveMenuData]", err instanceof Error ? err.message : err);
    return empty;
  }
}
