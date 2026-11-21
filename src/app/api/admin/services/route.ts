import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { authorizeAdmin } from "@/lib/auth";
import { notFoundResponse, uniqueConflictResponse } from "@/lib/tenant-scope";

export async function GET() {
  const auth = await authorizeAdmin();
  if (!auth.ok) return auth.response;

  const services = await prisma.service.findMany({
    where: { tenantId: auth.tenantId },
    include: { _count: { select: { inquiryLogs: true } } },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json({ services });
}

export async function POST(request: Request) {
  const auth = await authorizeAdmin(["services:manage"]);
  if (!auth.ok) return auth.response;

  const data = await request.json();
  const { title, slug, summary, description, estimatedTime, priceInfo, ctaWhatsappText, iconName, imageUrl, isActive = true, sortOrder = 0 } = data;

  try {
    const service = await prisma.service.create({
      data: { tenantId: auth.tenantId, title, slug, summary, description, estimatedTime, priceInfo, ctaWhatsappText, iconName, imageUrl, isActive, sortOrder },
    });
    revalidatePath("/", "layout");
    return NextResponse.json({ success: true, service });
  } catch (err) {
    const conflict = uniqueConflictResponse(err, "layanan");
    if (conflict) return conflict;
    throw err;
  }
}

export async function PUT(request: Request) {
  const auth = await authorizeAdmin(["services:manage"]);
  if (!auth.ok) return auth.response;

  const data = await request.json();
  const { id, title, slug, summary, description, estimatedTime, priceInfo, ctaWhatsappText, iconName, imageUrl, isActive, sortOrder } = data;

  const owned = await prisma.service.findFirst({ where: { id, tenantId: auth.tenantId }, select: { id: true } });
  if (!owned) return notFoundResponse("Layanan");

  try {
    const service = await prisma.service.update({
      where: { id },
      data: { title, slug, summary, description, estimatedTime, priceInfo, ctaWhatsappText, iconName, imageUrl, isActive, sortOrder },
    });
    revalidatePath("/", "layout");
    return NextResponse.json({ success: true, service });
  } catch (err) {
    const conflict = uniqueConflictResponse(err, "layanan");
    if (conflict) return conflict;
    throw err;
  }
}
