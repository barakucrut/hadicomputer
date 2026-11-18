import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  MessageCircle,
  ShieldCheck,
  Zap,
  MapPin,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import { Container } from "@/components/ui";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { parseGoogleMaps } from "@/components/location-panel";
import type { StorefrontTemplateProps } from "../../types";
import { rupiah, priceLabel } from "@/lib/catalog";

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

  // Filter curated collections
  const featured = products.filter(
    (p) => p.labels.includes("Pilihan Toko") || p.labels.includes("Pilihan Hadi") || p.labels.includes("Featured")
  );
  const heroProduct = featured[0] || products[0];

  const promoProducts = products.filter(
    (p) => p.labels.includes("Promo") || (p.originalPrice && p.price && p.originalPrice > p.price)
  ).slice(0, 6);

  const bestsellers = products.filter(
    (p) => p.labels.includes("Terlaris") || p.labels.includes("Bestseller")
  ).slice(0, 6);

  const activeBanners = banners && banners.length > 0 ? banners : [];
  const primaryBanner = activeBanners[0];

  return (
    <div className="boutique-theme pb-24" style={{ backgroundColor: "#fafaf8", minHeight: "100vh" }}>
      {/* 1. CINEMATIC BOUTIQUE HERO */}
      {sections.heroSlider !== false && (
        <section className="relative overflow-hidden pt-8 pb-16 md:pt-14 md:pb-20 border-b border-[#ecece8] bg-white">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-14 items-center">
              {/* Left Column: Editorial Headline & Actions */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f1f3ed] border border-[#e2e5dc] text-[11px] font-bold text-[#525854] tracking-wide uppercase">
                  <Sparkles size={13} style={{ color: "var(--red)" }} />
                  <span>Koleksi Eksklusif &bull; {storeName}</span>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#111413] tracking-tight leading-[1.12]">
                  Performa Tinggi.
                  <br />
                  <span style={{ color: "var(--red)" }}>Desain Minimalis.</span>
                </h1>

                <p className="text-sm md:text-base text-[#525854] max-w-xl leading-relaxed">
                  {primaryBanner?.description ||
                    `Kurasi perangkat komputasi pilihan, laptop premium, dan rakitan desktop presisi yang disesuaikan untuk kebutuhan kerja dan kreasi Anda.`}
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Link
                    href="/katalog"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold text-white shadow-sm transition-all hover:opacity-90"
                    style={{ backgroundColor: "var(--red)" }}
                  >
                    <span>Eksplorasi Katalog</span>
                    <ArrowRight size={15} />
                  </Link>

                  <WhatsAppButton
                    label={`Konsultasi Spesifikasi`}
                    phone={storeSettings.whatsapp}
                    className="px-5 py-3 rounded-full text-xs font-bold border border-[#d8d8d4] bg-white text-[#111413] hover:bg-gray-50 shadow-xs"
                  />
                </div>

                {/* Micro Guarantee Strip */}
                <div className="pt-6 border-t border-[#ecece8] grid grid-cols-3 gap-4 text-left">
                  <div>
                    <span className="block text-xs font-black text-[#111413]">100% Original</span>
                    <span className="text-[11px] text-[#818779]">Garansi & unit teruji</span>
                  </div>
                  <div>
                    <span className="block text-xs font-black text-[#111413]">Personal Setup</span>
                    <span className="text-[11px] text-[#818779]">Konsultasi ramah</span>
                  </div>
                  <div>
                    <span className="block text-xs font-black text-[#111413]">Siap Kirim</span>
                    <span className="text-[11px] text-[#818779]">Packing aman & rapi</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Featured Hero Visual */}
              <div className="lg:col-span-5 relative">
                {heroProduct ? (
                  <div className="relative rounded-3xl p-6 md:p-8 bg-[#f6f6f4] border border-[#e5e5e2] shadow-xs flex flex-col items-center text-center">
                    <span className="absolute top-4 left-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-white border border-[#e2e5dc] text-[#111413]">
                      Flagship Curated
                    </span>

                    <div className="w-full h-56 sm:h-64 flex items-center justify-center my-4 overflow-hidden">
                      <img
                        src={heroProduct.images?.[0] || "/images/banners/promo-bundle.png"}
                        alt={heroProduct.name}
                        className="max-h-full max-w-full object-contain transition-transform duration-500 hover:scale-105"
                      />
                    </div>

                    <div className="w-full text-left pt-4 border-t border-[#e8e8e4]">
                      <span className="text-[11px] font-mono text-[#818779] uppercase">
                        {heroProduct.brand || "Hardware Pilihan"}
                      </span>
                      <h3 className="text-sm font-bold text-[#111413] truncate mt-0.5">
                        {heroProduct.name}
                      </h3>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-base font-black text-[#111413]">
                          {priceLabel(heroProduct.price)}
                        </span>
                        <Link
                          href={`/produk/${heroProduct.slug}`}
                          className="inline-flex items-center gap-1 text-xs font-bold hover:underline"
                          style={{ color: "var(--red)" }}
                        >
                          <span>Detail</span>
                          <ArrowUpRight size={13} />
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-3xl p-8 bg-[#f6f6f4] border border-[#e5e5e2] text-center">
                    <p className="text-sm text-[#818779]">Koleksi siap dieksplorasi</p>
                  </div>
                )}
              </div>
            </div>
          </Container>
        </section>
      )}

      {/* 2. CURATED CATEGORY CHIPS STRIP */}
      {sections.categories !== false && categories && categories.length > 0 && (
        <section className="py-8 border-b border-[#ecece8] bg-white sticky top-0 z-10 shadow-xs">
          <Container>
            <div className="flex items-center justify-between gap-4 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-xs font-bold text-[#111413] shrink-0 tracking-wide uppercase hidden sm:inline-block">
                Kategori Pilihan:
              </span>
              <div className="flex items-center gap-2 overflow-x-auto">
                <Link
                  href="/katalog"
                  className="px-4 py-1.5 rounded-full text-xs font-bold border border-[#111413] bg-[#111413] text-white shrink-0 transition-colors"
                >
                  Semua Produk
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat.value}
                    href={`/katalog?kategori=${cat.value}`}
                    className="px-4 py-1.5 rounded-full text-xs font-medium border border-[#e5e5e2] bg-white text-[#525854] hover:text-[#111413] hover:border-[#111413] shrink-0 transition-colors"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          </Container>
        </section>
      )}

      {/* 3. CURATED SELECTIONS (BOUTIQUE PRODUCT GRID) */}
      {sections.featured !== false && featured.length > 0 && (
        <section className="py-16 md:py-20">
          <Container>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#818779] block mb-1">
                  {config.featuredEyebrow || "KURASI UTAMA"}
                </span>
                <h2 className="text-2xl md:text-3xl font-black text-[#111413] tracking-tight">
                  {config.featuredTitle || `Koleksi Terpilih di ${storeName}`}
                </h2>
              </div>
              <Link
                href="/katalog?koleksi=Pilihan%20Toko"
                className="inline-flex items-center gap-1.5 text-xs font-bold hover:underline shrink-0"
                style={{ color: "var(--red)" }}
              >
                <span>Lihat Semua Kurasi</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.slice(0, 8).map((product) => (
                <BoutiqueProductCard key={product.id} product={product} storeSettings={storeSettings} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* 4. PROMO & SPECIAL DEALS (MINIMALIST CARDS) */}
      {sections.promoWeek !== false && promoProducts.length > 0 && (
        <section className="py-16 md:py-20 border-t border-[#ecece8] bg-white">
          <Container>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 block mb-1">
                  PENAWARAN TERBATAS
                </span>
                <h2 className="text-2xl md:text-3xl font-black text-[#111413] tracking-tight">
                  Promo Pekan Ini
                </h2>
              </div>
              <Link
                href="/katalog?koleksi=Promo"
                className="inline-flex items-center gap-1.5 text-xs font-bold hover:underline shrink-0"
                style={{ color: "var(--red)" }}
              >
                <span>Semua Promo</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {promoProducts.map((product) => (
                <BoutiqueProductCard key={product.id} product={product} storeSettings={storeSettings} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* 5. EDITORIAL WHY CHOOSE US STRIP */}
      {sections.valueStrip !== false && (
        <section className="py-16 border-t border-[#ecece8] bg-[#fcfcfb]">
          <Container>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 text-center md:text-left">
              <div className="space-y-2 p-6 rounded-2xl bg-white border border-[#e5e5e2] shadow-xs">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#f1f3ed] text-[#111413] mb-3 mx-auto md:mx-0">
                  <ShieldCheck size={20} style={{ color: "var(--red)" }} />
                </div>
                <h3 className="font-bold text-sm text-[#111413]">Standar Kurasi Ketat</h3>
                <p className="text-xs text-[#525854] leading-relaxed">
                  Setiap unit perangkat melalui pengujian fungsi, performa termal, dan keaslian komponen sebelum dipajang.
                </p>
              </div>

              <div className="space-y-2 p-6 rounded-2xl bg-white border border-[#e5e5e2] shadow-xs">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#f1f3ed] text-[#111413] mb-3 mx-auto md:mx-0">
                  <Zap size={20} style={{ color: "var(--red)" }} />
                </div>
                <h3 className="font-bold text-sm text-[#111413]">Spesifikasi Tepat Sasaran</h3>
                <p className="text-xs text-[#525854] leading-relaxed">
                  Tidak perlu bingung spek berlebih. Kami rekomendasikan hardware paling efisien untuk kebutuhan dan anggaran Anda.
                </p>
              </div>

              <div className="space-y-2 p-6 rounded-2xl bg-white border border-[#e5e5e2] shadow-xs">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#f1f3ed] text-[#111413] mb-3 mx-auto md:mx-0">
                  <MessageCircle size={20} style={{ color: "var(--red)" }} />
                </div>
                <h3 className="font-bold text-sm text-[#111413]">Pendampingan Purna Jual</h3>
                <p className="text-xs text-[#525854] leading-relaxed">
                  Dukungan konsultasi berkelanjutan, bantuan klaim garansi, dan upgrade perangkat kapan pun Anda butuhkan.
                </p>
              </div>
            </div>
          </Container>
        </section>
      )}

      {/* 6. STORE LOCATION & VISIT CONTACT */}
      {sections.storeLocation !== false && (
        <section className="py-16 border-t border-[#ecece8] bg-white">
          <Container>
            <div className="p-8 md:p-12 rounded-3xl bg-[#f4f5f1] border border-[#e0e2d8] flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="space-y-3 max-w-xl text-center lg:text-left">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#818779]">
                  {config.storeSectionEyebrow || "KUNJUNGI KAMI"}
                </span>
                <h2 className="text-2xl md:text-3xl font-black text-[#111413] tracking-tight">
                  {config.storeSectionTitle || `Ingin Berdiskusi Langsung di Toko ${storeName}?`}
                </h2>
                <p className="text-xs md:text-sm text-[#525854] leading-relaxed">
                  {storeSettings.address || "Hubungi customer care kami via WhatsApp untuk mendapatkan panduan lokasi dan ketersediaan unit."}
                </p>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#818779] justify-center lg:justify-start pt-1">
                  <MapPin size={15} style={{ color: "var(--red)" }} />
                  <span>{storeSettings.hours || "Buka setiap hari: 08.00 – 22.00 WIB"}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                <WhatsAppButton
                  label={config.waConsultLabel || `Hubungi ${storeName}`}
                  phone={storeSettings.whatsapp}
                  className="px-6 py-3 rounded-full text-xs font-bold text-white shadow-sm transition-all hover:opacity-90"
                />
                <Link
                  href="/lokasi"
                  className="px-5 py-3 rounded-full text-xs font-bold border border-[#d8d8d4] bg-white text-[#111413] hover:bg-gray-50 shadow-xs"
                >
                  Peta Lokasi Toko
                </Link>
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

/**
 * Minimalist Boutique Product Card Component
 */
function BoutiqueProductCard({
  product,
  storeSettings,
}: {
  product: any;
  storeSettings: any;
}) {
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl bg-white border border-[#e5e5e2] p-5 shadow-xs transition-all duration-300 hover:shadow-md hover:border-[#111413]/30">
      {/* Top Badges */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-[10px] font-mono uppercase font-bold text-[#818779] tracking-wider truncate">
          {product.brand || product.category || "Hardware"}
        </span>
        {hasDiscount && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-red-700 bg-red-50 border border-red-200">
            Hemat {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
          </span>
        )}
      </div>

      {/* Image Container with smooth hover zoom */}
      <Link href={`/produk/${product.slug}`} className="w-full h-44 flex items-center justify-center overflow-hidden my-2">
        <img
          src={product.images?.[0] || "/images/banners/promo-bundle.png"}
          alt={product.name}
          className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
        />
      </Link>

      {/* Title & Specs */}
      <div className="pt-3 border-t border-[#f1f3ed] mt-2">
        <h3 className="text-xs font-bold text-[#111413] line-clamp-2 leading-snug group-hover:text-red-600 transition-colors">
          <Link href={`/produk/${product.slug}`}>{product.name}</Link>
        </h3>

        {/* Pricing */}
        <div className="mt-3 flex items-baseline justify-between gap-2">
          <div>
            <div className="text-sm font-black text-[#111413]">
              {priceLabel(product.price)}
            </div>
            {hasDiscount && (
              <div className="text-[11px] text-[#818779] line-through font-medium">
                {product.originalPrice ? rupiah(product.originalPrice) : null}
              </div>
            )}
          </div>
          <Link
            href={`/produk/${product.slug}`}
            className="w-8 h-8 rounded-full border border-[#e5e5e2] flex items-center justify-center text-[#111413] hover:bg-[#111413] hover:text-white transition-all shadow-xs"
            title="Lihat Detail Produk"
          >
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
