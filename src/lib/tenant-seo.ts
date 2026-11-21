import { headers } from "next/headers";
import { prisma } from "./db";
import { resolveStorefrontTenant } from "./tenant-resolver";
import { STORE_PREVIEW_HEADER } from "./storefront-template";

/**
 * Data SEO & analitik toko aktif (berdasarkan domain/subdomain/preview request).
 * Dipakai layout (metadata + script analitik), sitemap.xml, dan robots.txt.
 */
export async function getStorefrontSeo() {
  const headerStore = await headers();
  const tenant = await resolveStorefrontTenant(undefined, { previewSlug: headerStore.get(STORE_PREVIEW_HEADER) });
  const isRealTenant = tenant.id !== "default";

  const status = tenant.status;
  const [setting, sampleCount] = isRealTenant
    ? await Promise.all([
        prisma.tenantSetting.findUnique({
          where: { tenantId: tenant.id },
          select: {
            seoTitle: true,
            seoDescription: true,
            seoKeywords: true,
            ogImageUrl: true,
            googleSiteVerification: true,
            searchIndexing: true,
            gaMeasurementId: true,
            gtmContainerId: true,
            stockDisplay: true,
            lowStockThreshold: true,
          },
        }),
        prisma.product.count({ where: { tenantId: tenant.id, isSample: true, deletedAt: null } }),
      ])
    : [null, 0];

  const name = tenant.settings.name || tenant.name || "Toko";
  const tagline = tenant.settings.tagline || "Perangkat tepat untuk kebutuhanmu";

  // Origin publik request ini (custom domain / subdomain), untuk URL absolut sitemap & OG
  const host = headerStore.get("x-forwarded-host") || headerStore.get("host") || "localhost:3000";
  const proto = headerStore.get("x-forwarded-proto") || (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  const origin = `${proto}://${host}`;

  /** Toko boleh diindeks bila: sudah LIVE (bukan demo), diizinkan owner, tanpa data contoh, dan tidak ditangguhkan. */
  const indexable =
    isRealTenant && tenant.siteStatus !== "DEMO" && setting?.searchIndexing !== false && sampleCount === 0 && status !== "SUSPENDED";

  return {
    tenant,
    name,
    tagline,
    origin,
    indexable,
    hasSampleData: sampleCount > 0,
    title: setting?.seoTitle || `${name} — ${tagline}`,
    description:
      setting?.seoDescription ||
      `${name} — ${tagline}. Laptop baru & bekas, PC rakitan, aksesori, dan servis. Konsultasi langsung via WhatsApp.`,
    keywords: (setting?.seoKeywords || "")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean),
    ogImage: setting?.ogImageUrl || tenant.settings.logoUrl || "/images/banners/promo-bundle.png",
    googleSiteVerification: setting?.googleSiteVerification || null,
    analytics: {
      platformGaId: process.env.NEXT_PUBLIC_PLATFORM_GA_ID || null,
      tenantGaId: setting?.gaMeasurementId || null,
      gtmId: setting?.gtmContainerId || null,
      tenantSlug: tenant.slug || tenant.id,
    },
    stock: {
      display: (setting?.stockDisplay || "hidden") as "hidden" | "exact" | "limited",
      lowThreshold: setting?.lowStockThreshold ?? 3,
    },
  };
}
