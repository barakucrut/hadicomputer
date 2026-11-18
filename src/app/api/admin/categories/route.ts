import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { authorizeAdmin } from "@/lib/auth";

export async function GET() {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: { where: { deletedAt: null } } } } },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  const auth = await authorizeAdmin(["categories:manage"]);
  if (!auth.ok) return auth.response;

  const { name, slug, icon, description, sortOrder = 0, isActive = true } = await request.json();
  if (!name || !slug) {
    return NextResponse.json({ error: "Nama dan slug wajib diisi" }, { status: 400 });
  }

  const category = await prisma.category.create({
    data: { name, slug, icon, description, sortOrder, isActive },
  });
  revalidatePath("/", "layout");
  return NextResponse.json({ success: true, category });
}

export async function PUT(request: Request) {
  const auth = await authorizeAdmin(["categories:manage"]);
  if (!auth.ok) return auth.response;

  const { id, name, slug, icon, description, sortOrder, isActive } = await request.json();
  const category = await prisma.category.update({
    where: { id },
    data: { name, slug, icon, description, sortOrder, isActive },
  });
  revalidatePath("/", "layout");
  return NextResponse.json({ success: true, category });
}

export async function DELETE(request: Request) {
  const auth = await authorizeAdmin(["categories:manage"]);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID missing" }, { status: 400 });

  const [activeCount, deletedCount] = await Promise.all([
    prisma.product.count({ where: { categoryId: id, deletedAt: null } }),
    prisma.product.count({ where: { categoryId: id, NOT: { deletedAt: null } } }),
  ]);
  if (activeCount > 0) {
    return NextResponse.json(
      { error: `Kategori masih dipakai oleh ${activeCount} produk. Pindahkan atau hapus produknya terlebih dahulu.` },
      { status: 400 }
    );
  }
  if (deletedCount > 0) {
    return NextResponse.json(
      { error: `Kategori masih tercatat pada ${deletedCount} produk yang sudah dihapus (arsip), sehingga tidak dapat dihapus.` },
      { status: 400 }
    );
  }

  await prisma.category.delete({ where: { id } });
  revalidatePath("/", "layout");
  return NextResponse.json({ success: true });
}
