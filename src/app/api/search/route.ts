import { NextResponse } from "next/server";
import { getLiveProducts } from "@/lib/live-repository";
import { queryCatalog, rupiah } from "@/lib/catalog";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";

    if (q.length < 3) {
      return NextResponse.json({ products: [], total: 0, hasMore: false });
    }

    const allProducts = await getLiveProducts();
    // Query up to 100 items to accurately determine matching count
    const result = queryCatalog(allProducts, { q }, 100);

    const total = result.total;
    const products = result.products.slice(0, 5).map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      price: p.price,
      priceFormatted: p.price !== null ? rupiah(p.price) : "Hubungi Kami",
      image: p.images[0] || "/images/banners/promo-bundle.png",
      category: p.category,
    }));

    return NextResponse.json({
      products,
      total,
      hasMore: total > 5,
    });
  } catch (err) {
    console.error("Live search API error:", err);
    return NextResponse.json(
      { products: [], total: 0, hasMore: false },
      { status: 500 }
    );
  }
}
