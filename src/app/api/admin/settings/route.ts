import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { authorizeAdmin } from "@/lib/auth";
import { DEFAULT_PRIMARY, DEFAULT_SECONDARY, safeHex } from "@/lib/brand-color";
import { parseLocale } from "@/lib/i18n";
import { parseCurrency } from "@/lib/i18n/currency";

export async function GET() {
  const auth = await authorizeAdmin();
  if (!auth.ok) return auth.response;
  // Selalu tenant milik sesi — tidak pernah jatuh ke tenant lain
  const tenantId: string | null = auth.tenantId;

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
        googleReviewUrl: s.googleReviewUrl || "",
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
  const auth = await authorizeAdmin(["settings:appearance", "settings:store_info", "settings:sections"]);
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

  const parsedLocale = data.locale !== undefined ? parseLocale(data.locale) ?? "id" : undefined;
  const parsedCurrency = data.currency !== undefined ? parseCurrency(data.currency) ?? "IDR" : undefined;

  // Favicon masuk ke <head>: hanya file hasil upload CMS (atau kosong = ikon Rigspace).
  if (typeof faviconUrl === "string" && faviconUrl.trim() && (!faviconUrl.startsWith("/uploads/") || faviconUrl.includes(".."))) {
    return NextResponse.json({ error: "Favicon harus diunggah lewat CMS." }, { status: 400 });
  }

  // Link ulasan Google: hanya https (atau kosong). Tidak dikirim = tidak diubah.
  let googleReviewUrl: string | null | undefined = undefined;
  if (data.googleReviewUrl !== undefined) {
    const raw = typeof data.googleReviewUrl === "string" ? data.googleReviewUrl.trim() : "";
    if (raw && (!/^https:\/\/[^\s]+$/i.test(raw) || raw.length > 500)) {
      return NextResponse.json({ error: "Link ulasan Google harus diawali https:// (maks 500 karakter)." }, { status: 400 });
    }
    googleReviewUrl = raw || null;
  }

  const tenantId: string | null = auth.tenantId;

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
        primaryColor: safeHex(primaryColor, DEFAULT_PRIMARY),
        secondaryColor: safeHex(secondaryColor, DEFAULT_SECONDARY),
        fontFamily: fontFamily || "Plus Jakarta Sans",
        whatsappNumber: whatsappNumber || "",
        whatsappDefaultTemplate,
        address,
        mapsEmbedUrl,
        googleReviewUrl,
        openHours,
        socialInstagram,
        socialTiktok,
        socialFacebook,
        announcementText,
        isAnnouncementActive,
        ...(parsedLocale ? { locale: parsedLocale } : {}),
        ...(parsedCurrency ? { currency: parsedCurrency } : {}),
        homepageConfig: homepageConfig || undefined,
      },
      create: {
        tenantId,
        tagline,
        logoUrl,
        faviconUrl,
        primaryColor: safeHex(primaryColor, DEFAULT_PRIMARY),
        secondaryColor: safeHex(secondaryColor, DEFAULT_SECONDARY),
        fontFamily: fontFamily || "Plus Jakarta Sans",
        whatsappNumber: whatsappNumber || "6285769000007",
        whatsappDefaultTemplate,
        address,
        mapsEmbedUrl,
        googleReviewUrl,
        openHours,
        socialInstagram,
        socialTiktok,
        socialFacebook,
        announcementText,
        isAnnouncementActive,
        locale: parsedLocale ?? "id",
        currency: parsedCurrency ?? "IDR",
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
      storeName: storeName || "Toko",
      tagline: tagline || "",
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
