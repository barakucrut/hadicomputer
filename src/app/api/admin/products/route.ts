import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const categoryId = searchParams.get("categoryId");
  const brandId = searchParams.get("brandId");
  const availability = searchParams.get("availability");
  const condition = searchParams.get("condition");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const collection = searchParams.get("collection");
  const need = searchParams.get("need");
  const status = searchParams.get("status");

  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limitParam = searchParams.get("limit");
  const limit = limitParam === "all" ? 1000 : Math.max(1, parseInt(limitParam || "10", 10));

  const whereClause: any = {};

  if (q) {
    whereClause.OR = [
      { name: { contains: q } },
      { code: { contains: q } },
      { summary: { contains: q } },
    ];
  }

  if (categoryId) whereClause.categoryId = categoryId;
  if (brandId) whereClause.brandId = brandId;
  if (availability) whereClause.availability = availability;
  if (condition) whereClause.condition = condition.toUpperCase();
  if (status) whereClause.publicationStatus = status;

  if (minPrice || maxPrice) {
    whereClause.basePrice = {};
    if (minPrice && !isNaN(Number(minPrice))) {
      whereClause.basePrice.gte = BigInt(Math.floor(Number(minPrice)));
    }
    if (maxPrice && !isNaN(Number(maxPrice))) {
      whereClause.basePrice.lte = BigInt(Math.floor(Number(maxPrice)));
    }
  }

  if (collection) {
    if (collection === "Pilihan Hadi" || collection === "featured") whereClause.isFeatured = true;
    else if (collection === "Terbaru" || collection === "newArrival") whereClause.isNewArrival = true;
    else if (collection === "Terlaris" || collection === "bestSeller") whereClause.isBestSeller = true;
    else if (collection === "Promo" || collection === "promo") whereClause.isPromo = true;
  }

  const total = await prisma.product.count({ where: whereClause });

  const products = await prisma.product.findMany({
    where: whereClause,
    include: {
      category: { select: { id: true, name: true, slug: true } },
      brand: { select: { id: true, name: true, slug: true } },
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { sortOrder: "asc" } },
      specs: { orderBy: { sortOrder: "asc" } },
      _count: { select: { inquiryLogs: true } },
    },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });

  // Convert BigInt to number/string for JSON serialization
  const serialized = products.map((p) => ({
    ...p,
    basePrice: p.basePrice !== null ? Number(p.basePrice) : null,
    originalPrice: p.originalPrice !== null ? Number(p.originalPrice) : null,
    inquiryCount: p._count.inquiryLogs,
    variants: p.variants.map((v) => ({
      ...v,
      price: v.price !== null ? Number(v.price) : null,
      originalPrice: v.originalPrice !== null ? Number(v.originalPrice) : null,
    })),
  }));

  return NextResponse.json({
    products: serialized,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();
    const {
      name,
      code,
      slug,
      summary,
      description,
      condition = "BARU",
      basePrice,
      originalPrice,
      availability = "TERSEDIA",
      warranty,
      bonus,
      isFeatured = false,
      isBestSeller = false,
      isPromo = false,
      isNewArrival = false,
      needs,
      publicationStatus = "PUBLISHED",
      categoryId,
      brandId,
      images = [],
      variants = [],
      specs = [],
    } = data;

    if (!name || !code || !categoryId || !brandId) {
      return NextResponse.json(
        { error: "Nama, kode, kategori, dan merek wajib diisi" },
        { status: 400 }
      );
    }

    const finalSlug =
      slug ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const product = await prisma.product.create({
      data: {
        name,
        code,
        slug: finalSlug,
        summary: summary || "",
        description: description || "",
        condition,
        basePrice: basePrice !== null && basePrice !== undefined ? BigInt(basePrice) : null,
        originalPrice: originalPrice !== null && originalPrice !== undefined ? BigInt(originalPrice) : null,
        availability,
        warranty: warranty || "Garansi Toko 1 Bulan",
        bonus: bonus || null,
        isFeatured,
        isBestSeller,
        isPromo,
        isNewArrival,
        needs: needs ? (needs as any) : undefined,
        publicationStatus,
        categoryId,
        brandId,
        images: {
          create: (() => {
            const primaryIdx = images.findIndex((img: any) => Boolean(img.isPrimary));
            const effectivePrimaryIdx = primaryIdx !== -1 ? primaryIdx : 0;
            const reordered = images.length > 0
              ? [images[effectivePrimaryIdx], ...images.filter((_: any, idx: number) => idx !== effectivePrimaryIdx)]
              : [];
            return reordered.map((img: any, idx: number) => ({
              url: typeof img === "string" ? img : img.url,
              altText: img.altText || `${name} - ${idx + 1}`,
              isPrimary: idx === 0,
              sortOrder: idx,
            }));
          })(),
        },
        variants: {
          create: variants.map((v: any, idx: number) => ({
            name: v.name,
            price: v.price ? BigInt(v.price) : null,
            originalPrice: v.originalPrice ? BigInt(v.originalPrice) : null,
            availability: v.availability || "TERSEDIA",
            isDefault: v.isDefault ?? idx === 0,
            sortOrder: idx,
          })),
        },
        specs: {
          create: specs.map((s: any, idx: number) => ({
            key: s.key || s.name,
            value: s.value,
            sortOrder: idx,
          })),
        },
      },
    });

    revalidatePath("/", "layout");
    revalidatePath("/katalog");
    return NextResponse.json({ success: true, id: product.id });
  } catch (err: any) {
    console.error("Create product error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal membuat produk baru" },
      { status: 500 }
    );
  }
}
