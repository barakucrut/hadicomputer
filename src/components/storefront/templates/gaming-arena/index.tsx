import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Clock,
  Cpu,
  Flame,
  Gauge,
  MapPin,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { Container, CategoryIcon } from "@/components/ui";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { TestimonialAvatar, TestimonialStars, testimonialMeta } from "@/components/testimonials-section";
import { parseGoogleMaps } from "@/components/location-panel";
import { rupiah, priceLabel } from "@/lib/catalog";
import type { Product } from "@/lib/types";
import type { StorefrontTemplateProps } from "../../types";
import s from "./gaming-arena.module.css";

/** Spec keys shown first on cards, in priority order. */
const SPEC_PRIORITY: Array<{ label: string; match: RegExp }> = [
  { label: "CPU", match: /processor|prosesor|cpu|chipset/i },
  { label: "GPU", match: /vga|gpu|grafis|graphic/i },
  { label: "RAM", match: /ram|memori|memory/i },
  { label: "Storage", match: /storage|ssd|hdd|penyimpanan/i },
  { label: "Layar", match: /layar|display|screen|monitor/i },
];

function keySpecs(product: Product, limit: number) {
  const picked: Array<{ label: string; value: string }> = [];
  const used = new Set<number>();
  for (const rule of SPEC_PRIORITY) {
    const idx = product.specs.findIndex((spec, i) => !used.has(i) && rule.match.test(spec.name));
    if (idx >= 0) {
      used.add(idx);
      picked.push({ label: rule.label, value: product.specs[idx].value });
    }
    if (picked.length >= limit) return picked;
  }
  product.specs.forEach((spec, i) => {
    if (picked.length < limit && !used.has(i)) {
      picked.push({ label: spec.name, value: spec.value });
    }
  });
  return picked;
}

function rigTier(price: number | null) {
  if (price === null) return "Custom Build";
  if (price < 10_000_000) return "Entry Tier";
  if (price < 20_000_000) return "Mid Tier";
  return "High-End Tier";
}

function hasDiscount(p: Product) {
  return !!(p.originalPrice && p.price && p.originalPrice > p.price);
}

