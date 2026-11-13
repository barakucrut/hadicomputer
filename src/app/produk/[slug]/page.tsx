import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getProduct, getProducts } from "@/lib/repository";
import { getLiveProduct, getLiveProducts } from "@/lib/live-repository";
import { effectiveOffer, getProductDiscount, priceLabel, rupiah } from "@/lib/catalog";
import { Container, Breadcrumbs, SectionHeading } from "@/components/ui";
import { ProductDetail } from "@/components/product-detail";
import { ProductGrid } from "@/components/product-card";

export function generateStaticParams() {
  return getProducts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await getLiveProduct(slug);
  if (!p) {
    return {
      title: "Produk Tidak Ditemukan | Hadi Computer",
    };
  }

  // Dynamically resolve active public host (for ngrok, trycloudflare, or production)
  const headerList = await headers();
  const host =
    headerList.get("x-forwarded-host") ||
    headerList.get("host") ||
    "localhost:3000";
  const proto =
    headerList.get("x-forwarded-proto") ||
    (host.includes("localhost") ? "http" : "https");
  const baseUrl = `${proto}://${host}`;

  const offer = effectiveOffer(p);
  const discount = getProductDiscount(p);
  const savingsText = discount ? ` (Hemat ${rupiah(discount.savings)})` : "";
  const bonusText = p.bonus ? ` + Bonus: ${p.bonus}` : "";
  const conditionText = p.condition === "bekas" ? "Bekas Pilihan" : "Baru";

  const title = `${p.name} — ${priceLabel(offer.price)}`;
  const description = `${p.name} (${conditionText}). ${p.summary}. Harga ${priceLabel(offer.price)}${savingsText}${bonusText}. ${p.warranty}. Siap konsultasi & pengiriman via WhatsApp Hadi Computer.`;

  // WhatsApp strictly requires JPEG/PNG (does not support .webp in chat previews)
  const primaryWebp = p.images[0] || "/images/banners/promo-bundle.png";
  const primaryJpg = primaryWebp.replace(/\.webp$/, ".jpg");
  const absoluteImageUrl = primaryJpg.startsWith("http")
    ? primaryJpg
    : `${baseUrl}${primaryJpg}`;

  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    keywords: [
      p.name,
      p.brand,
      p.category,
      conditionText,
      "Hadi Computer",
      "jual laptop",
      "beli komputer",
    ],
    openGraph: {
      type: "website",
      locale: "id_ID",
      url: `${baseUrl}/produk/${p.slug}`,
      siteName: "Hadi Computer",
      title: `${title} | Hadi Computer`,
      description,
      images: [
        {
          url: absoluteImageUrl,
          secureUrl: absoluteImageUrl,
          width: 1000,
          height: 1000,
          type: "image/jpeg",
          alt: `${p.name} - Hadi Computer`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Hadi Computer`,
      description,
      images: [absoluteImageUrl],
    },
    alternates: {
      canonical: `${baseUrl}/produk/${p.slug}`,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params,
    product = await getLiveProduct(slug);
  if (!product) notFound();

  const offer = effectiveOffer(product);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images.map((img) =>
      img.startsWith("http") ? img : `${siteUrl}${img}`,
    ),
    description: product.summary,
    sku: product.code,
    mpn: product.code,
    brand: {
      "@type": "Brand",
      name: product.brand,
    },
    category: product.category,
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/produk/${product.slug}`,
      priceCurrency: "IDR",
      price: offer.price ?? undefined,
      itemCondition:
        product.condition === "bekas"
          ? "https://schema.org/UsedCondition"
          : "https://schema.org/NewCondition",
      availability:
        offer.availability === "tersedia"
          ? "https://schema.org/InStock"
          : offer.availability === "preorder"
            ? "https://schema.org/PreOrder"
            : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "Hadi Computer",
      },
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Beranda",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Katalog",
        item: `${siteUrl}/katalog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name:
          product.category.charAt(0).toUpperCase() + product.category.slice(1),
        item: `${siteUrl}/katalog?kategori=${product.category}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: product.name,
        item: `${siteUrl}/produk/${product.slug}`,
      },
    ],
  };

  const allProducts = await getLiveProducts();
  const related = allProducts
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Container className="page-container product-page">
        <Breadcrumbs
          items={[
            { label: "Katalog", href: "/katalog" },
            {
              label:
                product.category.charAt(0).toUpperCase() +
                product.category.slice(1),
              href: `/katalog?kategori=${product.category}`,
            },
            { label: product.name },
          ]}
        />
        <ProductDetail key={product.id} product={product} />
        {related.length > 0 && (
          <section className="section">
            <SectionHeading
              title="Pilihan lain yang bisa kamu kenali."
              href={`/katalog?kategori=${product.category}`}
            />
            <ProductGrid products={related} />
          </section>
        )}
      </Container>
    </>
  );
}
