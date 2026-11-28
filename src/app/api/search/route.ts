import { NextResponse } from "next/server";
import { getLiveProducts } from "@/lib/live-repository";
import { resolveStorefrontTenant } from "@/lib/tenant-resolver";
import { queryCatalog, rupiah } from "@/lib/catalog";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";

    if (q.length < 3) {
      return NextResponse.json({ products: [], total: 0, hasMore: false });
    }

    // Toko: ?store= eksplisit, atau ?store= dari halaman asal (mode preview),
    // selain itu domain/subdomain request seperti biasa.
    let storeParam = searchParams.get("store") || undefined;
    if (!storeParam) {
      try {
        const ref = request.headers.get("referer");
        storeParam = ref ? new URL(ref).searchParams.get("store") || undefined : undefined;
      } catch {
        storeParam = undefined;
      }
    }
    if (storeParam && !/^[a-z0-9-]{1,100}$/i.test(storeParam)) storeParam = undefined;
    const tenant = await resolveStorefrontTenant(undefined, { previewSlug: storeParam });
    const locale = tenant.settings.locale ?? "id";
    const currency = tenant.settings.currency ?? "IDR";
    const allProducts = await getLiveProducts(tenant.id);
    // Query up to 100 items to accurately determine matching count
    const result = queryCatalog(allProducts, { q }, 100);

    const total = result.total;
    const products = result.products.slice(0, 5).map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      price: p.price,
      // Harga coret hanya bila nyata lebih tinggi dari harga jual
      originalPrice: p.originalPrice && p.price && p.originalPrice > p.price ? p.originalPrice : null,
      priceFormatted: p.price !== null ? rupiah(p.price, currency, locale) : locale === "en" ? "Contact Us" : "Hubungi Kami",
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
