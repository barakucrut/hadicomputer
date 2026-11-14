import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

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
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await request.json();
  const {
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
  } = data;

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
