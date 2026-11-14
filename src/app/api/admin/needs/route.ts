import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

const DEFAULT_NEEDS = [
  { id: "need-kerja", name: "Kerja", slug: "kerja", description: "Perangkat andalan untuk hari produktif", icon: "briefcase", sortOrder: 1, isActive: true },
  { id: "need-kuliah", name: "Kuliah", slug: "kuliah", description: "Dari tugas pertama sampai ide besar", icon: "graduation-cap", sortOrder: 2, isActive: true },
  { id: "need-kreatif", name: "Kreatif", slug: "kreatif", description: "Teman untuk mewujudkan imajinasimu", icon: "palette", sortOrder: 3, isActive: true },
  { id: "need-gaming", name: "Gaming", slug: "gaming", description: "Performa tinggi untuk bermain game", icon: "gamepad", sortOrder: 4, isActive: true },
  { id: "need-harian", name: "Harian", slug: "harian", description: "Aktivitas ringan & santai setiap hari", icon: "home", sortOrder: 5, isActive: true },
];

export async function GET() {
  try {
    let needs = await (prisma as any).productNeed.findMany({
      orderBy: { sortOrder: "asc" },
    });

    // If table is newly created and empty, auto-populate default needs
    if (!needs || needs.length === 0) {
      try {
        for (const item of DEFAULT_NEEDS) {
          await (prisma as any).productNeed.create({
            data: {
              id: item.id,
              name: item.name,
              slug: item.slug,
              description: item.description,
              icon: item.icon,
              sortOrder: item.sortOrder,
              isActive: item.isActive,
            },
          });
        }
        needs = await (prisma as any).productNeed.findMany({
          orderBy: { sortOrder: "asc" },
        });
      } catch {
        // If DB table not pushed yet, return fallback
        needs = DEFAULT_NEEDS;
      }
    }

    return NextResponse.json({ needs: needs || DEFAULT_NEEDS });
  } catch {
    return NextResponse.json({ needs: DEFAULT_NEEDS });
  }
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, slug, icon, description, sortOrder = 0, isActive = true } = await request.json();
  if (!name || !slug) {
    return NextResponse.json({ error: "Nama dan slug wajib diisi" }, { status: 400 });
  }

  if (!(prisma as any).productNeed) {
    return NextResponse.json(
      { error: "Model ProductNeed belum ter-generate di server. Harap jalankan: npx prisma generate && npx prisma db push di server." },
      { status: 500 }
    );
  }

  try {
    const need = await (prisma as any).productNeed.create({
      data: { name, slug, icon, description, sortOrder, isActive },
    });
    revalidatePath("/", "layout");
    revalidatePath("/katalog");
    return NextResponse.json({ success: true, need });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal membuat kebutuhan" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, name, slug, icon, description, sortOrder, isActive } = await request.json();

  if (!(prisma as any).productNeed) {
    return NextResponse.json(
      { error: "Model ProductNeed belum ter-generate di server. Harap jalankan: npx prisma generate && npx prisma db push di server." },
      { status: 500 }
    );
  }

  try {
    const need = await (prisma as any).productNeed.update({
      where: { id },
      data: { name, slug, icon, description, sortOrder, isActive },
    });
    revalidatePath("/", "layout");
    revalidatePath("/katalog");
    return NextResponse.json({ success: true, need });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal memperbarui kebutuhan" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID missing" }, { status: 400 });

  if (!(prisma as any).productNeed) {
    return NextResponse.json(
      { error: "Model ProductNeed belum ter-generate di server. Harap jalankan: npx prisma generate && npx prisma db push di server." },
      { status: 500 }
    );
  }

  try {
    await (prisma as any).productNeed.delete({ where: { id } });
    revalidatePath("/", "layout");
    revalidatePath("/katalog");
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal menghapus kebutuhan" }, { status: 500 });
  }
}
