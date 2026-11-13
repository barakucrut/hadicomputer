import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
  const brands = await prisma.brand.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json({ brands });
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, slug, logoUrl, sortOrder = 0, isActive = true } = await request.json();
  if (!name || !slug) {
    return NextResponse.json({ error: "Nama dan slug wajib diisi" }, { status: 400 });
  }

  const brand = await prisma.brand.create({
    data: { name, slug, logoUrl, sortOrder, isActive },
  });
  return NextResponse.json({ success: true, brand });
}

export async function PUT(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, name, slug, logoUrl, sortOrder, isActive } = await request.json();
  const brand = await prisma.brand.update({
    where: { id },
    data: { name, slug, logoUrl, sortOrder, isActive },
  });
  return NextResponse.json({ success: true, brand });
}

export async function DELETE(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID missing" }, { status: 400 });

  await prisma.brand.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
