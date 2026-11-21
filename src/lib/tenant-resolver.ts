import { cookies, headers } from "next/headers";
import { prisma } from "./db";
import type { StoreSettings, HomepageConfig } from "./types";
import { jwtVerify } from "jose";
import { STORE_PREVIEW_HEADER } from "./storefront-template";
import { classifyHost } from "./platform-domain";
import { GOD_COOKIE_NAME, verifyGodToken } from "./god-auth";
import { demoCookieName, isDemoLinkActive, verifyDemoCookie } from "./demo-access";

export interface StorefrontTenant {
  id: string;
  slug: string;
  name: string;
  plan: string;
  status: string;
  features: Record<string, boolean>;
  settings: StoreSettings;
  /** Bawaan "tenant". Lihat TenantResolution. */
  resolution?: TenantResolution;
  /** DEMO = etalase terkunci (Mode Demo), LIVE = publik. */
  siteStatus?: "DEMO" | "LIVE";
}

const DEFAULT_HOMEPAGE_CONFIG: HomepageConfig = {
  featuredTitle: "Pilihan Toko, untuk harimu.",
  featuredEyebrow: "DIPILIH UNTUKMU",
  featuredDescription: "Kenali perangkat yang bisa jadi teman aktivitasmu berikutnya.",
  bestSellerTitle: "Favorit di Toko Ini",
  bestSellerEyebrow: "KURASI OWNER",
  bestSellerDescription: "Koleksi produk paling diminati yang siap menemani produktivitas harianmu.",
  waConsultLabel: "Tanya Toko",
  waFloatingLabel: "Tanya via WhatsApp",
  storeSectionTitle: "Lihat langsung. Ngobrol lebih nyaman.",
  storeSectionEyebrow: "SAMPAI KETEMU DI TOKO",
  storeSectionDescription: "Kenali pilihan perangkatmu dan diskusikan kebutuhan langsung.",
  sections: {
    heroSlider: true,
    valueStrip: true,
    categories: true,
    promoWeek: true,
    featured: true,
    needs: true,
    latest: true,
    pcGaming: true,
    services: true,
    storeLocation: true,
  },
};

/** Hasil resolusi: toko nyata, halaman platform (rigspace.id), atau toko tidak ditemukan. */
export type TenantResolution = "tenant" | "platform-root" | "not-found" | "demo-locked";

const ADMIN_JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || "hadi-computer-cms-secret-key-32-chars-long-2026"
);

async function verifiedAdminTenantId(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, ADMIN_JWT_SECRET);
    return typeof payload?.tenantId === "string" ? payload.tenantId : null;
  } catch {
    return null;
  }
}

/** Pengunjung = tim internal (god-mode) atau admin toko yang sedang login. */
async function isTeamViewer(cookieStore: Awaited<ReturnType<typeof cookies>>): Promise<boolean> {
  const god = cookieStore.get(GOD_COOKIE_NAME)?.value;
  if (god && (await verifyGodToken(god))) return true;
  return Boolean(await verifiedAdminTenantId(cookieStore.get("hadi_admin_session")?.value));
}

/** Toko kosong netral: query apa pun ke tenantId ini tidak mengembalikan data toko mana pun. */
function emptyStorefront(resolution: Exclude<TenantResolution, "tenant">): StorefrontTenant {
  return {
    id: "default",
    slug: "",
    name: resolution === "platform-root" ? "Rigspace.id" : "Toko",
    plan: "STARTER",
    siteStatus: "LIVE",
    status: "ACTIVE",
    features: {},
    resolution,
    settings: {
      id: "default",
      slug: "",
      name: resolution === "platform-root" ? "Rigspace.id" : "Toko",
      tagline: null,
      logoUrl: null,
      faviconUrl: null,
      primaryColor: "#111413",
      secondaryColor: "#111413",
      fontFamily: "Plus Jakarta Sans",
      whatsapp: null,
      address: null,
      hours: null,
      email: null,
      instagram: null,
      tiktok: null,
      facebook: null,
      mapsUrl: null,
      homepageConfig: DEFAULT_HOMEPAGE_CONFIG,
    },
  };
}

/**
 * Toko aktif untuk request ini. Urutan:
 *  1. `explicitTenantId` — HANYA nilai internal tepercaya (id/slug dari database), bukan input pengunjung.
 *  2. CMS (`opts.cms`): toko yang sedang dibuka (cookie impersonasi) / toko admin yang login.
 *  3. Preview `?store=` / cookie preview — hanya untuk tim internal atau host pengembangan.
 *  4. Host: custom domain, lalu `{slug}.rigspace.id`.
 *  5. Host pengembangan saja: toko admin yang login, lalu toko pertama (kenyamanan dev).
 *  6. Selain itu TIDAK ada fallback ke toko lain: rigspace.id = halaman platform, sisanya = tidak ditemukan.
 */