export function GamingArenaHome({
  tenant,
  products,
  banners,
  categories,
  needs,
  services,
  testimonials,
}: StorefrontTemplateProps) {
  const storeSettings = tenant.settings;
  const config = storeSettings.homepageConfig || {};
  const sections = config.sections || {};
  const storeName = storeSettings.name || tenant.name || "Toko Pilihan";
  const mapData = parseGoogleMaps(storeSettings.mapsUrl, storeSettings.address);

  const rigs = products.filter((p) => p.category === "pc").slice(0, 4);
  const featured = products
    .filter((p) => p.labels.includes("Pilihan Toko") || p.labels.includes("Pilihan Hadi"))
    .slice(0, 8);
  const promoProducts = products.filter((p) => p.labels.includes("Promo") || hasDiscount(p)).slice(0, 4);
  const latest = products.filter((p) => p.labels.includes("Terbaru")).slice(0, 4);

  const heroProduct = rigs[0] || featured[0] || products[0];
  const primaryBanner = banners[0];
  const inStock = products.filter((p) => p.availability === "tersedia").length;

  return (
    <div className={s.theme}>
      {/* 1. HERO */}
      {sections.heroSlider !== false && (
        <section className={s.hero}>
          <div className={s.heroGrid} aria-hidden="true" />
          <div className={s.heroGlow} aria-hidden="true" />
          <Container>
            <div className={s.heroLayout}>
              <div>
                <span className={s.heroBadge}>
                  <span className={s.liveDot} />
                  {storeName} &middot; Performance Showroom
                </span>
                <h1 className={s.heroTitle}>
                  Rakit. Main.
                  <br />
                  <span className={s.heroAccent}>Tanpa Kompromi.</span>
                </h1>
                <p className={s.heroText}>
                  {primaryBanner?.description ||
                    storeSettings.tagline ||
                    "PC rakitan siap tempur, laptop gaming, dan komponen pilihan. Konsultasikan spesifikasi impianmu langsung dengan tim kami."}
                </p>
                <div className={s.heroActions}>
                  <Link href="/katalog?kategori=pc" className={s.btnPrimary}>
                    <Cpu size={16} />
                    <span>Lihat Rakitan PC</span>
                  </Link>
                  <WhatsAppButton
                    label={config.waConsultLabel || "Konsultasi Spek"}
                    phone={storeSettings.whatsapp}
                    message={`Halo ${storeName}, saya ingin konsultasi spesifikasi PC/laptop gaming.`}
                    className={s.waBtn}
                    trackingData={{ inquiryType: "GENERAL" }}
                  />
                </div>
                <div className={s.heroStats}>
                  <div>
                    <span className={s.statValue}>{products.length}+</span>
                    <span className={s.statLabel}>Unit Katalog</span>
                  </div>
                  <div>
                    <span className={s.statValue}>{inStock}</span>
                    <span className={s.statLabel}>Ready Stock</span>
                  </div>
                  <div>
                    <span className={s.statValue}>{categories.length}</span>
                    <span className={s.statLabel}>Kategori</span>
                  </div>
                </div>
              </div>

              {heroProduct ? (
                <Link href={`/produk/${heroProduct.slug}`} className={s.heroVisual}>
                  <div className={s.heroStage}>
                    <span className={s.rigTier}>{rigTier(heroProduct.price)}</span>
                    <img src={heroProduct.images?.[0] || "/images/banners/promo-bundle.png"} alt={heroProduct.name} />
                  </div>
                  <div className={s.heroMeta}>
                    <div style={{ minWidth: 0 }}>
                      <span className={s.priceLabel}>{heroProduct.brand}</span>
                      <p className={s.heroMetaName}>{heroProduct.name}</p>
                    </div>
                    <span className={`${s.heroMetaPrice} ${heroProduct.price === null ? s.ask : ""}`}>
                      {priceLabel(heroProduct.price)}
                    </span>
                  </div>
                </Link>
              ) : primaryBanner ? (
                <Link href={primaryBanner.href || "/katalog"} className={s.heroVisual}>
                  <div className={`${s.heroStage} ${s.heroStageCover}`}>
                    <img src={primaryBanner.image} alt={primaryBanner.title} />
                  </div>
                </Link>
              ) : null}
            </div>
          </Container>
        </section>
      )}

      {/* 2. VALUE STRIP */}
      {sections.valueStrip !== false && (
        <section style={{ paddingBottom: 56 }}>
          <Container>
            <div className={s.valueGrid}>
              {[
                { icon: ShieldCheck, title: "Garansi Resmi", text: "Unit original dengan garansi distributor." },
                { icon: Wrench, title: "Rakit & Tes Gratis", text: "Dirakit rapi, diuji stres sebelum diserahkan." },
                { icon: Gauge, title: "Spek Tepat Budget", text: "Rekomendasi part paling efisien untuk game-mu." },
                { icon: Flame, title: "Upgrade Kapan Saja", text: "Konsultasi upgrade & tukar tambah berkelanjutan." },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className={s.valueItem}>
                  <span className={s.valueIcon}>
                    <Icon size={20} />
                  </span>
                  <div>
                    <p className={s.valueTitle}>{title}</p>
                    <p className={s.valueText}>{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* 3. CATEGORIES */}
      {sections.categories !== false && categories.length > 0 && (
        <section className={s.section}>
          <Container>
            <div className={s.sectionHead}>
              <div>
                <span className={s.eyebrow}>Pilih Arena</span>
                <h2 className={s.title}>Kategori Perangkat</h2>
              </div>
              <Link href="/katalog" className={s.moreLink}>
                Semua Produk <ArrowRight size={14} />
              </Link>
            </div>
            <div className={s.catGrid}>
              {categories.map((cat) => (
                <Link key={cat.value} href={`/katalog?kategori=${cat.value}`} className={s.catTile}>
                  <span className={s.catIcon}>
                    <CategoryIcon name={cat.icon || cat.value} size={28} />
                  </span>
                  <ArrowUpRight size={16} className={s.catArrow} />
                  <span className={s.catName}>{cat.name}</span>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* 4. RIG SHOWCASE */}
      {sections.pcGaming !== false && rigs.length > 0 && (
        <section className={`${s.section} ${s.sectionAlt}`}>
          <Container>
            <div className={s.sectionHead}>
              <div>
                <span className={s.eyebrow}>Rig Siap Tempur</span>
                <h2 className={s.title}>Rakitan PC Gaming</h2>
                <p className={s.subtitle}>
                  Konfigurasi teruji dari {storeName}. Kirim racikan ke WhatsApp untuk minta penyesuaian part.
                </p>
              </div>
              <Link href="/katalog?kategori=pc" className={s.moreLink}>
                Semua Rakitan <ArrowRight size={14} />
              </Link>
            </div>
            <div className={s.rigList}>
              {rigs.map((rig) => (
                <RigCard key={rig.id} rig={rig} storeName={storeName} phone={storeSettings.whatsapp} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* 5. PROMO */}
      {sections.promoWeek !== false && promoProducts.length > 0 && (
        <section className={s.section}>
          <Container>
            <div className={s.promoBand}>
              <div>
                <span className={s.eyebrow}>Limited Drop</span>
                <h2 className={s.promoTitle}>Promo Pekan Ini</h2>
                <p className={s.promoText}>Harga spesial selama stok tersedia. Amankan unitmu sebelum habis.</p>
              </div>
              <Link href="/katalog?koleksi=Promo" className={s.btnPrimary}>
                Semua Promo <ArrowRight size={15} />
              </Link>
            </div>
            <div className={s.productGrid}>
              {promoProducts.map((p) => (
                <ArenaProductCard key={p.id} product={p} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* 6. FEATURED */}
      {sections.featured !== false && featured.length > 0 && (
        <section className={s.section}>
          <Container>
            <div className={s.sectionHead}>
              <div>
                <span className={s.eyebrow}>{config.featuredEyebrow || "Pilihan Toko"}</span>
                <h2 className={s.title}>{config.featuredTitle || `Pilihan ${storeName}`}</h2>
                {config.featuredDescription && <p className={s.subtitle}>{config.featuredDescription}</p>}
              </div>
              <Link href="/katalog?koleksi=Pilihan%20Toko" className={s.moreLink}>
                Lihat Semua <ArrowRight size={14} />
              </Link>
            </div>
            <div className={s.productGrid}>
              {featured.map((p) => (
                <ArenaProductCard key={p.id} product={p} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* 7. NEEDS */}
      {sections.needs !== false && needs.length > 0 && (
        <section className={`${s.section} ${s.sectionAlt}`}>
          <Container>
            <div className={s.sectionHead}>
              <div>
                <span className={s.eyebrow}>Pilih Misimu</span>
                <h2 className={s.title}>Belanja Sesuai Kebutuhan</h2>
              </div>
            </div>
            <div className={s.needsGrid}>
              {needs.map((need, i) => (
                <Link key={need.id} href={`/katalog?kebutuhan=${need.slug}`} className={s.needCard}>
                  <span className={s.needIndex}>{String(i + 1).padStart(2, "0")} /</span>
                  <p className={s.needName}>{need.name}</p>
                  {need.description && <p className={s.needText}>{need.description}</p>}
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* 8. LATEST */}
      {sections.latest !== false && latest.length > 0 && (
        <section className={s.section}>
          <Container>
            <div className={s.sectionHead}>
              <div>
                <span className={s.eyebrow}>New Arrival</span>
                <h2 className={s.title}>Baru Masuk</h2>
              </div>
              <Link href="/katalog?koleksi=Terbaru" className={s.moreLink}>
                Lihat Semua <ArrowRight size={14} />
              </Link>
            </div>
            <div className={s.productGrid}>
              {latest.map((p) => (
                <ArenaProductCard key={p.id} product={p} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* 9. SERVICES — PIT STOP */}
      {sections.services !== false && services.length > 0 && (
        <section className={`${s.section} ${s.sectionAlt}`}>
          <Container>
            <div className={s.sectionHead}>
              <div>
                <span className={s.eyebrow}>Pit Stop</span>
                <h2 className={s.title}>Servis & Upgrade</h2>
                <p className={s.subtitle}>Rig bermasalah atau butuh tenaga ekstra? Teknisi kami siap bantu.</p>
              </div>
              <Link href="/layanan" className={s.moreLink}>
                Semua Layanan <ArrowRight size={14} />
              </Link>
            </div>
            <div className={s.serviceGrid}>
              {services.slice(0, 3).map((svc) => (
                <Link key={svc.slug} href={`/layanan/${svc.slug}`} className={s.serviceCard}>
                  <div className={s.serviceImg}>
                    <img src={svc.image || "/images/banners/promo-bundle.png"} alt={svc.name} />
                  </div>
                  <div className={s.serviceBody}>
                    {svc.eyebrow && <span className={s.cardBrand}>{svc.eyebrow}</span>}
                    <p className={s.serviceName}>{svc.name}</p>
                    <p className={s.serviceText}>{svc.summary}</p>
                    <div className={s.serviceFoot}>
                      <span>{svc.price !== null ? `Mulai ${rupiah(svc.price)}` : "Konsultasi"}</span>
                      <span>
                        Detail <ArrowUpRight size={14} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* 9b. TESTIMONI — PLAYER REVIEWS */}
      {sections.testimonials !== false && testimonials.length > 0 && (
        <section className={s.section}>
          <Container>
            <div className={s.sectionHead}>
              <div>
                <span className={s.eyebrow}>Player Reviews</span>
                <h2 className={s.title}>Kata Pelanggan</h2>
                <p className={s.subtitle}>Pengalaman nyata pelanggan {storeName}.</p>
              </div>
              <Link href="/testimoni" className={s.moreLink}>
                Semua Testimoni <ArrowRight size={14} />
              </Link>
            </div>
            <ul className={s.reviewGrid}>
              {testimonials.map((t) => (
                <li key={t.id} className={s.reviewCard}>
                  <div className={s.reviewTop}>
                    {t.rating ? <TestimonialStars value={t.rating} size={14} /> : <span className={s.reviewQuoteMark}>&ldquo;</span>}
                    {t.label && <span className={s.cardBrand}>{t.label}</span>}
                  </div>
                  <p className={s.reviewText}>&ldquo;{t.quote}&rdquo;</p>
                  <div className={s.reviewPerson}>
                    <TestimonialAvatar name={t.name} photoUrl={t.photoUrl} className={s.reviewAvatar} />
                    <div style={{ minWidth: 0 }}>
                      <p className={s.reviewName}>{t.name}</p>
                      {testimonialMeta(t) && <p className={s.reviewMeta}>{testimonialMeta(t)}</p>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {storeSettings.googleReviewUrl && (
              <a href={storeSettings.googleReviewUrl} target="_blank" rel="noopener noreferrer" className={s.moreLink} style={{ marginTop: 24, display: "inline-flex" }}>
                Lihat semua ulasan di Google <ArrowUpRight size={14} />
              </a>
            )}
          </Container>
        </section>
      )}

      {/* 10. STORE LOCATION */}
      {sections.storeLocation !== false && (
        <section className={s.section}>
          <Container>
            <div className={s.storeBox}>
              <div className={s.storeInfo}>
                <div>
                  <span className={s.eyebrow}>{config.storeSectionEyebrow || "Base Camp"}</span>
                  <h2 className={s.title}>{config.storeSectionTitle || `Datang ke ${storeName}`}</h2>
                  {config.storeSectionDescription && <p className={s.subtitle}>{config.storeSectionDescription}</p>}
                </div>
                {storeSettings.address && (
                  <div className={s.storeRow}>
                    <MapPin size={16} />
                    <span>{storeSettings.address}</span>
                  </div>
                )}
                <div className={s.storeRow}>
                  <Clock size={16} />
                  <span>{storeSettings.hours || "Buka setiap hari: 08.00 – 22.00 WIB"}</span>
                </div>
                <div className={s.storeActions}>
                  <WhatsAppButton
                    label={config.waConsultLabel || `Hubungi ${storeName}`}
                    phone={storeSettings.whatsapp}
                    className={s.waBtn}
                    trackingData={{ inquiryType: "GENERAL" }}
                  />
                  <Link href="/lokasi" className={s.btnGhost}>
                    <MapPin size={15} /> Peta Lokasi
                  </Link>
                </div>
              </div>
              <div className={s.storeMap}>
                {mapData ? (
                  <iframe
                    src={mapData.embedUrl}
                    title={`Lokasi ${storeName}`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                ) : (
                  <div className={s.storeMapEmpty}>
                    <MapPin size={28} />
                    <span>Peta lokasi belum diatur</span>
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

function RigCard({ rig, storeName, phone }: { rig: Product; storeName: string; phone: string | null }) {
  const specs = keySpecs(rig, 4);
  const specText = specs.map((sp) => `${sp.label}: ${sp.value}`).join(", ");
  const message = `Halo ${storeName}, saya tertarik dengan rakitan *${rig.name}* (${priceLabel(rig.price)}).${
    specText ? ` Spek: ${specText}.` : ""
  } Apakah masih tersedia dan bisa disesuaikan? {origin}/produk/${rig.slug}`;

  return (
    <article className={s.rigCard}>
      <Link href={`/produk/${rig.slug}`} className={s.rigStage}>
        <span className={s.rigTier}>{rigTier(rig.price)}</span>
        <img src={rig.images?.[0] || "/images/banners/promo-bundle.png"} alt={rig.name} />
      </Link>
      <div className={s.rigBody}>
        <span className={s.cardBrand}>{rig.brand}</span>
        <h3 className={s.rigName}>
          <Link href={`/produk/${rig.slug}`}>{rig.name}</Link>
        </h3>
        {rig.summary && <p className={s.rigSummary}>{rig.summary}</p>}
        {specs.length > 0 && (
          <dl className={s.specTable}>
            {specs.map((sp) => (
              <div key={sp.label} className={s.specRow}>
                <dt>{sp.label}</dt>
                <dd title={sp.value}>{sp.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
      <div className={s.rigBuy}>
        <div>
          <span className={s.priceLabel}>Harga Rakitan</span>
          <span className={`${s.rigPrice} ${rig.price === null ? s.ask : ""}`}>{priceLabel(rig.price)}</span>
          {hasDiscount(rig) && <span className={s.strike}>{rupiah(rig.originalPrice!)}</span>}
        </div>
        <div className={s.rigActions}>
          <WhatsAppButton
            label="Kirim Racikan"
            phone={phone}
            message={message}
            className={s.waBtnSm}
            trackingData={{
              inquiryType: "PRODUCT",
              productId: rig.id,
              priceAtInquiry: rig.price ?? undefined,
            }}
          />
          <Link href={`/produk/${rig.slug}`} className={s.rigDetail}>
            Detail Spek <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}

function ArenaProductCard({ product }: { product: Product }) {
  const discount = hasDiscount(product)
    ? Math.round(((product.originalPrice! - product.price!) / product.originalPrice!) * 100)
    : 0;
  const chips = keySpecs(product, 3);
  const stockClass =
    product.availability === "preorder" ? s.stockPre : product.availability === "habis" ? s.stockOut : "";
  const stockLabel =
    product.availability === "preorder" ? "Pre-order" : product.availability === "habis" ? "Habis" : "Ready";

  return (
    <Link href={`/produk/${product.slug}`} className={s.card}>
      <div className={s.cardStage}>
        <div className={s.cardBadges}>
          {product.condition === "bekas" ? (
            <span className={`${s.tag} ${s.tagUsed}`}>Second</span>
          ) : (
            <span className={s.tag}>Baru</span>
          )}
          {discount > 0 && <span className={`${s.tag} ${s.tagAccent}`}>-{discount}%</span>}
        </div>
        <img src={product.images?.[0] || "/images/banners/promo-bundle.png"} alt={product.name} />
      </div>
      <div className={s.cardBody}>
        <span className={s.cardBrand}>{product.brand}</span>
        <h3 className={s.cardName}>{product.name}</h3>
        {chips.length > 0 && (
          <div className={s.chips}>
            {chips.map((c) => (
              <span key={c.label} className={s.chip} title={`${c.label}: ${c.value}`}>
                {c.value}
              </span>
            ))}
          </div>
        )}
        <div className={s.cardFoot}>
          <div>
            <div className={`${s.cardPrice} ${product.price === null ? s.ask : ""}`}>{priceLabel(product.price)}</div>
            {discount > 0 && <span className={s.strike}>{rupiah(product.originalPrice!)}</span>}
          </div>
          <span className={s.stock}>
            <span className={`${s.stockDot} ${stockClass}`} />
            {stockLabel}
            {product.stockLabel ? ` · ${product.stockLabel}` : ""}
          </span>
        </div>
      </div>
    </Link>
  );
}
