import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { authorizeAdmin } from "@/lib/auth";
import { notFoundResponse, uniqueConflictResponse } from "@/lib/tenant-scope";

/** Kebutuhan bawaan yang otomatis dibuat untuk toko baru (per tenant). */
const DEFAULT_NEEDS = [
  { name: "Kerja", slug: "kerja", description: "Perangkat andalan untuk hari produktif", icon: "briefcase", sortOrder: 1 },
  { name: "Kuliah", slug: "kuliah", description: "Dari tugas pertama sampai ide besar", icon: "graduation-cap", sortOrder: 2 },
  { name: "Kreatif", slug: "kreatif", description: "Teman untuk mewujudkan imajinasimu", icon: "palette", sortOrder: 3 },
  { name: "Gaming", slug: "gaming", description: "Performa tinggi untuk bermain game", icon: "gamepad", sortOrder: 4 },
  { name: "Harian", slug: "harian", description: "Aktivitas ringan & santai setiap hari", icon: "home", sortOrder: 5 },
];

export async function GET() {
  const auth = await authorizeAdmin();
  if (!auth.ok) return auth.response;

  const where = { tenantId: auth.tenantId };
  let needs = await prisma.productNeed.findMany({ where, orderBy: { sortOrder: "asc" } });

  if (needs.length === 0) {
    await prisma.productNeed.createMany({
      data: DEFAULT_NEEDS.map((n) => ({ ...n, tenantId: auth.tenantId, isActive: true })),
      skipDuplicates: true,
    });
    needs = await prisma.productNeed.findMany({ where, orderBy: { sortOrder: "asc" } });
  }

  return NextResponse.json({ needs });
}

export async function POST(request: Request) {
  const auth = await authorizeAdmin(["categories:manage"]);
  if (!auth.ok) return auth.response;

  const { name, slug, icon, description, sortOrder = 0, isActive = true } = await request.json();
  if (!name || !slug) {
    return NextResponse.json({ error: "Nama dan slug wajib diisi" }, { status: 400 });
  }

  try {
    const need = await prisma.productNeed.create({
      data: { tenantId: auth.tenantId, name, slug, icon, description, sortOrder, isActive },
    });
    revalidatePath("/", "layout");
    revalidatePath("/katalog");
    return NextResponse.json({ success: true, need });
  } catch (err) {
    const conflict = uniqueConflictResponse(err, "kebutuhan");
    if (conflict) return conflict;
    throw err;
  }
}

export async function PUT(request: Request) {
  const auth = await authorizeAdmin(["categories:manage"]);
  if (!auth.ok) return auth.response;

  const { id, name, slug, icon, description, sortOrder, isActive } = await request.json();
  const owned = await prisma.productNeed.findFirst({ where: { id, tenantId: auth.tenantId }, select: { id: true } });
  if (!owned) return notFoundResponse("Kebutuhan");

  try {
    const need = await prisma.productNeed.update({
      where: { id },
      data: { name, slug, icon, description, sortOrder, isActive },
    });
    revalidatePath("/", "layout");
    revalidatePath("/katalog");
    return NextResponse.json({ success: true, need });
  } catch (err) {
    const conflict = uniqueConflictResponse(err, "kebutuhan");
    if (conflict) return conflict;
    throw err;
  }
}

export async function DELETE(request: Request) {
  const auth = await authorizeAdmin(["categories:manage"]);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID missing" }, { status: 400 });

  const owned = await prisma.productNeed.findFirst({ where: { id, tenantId: auth.tenantId }, select: { id: true } });
  if (!owned) return notFoundResponse("Kebutuhan");

  await prisma.productNeed.delete({ where: { id } });
  revalidatePath("/", "layout");
  revalidatePath("/katalog");
  return NextResponse.json({ success: true });
}
