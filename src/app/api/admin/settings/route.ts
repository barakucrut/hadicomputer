import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { authorizeAdmin } from "@/lib/auth";

export async function GET() {
  const session = await getAdminSession();
  let tenantId = session?.tenantId || null;

  if (!tenantId) {
    const defaultTenant = await prisma.tenant.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    tenantId = defaultTenant?.id || null;
  }

  if (tenantId) {
    let tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { settings: true },
    });

    if (tenant) {
      let s = tenant.settings;
      if (!s) {
        s = await prisma.tenantSetting.create({
          data: {
            tenantId: tenant.id,
            tagline: "Pusat Komputer & Hardware Terpercaya",
            primaryColor: "#dd2028",
            secondaryColor: "#111413",
            fontFamily: "Plus Jakarta Sans",
            whatsappNumber: "6285769000007",
            whatsappDefaultTemplate: `Halo ${tenant.name}, saya ingin berkonsultasi mengenai perangkat komputer/laptop.`,
            openHours: "Buka setiap hari: 08.00 – 22.00 WIB",
          },
        });
      }

      const mergedSettings = {
        storeName: tenant.name,
        tagline: s.tagline || "",
        logoUrl: s.logoUrl || "",
        faviconUrl: s.faviconUrl || "",
        primaryColor: s.primaryColor || "#dd2028",
        secondaryColor: s.secondaryColor || "#111413",
        fontFamily: s.fontFamily || "Plus Jakarta Sans",
        whatsappNumber: s.whatsappNumber || "6285769000007",
        whatsappDefaultTemplate: s.whatsappDefaultTemplate || "",
        address: s.address || "",
        mapsEmbedUrl: s.mapsEmbedUrl || "",
        openHours: s.openHours || "Buka setiap hari: 08.00 – 22.00 WIB",
        socialInstagram: s.socialInstagram || "",
        socialTiktok: s.socialTiktok || "",
        socialFacebook: s.socialFacebook || "",
        announcementText: s.announcementText || "",
        isAnnouncementActive: s.isAnnouncementActive || false,
        homepageConfig: s.homepageConfig || null,
      };

      return NextResponse.json({ settings: mergedSettings, tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug } });
    }
  }

  // Fallback to legacy StoreSetting
  let settings = await prisma.storeSetting.findUnique({
    where: { id: "default" },
  });

  return NextResponse.json({ settings });
}

export async function PUT(request: Request) {
  const auth = await authorizeAdmin(["settings:store_info"]);
  if (!auth.ok) return auth.response;

  const data = await request.json();
  const {
    storeName,
    tagline,
    logoUrl,
    faviconUrl,
    primaryColor,
    secondaryColor,
    fontFamily,
    whatsappNumber,
    whatsappDefaultTemplate,
    address,
    mapsEmbedUrl,
    openHours,
    socialInstagram,
    socialTiktok,
    socialFacebook,
    announcementText,
    isAnnouncementActive,
    homepageConfig,
  } = data;

  let tenantId = session.tenantId || null;
  if (!tenantId) {
    const defaultTenant = await prisma.tenant.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    tenantId = defaultTenant?.id || null;
  }

  if (tenantId) {
    if (storeName) {
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { name: storeName.trim() },
      });
    }

    const tenantSetting = await prisma.tenantSetting.upsert({
      where: { tenantId },
      update: {
        tagline,
        logoUrl,
        faviconUrl,
        primaryColor: primaryColor || "#dd2028",
        secondaryColor: secondaryColor || "#111413",
        fontFamily: fontFamily || "Plus Jakarta Sans",
        whatsappNumber: whatsappNumber || "6285769000007",
        whatsappDefaultTemplate,
        address,
        mapsEmbedUrl,
        openHours,
        socialInstagram,
        socialTiktok,
        socialFacebook,
        announcementText,
        isAnnouncementActive,
        homepageConfig: homepageConfig || undefined,
      },
      create: {
        tenantId,
        tagline,
        logoUrl,
        faviconUrl,
        primaryColor: primaryColor || "#dd2028",
        secondaryColor: secondaryColor || "#111413",
        fontFamily: fontFamily || "Plus Jakarta Sans",
        whatsappNumber: whatsappNumber || "6285769000007",
        whatsappDefaultTemplate,
        address,
        mapsEmbedUrl,
        openHours,
        socialInstagram,
        socialTiktok,
        socialFacebook,
        announcementText,
        isAnnouncementActive,
        homepageConfig: homepageConfig || undefined,
      },
    });

    revalidatePath("/", "layout");
    revalidatePath("/katalog");
    revalidatePath("/kontak");
    revalidatePath("/lokasi");
    revalidatePath("/layanan");

    return NextResponse.json({
      success: true,
      settings: {
        storeName,
        ...tenantSetting,
      },
    });
  }

  // Fallback update legacy store setting
  const settings = await prisma.storeSetting.upsert({
    where: { id: "default" },
    update: {
      storeName,
      tagline,
      whatsappNumber,
      whatsappDefaultTemplate,
      address,
      mapsEmbedUrl,
      openHours,
      socialInstagram,
      socialTiktok,
      socialFacebook,
      announcementText,
      isAnnouncementActive,
    },
    create: {
      id: "default",
      storeName: storeName || "Hadi Computer",
      tagline: tagline || "Pusat Laptop & Komputer Terpercaya",
      whatsappNumber: whatsappNumber || "6285769000007",
      whatsappDefaultTemplate: whatsappDefaultTemplate || "",
      address: address || "",
      mapsEmbedUrl,
      openHours: openHours || "",
      socialInstagram,
      socialTiktok,
      socialFacebook,
      announcementText,
      isAnnouncementActive,
    },
  });

  revalidatePath("/", "layout");
  return NextResponse.json({ success: true, settings });
}
