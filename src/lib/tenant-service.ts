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
  createdAt: Date;
}

export async function getAllTenants(): Promise<TenantWithSettings[]> {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      settings: true,
      _count: {
        select: {
          products: true,
          categories: true,
        },
      },
    },
  });

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
        }
      : null,
    _count: t._count,
    createdAt: t.createdAt,
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
  features?: {
    pcBuilder?: boolean;
    tradeIn?: boolean;
    instantCheckout?: boolean;
  };
}) {
  const id = generateTenantId(data.slug);
  const plan = data.plan || "PRO";
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
      status: "ACTIVE",
      features,
      settings: {
        create: {
          primaryColor: data.primaryColor || "#cc252b",
          secondaryColor: "#111413",
          whatsappNumber: data.whatsappNumber || "6285769000007",
          address: data.address || "Indonesia",
          openHours: data.openHours || "Buka setiap hari: 08.00 – 22.00 WIB",
          whatsappDefaultTemplate: `Halo ${data.name}, saya ingin konsultasi perangkat komputer/laptop.`,
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
  whatsappNumber?: string;
  address?: string;
  openHours?: string;
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

  const settingsUpdateData: any = {};
  if (data.primaryColor !== undefined) settingsUpdateData.primaryColor = data.primaryColor;
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
  return await prisma.tenant.delete({
    where: { id: tenantId },
  });
}
