import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { authorizeAdmin } from "@/lib/auth";

export async function GET() {
  const brands = await prisma.brand.findMany({
    include: { _count: { select: { products: { where: { deletedAt: null } } } } },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json({ brands });
}

export async function POST(request: Request) {
  const auth = await authorizeAdmin(["brands:manage"]);
  if (!auth.ok) return auth.response;

  const { name, slug, logoUrl, sortOrder = 0, isActive = true } = await request.json();
  if (!name || !slug) {
    return NextResponse.json({ error: "Nama dan slug wajib diisi" }, { status: 400 });
  }

  const brand = await prisma.brand.create({
    data: { name, slug, logoUrl, sortOrder, isActive },
  });
  revalidatePath("/", "layout");
  return NextResponse.json({ success: true, brand });
}

export async function PUT(request: Request) {
  const auth = await authorizeAdmin(["brands:manage"]);
  if (!auth.ok) return auth.response;

  const { id, name, slug, logoUrl, sortOrder, isActive } = await request.json();
  const brand = await prisma.brand.update({
    where: { id },
    data: { name, slug, logoUrl, sortOrder, isActive },
  });
  revalidatePath("/", "layout");
  return NextResponse.json({ success: true, brand });
}

export async function DELETE(request: Request) {
  const auth = await authorizeAdmin(["brands:manage"]);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID missing" }, { status: 400 });

  const [activeCount, deletedCount] = await Promise.all([
    prisma.product.count({ where: { brandId: id, deletedAt: null } }),
    prisma.product.count({ where: { brandId: id, NOT: { deletedAt: null } } }),
  ]);
  if (activeCount > 0) {
    return NextResponse.json(
      { error: `Merek masih dipakai oleh ${activeCount} produk. Pindahkan atau hapus produknya terlebih dahulu.` },
      { status: 400 }
    );
  }
  if (deletedCount > 0) {
    return NextResponse.json(
      { error: `Merek masih tercatat pada ${deletedCount} produk yang sudah dihapus (arsip), sehingga tidak dapat dihapus.` },
      { status: 400 }
    );
  }

  await prisma.brand.delete({ where: { id } });
  revalidatePath("/", "layout");
  return NextResponse.json({ success: true });
}
