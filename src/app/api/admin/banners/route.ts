import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { authorizeAdmin } from "@/lib/auth";
import { notFoundResponse } from "@/lib/tenant-scope";
import { CUTOUT_REJECT_MESSAGE, createCutoutFromUpload } from "@/lib/product-cutout";

/** BigInt (harga) -> number agar bisa dikirim sebagai JSON. */
function serializeBanner<T extends { price: bigint | null; originalPrice: bigint | null; product?: { basePrice: bigint | null; originalPrice: bigint | null } | null }>(b: T) {
  const n = (v: bigint | null | undefined) => (v !== null && v !== undefined ? Number(v) : null);
  return {
    ...b,
    price: n(b.price),
    originalPrice: n(b.originalPrice),
    product: b.product ? { ...b.product, basePrice: n(b.product.basePrice), originalPrice: n(b.product.originalPrice) } : b.product,
  };
}

export async function GET() {
  const auth = await authorizeAdmin();
  if (!auth.ok) return auth.response;

  const banners = await prisma.banner.findMany({
    where: { tenantId: auth.tenantId },
    include: {
      hotspots: { orderBy: { sortOrder: "asc" } },
      product: { select: { id: true, name: true, code: true, basePrice: true, originalPrice: true } },
    },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json({ banners: banners.map(serializeBanner) });
}

const toBig = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(String(v ?? "").replace(/\D/g, ""));
  return Number.isFinite(n) && n > 0 ? BigInt(Math.round(n)) : null;
};

/**
 * Normalisasi field banner dari form CMS. Produk tertaut wajib milik toko yang sama;
 * banner tanpa produk wajib punya gambar sendiri.
 */
async function normalizeBanner(tenantId: string, data: Record<string, any>) {
  let productId: string | null = typeof data.productId === "string" && data.productId ? data.productId : null;
  if (productId) {
    const owned = await prisma.product.findFirst({ where: { id: productId, tenantId, deletedAt: null }, select: { id: true } });
    if (!owned) return { error: "Produk tertaut tidak ditemukan di toko ini." } as const;
  }
  let imageUrl = typeof data.imageUrl === "string" && data.imageUrl.trim() ? data.imageUrl.trim() : null;
  const bgTheme = ["dark", "light", "sage", "studio"].includes(data.bgTheme) ? data.bgTheme : "dark";
  // Studio Banner tanpa foto: buat foto studio otomatis dari foto utama produk
  if (bgTheme === "studio" && !imageUrl && productId) {
    const product = await prisma.product.findFirst({
      where: { id: productId, tenantId },
      select: { slug: true, images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1, select: { url: true } } },
    });
    const source = product?.images[0]?.url;
    if (!source) return { error: "Produk tertaut belum punya foto." } as const;
    const cut = await createCutoutFromUpload(source, product.slug.slice(0, 40));
    if (!cut.ok) return { error: CUTOUT_REJECT_MESSAGE[cut.reason] } as const;
    imageUrl = cut.url;
  }
  if (!productId && !imageUrl) {
    return { error: "Unggah gambar banner, atau tautkan ke produk agar memakai foto produk." } as const;
  }
  const price = productId ? null : toBig(data.price);
  let originalPrice = productId ? null : toBig(data.originalPrice);
  if (price && originalPrice && originalPrice <= price) originalPrice = null;
  productId = productId || null;
  return {
    value: {
      title: String(data.title || "").slice(0, 150),
      subtitle: data.subtitle ? String(data.subtitle).slice(0, 255) : null,
      badgeText: data.badgeText ? String(data.badgeText).slice(0, 100) : null,
      ctaLabel: data.ctaLabel ? String(data.ctaLabel).slice(0, 50) : null,
      ctaUrl: data.ctaUrl ? String(data.ctaUrl).slice(0, 255) : null,
      imageUrl,
      imageAlt: String(data.imageAlt || data.title || "Banner").slice(0, 150),
      bgTheme,
      placement: data.placement === "tile" ? "tile" : "hero",
      productId,
      price,
      originalPrice,
      sortOrder: Number.isFinite(Number(data.sortOrder)) ? Number(data.sortOrder) : 0,
      isActive: data.isActive !== false,
    },
  } as const;
}

const hotspotData = (hotspots: any[]) =>
  hotspots.map((h: any, idx: number) => ({
    label: String(h.label || "").slice(0, 100),
    xPercent: Number(h.xPercent ?? h.x) || 0,
    yPercent: Number(h.yPercent ?? h.y) || 0,
    sortOrder: idx,
  }));

export async function POST(request: Request) {
  const auth = await authorizeAdmin(["banners:manage"]);
  if (!auth.ok) return auth.response;

  const data = await request.json();
  if (!data?.title) return NextResponse.json({ error: "Judul banner wajib diisi" }, { status: 400 });
  const norm = await normalizeBanner(auth.tenantId, data);
  if ("error" in norm) return NextResponse.json({ error: norm.error }, { status: 400 });

  const banner = await prisma.banner.create({
    data: {
      tenantId: auth.tenantId,
      ...norm.value,
      hotspots: { create: hotspotData(Array.isArray(data.hotspots) ? data.hotspots : []) },
    },
    include: { hotspots: true },
  });

  revalidatePath("/", "layout");
  return NextResponse.json({ success: true, banner: serializeBanner(banner) });
}

export async function PUT(request: Request) {
  const auth = await authorizeAdmin(["banners:manage"]);
  if (!auth.ok) return auth.response;

  const data = await request.json();
  const id = data?.id;
  const owned = await prisma.banner.findFirst({ where: { id, tenantId: auth.tenantId }, select: { id: true } });
  if (!owned) return notFoundResponse("Banner");
  if (!data?.title) return NextResponse.json({ error: "Judul banner wajib diisi" }, { status: 400 });

  const norm = await normalizeBanner(auth.tenantId, data);
  if ("error" in norm) return NextResponse.json({ error: norm.error }, { status: 400 });

  await prisma.$transaction(async (tx) => {
    await tx.banner.update({ where: { id }, data: norm.value });
    if (Array.isArray(data.hotspots)) {
      await tx.bannerHotspot.deleteMany({ where: { bannerId: id } });
      await tx.bannerHotspot.createMany({ data: hotspotData(data.hotspots).map((h) => ({ ...h, bannerId: id })) });
    }
  });

  const updated = await prisma.banner.findUnique({ where: { id }, include: { hotspots: true } });
  revalidatePath("/", "layout");
  return NextResponse.json({ success: true, banner: updated ? serializeBanner(updated) : null });
}

export async function DELETE(request: Request) {
  const auth = await authorizeAdmin(["banners:manage"]);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID missing" }, { status: 400 });

  const owned = await prisma.banner.findFirst({ where: { id, tenantId: auth.tenantId }, select: { id: true } });
  if (!owned) return notFoundResponse("Banner");

  await prisma.banner.delete({ where: { id } });
  revalidatePath("/", "layout");
  return NextResponse.json({ success: true });
}
