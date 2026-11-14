import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCheck,
  MessageCircle,
  MapPin,
  GraduationCap,
  BriefcaseBusiness,
  Palette,
  MoveUpRight,
  SlidersHorizontal,
  Wrench,
} from "lucide-react";
import {
  banners as staticBanners,
  categories as staticCategories,
  getProducts,
  services,
} from "@/lib/repository";
import {
  getLiveProducts,
  getLiveBanners,
  getLiveCategories,
  getLiveStoreSettings,
  getLiveNeeds,
} from "@/lib/live-repository";
import { Container, CategoryIcon, SectionHeading } from "@/components/ui";
import { HeroSlider } from "@/components/hero-slider";
import { FeaturedProducts } from "@/components/featured-products";
import { ProductGrid } from "@/components/product-card";
import { ServiceCard } from "@/components/service-card";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { parseGoogleMaps } from "@/components/location-panel";

const mobilePcSlugs = new Set([
  "msi-mag-infinite-s3-14th",
  "msi-cubi-n-adl",
  "msi-pro-dp21-14m",
  "asus-rog-g22ch",
]);

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const [products, liveBanners, liveCategories, storeSettings, liveNeeds] = await Promise.all([
    getLiveProducts(),
    getLiveBanners(),
    getLiveCategories(),
    getLiveStoreSettings(),
    getLiveNeeds(),
  ]);

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
  // Compact, non-repeating selections for the mobile overview; full collections
  // remain available through their links and category tabs.
  const featured = products.filter((p) => p.labels.includes("Pilihan Hadi"));
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
  return (
    <div className="home-page">
      <Container className="home-hero-wrap">
        <HeroSlider slides={liveBanners} />
        <div className="value-strip">
          {[
            {
              Icon: SlidersHorizontal,
              title: "Pilihan sesuai kebutuhan",
              text: "Baru maupun bekas pilihan",
            },
            {
              Icon: MessageCircle,
              title: "Ngobrol langsung dengan Hadi",
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
      </Container>
      <HomeCategories className="home-categories-mobile" categoriesList={liveCategories} />
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
      <HomeCategories className="home-categories-desktop" categoriesList={liveCategories} />
      <section className="section section-soft">
        <Container>
          <SectionHeading
            eyebrow="DIPILIH UNTUKMU"
            title="Pilihan Hadi, untuk harimu."
            description="Kenali perangkat yang bisa jadi teman aktivitasmu berikutnya."
            href="/katalog?koleksi=Pilihan%20Hadi"
          />
          <FeaturedProducts
            products={featured}
            mobileProducts={mobileFeatured.length ? mobileFeatured : undefined}
          />
        </Container>
      </section>
      <section className="section needs-section">
        <Container>
          <SectionHeading
            title="Beda kebutuhan, beda pilihan."
            description="Temukan perangkat yang sejalan dengan keseharianmu."
            href="/katalog"
            linkText="Lihat semua kebutuhan"
          />
          <div className="needs-grid">
            {liveNeeds.map((needItem, idx) => {
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
      {latest.length > 0 && (
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
      {desktops.length > 0 && (
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
      {bestsellers.length > 0 && (
        <section className="section bestsellers-section">
          <Container>
            <SectionHeading
              eyebrow="KURASI OWNER"
              title="Favorit di pilihan Hadi."
              description="Koleksi produk paling diminati yang siap menemani produktivitas harianmu."
              href="/katalog?koleksi=Terlaris"
            />
            <ProductGrid products={bestsellers} />
          </Container>
        </section>
      )}
      <section className="section services-section">
        <Container>
          <SectionHeading
            eyebrow="ADA HADI YANG BANTU"
            title="Perangkatmu butuh perhatian?"
            description="Dari perawatan rutin sampai membangun setup baru."
            href="/layanan"
            linkText="Semua layanan"
          />
          <div className="services-grid">
            {services.map((service) => (
              <ServiceCard service={service} key={service.slug} />
            ))}
          </div>
        </Container>
      </section>
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
                  title={`Peta Lokasi ${storeSettings.name || "Hadi Computer"}`}
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
                <span>HADI COMPUTER</span>
                <div className="map-road road-one" />
                <div className="map-road road-two" />
              </div>
            )}
            <div className="store-copy">
              <span className="eyebrow">SAMPAI KETEMU DI TOKO</span>
              <h2>
                Lihat langsung.
                <br />
                Ngobrol lebih nyaman.
              </h2>
              <p>
                Kenali pilihan perangkatmu dan diskusikan kebutuhan langsung
                dengan Hadi.
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
                label="Tanya Hadi dulu"
                phone={storeSettings.whatsapp}
              />
              <small>Hubungi langsung via WhatsApp · Respon cepat</small>
            </div>
          </div>
        </Container>
      </section>
      <WhatsAppButton
        label="Tanya Hadi via WhatsApp"
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
