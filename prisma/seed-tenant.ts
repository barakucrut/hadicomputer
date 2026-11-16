import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

export function generateTenantId(slug: string): string {
  return crypto.createHash("sha1").update(slug.toLowerCase().trim()).digest("hex");
}

async function main() {
  console.log("🌱 Starting Tenant #1 (Hadi Computer) multi-tenant migration...");

  const hadiTenantId = generateTenantId("hadicomputer");
  console.log(`Generated SHA-1 ID for Hadi Computer: ${hadiTenantId}`);

  // 1. Upsert Hadi Computer Tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: "hadicomputer" },
    update: {
      name: "Hadi Computer",
      customDomain: "hadicomputer.com",
      plan: "PRO",
      status: "ACTIVE",
      features: {
        pcBuilder: true,
        tradeIn: true,
        instantCheckout: false,
      },
    },
    create: {
      id: hadiTenantId,
      slug: "hadicomputer",
      name: "Hadi Computer",
      customDomain: "hadicomputer.com",
      plan: "PRO",
      status: "ACTIVE",
      features: {
        pcBuilder: true,
        tradeIn: true,
        instantCheckout: false,
      },
    },
  });

  console.log(`✓ Tenant created/updated: ${tenant.name} (${tenant.id})`);

  // 2. Fetch existing store settings or fallback
  const storeSetting = await prisma.storeSetting.findUnique({
    where: { id: "default" },
  });

  // 3. Upsert TenantSetting
  await prisma.tenantSetting.upsert({
    where: { tenantId: tenant.id },
    update: {
      tagline: storeSetting?.tagline || "Pusat Laptop & Komputer Terpercaya",
      whatsappNumber: storeSetting?.whatsappNumber || "6285769000007",
      whatsappDefaultTemplate:
        storeSetting?.whatsappDefaultTemplate ||
        "Halo Hadi Computer, saya ingin berkonsultasi mengenai perangkat laptop/komputer.",
      address: storeSetting?.address || "Tempurejo, Kabupaten Jember",
      openHours: storeSetting?.openHours || "Buka setiap hari: 08.00 – 22.00 WIB",
      mapsEmbedUrl: storeSetting?.mapsEmbedUrl || null,
      primaryColor: "#cc252b",
      secondaryColor: "#111413",
      socialInstagram: storeSetting?.socialInstagram || "@hadicomputer",
      socialTiktok: storeSetting?.socialTiktok || "@hadicomputer1991",
      socialFacebook: storeSetting?.socialFacebook || "nurulsalam",
      announcementText: storeSetting?.announcementText || null,
      isAnnouncementActive: storeSetting?.isAnnouncementActive || false,
    },
    create: {
      tenantId: tenant.id,
      tagline: storeSetting?.tagline || "Pusat Laptop & Komputer Terpercaya",
      whatsappNumber: storeSetting?.whatsappNumber || "6285769000007",
      whatsappDefaultTemplate:
        storeSetting?.whatsappDefaultTemplate ||
        "Halo Hadi Computer, saya ingin berkonsultasi mengenai perangkat laptop/komputer.",
      address: storeSetting?.address || "Tempurejo, Kabupaten Jember",
      openHours: storeSetting?.openHours || "Buka setiap hari: 08.00 – 22.00 WIB",
      mapsEmbedUrl: storeSetting?.mapsEmbedUrl || null,
      primaryColor: "#cc252b",
      secondaryColor: "#111413",
      socialInstagram: storeSetting?.socialInstagram || "@hadicomputer",
      socialTiktok: storeSetting?.socialTiktok || "@hadicomputer1991",
      socialFacebook: storeSetting?.socialFacebook || "nurulsalam",
      announcementText: storeSetting?.announcementText || null,
      isAnnouncementActive: storeSetting?.isAnnouncementActive || false,
    },
  });

  console.log(`✓ TenantSetting synchronized for ${tenant.name}`);

  // 4. Associate all existing orphan records with Hadi Computer
  const pCount = await prisma.product.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenant.id },
  });
  const cCount = await prisma.category.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenant.id },
  });
  const bCount = await prisma.brand.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenant.id },
  });
  const nCount = await prisma.productNeed.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenant.id },
  });
  const banCount = await prisma.banner.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenant.id },
  });
  const sCount = await prisma.service.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenant.id },
  });
  const uCount = await prisma.adminUser.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenant.id },
  });

  console.log(
    `✓ Linked to ${tenant.name}: Products(${pCount.count}), Categories(${cCount.count}), Brands(${bCount.count}), Needs(${nCount.count}), Banners(${banCount.count}), Services(${sCount.count}), Admins(${uCount.count})`
  );

  console.log("🎉 Migration completed successfully! Hadi Computer is now Tenant #1.");
}

main()
  .catch((e) => {
    console.error("Migration error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
