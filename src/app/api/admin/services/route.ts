import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
  const services = await prisma.service.findMany({
    include: { _count: { select: { inquiryLogs: true } } },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json({ services });
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await request.json();
  const { title, slug, summary, description, estimatedTime, priceInfo, ctaWhatsappText, iconName, imageUrl, isActive = true, sortOrder = 0 } = data;

  const service = await prisma.service.create({
    data: { title, slug, summary, description, estimatedTime, priceInfo, ctaWhatsappText, iconName, imageUrl, isActive, sortOrder },
  });

  return NextResponse.json({ success: true, service });
}

export async function PUT(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await request.json();
  const { id, title, slug, summary, description, estimatedTime, priceInfo, ctaWhatsappText, iconName, imageUrl, isActive, sortOrder } = data;

  const service = await prisma.service.update({
    where: { id },
    data: { title, slug, summary, description, estimatedTime, priceInfo, ctaWhatsappText, iconName, imageUrl, isActive, sortOrder },
  });

  return NextResponse.json({ success: true, service });
}
