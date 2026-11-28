import { prisma } from "@/lib/db";
import crypto from "crypto";

export function generateTenantId(slug: string): string {
  // 40-char SHA-1 hash from slug + random salt to ensure absolute uniqueness
  const input = `${slug.toLowerCase().trim()}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  return crypto.createHash("sha1").update(input).digest("hex");
}

export const HADI_TENANT_ID = crypto
  .createHash("sha1")
  .update("hadicomputer")
  .digest("hex");

export interface TenantWithSettings {
  id: string;
  name: string;
  slug: string;
  customDomain: string | null;
  plan: "STARTER" | "PRO" | "ENTERPRISE";
  status: "ACTIVE" | "TRIAL" | "SUSPENDED";
  features: {
    pcBuilder?: boolean;
    tradeIn?: boolean;
    instantCheckout?: boolean;
    [key: string]: boolean | undefined;
  };
  settings: {
    tagline: string | null;
    logoUrl: string | null;
    faviconUrl: string | null;
    primaryColor: string;
    secondaryColor: string;
    whatsappNumber: string;
    whatsappDefaultTemplate: string | null;
    address: string | null;
    openHours: string;
    mapsEmbedUrl: string | null;
    socialInstagram: string | null;
    socialTiktok: string | null;
    socialFacebook: string | null;
  } | null;
  _count?: {
    products: number;
    categories: number;
  };
  acquiredBy: { id: string; name: string; email: string } | null;
  createdAt: Date;
  siteStatus: "DEMO" | "LIVE";
  liveAt: Date | null;
  demoTokenExpiresAt: Date | null;
  lastDemoViewAt: Date | null;
}

/** Daftar tenant; `where` dipakai god-mode untuk membatasi marketing ke tenant miliknya. */
export async function getAllTenants(where: { acquiredById?: string | { in: string[] } } = {}): Promise<TenantWithSettings[]> {
  const tenants = await prisma.tenant.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      settings: true,
      acquiredBy: { select: { id: true, name: true, email: true } },
      _count: {
        select: {
          products: true,
          categories: true,
          demoViews: true,
        },
      },
    },
  });

  // Link demo terakhir dibuka calon klien (per tenant)
  const lastViews = tenants.length
    ? await prisma.demoView.groupBy({
        by: ["tenantId"],
        where: { tenantId: { in: tenants.map((t) => t.id) } },
        _max: { createdAt: true },
      })
    : [];
  const lastViewBy = new Map(lastViews.map((v) => [v.tenantId, v._max.createdAt]));

  return tenants.map((t: any) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    customDomain: t.customDomain,
    plan: t.plan as "STARTER" | "PRO" | "ENTERPRISE",
    status: t.status as "ACTIVE" | "TRIAL" | "SUSPENDED",
    features: (t.features as any) || { pcBuilder: true, tradeIn: true },
    settings: t.settings
      ? {
          tagline: t.settings.tagline,
          logoUrl: t.settings.logoUrl,
          faviconUrl: t.settings.faviconUrl,
          primaryColor: t.settings.primaryColor || "#cc252b",
          secondaryColor: t.settings.secondaryColor || "#111413",
          whatsappNumber: t.settings.whatsappNumber || "6285769000007",
          whatsappDefaultTemplate: t.settings.whatsappDefaultTemplate,
          address: t.settings.address,
          openHours: t.settings.openHours,
          mapsEmbedUrl: t.settings.mapsEmbedUrl,
          socialInstagram: t.settings.socialInstagram,
          socialTiktok: t.settings.socialTiktok,
          socialFacebook: t.settings.socialFacebook,
          locale: t.settings.locale || "id",
          currency: t.settings.currency || "IDR",
        }
      : null,
    _count: t._count,
    acquiredBy: t.acquiredBy || null,
    createdAt: t.createdAt,
    siteStatus: t.siteStatus as "DEMO" | "LIVE",
    liveAt: t.liveAt,
    demoTokenExpiresAt: t.demoTokenExpiresAt,
    lastDemoViewAt: lastViewBy.get(t.id) || null,
  }));
}

export async function getTenantById(id: string) {
  return await prisma.tenant.findUnique({
    where: { id },
    include: { settings: true },
  });
}

export async function createTenant(data: {
  name: string;
  slug: string;
  customDomain?: string;
  plan?: "STARTER" | "PRO" | "ENTERPRISE";
  primaryColor?: string;
  whatsappNumber?: string;
  address?: string;
  openHours?: string;
  locale?: "id" | "en";
  currency?: "IDR" | "USD" | "SGD" | "MYR" | "EUR";
  features?: {
    pcBuilder?: boolean;
    tradeIn?: boolean;
    instantCheckout?: boolean;
  };
  status?: "ACTIVE" | "TRIAL" | "SUSPENDED";
  siteStatus?: "DEMO" | "LIVE";
  /** Marketing yang membawa tenant ini */
  acquiredById?: string | null;
}) {
  const id = generateTenantId(data.slug);
  const plan = data.plan || "PRO";
  const locale = data.locale === "en" ? "en" : "id";
  const currency = data.currency || (locale === "en" ? "USD" : "IDR");
  const en = locale === "en";
  const features = data.features || {
    pcBuilder: plan === "PRO" || plan === "ENTERPRISE",
    tradeIn: plan === "PRO" || plan === "ENTERPRISE",
    instantCheckout: plan === "ENTERPRISE",
  };

  const tenant = await prisma.tenant.create({
    data: {
      id,
      slug: data.slug.toLowerCase().trim().replace(/[^a-z0-9_-]/g, "-"),
      name: data.name.trim(),
      customDomain: data.customDomain ? data.customDomain.toLowerCase().trim() : null,
      plan,
      status: data.status || "ACTIVE",
      siteStatus: data.siteStatus || "DEMO",
      features,
      acquiredById: data.acquiredById || null,
      settings: {
        create: {
          primaryColor: data.primaryColor || "#cc252b",
          secondaryColor: "#111413",
          whatsappNumber: data.whatsappNumber || "6285769000007",
          address: data.address || (en ? "" : "Indonesia"),
          openHours: data.openHours || (en ? "Open daily: 09:00 – 21:00" : "Buka setiap hari: 08.00 – 22.00 WIB"),
          whatsappDefaultTemplate: en
            ? `Hi ${data.name}, I'd like to inquire about computers & laptops.`
            : `Halo ${data.name}, saya ingin konsultasi perangkat komputer/laptop.`,
          locale,
          currency,
          // Toko baru memakai template Precision (bisa diganti di Pengaturan → Tampilan)
          homepageConfig: { templateId: "precision" },
        },
      },
    },
    include: { settings: true },
  });

  return tenant;
}

