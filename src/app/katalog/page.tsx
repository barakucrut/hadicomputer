import type { Metadata } from "next";
import { getStoreBrand } from "@/lib/store-brand";
import Link from "next/link";
import { X } from "lucide-react";
import { getProducts } from "@/lib/repository";
import { getLiveProducts, getLiveCategories, getLiveBrands, getLiveNeeds } from "@/lib/live-repository";
import { queryCatalog, rupiah, type CatalogQuery } from "@/lib/catalog";
import { Container, Breadcrumbs, EmptyState } from "@/components/ui";
import { ProductGrid } from "@/components/product-card";
import { CatalogFilters, CatalogSort, CatalogPagination } from "@/components/catalog-controls";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { brand } = await getStoreBrand();
  const raw = await searchParams;
  const kategori = typeof raw.kategori === "string" ? raw.kategori : "";
  const kondisi = typeof raw.kondisi === "string" ? raw.kondisi : "";
  const koleksi = typeof raw.koleksi === "string" ? raw.koleksi : "";
  const q = typeof raw.q === "string" ? raw.q : "";

  let title = "Katalog Produk Lengkap";
  if (kategori === "laptop") title = "Katalog Laptop Baru & Bekas Berkualitas";
  else if (kategori === "pc") title = "Katalog PC Desktop & Jasa Rakit PC";
  else if (kategori === "smartphone") title = "Katalog Smartphone & Gadget";
  else if (kategori === "tablet") title = "Katalog Tablet & iPad";
  else if (kategori === "aksesori") title = "Katalog Aksesori & Audio Komputer";
  else if (kondisi === "bekas") title = "Katalog Laptop & Komputer Bekas Pilihan";
  else if (koleksi === "Promo") title = "Daftar Promo Spesial & Bundling";
  else if (q) title = `Hasil Pencarian "${q}"`;

  const description =
    "Jelajahi laptop baru & bekas pilihan, PC gaming rakitan, tablet, smartphone, dan aksesoris komputer bergaransi dengan penawaran harga terbaik di ${brand}.";

  return {
    title,
    description,
    openGraph: {
      type: "website",
      locale: "id_ID",
      url: "/katalog",
      siteName: `${brand}`,
      title: `${title} | ${brand}`,
      description,
      images: [
        {
          url: "/images/banners/promo-bundle.png",
          width: 1200,
          height: 630,
          alt: `Katalog ${brand}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${brand}`,
      description,
      images: ["/images/banners/promo-bundle.png"],
    },
    alternates: {
      canonical: "/katalog",
    },
  };
}
export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const query = Object.fromEntries(
    Object.entries(raw).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  ) as CatalogQuery;
  const { brand } = await getStoreBrand();
  const [products, liveCategories, liveBrands, liveNeeds] = await Promise.all([
    getLiveProducts(),
    getLiveCategories(),
    getLiveBrands(),
    getLiveNeeds(),
  ]);
  const result = queryCatalog(products, query);
  // Merge live brands from DB with any active product brands
  const productBrands = products.map((p) => p.brand);
  const dbBrands = liveBrands.map((b) => b.name);
  const allBrands = [...new Set([...dbBrands, ...productBrands])].filter(Boolean).sort();
  const chips = Object.entries(query).filter(
    // store/preview/template = parameter pratinjau toko, bukan filter produk
    ([key, value]) => value && !["page", "urut", "store", "preview", "template"].includes(key),
  );
  return (
    <Container className="page-container">
      <Breadcrumbs items={[{ label: "Katalog Produk" }]} />
      <div className="page-heading">
        <span className="eyebrow">TEMUKAN YANG PAS UNTUKMU</span>
        <h1>Perangkat untuk setiap kebutuhan.</h1>
        <p>
          Jelajahi pilihan baru dan bekas. Pilih, kenali, lalu ngobrol dengan
          {brand}.
        </p>
      </div>
      <div className="catalog-layout">
        <CatalogFilters
          key={JSON.stringify(query)}
          query={query}
          brands={allBrands}
          categories={liveCategories}
          needs={liveNeeds}
        />
        <div className="catalog-results">
          <div className="catalog-toolbar">
            <p>
              <strong>{result.total}</strong> produk ditemukan
            </p>
            <CatalogSort value={query.urut} />
          </div>
          {chips.length > 0 && (
            <div className="active-filters">
              {chips.map(([key, value]) => {
                const price = Number(value);
                const labelValue =
                  (key === "min" || key === "max") && Number.isFinite(price)
                    ? rupiah(price)
                    : value;
                const params = new URLSearchParams(
                  query as Record<string, string>,
                );
                params.delete(key);
                params.delete("page");
                return (
                  <Link
                    href={`/katalog?${params}`}
                    key={key}
                    aria-label={`Hapus filter ${key}: ${labelValue}`}
                  >
                    <span>
                      {(
                        {
                          q: "Cari",
                          kategori: "Kategori",
                          merek: "Merek",
                          kondisi: "Kondisi",
                          status: "Status",
                          min: "Min",
                          max: "Maks",
                          koleksi: "Koleksi",
                          kebutuhan: "Kebutuhan",
                        } as Record<string, string>
                      )[key] ?? key}
                      : {labelValue}
                    </span>
                    <X size={12} />
                  </Link>
                );
              })}
            </div>
          )}
          {result.products.length ? (
            <ProductGrid products={result.products} />
          ) : (
            <EmptyState />
          )}
          {result.totalPages > 1 && (
            <CatalogPagination
              currentPage={result.page}
              totalPages={result.totalPages}
              query={query}
            />
          )}
        </div>
      </div>
    </Container>
  );
}
