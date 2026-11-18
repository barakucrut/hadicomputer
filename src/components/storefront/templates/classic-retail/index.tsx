import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCheck,
  MessageCircle,
  MapPin,
  MoveUpRight,
  SlidersHorizontal,
  Wrench,
} from "lucide-react";
import { services as staticServices } from "@/lib/repository";
import { Container, CategoryIcon, SectionHeading } from "@/components/ui";
import { HeroSlider } from "@/components/hero-slider";
import { FeaturedProducts } from "@/components/featured-products";
import { ProductGrid } from "@/components/product-card";
import { ServiceCard } from "@/components/service-card";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { parseGoogleMaps } from "@/components/location-panel";
import type { StorefrontTemplateProps } from "../../types";

const mobilePcSlugs = new Set([
  "msi-mag-infinite-s3-14th",
  "msi-cubi-n-adl",
  "msi-pro-dp21-14m",
  "asus-rog-g22ch",
]);

export function ClassicRetailHome({
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
  const storeName = storeSettings.name || tenant.name || "Hadi Computer";

  const mapData = parseGoogleMaps(storeSettings.mapsUrl, storeSettings.address);

  const desktops = products.filter((product) => product.category === "pc");
  const promoProducts = products
    .filter(
      (p) =>
        p.labels.includes("Promo") ||
        (p.originalPrice && p.price && p.originalPrice > p.price),
    )
    .slice(0, 4);
  const latest = products
    .filter((p) => p.labels.includes("Terbaru"))
    .slice(0, 4);
  const bestsellers = products
    .filter((p) => p.labels.includes("Terlaris"))
    .slice(0, 4);

  const featured = products.filter(
    (p) => p.labels.includes("Pilihan Toko") || p.labels.includes("Pilihan Hadi"),
  );
  const mobileCandidates = featured.filter(
    (p) =>
      p.category !== "pc" && !promoProducts.some((item) => item.id === p.id),
  );
  const mobileFeatured = mobileCandidates
    .filter(
      (p, index, items) =>
        items.findIndex((item) => item.category === p.category) === index,
    )
    .slice(0, 2);
  const mobileLatest = products
    .filter(
      (p) =>
        p.labels.includes("Terbaru") &&
        p.category !== "pc" &&
        ![...promoProducts, ...mobileFeatured].some((item) => item.id === p.id),
    )
    .slice(0, 2);
  const mobileDesktops = desktops.filter((p) => mobilePcSlugs.has(p.slug));

  const displayServices = services.length > 0 ? services : staticServices;

  return (
    <div className="home-page">
      <Container className="home-hero-wrap">
        {sections.heroSlider !== false && <HeroSlider slides={banners} />}
        {sections.valueStrip !== false && (
          <div className="value-strip">
            {[
              {
                Icon: SlidersHorizontal,
                title: "Pilihan sesuai kebutuhan",
                text: "Baru maupun bekas pilihan",
              },
              {
                Icon: MessageCircle,
                title: `Ngobrol langsung dengan ${storeName}`,
                text: "Konsultasi sebelum memilih",
              },
              {
                Icon: CheckCheck,
                title: "Informasi lebih jelas",
                text: "Spesifikasi, kondisi & garansi",
              },
              {
                Icon: Wrench,
                title: "Lebih dari sekadar perangkat",
                text: "Servis hingga jasa rakit PC",
              },
            ].map(({ Icon, title, text }) => (
              <div key={title}>
                <Icon size={23} strokeWidth={1.5} />
                <div>
                  <strong>{title}</strong>
                  <span>{text}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>

      {sections.categories !== false && (
        <HomeCategories className="home-categories-mobile" categoriesList={categories} />
      )}

      {sections.promoWeek !== false && promoProducts.length > 0 && (
        <section id="promo-minggu-ini" className="section promo-week-section">
          <Container>
            <SectionHeading
              eyebrow="PENAWARAN TERBATAS PEKAN INI"
              title="Promo Minggu Ini"
              description="Koleksi produk pilihan dengan diskon harga spesial & paket bundling bonus eksklusif."
              href="/katalog?koleksi=Promo"
              linkText="Lihat semua promo"
            />
            <ProductGrid products={promoProducts} />
          </Container>
        </section>
      )}

      {sections.categories !== false && (
        <HomeCategories className="home-categories-desktop" categoriesList={categories} />
      )}

      {sections.featured !== false && featured.length > 0 && (
        <section className="section section-soft">
          <Container>
            <SectionHeading
              eyebrow={config.featuredEyebrow || "DIPILIH UNTUKMU"}
              title={config.featuredTitle || `Pilihan ${storeName}, untuk harimu.`}
              description={config.featuredDescription || "Kenali perangkat yang bisa jadi teman aktivitasmu berikutnya."}
              href="/katalog?koleksi=Pilihan%20Toko"
            />
            <FeaturedProducts
              products={featured}
              mobileProducts={mobileFeatured.length ? mobileFeatured : undefined}
            />
          </Container>
        </section>
      )}

      {sections.needs !== false && needs.length > 0 && (
        <section className="section needs-section">
          <Container>
            <SectionHeading
              title="Beda kebutuhan, beda pilihan."
              description="Temukan perangkat yang sejalan dengan keseharianmu."
              href="/katalog"
              linkText="Lihat semua kebutuhan"
            />
            <div className="needs-grid">
              {needs.map((needItem, idx) => {
                const num = String(idx + 1).padStart(2, "0");
                const cls = needItem.slug === "kuliah" ? "study" : needItem.slug === "kerja" ? "work" : "create";
                return (
                  <Link
                    key={needItem.slug}
                    href={`/katalog?kebutuhan=${needItem.slug}`}
                    className={`need-card ${cls}`}
                  >
                    <div className="need-top">
                      <CategoryIcon name={needItem.icon || "tag"} size={29} />
                      <span>{num}</span>
                    </div>
                    <h3>{needItem.name}</h3>
                    <p>{needItem.description || "Perangkat andalan untuk mendukung aktivitasmu."}</p>
                    <span className="need-link">
                      Temukan pilihanmu
                      <ArrowUpRight size={19} />
                    </span>
                  </Link>
                );
              })}
            </div>
          </Container>
        </section>
      )}

      {sections.latest !== false && latest.length > 0 && (
        <section className="section latest-section">
          <Container>
            <SectionHeading
              eyebrow="BARU DI KATALOG"
              title="Kenalan dengan yang terbaru."
              href="/katalog?koleksi=Terbaru"
            />
            <ProductGrid
              products={latest}
              mobileProducts={mobileLatest.length ? mobileLatest : undefined}
            />
          </Container>
        </section>
      )}

      {sections.pcGaming !== false && desktops.length > 0 && (
        <section className="section desktop-section">
          <Container>
            <SectionHeading
              eyebrow="RUANG UNTUK PERFORMA LEBIH"
              title="PC untuk kerja, kreasi, dan gaming."
              description="Dari mini PC yang ringkas sampai desktop gaming pilihan."
              href="/katalog?kategori=pc"
              linkText="Lihat semua PC"
            />
            <ProductGrid
              products={desktops.slice(0, 4)}
              mobileProducts={
                mobileDesktops.length ? mobileDesktops : undefined
              }
            />
          </Container>
        </section>
      )}

      {sections.pcGaming !== false && (
        <section className="section gaming-section">
          <Container>
            <div className="gaming-panel">
              <div className="gaming-image" />
              <div className="gaming-copy">
                <span className="eyebrow">DARI IDE JADI SETUP IMPIAN</span>
                <h2>
                  PC yang dirakit
                  <br />
                  untuk caramu bermain.
                </h2>
                <p>Ceritakan kebutuhan dan budgetmu. Kita mulai dari situ.</p>
                <Link href="/layanan/rakit-pc" className="button white">
                  Kenali jasa rakit PC
                  <ArrowRight size={17} />
                </Link>
              </div>
              <span className="campaign-note">
                Konsultasi spesifikasi dan pilihan komponen via WhatsApp
              </span>
            </div>
          </Container>
        </section>
      )}

      {sections.promoWeek !== false && bestsellers.length > 0 && (
        <section className="section bestsellers-section">
          <Container>
            <SectionHeading
              eyebrow={config.bestSellerEyebrow || "KURASI OWNER"}
              title={config.bestSellerTitle || `Favorit di ${storeName}.`}
              description={config.bestSellerDescription || "Koleksi produk paling diminati yang siap menemani produktivitas harianmu."}
              href="/katalog?koleksi=Terlaris"
            />
            <ProductGrid products={bestsellers} />
          </Container>
        </section>
      )}

      {sections.services !== false && displayServices.length > 0 && (
        <section className="section services-section">
          <Container>
            <SectionHeading
              eyebrow="LAYANAN TERBAIK"
              title="Perangkatmu butuh perhatian?"
              description="Dari perawatan rutin sampai membangun setup baru."
              href="/layanan"
              linkText="Semua layanan"
            />
            <div className="services-grid">
              {displayServices.map((service) => (
                <ServiceCard service={service} key={service.slug} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {sections.storeLocation !== false && (
        <section className="section store-section">
          <Container>
            <div className="store-banner">
              {mapData?.embedUrl ? (
                <div
                  className="store-illustration store-map-embed"
                  style={{
                    position: "relative",
                    padding: 0,
                    minHeight: "260px",
                    overflow: "hidden",
                  }}
                >
                  <iframe
                    src={mapData.embedUrl}
                    width="100%"
                    height="100%"
                    style={{
                      border: 0,
                      width: "100%",
                      height: "100%",
                      minHeight: "260px",
                      display: "block",
                      borderRadius: "8px",
                    }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`Peta Lokasi ${storeName}`}
                  />
                  {mapData.directUrl && (
                    <a
                      className="button white map-link"
                      href={mapData.directUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        position: "absolute",
                        bottom: "10px",
                        right: "10px",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.18)",
                        fontSize: "11px",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        zIndex: 10,
                      }}
                    >
                      Buka Google Maps
                      <MoveUpRight size={13} />
                    </a>
                  )}
                </div>
              ) : (
                <div className="store-illustration">
                  <MapPin size={62} strokeWidth={1} />
                  <span>{storeName.toUpperCase()}</span>
                  <div className="map-road road-one" />
                  <div className="map-road road-two" />
                </div>
              )}
              <div className="store-copy">
                <span className="eyebrow">{config.storeSectionEyebrow || "SAMPAI KETEMU DI TOKO"}</span>
                <h2>
                  {config.storeSectionTitle || (
                    <>
                      Lihat langsung.
                      <br />
                      Ngobrol lebih nyaman.
                    </>
                  )}
                </h2>
                <p>
                  {config.storeSectionDescription || `Kenali pilihan perangkatmu dan diskusikan kebutuhan langsung dengan ${storeName}.`}
                </p>
                <span className="small-note">
                  {storeSettings.hours || "Buka setiap hari: 08.00 – 22.00 WIB"} · Siap konsultasi
                </span>
                <Link href="/lokasi" className="text-link">
                  Kenali lokasi toko
                  <MoveUpRight size={17} />
                </Link>
              </div>
              <div className="store-chat">
                <MessageCircle size={30} strokeWidth={1.3} />
                <h3>Belum tahu harus pilih apa?</h3>
                <p>Mulai dengan cerita tentang kebutuhanmu.</p>
                <WhatsAppButton
                  label={config.waConsultLabel || `Tanya ${storeName} dulu`}
                  phone={storeSettings.whatsapp}
                />
                <small>Hubungi langsung via WhatsApp · Respon cepat</small>
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

function HomeCategories({
  className,
  categoriesList,
}: {
  className: string;
  categoriesList: Array<{ name: string; value: string; icon: string; description: string }>;
}) {
  return (
    <section className={`section category-section ${className}`}>
      <Container>
        <SectionHeading
          title="Lagi cari apa?"
          description="Mulai dari perangkat yang kamu butuhkan."
          href="/katalog"
          linkText="Jelajahi katalog"
        />
        <div className="category-grid">
          {categoriesList.map((c) => (
            <Link
              className="category-card"
              key={c.value}
              href={`/katalog?kategori=${c.value}`}
            >
              <span className={`category-icon category-${c.value}`}>
                <CategoryIcon name={c.icon} size={29} />
              </span>
              <div>
                <h3>{c.name}</h3>
                <p>{c.description || "Temukan pilihan perangkat"}</p>
              </div>
              <ArrowUpRight size={16} />
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