export async function resolveStorefrontTenant(
  explicitTenantId?: string,
  opts: { cms?: boolean; previewSlug?: string | null } = {}
): Promise<StorefrontTenant> {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const hostKind = classifyHost(headerStore.get("x-forwarded-host") || headerStore.get("host"));
  const isDev = hostKind.kind === "dev";

  let targetSlugOrId = explicitTenantId || undefined;

  // 2. Area CMS: tema mengikuti toko yang sedang dikelola
  if (!targetSlugOrId && opts.cms) {
    targetSlugOrId =
      cookieStore.get("god_impersonated_tenant_id")?.value ||
      (await verifiedAdminTenantId(cookieStore.get("hadi_admin_session")?.value)) ||
      undefined;
  }

  // 3. Preview toko lain (?store= diteruskan middleware lewat header) — tim internal / dev saja
  if (!targetSlugOrId) {
    const preview =
      opts.previewSlug ||
      headerStore.get(STORE_PREVIEW_HEADER) ||
      cookieStore.get("rigspace_store_slug")?.value ||
      cookieStore.get("preview_tenant_slug")?.value ||
      cookieStore.get("god_impersonated_tenant_id")?.value;
    if (preview && /^[a-z0-9-]{1,100}$/i.test(preview) && (isDev || (await isTeamViewer(cookieStore)))) {
      targetSlugOrId = preview;
    }
  }

  // 4. Host request
  if (!targetSlugOrId) {
    if (hostKind.kind === "custom") {
      const domainTenant = await prisma.tenant.findFirst({
        where: { customDomain: { in: [hostKind.domain, `www.${hostKind.domain}`] } },
        select: { id: true },
      });
      if (domainTenant) targetSlugOrId = domainTenant.id;
    } else if (hostKind.kind === "subdomain") {
      targetSlugOrId = hostKind.slug;
    } else if (hostKind.kind === "dev" && hostKind.slug) {
      targetSlugOrId = hostKind.slug;
    }
  }

  // 5. Host pengembangan: toko admin yang login
  if (!targetSlugOrId && isDev) {
    targetSlugOrId = (await verifiedAdminTenantId(cookieStore.get("hadi_admin_session")?.value)) || undefined;
  }

  let tenant = null;
  if (targetSlugOrId) {
    tenant = await prisma.tenant.findFirst({
      where: {
        OR: [{ slug: targetSlugOrId }, { id: targetSlugOrId }, { customDomain: targetSlugOrId }],
      },
      include: { settings: true },
    });
  }

  // 7. Mode Demo: etalase terkunci kecuali tim internal, admin toko itu, atau pemegang link demo sah
  if (tenant && tenant.siteStatus === "DEMO" && !opts.cms && !explicitTenantId) {
    const godToken = cookieStore.get(GOD_COOKIE_NAME)?.value;
    const allowed =
      Boolean(godToken && (await verifyGodToken(godToken))) ||
      (await verifiedAdminTenantId(cookieStore.get("hadi_admin_session")?.value)) === tenant.id ||
      (isDemoLinkActive(tenant.demoTokenExpiresAt) &&
        verifyDemoCookie(tenant.id, tenant.demoToken, cookieStore.get(demoCookieName(tenant.id))?.value));
    if (!allowed) return emptyStorefront("demo-locked");
  }

  if (!tenant) {
    // 6. Produksi: jangan pernah menampilkan toko lain di alamat yang salah
    if (!isDev) return emptyStorefront(hostKind.kind === "platform-root" && !targetSlugOrId ? "platform-root" : "not-found");
    tenant = await prisma.tenant.findFirst({
      orderBy: { createdAt: "asc" },
      include: { settings: true },
    });
  }

  if (!tenant) {
    // Ultimate fallback if DB has no tenants at all
    return {
      id: "default",
      slug: "hadicomputer",
      name: "Toko",
      plan: "PRO",
      status: "ACTIVE",
      features: { pcBuilder: true, tradeIn: true },
      settings: {
        id: "default",
        slug: "hadicomputer",
        name: "Toko",
        tagline: "Teknologi untuk keseharianmu.",
        logoUrl: "/images/hadi-logo.jpeg",
        faviconUrl: "/favicon.ico",
        primaryColor: "#dd2028",
        secondaryColor: "#111413",
        fontFamily: "Plus Jakarta Sans",
        whatsapp: "+6285769000007",
        address: "Jl. Ahmad Yani No. 45, Lantai 1",
        hours: "Buka setiap hari: 08.00 – 22.00 WIB",
        email: null,
        instagram: "@hadicomputer",
        tiktok: null,
        facebook: null,
        mapsUrl: null,
        homepageConfig: DEFAULT_HOMEPAGE_CONFIG,
      },
    };
  }

  const s = tenant.settings;
  let rawConfig: HomepageConfig | null = null;
  if (s?.homepageConfig) {
    try {
      rawConfig = typeof s.homepageConfig === "string" ? JSON.parse(s.homepageConfig) : (s.homepageConfig as any);
    } catch {
      rawConfig = null;
    }
  }

  const storeName = tenant.name;
  const mergedHomepageConfig: HomepageConfig = {
    templateId: rawConfig?.templateId || "classic-retail",
    featuredTitle: rawConfig?.featuredTitle || `Pilihan ${storeName}, untuk harimu.`,
    featuredEyebrow: rawConfig?.featuredEyebrow || "DIPILIH UNTUKMU",
    featuredDescription: rawConfig?.featuredDescription || "Kenali perangkat yang bisa jadi teman aktivitasmu berikutnya.",
    bestSellerTitle: rawConfig?.bestSellerTitle || `Favorit di ${storeName}`,
    bestSellerEyebrow: rawConfig?.bestSellerEyebrow || "KURASI OWNER",
    bestSellerDescription: rawConfig?.bestSellerDescription || "Koleksi produk paling diminati yang siap menemani produktivitas harianmu.",
    waConsultLabel: rawConfig?.waConsultLabel || `Tanya ${storeName}`,
    waFloatingLabel: rawConfig?.waFloatingLabel || `Tanya ${storeName} via WhatsApp`,
    storeSectionTitle: rawConfig?.storeSectionTitle || "Lihat langsung. Ngobrol lebih nyaman.",
    storeSectionEyebrow: rawConfig?.storeSectionEyebrow || "SAMPAI KETEMU DI TOKO",
    storeSectionDescription: rawConfig?.storeSectionDescription || `Kenali pilihan perangkatmu dan diskusikan kebutuhan langsung dengan ${storeName}.`,
    sections: {
      heroSlider: rawConfig?.sections?.heroSlider !== false,
      valueStrip: rawConfig?.sections?.valueStrip !== false,
      categories: rawConfig?.sections?.categories !== false,
      promoWeek: rawConfig?.sections?.promoWeek !== false,
      featured: rawConfig?.sections?.featured !== false,
      needs: rawConfig?.sections?.needs !== false,
      latest: rawConfig?.sections?.latest !== false,
      pcGaming: rawConfig?.sections?.pcGaming !== false,
      services: rawConfig?.sections?.services !== false,
      storeLocation: rawConfig?.sections?.storeLocation !== false,
    },
  };

  let waDigits = (s?.whatsappNumber || "6285769000007").replace(/\D/g, "");
  if (waDigits.startsWith("0")) {
    waDigits = "62" + waDigits.slice(1);
  }
  const formattedWa = waDigits ? `+${waDigits}` : "+6285769000007";

  return {
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    plan: tenant.plan,
    status: tenant.status,
    resolution: "tenant",
    siteStatus: tenant.siteStatus,
    features: (tenant.features as Record<string, boolean>) || { pcBuilder: true, tradeIn: true },
    settings: {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      tagline: s?.tagline || "Teknologi untuk keseharianmu.",
      logoUrl: s?.logoUrl || null,
      faviconUrl: s?.faviconUrl || null,
      primaryColor: s?.primaryColor || "#dd2028",
      secondaryColor: s?.secondaryColor || "#111413",
      fontFamily: s?.fontFamily || "Plus Jakarta Sans",
      whatsapp: formattedWa,
      address: s?.address || "Tempurejo, Kabupaten Jember",
      hours: s?.openHours || "Buka setiap hari: 08.00 – 22.00 WIB",
      email: null,
      instagram: s?.socialInstagram || null,
      tiktok: s?.socialTiktok || null,
      facebook: s?.socialFacebook || null,
      mapsUrl: s?.mapsEmbedUrl || null,
      homepageConfig: mergedHomepageConfig,
    },
  };
}
