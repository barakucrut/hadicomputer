import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
  const banners = await prisma.banner.findMany({
    include: { hotspots: { orderBy: { sortOrder: "asc" } } },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json({ banners });
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await request.json();
  const { title, subtitle, badgeText, ctaLabel, ctaUrl, imageUrl, imageAlt, bgTheme = "dark", sortOrder = 0, isActive = true, hotspots = [] } = data;

  const banner = await prisma.banner.create({
    data: {
      title,
      subtitle,
      badgeText,
      ctaLabel,
      ctaUrl,
      imageUrl,
      imageAlt: imageAlt || title,
      bgTheme,
      sortOrder,
      isActive,
      hotspots: {
        create: hotspots.map((h: any, idx: number) => ({
          label: h.label,
          xPercent: h.xPercent ?? h.x,
          yPercent: h.yPercent ?? h.y,
          sortOrder: idx,
        })),
      },
    },
    include: { hotspots: true },
  });

  return NextResponse.json({ success: true, banner });
}

export async function PUT(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await request.json();
  const { id, title, subtitle, badgeText, ctaLabel, ctaUrl, imageUrl, imageAlt, bgTheme, sortOrder, isActive, hotspots } = data;

  await prisma.banner.update({
    where: { id },
    data: {
      title,
      subtitle,
      badgeText,
      ctaLabel,
      ctaUrl,
      imageUrl,
      imageAlt,
      bgTheme,
      sortOrder,
      isActive,
    },
  });

  if (hotspots && Array.isArray(hotspots)) {
    await prisma.bannerHotspot.deleteMany({ where: { bannerId: id } });
    await prisma.bannerHotspot.createMany({
      data: hotspots.map((h: any, idx: number) => ({
        bannerId: id,
        label: h.label,
        xPercent: h.xPercent ?? h.x,
        yPercent: h.yPercent ?? h.y,
        sortOrder: idx,
      })),
    });
  }

  const updated = await prisma.banner.findUnique({
    where: { id },
    include: { hotspots: true },
  });

  return NextResponse.json({ success: true, banner: updated });
}

export async function DELETE(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID missing" }, { status: 400 });

  await prisma.banner.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
