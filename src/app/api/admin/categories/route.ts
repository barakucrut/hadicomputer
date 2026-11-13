import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, slug, icon, description, sortOrder = 0, isActive = true } = await request.json();
  if (!name || !slug) {
    return NextResponse.json({ error: "Nama dan slug wajib diisi" }, { status: 400 });
  }

  const category = await prisma.category.create({
    data: { name, slug, icon, description, sortOrder, isActive },
  });
  return NextResponse.json({ success: true, category });
}

export async function PUT(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, name, slug, icon, description, sortOrder, isActive } = await request.json();
  const category = await prisma.category.update({
    where: { id },
    data: { name, slug, icon, description, sortOrder, isActive },
  });
  return NextResponse.json({ success: true, category });
}

export async function DELETE(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID missing" }, { status: 400 });

  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