export async function updateTenantFeatures(
  tenantId: string,
  features: Record<string, boolean>
) {
  return await prisma.tenant.update({
    where: { id: tenantId },
    data: { features },
    include: { settings: true },
  });
}

export async function updateTenantStatus(
  tenantId: string,
  status: "ACTIVE" | "TRIAL" | "SUSPENDED"
) {
  return await prisma.tenant.update({
    where: { id: tenantId },
    data: { status },
  });
}

export interface UpdateTenantInput {
  name?: string;
  customDomain?: string | null;
  plan?: "STARTER" | "PRO" | "ENTERPRISE";
  status?: "ACTIVE" | "TRIAL" | "SUSPENDED";
  features?: Record<string, boolean>;
  primaryColor?: string;
  secondaryColor?: string;
  whatsappNumber?: string;
  address?: string;
  openHours?: string;
  acquiredById?: string | null;
}

export async function updateTenantFull(tenantId: string, data: UpdateTenantInput) {
  const tenantUpdateData: any = {};
  if (data.name !== undefined) tenantUpdateData.name = data.name.trim();
  if (data.customDomain !== undefined) {
    tenantUpdateData.customDomain = data.customDomain ? data.customDomain.toLowerCase().trim() : null;
  }
  if (data.plan !== undefined) tenantUpdateData.plan = data.plan;
  if (data.status !== undefined) tenantUpdateData.status = data.status;
  if (data.features !== undefined) tenantUpdateData.features = data.features;
  if (data.acquiredById !== undefined) tenantUpdateData.acquiredById = data.acquiredById;

  const settingsUpdateData: any = {};
  if (data.primaryColor !== undefined) settingsUpdateData.primaryColor = data.primaryColor;
  if (data.secondaryColor !== undefined) settingsUpdateData.secondaryColor = data.secondaryColor;
  if (data.whatsappNumber !== undefined) settingsUpdateData.whatsappNumber = data.whatsappNumber.trim();
  if (data.address !== undefined) settingsUpdateData.address = data.address.trim() || null;
  if (data.openHours !== undefined) settingsUpdateData.openHours = data.openHours.trim();

  return await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      ...tenantUpdateData,
      settings:
        Object.keys(settingsUpdateData).length > 0
          ? {
              upsert: {
                create: {
                  primaryColor: data.primaryColor || "#cc252b",
                  ...(data.secondaryColor ? { secondaryColor: data.secondaryColor } : {}),
                  whatsappNumber: data.whatsappNumber || "6281234567890",
                  address: data.address || null,
                  openHours: data.openHours || "Senin - Sabtu: 09:00 - 20:00",
                },
                update: settingsUpdateData,
              },
            }
          : undefined,
    },
    include: { settings: true },
  });
}

export async function deleteTenant(tenantId: string) {
  // Prevent accidentally deleting Hadi Computer Tenant #1
  if (tenantId === HADI_TENANT_ID) {
    throw new Error("Toko utama Hadi Computer (Tenant #1) tidak dapat dihapus.");
  }
  return await prisma.$transaction(async (tx) => {
    // Produk menunjuk kategori/merek tanpa cascade: hapus produk dulu agar urutan FK tidak bentrok
    await tx.product.deleteMany({ where: { tenantId } });
    // Akun admin toko ikut dihapus (relasinya SetNull: tanpa ini akun tertinggal tanpa toko)
    await tx.adminUser.deleteMany({ where: { tenantId } });
    return tx.tenant.delete({ where: { id: tenantId } });
  });
}
