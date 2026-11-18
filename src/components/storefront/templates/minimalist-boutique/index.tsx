import Link from "next/link";
import { ArrowRight, ArrowUpRight, Clock, MapPin } from "lucide-react";
import { Container } from "@/components/ui";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { parseGoogleMaps } from "@/components/location-panel";
import { rupiah, priceLabel } from "@/lib/catalog";
import type { Product } from "@/lib/types";
import type { StorefrontTemplateProps } from "../../types";

/**
 * MINIMALIST TECH BOUTIQUE — "Editorial Gallery"
 * Light, calm, one product at a time. Merchant color is used sparingly
 * (dots, underlines, prices) via the `brand` Tailwind token.
 */

const FALLBACK_IMG = "/images/banners/promo-bundle.png";

function hasDiscount(p: Product) {
  return !!(p.originalPrice && p.price && p.originalPrice > p.price);
}

function SectionHead({
  eyebrow,
  title,
  description,
  href,
  linkLabel,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-10 flex flex-col gap-4 md:mb-14 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <span className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a8a83]">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          {eyebrow}
        </span>
        <h2 className="m-0 text-3xl font-semibold leading-[1.08] tracking-[-0.03em] text-[#141412] md:text-[44px]">
          {title}
        </h2>
        {description && (
          <p className="mt-4 mb-0 max-w-xl text-[15px] font-light leading-relaxed text-[#6b6b65]">{description}</p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="group inline-flex shrink-0 items-center gap-2 text-sm font-medium text-[#141412] underline decoration-brand decoration-1 underline-offset-[6px] transition-colors hover:text-brand"
        >
          {linkLabel || "Lihat semua"}
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

function GalleryCard({ product, size = "md" }: { product: Product; size?: "md" | "sm" }) {
  const discount = hasDiscount(product);
  return (
    <Link href={`/produk/${product.slug}`} className="group flex flex-col gap-4 text-[#141412]">
      <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden bg-[#ecebe6]">
        <img
          src={product.images?.[0] || FALLBACK_IMG}
          alt={product.name}
          className={`${size === "sm" ? "max-h-[62%]" : "max-h-[70%]"} max-w-[78%] object-contain mix-blend-multiply transition-transform duration-700 ease-out group-hover:scale-[1.04]`}
        />
        {product.condition === "bekas" && (
          <span className="absolute top-3 left-3 bg-white px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[#6b6b65]">
            Second
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[11px] uppercase tracking-[0.16em] text-[#8a8a83]">{product.brand}</span>
        <h3 className="m-0 line-clamp-2 text-[15px] font-medium leading-snug tracking-[-0.01em] group-hover:underline group-hover:decoration-brand group-hover:underline-offset-4">
          {product.name}
        </h3>
        <div className="mt-1 flex items-baseline gap-2">
          <span className={`text-sm ${product.price === null ? "text-[#8a8a83]" : "font-medium text-brand"}`}>
            {priceLabel(product.price)}
          </span>
          {discount && (
            <span className="text-xs text-[#a3a39c] line-through">{rupiah(product.originalPrice!)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function MinimalistBoutiqueHome({
  tenant,
  products,
  banners,
  categories,
  needs,
  services,
}: StorefrontTemplateProps) {
  const storeSettings = tenant.settings;
  const config = storeSettings.homepageConfig || {};
  const sections = config.sections || {};
  const storeName = storeSettings.name || tenant.name || "Toko Pilihan";
  const mapData = parseGoogleMaps(storeSettings.mapsUrl, storeSettings.address);

  const featured = products.filter(
    (p) => p.labels.includes("Pilihan Toko") || p.labels.includes("Pilihan Hadi") || p.labels.includes("Featured"),
  );
  const bestsellers = products.filter((p) => p.labels.includes("Terlaris") || p.labels.includes("Bestseller"));
  const promoProducts = products.filter((p) => p.labels.includes("Promo") || hasDiscount(p)).slice(0, 8);
  const latest = products.filter((p) => p.labels.includes("Terbaru")).slice(0, 4);

  const spotlight = featured[0] || products[0];
  const curated = featured.filter((p) => p.id !== spotlight?.id).slice(0, 6);
  const story = bestsellers.find((p) => p.id !== spotlight?.id) || featured[1] || products[1];
  const storySpecs = story?.specs.slice(0, 3) || [];
  const primaryBanner = banners[0];

  const countByCategory = (value: string) => products.filter((p) => p.category === value).length;

  return (
    <div className="min-h-screen bg-[#f7f6f2] pb-24 text-[#141412]">
      {/* 1. HERO SPOTLIGHT */}
      {sections.heroSlider !== false && (
        <section className="pt-14 pb-20 md:pt-24 md:pb-28">
          <Container>
            <div className="mx-auto max-w-4xl text-center">
              <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a8a83]">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                {storeName}
              </span>
              <h1 className="mt-6 mb-0 text-[42px] font-semibold leading-[1.02] tracking-[-0.045em] sm:text-6xl md:text-[84px]">
                Dipilih dengan teliti.
                <br />
                <span className="font-light text-[#8a8a83]">Dirawat sepenuh hati.</span>
              </h1>
              <p className="mx-auto mt-6 mb-0 max-w-xl text-[15px] font-light leading-relaxed text-[#6b6b65] md:text-base">
                {storeSettings.tagline ||
                  primaryBanner?.description ||
                  "Kurasi perangkat komputasi terbaik untuk kerja, kreasi, dan keseharianmu."}
              </p>
            </div>

            {spotlight && (
              <Link href={`/produk/${spotlight.slug}`} className="group mt-14 block md:mt-20">
                <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-[#ecebe6] md:aspect-[21/9]">
                  <img
                    src={spotlight.images?.[0] || FALLBACK_IMG}
                    alt={spotlight.name}
                    className="max-h-[78%] max-w-[70%] object-contain mix-blend-multiply transition-transform duration-1000 ease-out group-hover:scale-[1.03]"
                  />
                  <span className="absolute top-5 left-5 text-[11px] uppercase tracking-[0.2em] text-[#8a8a83]">
                    Sorotan
                  </span>
                </div>
                <div className="flex flex-col gap-3 border-b border-[#dedcd5] py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col">
                    <span className="text-[11px] uppercase tracking-[0.16em] text-[#8a8a83]">{spotlight.brand}</span>
                    <span className="text-lg font-medium tracking-[-0.01em] md:text-xl">{spotlight.name}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className={spotlight.price === null ? "text-sm text-[#8a8a83]" : "text-lg font-medium text-brand"}>
                      {priceLabel(spotlight.price)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium underline decoration-brand underline-offset-[6px]">
                      Lihat detail <ArrowUpRight size={15} />
                    </span>
                  </div>
                </div>
              </Link>
            )}
          </Container>
        </section>
      )}

      {/* 2. CATEGORY INDEX */}
      {sections.categories !== false && categories.length > 0 && (
        <section className="border-t border-[#dedcd5] py-20 md:py-28">
          <Container>
            <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
              <div className="md:col-span-4">
                <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a8a83]">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                  Indeks
                </span>
                <p className="mt-4 mb-0 max-w-xs text-[15px] font-light leading-relaxed text-[#6b6b65]">
                  Jelajahi koleksi {storeName} berdasarkan jenis perangkat.
                </p>
              </div>
              <ol className="m-0 list-none p-0 md:col-span-8">
                {categories.map((cat, i) => (
                  <li key={cat.value} className="border-t border-[#dedcd5] last:border-b">
                    <Link
                      href={`/katalog?kategori=${cat.value}`}
                      className="group flex items-center justify-between gap-4 py-5 md:py-6"
                    >
                      <span className="flex items-baseline gap-5">
                        <span className="w-6 text-xs tabular-nums text-[#a3a39c]">{String(i + 1).padStart(2, "0")}</span>
                        <span className="text-2xl font-medium tracking-[-0.03em] transition-colors group-hover:text-brand md:text-4xl">
                          {cat.name}
                        </span>
                      </span>
                      <span className="flex items-center gap-4 text-sm text-[#8a8a83]">
                        <span className="hidden opacity-0 transition-opacity group-hover:opacity-100 sm:inline">
                          {countByCategory(cat.value)} produk
                        </span>
                        <ArrowUpRight
                          size={22}
                          className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand"
                        />
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          </Container>
        </section>
      )}

      {/* 3. CURATED GRID */}
      {sections.featured !== false && curated.length > 0 && (
        <section className="border-t border-[#dedcd5] py-20 md:py-28">
          <Container>
            <SectionHead
              eyebrow={config.featuredEyebrow || "Kurasi"}
              title={config.featuredTitle || `Pilihan ${storeName}`}
              description={config.featuredDescription}
              href="/katalog?koleksi=Pilihan%20Toko"
              linkLabel="Lihat semua kurasi"
            />
            <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-8 md:gap-y-16">
              {curated.map((p) => (
                <GalleryCard key={p.id} product={p} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* 4. FEATURE STORY */}
      {sections.featured !== false && story && (
        <section className="border-t border-[#dedcd5] bg-white py-20 md:py-28">
          <Container>
            <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-16">
              <Link
                href={`/produk/${story.slug}`}
                className="group flex aspect-[4/5] items-center justify-center overflow-hidden bg-[#ecebe6]"
              >
                <img
                  src={story.images?.[0] || FALLBACK_IMG}
                  alt={story.name}
                  className="max-h-[72%] max-w-[76%] object-contain mix-blend-multiply transition-transform duration-1000 ease-out group-hover:scale-[1.03]"
                />
              </Link>
              <div className="flex flex-col gap-6">
                <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a8a83]">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                  {config.bestSellerEyebrow || "Cerita Produk"}
                </span>
                <h2 className="m-0 text-3xl font-semibold leading-[1.08] tracking-[-0.03em] md:text-5xl">{story.name}</h2>
                <p className="m-0 text-[15px] font-light leading-relaxed text-[#6b6b65]">
                  {story.summary || config.bestSellerDescription}
                </p>
                {storySpecs.length > 0 && (
                  <dl className="m-0 grid grid-cols-1 border-t border-[#dedcd5]">
                    {storySpecs.map((spec) => (
                      <div key={spec.name} className="flex justify-between gap-6 border-b border-[#dedcd5] py-3 text-sm">
                        <dt className="text-[#8a8a83]">{spec.name}</dt>
                        <dd className="m-0 text-right font-medium">{spec.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                <div className="flex flex-wrap items-center gap-6 pt-2">
                  <span className={story.price === null ? "text-sm text-[#8a8a83]" : "text-2xl font-medium text-brand"}>
                    {priceLabel(story.price)}
                  </span>
                  <WhatsAppButton
                    label="Tanyakan unit ini"
                    phone={storeSettings.whatsapp}
                    message={`Halo ${storeName}, saya tertarik dengan ${story.name}. Apakah masih tersedia? {origin}/produk/${story.slug}`}
                    trackingData={{ inquiryType: "PRODUCT", productId: story.id, priceAtInquiry: story.price ?? undefined }}
                    className="rounded-full!"
                  />
                </div>
              </div>
            </div>
          </Container>
        </section>
      )}

      {/* 5. PROMO RAIL */}
      {sections.promoWeek !== false && promoProducts.length > 0 && (
        <section className="border-t border-[#dedcd5] py-20 md:py-28">
          <Container>
            <SectionHead
              eyebrow="Penawaran"
              title="Harga terbaik pekan ini."
              href="/katalog?koleksi=Promo"
              linkLabel="Semua promo"
            />
            <div className="-mx-1 flex snap-x snap-mandatory gap-6 overflow-x-auto px-1 pb-4 [scrollbar-width:thin]">
              {promoProducts.map((p) => (
                <div key={p.id} className="w-[68%] shrink-0 snap-start sm:w-[42%] md:w-[calc((100%-72px)/4)]">
                  <GalleryCard product={p} size="sm" />
                </div>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* 6. NEEDS */}
      {sections.needs !== false && needs.length > 0 && (
        <section className="border-t border-[#dedcd5] py-20 md:py-28">
          <Container>
            <SectionHead eyebrow="Kebutuhan" title="Mulai dari apa yang kamu kerjakan." />
            <div className="grid grid-cols-1 border-t border-[#dedcd5] sm:grid-cols-2 lg:grid-cols-3">
              {needs.map((need) => (
                <Link
                  key={need.id}
                  href={`/katalog?kebutuhan=${need.slug}`}
                  className="group flex flex-col gap-2 border-b border-[#dedcd5] py-6 sm:pr-8"
                >
                  <span className="flex items-center justify-between text-xl font-medium tracking-[-0.02em] group-hover:text-brand">
                    {need.name}
                    <ArrowRight size={18} className="text-[#a3a39c] transition-transform group-hover:translate-x-1 group-hover:text-brand" />
                  </span>
                  {need.description && (
                    <span className="text-sm font-light leading-relaxed text-[#6b6b65]">{need.description}</span>
                  )}
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* 7. LATEST */}
      {sections.latest !== false && latest.length > 0 && (
        <section className="border-t border-[#dedcd5] py-20 md:py-28">
          <Container>
            <SectionHead eyebrow="Baru Tiba" title="Koleksi terbaru." href="/katalog?koleksi=Terbaru" />
            <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-4 md:gap-x-8">
              {latest.map((p) => (
                <GalleryCard key={p.id} product={p} size="sm" />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* 8. SERVICES */}
      {sections.services !== false && services.length > 0 && (
        <section className="border-t border-[#dedcd5] bg-white py-20 md:py-28">
          <Container>
            <SectionHead eyebrow="Layanan" title="Lebih dari sekadar menjual." href="/layanan" linkLabel="Semua layanan" />
            <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-10">
              {services.slice(0, 3).map((svc, i) => (
                <Link key={svc.slug} href={`/layanan/${svc.slug}`} className="group flex flex-col gap-5">
                  <div className="aspect-[3/2] overflow-hidden bg-[#ecebe6]">
                    <img
                      src={svc.image || FALLBACK_IMG}
                      alt={svc.name}
                      className="h-full w-full object-cover grayscale transition duration-700 group-hover:scale-[1.03] group-hover:grayscale-0"
                    />
                  </div>
                  <div className="flex flex-col gap-2 border-t border-[#dedcd5] pt-5">
                    <span className="text-xs tabular-nums text-brand">{String(i + 1).padStart(2, "0")}</span>
                    <h3 className="m-0 text-xl font-medium tracking-[-0.02em] group-hover:underline group-hover:decoration-brand group-hover:underline-offset-4">
                      {svc.name}
                    </h3>
                    <p className="m-0 line-clamp-3 text-sm font-light leading-relaxed text-[#6b6b65]">{svc.summary}</p>
                    <span className="mt-1 text-sm text-[#8a8a83]">
                      {svc.price !== null ? `Mulai ${rupiah(svc.price)}` : "Konsultasi gratis"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* 9. VISIT */}
      {sections.storeLocation !== false && (
        <section className="border-t border-[#dedcd5] py-20 md:py-28">
          <Container>
            <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-16">
              <div className="flex flex-col gap-8">
                <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a8a83]">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                  {config.storeSectionEyebrow || "Kunjungi"}
                </span>
                <h2 className="m-0 text-4xl font-semibold leading-[1.05] tracking-[-0.04em] md:text-6xl">
                  {config.storeSectionTitle || "Lihat langsung. Ngobrol lebih nyaman."}
                </h2>
                {config.storeSectionDescription && (
                  <p className="m-0 max-w-md text-[15px] font-light leading-relaxed text-[#6b6b65]">
                    {config.storeSectionDescription}
                  </p>
                )}
                <div className="flex flex-col border-t border-[#dedcd5]">
                  {storeSettings.address && (
                    <div className="flex items-start gap-3 border-b border-[#dedcd5] py-4 text-[15px]">
                      <MapPin size={17} className="mt-0.5 shrink-0 text-brand" />
                      <span>{storeSettings.address}</span>
                    </div>
                  )}
                  <div className="flex items-start gap-3 border-b border-[#dedcd5] py-4 text-[15px]">
                    <Clock size={17} className="mt-0.5 shrink-0 text-brand" />
                    <span>{storeSettings.hours || "Buka setiap hari: 08.00 – 22.00 WIB"}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-6">
                  <WhatsAppButton
                    label={config.waConsultLabel || `Hubungi ${storeName}`}
                    phone={storeSettings.whatsapp}
                    trackingData={{ inquiryType: "GENERAL" }}
                    className="rounded-full!"
                  />
                  <Link
                    href="/lokasi"
                    className="inline-flex items-center gap-1.5 text-sm font-medium underline decoration-brand underline-offset-[6px]"
                  >
                    Petunjuk arah <ArrowUpRight size={15} />
                  </Link>
                </div>
              </div>
              <div className="relative min-h-[320px] overflow-hidden bg-[#ecebe6] md:min-h-full">
                {mapData ? (
                  <iframe
                    src={mapData.embedUrl}
                    title={`Lokasi ${storeName}`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="absolute inset-0 h-full w-full border-0 grayscale-[0.9] contrast-[0.95]"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-[#8a8a83]">
                    <MapPin size={24} className="text-brand" />
                    Peta lokasi belum diatur
                  </div>
                )}
              </div>
            </div>
          </Container>
        </section>
      )}

      <WhatsAppButton
        label={config.waFloatingLabel || `Tanya ${storeName} via WhatsApp`}
        className="mobile-floating-whatsapp"
        phone={storeSettings.whatsapp}
      />
    </div>
  );
}
