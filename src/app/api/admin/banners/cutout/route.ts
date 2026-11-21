import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authorizeAdmin } from "@/lib/auth";
import { notFoundResponse } from "@/lib/tenant-scope";
import { CUTOUT_REJECT_MESSAGE, createCutoutFromUpload } from "@/lib/product-cutout";

/**
 * Buat foto "studio" (produk berlatar transparan) dari foto utama produk,
 * untuk Studio Banner di template Precision.
 */
export async function POST(request: Request) {
  const auth = await authorizeAdmin(["banners:manage"]);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const productId = typeof body?.productId === "string" ? body.productId : "";
  if (!productId) return NextResponse.json({ error: "Pilih produk terlebih dahulu." }, { status: 400 });

  const product = await prisma.product.findFirst({
    where: { id: productId, tenantId: auth.tenantId, deletedAt: null },
    select: { slug: true, images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1, select: { url: true } } },
  });
  if (!product) return notFoundResponse("Produk");
  const image = product.images[0]?.url;
  if (!image) return NextResponse.json({ error: "Produk ini belum punya foto." }, { status: 400 });

  try {
    const result = await createCutoutFromUpload(image, product.slug.slice(0, 40));
    if (!result.ok) return NextResponse.json({ error: CUTOUT_REJECT_MESSAGE[result.reason] }, { status: 422 });
    return NextResponse.json({ success: true, url: result.url });
  } catch (err) {
    console.error("[banners/cutout]", err);
    return NextResponse.json({ error: "Gagal memproses foto produk." }, { status: 500 });
  }
}
