import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      brand: true,
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { sortOrder: "asc" } },
      specs: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
  }

  const serialized = {
    ...product,
    basePrice: product.basePrice !== null ? Number(product.basePrice) : null,
    originalPrice: product.originalPrice !== null ? Number(product.originalPrice) : null,
    variants: product.variants.map((v) => ({
      ...v,
      price: v.price !== null ? Number(v.price) : null,
      originalPrice: v.originalPrice !== null ? Number(v.originalPrice) : null,
    })),
  };

  return NextResponse.json({ product: serialized });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const data = await request.json();
    const {
      name,
      code,
      slug,
      summary,
      description,
      condition,
      basePrice,
      originalPrice,
      availability,
      warranty,
      bonus,
      isFeatured,
      isBestSeller,
      isPromo,
      isNewArrival,
      needs,
      publicationStatus,
      categoryId,
      brandId,
      images,
      variants,
      specs,
    } = data;

    // Update Product Info
    await prisma.product.update({
      where: { id },
      data: {
        name,
        code,
        slug,
        summary,
        description,
        condition,
        basePrice: basePrice !== null && basePrice !== undefined ? BigInt(basePrice) : null,
        originalPrice: originalPrice !== null && originalPrice !== undefined ? BigInt(originalPrice) : null,
        availability,
        warranty,
        bonus,
        isFeatured,
        isBestSeller,
        isPromo,
        isNewArrival,
        needs: needs ? (needs as any) : undefined,
        publicationStatus,
        categoryId,
        brandId,
      },
    });

    // Update Images if provided
    if (images && Array.isArray(images)) {
      const primaryIdx = images.findIndex((img: any) => Boolean(img.isPrimary));
      const effectivePrimaryIdx = primaryIdx !== -1 ? primaryIdx : 0;
      const reordered = images.length > 0
        ? [images[effectivePrimaryIdx], ...images.filter((_: any, idx: number) => idx !== effectivePrimaryIdx)]
        : [];

      await prisma.productImage.deleteMany({ where: { productId: id } });
      await prisma.productImage.createMany({
        data: reordered.map((img: any, idx: number) => ({
          productId: id,
          url: typeof img === "string" ? img : img.url,
          altText: img.altText || `${name} - ${idx + 1}`,
          isPrimary: idx === 0,
          sortOrder: idx,
        })),
      });
    }

    // Update Specs if provided
    if (specs && Array.isArray(specs)) {
      await prisma.productSpec.deleteMany({ where: { productId: id } });
      await prisma.productSpec.createMany({
        data: specs.map((s: any, idx: number) => ({
          productId: id,
          key: s.key || s.name,
          value: s.value,
          sortOrder: idx,
        })),
      });
    }

    // Update Variants if provided
    if (variants && Array.isArray(variants)) {
      await prisma.productVariant.deleteMany({ where: { productId: id } });
      await prisma.productVariant.createMany({
        data: variants.map((v: any, idx: number) => ({
          productId: id,
          name: v.name,
          price: v.price ? BigInt(v.price) : null,
          originalPrice: v.originalPrice ? BigInt(v.originalPrice) : null,
          availability: v.availability || "TERSEDIA",
          isDefault: v.isDefault ?? idx === 0,
          sortOrder: idx,
        })),
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Update product error:", err);
    return NextResponse.json({ error: err.message || "Gagal memperbarui produk" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete product error:", err);
    return NextResponse.json({ error: "Gagal menghapus produk" }, { status: 500 });
  }
}
