import { cookies, headers } from "next/headers";
import { prisma } from "./db";
import type { StoreSettings, HomepageConfig } from "./types";

export interface StorefrontTenant {
  id: string;
  slug: string;
  name: string;
  plan: string;
  status: string;
  features: Record<string, boolean>;
  settings: StoreSettings;
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

export async function resolveStorefrontTenant(explicitSlugOrId?: string): Promise<StorefrontTenant> {
  const cookieStore = await cookies();
  const headerStore = await headers();

  let targetSlugOrId = explicitSlugOrId;

  // 1. Check preview / override from cookie or active admin impersonation
  if (!targetSlugOrId) {
    targetSlugOrId =
      cookieStore.get("rigspace_store_slug")?.value ||
      cookieStore.get("preview_tenant_slug")?.value ||
      cookieStore.get("god_impersonated_tenant_id")?.value;
  }

  // 1.b Check if logged in as a normal tenant admin
  if (!targetSlugOrId) {
    const adminToken = cookieStore.get("hadi_admin_session")?.value;
    if (adminToken) {
      try {
        const { jwtVerify } = await import("jose");
        const ADMIN_JWT_SECRET = new TextEncoder().encode(
          process.env.ADMIN_JWT_SECRET || "hadi-computer-cms-secret-key-32-chars-long-2026"
        );
        const { payload } = await jwtVerify(adminToken, ADMIN_JWT_SECRET);
        if (payload?.tenantId) {
          targetSlugOrId = payload.tenantId as string;
        }
      } catch {
        // ignore invalid token
      }
    }
  }

  // 2. Check host header if not in override
  if (!targetSlugOrId) {
    const host = headerStore.get("host") || "";
    const cleanHost = host.split(":")[0].toLowerCase();

    // Check subdomain (e.g. plazabitcom.rigspace.id or plazabitcom.localhost)
    if (cleanHost.includes(".") && !cleanHost.startsWith("www.") && cleanHost !== "localhost") {
      const parts = cleanHost.split(".");
      if (parts.length >= 2) {
        const potentialSubdomain = parts[0];
        if (potentialSubdomain !== "admin" && potentialSubdomain !== "api" && potentialSubdomain !== "app") {
          targetSlugOrId = potentialSubdomain;
        }
      }
    }
  }

  // 3. Query tenant from database
  let tenant = null;
  if (targetSlugOrId) {
    tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { slug: targetSlugOrId },
          { id: targetSlugOrId },
          { customDomain: targetSlugOrId },
        ],
      },
      include: { settings: true },
    });
  }

  // 4. Fallback to default tenant (e.g. Hadi Computer or the first registered tenant)
  if (!tenant) {
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
      name: "Hadi Computer",
      plan: "PRO",
      status: "ACTIVE",
      features: { pcBuilder: true, tradeIn: true },
      settings: {
        id: "default",
        slug: "hadicomputer",
        name: "Hadi Computer",
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
