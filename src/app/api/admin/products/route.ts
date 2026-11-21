import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { authorizeAdmin } from "@/lib/auth";
import { applyStockRule, normalizeStock } from "@/lib/stock";
import { deletedSlug, getNextSku, isSkuTaken, isUniqueViolation, normalizeSku } from "@/lib/product-sku";

export async function GET(request: Request) {
  const auth = await authorizeAdmin(["products:view"]);
  if (!auth.ok) return auth.response;

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

  const whereClause: any = { tenantId: auth.tenantId, deletedAt: null };

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
    if (collection === "Pilihan Toko" || collection === "Pilihan Hadi" || collection === "featured") whereClause.isFeatured = true;
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
  const auth = await authorizeAdmin(["products:create"]);
  if (!auth.ok) return auth.response;

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
      availability: rawAvailability = "TERSEDIA",
      stock: rawStock,
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

    if (!name || !categoryId || !brandId) {
      return NextResponse.json(
        { error: "Nama, kategori, dan merek wajib diisi" },
        { status: 400 }
      );
    }

    const stock = normalizeStock(rawStock);
    const availability = applyStockRule(stock, rawAvailability);

    // Kategori & merek wajib milik toko yang sama
    const [ownCategory, ownBrand] = await Promise.all([
      prisma.category.findFirst({ where: { id: categoryId, tenantId: auth.tenantId }, select: { id: true } }),
      prisma.brand.findFirst({ where: { id: brandId, tenantId: auth.tenantId }, select: { id: true } }),
    ]);
    if (!ownCategory || !ownBrand) {
      return NextResponse.json({ error: "Kategori atau merek tidak ditemukan di toko ini." }, { status: 400 });
    }

    const finalSlug =
      slug ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const createWithCode = (finalCode: string) => prisma.product.create({
      data: {
        tenantId: auth.tenantId,
        name,
        code: finalCode,
        slug: finalSlug,
        summary: summary || "",
        description: description || "",
        condition,
        basePrice: basePrice !== null && basePrice !== undefined ? BigInt(basePrice) : null,
        originalPrice: originalPrice !== null && originalPrice !== undefined ? BigInt(originalPrice) : null,
        availability,
        stock,
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


    // SKU: manual (divalidasi unik) atau otomatis HC-NNNN (retry jika bentrok
    // karena dua admin menyimpan bersamaan).
    const manualCode = normalizeSku(code);
    let product;
    if (manualCode) {
      if (await isSkuTaken(auth.tenantId, manualCode)) {
        return NextResponse.json(
          { error: `SKU ${manualCode} sudah dipakai produk lain. Gunakan kode lain atau kosongkan agar dibuat otomatis.` },
          { status: 409 }
        );
      }
      try {
        product = await createWithCode(manualCode);
      } catch (err) {
        if (isUniqueViolation(err, "code")) {
          return NextResponse.json({ error: `SKU ${manualCode} sudah dipakai produk lain.` }, { status: 409 });
        }
        throw err;
      }
    } else {
      for (let attempt = 0; attempt < 5 && !product; attempt++) {
        const nextCode = await getNextSku(auth.tenantId);
        try {
          product = await createWithCode(nextCode);
        } catch (err) {
          if (!isUniqueViolation(err, "code")) throw err;
        }
      }
      if (!product) {
        return NextResponse.json({ error: "Gagal membuat SKU otomatis, silakan coba lagi." }, { status: 409 });
      }
    }

    revalidatePath("/", "layout");
    revalidatePath("/katalog");
    return NextResponse.json({ success: true, id: product.id, code: product.code });
  } catch (err: any) {
    console.error("Create product error:", err);
    if (isUniqueViolation(err, "slug")) {
      return NextResponse.json({ error: "Slug URL sudah dipakai produk lain di toko ini." }, { status: 409 });
    }
    return NextResponse.json(
      { error: err.message || "Gagal membuat produk baru" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const auth = await authorizeAdmin(["products:delete"]);
  if (!auth.ok) return auth.response;

  try {
    const data = await request.json();
    const { ids } = data;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Daftar ID produk wajib diisi" },
        { status: 400 }
      );
    }

    // Soft delete: gambar, varian, spek & riwayat inquiry tetap tersimpan
    const targets = await prisma.product.findMany({
      where: { id: { in: ids }, tenantId: auth.tenantId, deletedAt: null },
      select: { id: true, slug: true },
    });
    const now = new Date();
    await prisma.$transaction(
      targets.map((t) =>
        prisma.product.update({
          where: { id: t.id },
          data: { deletedAt: now, slug: deletedSlug(t.slug, t.id) },
        })
      )
    );

    revalidatePath("/", "layout");
    revalidatePath("/katalog");
    return NextResponse.json({ success: true, count: targets.length });
  } catch (err: any) {
    console.error("Bulk delete products error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal menghapus produk terpilih" },
      { status: 500 }
    );
  }
}
