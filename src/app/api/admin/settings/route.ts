import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { authorizeAdmin } from "@/lib/auth";

export async function GET() {
  let settings = await prisma.storeSetting.findUnique({
    where: { id: "default" },
  });

  if (!settings) {
    settings = await prisma.storeSetting.create({
      data: {
        id: "default",
        storeName: "Hadi Computer",
        tagline: "Pusat Laptop & Komputer Terpercaya",
        whatsappNumber: "6285769000007",
        whatsappDefaultTemplate:
          "Halo Hadi Computer, saya ingin berkonsultasi mengenai perangkat laptop/komputer.",
        address: "Jl. Ahmad Yani No. 45, Lantai 1",
        openHours: "Buka setiap hari: 08.00 – 22.00 WIB",
      },
    });
  }

  return NextResponse.json({ settings });
}

export async function PUT(request: Request) {
  const auth = await authorizeAdmin(["settings:store_info"]);
  if (!auth.ok) return auth.response;

  const data = await request.json();
  const {
    storeName,
    tagline,
    whatsappNumber,
    whatsappDefaultTemplate,
    address,
    mapsEmbedUrl,
    googleReviewUrl: rawGoogleReviewUrl,
    openHours,
    socialInstagram,
    socialTiktok,
    socialFacebook,
    announcementText,
    isAnnouncementActive,
  } = data;

  // Only accept a plain https link (or empty) for the Google reviews button.
  const reviewUrlText = typeof rawGoogleReviewUrl === "string" ? rawGoogleReviewUrl.trim() : "";
  if (reviewUrlText && (!/^https:\/\//i.test(reviewUrlText) || reviewUrlText.length > 500)) {
    return NextResponse.json({ error: "Link ulasan Google harus diawali https:// (maks 500 karakter)." }, { status: 400 });
  }
  const googleReviewUrl = reviewUrlText || null;

  const settings = await prisma.storeSetting.upsert({
    where: { id: "default" },
    update: {
      storeName,
      tagline,
      whatsappNumber,
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
    },
    create: {
      id: "default",
      storeName: storeName || "Hadi Computer",
      tagline: tagline || "Pusat Laptop & Komputer Terpercaya",
      whatsappNumber: whatsappNumber || "6285769000007",
      whatsappDefaultTemplate: whatsappDefaultTemplate || "",
      address: address || "",
      mapsEmbedUrl,
      googleReviewUrl,
      openHours: openHours || "",
      socialInstagram,
      socialTiktok,
      socialFacebook,
      announcementText,
      isAnnouncementActive,
    },
  });

  revalidatePath("/", "layout");
  revalidatePath("/katalog");
  revalidatePath("/kontak");
  revalidatePath("/lokasi");
  revalidatePath("/layanan");
  return NextResponse.json({ success: true, settings });
}
