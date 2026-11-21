import Link from "next/link";
import { ArrowUpRight, BadgeCheck, MapPin, MessageCircle, PackageCheck, ShieldCheck, Store } from "lucide-react";
import { Container } from "@/components/ui";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { parseGoogleMaps } from "@/components/location-panel";
import { rupiah } from "@/lib/catalog";
import type { StorefrontTemplateProps } from "../../types";
import { PriceStack, SectionHead } from "./card";
import { CountUp, NeedsShowcase, PrecisionReveal, ProductShowcase } from "./interactive";
import { PrecisionHero } from "./hero";
import { CategoryIcon } from "./category-icon";
import {
  DISPLAY,
  MONO,
  buildCategoryIndex,
  buildHeroSlides,
  buildPriceBoard,
  buildSideTiles,
  discountOf,
  isGenericBrand,
  prettyCategoryName,
  rankProducts,
  shortRupiah,
} from "./model";

/**
 * Template "Precision" — clean, spec-sheet style: pencarian di depan, hero bento,
 * indeks kategori, papan harga, dinding merek, kebutuhan, portofolio servis & kunjungan.
 * Section mengikuti saklar di Pengaturan → Beranda & Section Builder.
 */
export function PrecisionHome({
  tenant,
  products,
  banners,
  categories,
  needs,
  services,
  brands = [],
  serviceCases = [],
  profile = { foundedYear: null, quickSearches: [] },
}: StorefrontTemplateProps) {
  const store = tenant.settings;
  const config = store.homepageConfig || {};
  const sections = config.sections || {};
  const storeName = store.name || tenant.name || "Toko";
  const phone = store.whatsapp || null;

  const categoryName = (slug: string) => categories.find((c) => c.value === slug)?.name || slug;
  const index = buildCategoryIndex(products, categories);
  const slides = buildHeroSlides(banners, products, categoryName);
  const tiles = buildSideTiles(banners, products, index, new Set(slides.map((s) => s.id)));

  const featured = (() => {
    const picks = products.filter((p) => p.labels.includes("Pilihan Toko"));
    return (picks.length >= 4 ? picks : rankProducts(products)).slice(0, 8);
  })();
  const board = buildPriceBoard(products, 10);
  const promoCount = products.filter((p) => discountOf(p)).length;
  const brandWall = brands.filter((b) => b.productCount > 0 && !isGenericBrand(b.name)).slice(0, 24);
  const mapData = parseGoogleMaps(store.mapsUrl, store.address);

  // Penomoran section dinamis (01, 02, ...) mengikuti section yang benar-benar tampil
  let n = 0;
  const next = () => String(++n).padStart(2, "0");

  // Strip kepercayaan: hanya klaim yang didukung data (tanpa angka tempelan)
  const brandCount = brands.filter((b) => b.productCount > 0 && !isGenericBrand(b.name)).length;
  const years = profile.foundedYear ? new Date().getFullYear() - profile.foundedYear : 0;
  const trust = [
    products.length > 0 && {
      icon: PackageCheck,
      value: `${products.length}${products.length >= 50 ? "+" : ""}`,
      title: "produk siap dipilih",
      text: "Harga & spesifikasi jelas",
      href: "/katalog",
    },
    brandCount > 0 && { icon: BadgeCheck, value: String(brandCount), title: "merek resmi", text: "Produk original bergaransi", href: "#merek" },
    years > 0
      ? { icon: Store, value: `${years} tahun`, title: `melayani sejak ${profile.foundedYear}`, text: "Toko fisik, bisa cek unit", href: "/lokasi" }
      : { icon: ShieldCheck, value: "Cek unit", title: "langsung di toko", text: "Lihat & coba sebelum beli", href: "/lokasi" },
    { icon: MessageCircle, value: "Konsultasi", title: "gratis", text: "Dibantu pilih via WhatsApp", href: "/kontak" },
  ].filter(Boolean) as { icon: typeof PackageCheck; value: string; title: string; text: string; href: string }[];

  const campaigns = [
    promoCount > 0 && {
      eyebrow: "PROMO MINGGU INI",
      title: `${promoCount} produk sedang hemat`,
      text: "Harga coret asli — cek selisihnya di setiap produk.",
      href: "/katalog?koleksi=Promo",
      dark: true,
    },
    index[1] && {
      eyebrow: prettyCategoryName(index[1].name).toUpperCase(),
      title: `${prettyCategoryName(index[1].name)} pilihan`,
      text: `${index[1].count} unit siap dipilih${index[1].minPrice ? `, mulai ${shortRupiah(index[1].minPrice)}` : ""}.`,
      href: `/katalog?kategori=${index[1].slug}`,
      dark: false,
    },
    services[0] && {
      eyebrow: "LAYANAN",
      title: services[0].name,
      text: services[0].summary,
      href: `/layanan/${services[0].slug}`,
      dark: false,
    },
  ].filter(Boolean) as { eyebrow: string; title: string; text: string; href: string; dark: boolean }[];

  return (
    <div className="bg-white pb-16 text-[#0b0d0c] md:pb-0">
      <PrecisionReveal />
      <Container>
        {/* HERO: bento banner (pencarian ada di header) */}
        {sections.heroSlider !== false && (
          <div className="pt-5 sm:pt-6">
            <PrecisionHero slides={slides} tiles={tiles} phone={phone} storeName={storeName} />
          </div>
        )}

        {/* STRIP KEPERCAYAAN */}
        {sections.valueStrip !== false && trust.length > 0 && (
          <div
            data-reveal
            className={`mt-4 grid grid-cols-2 overflow-hidden rounded-xl border border-[#e6e6e3] bg-white ${trust.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}
          >
            {trust.map((t, i) => (
              <Link
                key={t.title}
                href={t.href}
                className={`pc-topline group flex items-start gap-3 border-[#e6e6e3] p-4 no-underline transition-colors duration-300 hover:bg-[#fafaf8] sm:p-5 ${
                  i % 2 === 0 ? "border-r" : ""
                } ${i < trust.length - 2 ? "border-b lg:border-b-0" : ""} ${i < trust.length - 1 ? "lg:border-r" : "lg:border-r-0"}`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--red)_10%,white)] text-brand transition-[background-color,color,transform] duration-300 group-hover:-rotate-6 group-hover:bg-brand group-hover:text-brand-ink">
                  <t.icon size={19} strokeWidth={1.8} />
                </span>
                <span className="min-w-0">
                  <strong className={`${DISPLAY} block text-[18px] font-extrabold leading-tight text-[#0b0d0c] sm:text-[20px]`}>
                    <CountUp value={t.value} />
                    <span className="mt-0.5 block text-[13px] font-semibold tracking-normal text-[#3d413e] sm:ml-1.5 sm:mt-0 sm:inline sm:text-[14px]">{t.title}</span>
                  </strong>
                  <span className="mt-1 flex items-center gap-1 text-[12px] text-[#6b6f6c]">
                    {t.text}
                    <ArrowUpRight size={12} className="pc-arrow opacity-0 transition-opacity group-hover:opacity-100" />
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* KATEGORI BERIKON */}
        {sections.categories !== false && index.length > 0 && (
          <section data-reveal className="mt-12">
            <SectionHead
              index={next()}
              eyebrow="KATEGORI"
              title="Lagi cari apa hari ini?"
              action={
                <Link href="/katalog" className="group inline-flex items-center gap-1 text-[13px] font-semibold text-[#0b0d0c] no-underline hover:text-brand">
                  Lihat semua produk <ArrowUpRight size={14} className="pc-arrow" />
                </Link>
              }
            />
            <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-6">
              {index.map((c) => (
                <Link
                  key={c.slug}
                  href={`/katalog?kategori=${c.slug}`}
                  className="pc-lift group flex min-w-[150px] snap-start flex-col rounded-xl border border-[#e6e6e3] bg-white p-4 no-underline sm:min-w-0"
                >
                  <span className="flex items-start justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f1f1ef] text-[#0b0d0c] transition-[background-color,color,transform] duration-300 group-hover:scale-105 group-hover:bg-brand group-hover:text-brand-ink">
                      <CategoryIcon name={c.name} size={22} />
                    </span>
                    <ArrowUpRight size={15} className="pc-arrow text-[#c4c6c2] group-hover:text-brand" />
                  </span>
                  <span className={`${DISPLAY} mt-4 line-clamp-2 text-[15.5px] font-bold leading-snug text-[#0b0d0c]`}>{prettyCategoryName(c.name)}</span>
                  <span className={`${MONO} mt-1 text-[11.5px] text-[#6b6f6c]`}>{c.count} produk</span>
                  {c.minPrice && <span className={`${MONO} mt-auto pt-2 text-[12px] font-semibold text-[#0b0d0c]`}>mulai {shortRupiah(c.minPrice)}</span>}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* STRIP KAMPANYE */}
        {sections.promoWeek !== false && campaigns.length > 0 && (
          <section data-reveal className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
            {campaigns.map((c) => (
              <Link
                key={c.title}
                href={c.href}
                className={`pc-shine min-h-[128px] rounded border p-5 no-underline transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_-22px_rgba(11,13,12,0.45)] ${c.dark ? "border-[#0b0d0c] bg-[#0b0d0c] text-white" : "border-[#e6e6e3] bg-white text-[#0b0d0c]"}`}
              >
                <span className={`${MONO} text-[11px] uppercase tracking-[0.12em] text-brand`}>{c.eyebrow}</span>
                <h3 className={`${DISPLAY} mb-1.5 mt-2.5 text-[20px] font-bold`}>{c.title}</h3>
                <p className={`m-0 line-clamp-2 text-[13px] ${c.dark ? "text-[#b9bbb7]" : "text-[#6b6f6c]"}`}>{c.text}</p>
              </Link>
            ))}
          </section>
        )}

        {/* PRODUK PILIHAN */}
        {sections.featured !== false && featured.length > 0 && (
          <section data-reveal className="mt-12 border-t border-[#e6e6e3] pt-12">
            <ProductShowcase
              index={next()}
              eyebrow={config.featuredEyebrow || "PRODUK PILIHAN"}
              title={config.featuredTitle || "Spesifikasi jelas, harga jelas"}
              products={featured}
            />
          </section>
        )}

        {/* PAPAN HARGA */}
        {sections.latest !== false && board.length > 0 && (
          <section data-reveal className="mt-12 border-t border-[#e6e6e3] pt-12">
            <SectionHead
              index={next()}
              eyebrow="PAPAN HARGA"
              title="Harga minggu ini"
              action={
                <Link href="/katalog" className="border-b border-[#0b0d0c] pb-0.5 text-[13px] font-semibold text-[#0b0d0c] no-underline">
                  Lihat katalog lengkap
                </Link>
              }
            />
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px] md:text-[14px]">
                <thead>
                  <tr className={`${MONO} border-b border-[#0b0d0c] text-left text-[11px] uppercase tracking-[0.1em] text-[#6b6f6c]`}>
                    <th className="hidden py-3 pr-3 font-medium md:table-cell">Kode</th>
                    <th className="py-3 pr-3 font-medium">Produk</th>
                    <th className="hidden py-3 pr-3 font-medium md:table-cell">Kategori</th>
                    <th className="py-3 pr-3 text-right font-medium">Harga</th>
                    <th className="hidden py-3 font-medium sm:table-cell">Hemat</th>
                  </tr>
                </thead>
                <tbody>
                  {board.map((p) => {
                    const d = discountOf(p);
                    return (
                      <tr key={p.id} className="border-b border-[#e6e6e3]">
                        <td className={`${MONO} hidden py-3.5 pr-3 text-[#6b6f6c] md:table-cell`}>{p.code}</td>
                        <td className="py-3.5 pr-3">
                          <Link href={`/produk/${p.slug}`} className="line-clamp-1 text-[#0b0d0c] no-underline hover:underline">
                            {p.name}
                          </Link>
                        </td>
                        <td className="hidden py-3.5 pr-3 text-[#6b6f6c] md:table-cell">{prettyCategoryName(categoryName(p.category))}</td>
                        <td className="py-3.5 pr-3 text-right">
                          {d && <span className={`${MONO} block text-[11px] text-[#9a9d99] line-through`}>{rupiah(d.originalPrice)}</span>}
                          <span className={`${MONO} font-semibold`}>{p.price ? rupiah(p.price) : "Hubungi"}</span>
                        </td>
                        <td className={`${MONO} hidden py-3.5 text-[13px] font-semibold text-[#15803d] sm:table-cell`}>{d ? `−${d.percent}%` : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* DINDING MEREK */}
        {brandWall.length > 0 && (
          <section id="merek" data-reveal className="scroll-mt-32 mt-12 border-t border-[#e6e6e3] pt-12">
            <SectionHead index={next()} eyebrow="MEREK" title="Merek resmi yang kami jual" />
            <div className="grid grid-cols-3 border-l border-t border-[#e6e6e3] sm:grid-cols-4 lg:grid-cols-8">
              {brandWall.map((b) => (
                <Link
                  key={b.id}
                  href={`/katalog?merek=${encodeURIComponent(b.name)}`}
                  title={`${b.name} · ${b.productCount} produk`}
                  className="group flex h-[64px] items-center justify-center border-b border-r border-[#e6e6e3] px-2 no-underline transition-colors hover:bg-[#fafaf8] sm:h-[74px]"
                >
                  {b.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.logoUrl} alt={b.name} loading="lazy" className="max-h-9 max-w-[80%] object-contain opacity-75 grayscale transition-[filter,opacity,transform] duration-300 group-hover:scale-110 group-hover:opacity-100 group-hover:grayscale-0" />
                  ) : (
                    <span className={`${DISPLAY} truncate text-[13px] font-bold uppercase tracking-[0.02em] text-[#3d413e] transition-[color,transform] duration-300 group-hover:scale-110 group-hover:text-brand sm:text-[15px]`}>{b.name}</span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* SESUAI KEBUTUHAN */}
        {sections.needs !== false && needs.length > 0 && (
          <section data-reveal className="mt-12 border-t border-[#e6e6e3] pt-12">
            <NeedsShowcase index={next()} needs={needs.map((x) => ({ slug: x.slug, name: x.name }))} products={products} />
          </section>
        )}

        {/* PORTOFOLIO SERVIS */}
        {sections.services !== false && serviceCases.length > 0 && (
          <section data-reveal className="mt-12 border-t border-[#e6e6e3] pt-12">
            <SectionHead
              index={next()}
              eyebrow="PORTOFOLIO SERVIS"
              title="Hasil kerja bengkel kami"
              action={
                <Link href="/layanan" className="border-b border-[#0b0d0c] pb-0.5 text-[13px] font-semibold text-[#0b0d0c] no-underline">
                  Lihat layanan
                </Link>
              }
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {serviceCases.slice(0, 6).map((c) => (
                <article key={c.id} className="pc-lift group flex flex-col overflow-hidden rounded-md border border-[#e6e6e3] bg-white">
                  <div className="relative bg-[#f6f6f4] p-4">
                    <div className="flex aspect-[16/10] items-center justify-center overflow-hidden rounded bg-white">
                      {c.images[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.images[0]} alt={c.title} loading="lazy" className="pc-zoom max-h-full max-w-full object-contain" />
                      )}
                    </div>
                    {c.durationText && (
                      <span className={`${MONO} absolute left-6 top-6 rounded-[3px] bg-[#0b0d0c] px-2 py-1 text-[10.5px] text-[#f6e3a1]`}>
                        SELESAI {c.durationText.toUpperCase()}
                      </span>
                    )}
                    {c.images.length > 1 && (
                      <span className={`${MONO} absolute bottom-6 right-6 rounded-[3px] border border-[#e6e6e3] bg-white px-2 py-1 text-[10px]`}>
                        {c.images.length} FOTO
                      </span>
                    )}
                  </div>
                  <div className="border-t border-[#e6e6e3] px-5 pb-5 pt-4">
                    <span className={`${MONO} text-[11px] uppercase tracking-[0.06em] text-[#6b6f6c]`}>
                      {[c.serviceName, c.completedAt && new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(c.completedAt))]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                    <h3 className={`${DISPLAY} mb-1.5 mt-2 text-[17px] font-bold leading-snug`}>{c.title}</h3>
                    <p className="m-0 line-clamp-3 text-[13px] leading-relaxed text-[#6b6f6c]">{c.summary}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* LAYANAN & KUNJUNGAN */}
        {sections.storeLocation !== false && (
          <section data-reveal className="mt-12 grid grid-cols-1 gap-10 border-t border-[#e6e6e3] pb-14 pt-12 lg:grid-cols-[1fr_1.3fr]">
            <div>
              <SectionHead index={next()} eyebrow="LAYANAN & KUNJUNGAN" title={config.storeSectionTitle || "Datang, konsultasi, bawa pulang"} />
              {services.length > 0 && sections.services !== false && (
                <div className="border-t border-[#0b0d0c]">
                  {services.slice(0, 4).map((s, i) => (
                    <Link
                      key={s.slug}
                      href={`/layanan/${s.slug}`}
                      className="grid grid-cols-[52px_1fr_auto] items-center gap-2 border-b border-[#e6e6e3] py-4 text-[#0b0d0c] no-underline hover:bg-[#fafaf8]"
                    >
                      <b className={`${MONO} text-[13px] text-brand`}>{String(i + 1).padStart(2, "0")}</b>
                      <span className="min-w-0">
                        <span className={`${DISPLAY} block text-[17px] font-bold`}>{s.name}</span>
                        <span className="mt-0.5 block line-clamp-1 text-[13px] text-[#6b6f6c]">{s.summary}</span>
                      </span>
                      <span className="text-[13px] font-semibold text-brand">Detail →</span>
                    </Link>
                  ))}
                </div>
              )}
              <div className="mt-5 space-y-1.5 text-[13.5px] text-[#3d413e]">
                {store.address && (
                  <p className="m-0 flex items-start gap-2">
                    <MapPin size={15} className="mt-0.5 shrink-0 text-brand" /> {store.address}
                  </p>
                )}
                {store.hours && <p className={`${MONO} m-0 text-[12.5px] text-[#6b6f6c]`}>{store.hours}</p>}
              </div>
            </div>
            <div className="relative min-h-[280px] overflow-hidden rounded-md border border-[#e6e6e3] bg-[#f6f6f4]">
              {mapData?.embedUrl ? (
                <iframe
                  src={mapData.embedUrl}
                  title={`Peta lokasi ${storeName}`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0 h-full w-full border-0 grayscale-[30%]"
                />
              ) : (
                <div className="flex h-full min-h-[280px] items-center justify-center text-[13px] text-[#6b6f6c]">
                  <MapPin size={18} className="mr-2 text-brand" /> Lokasi toko
                </div>
              )}
              <div className="absolute bottom-4 left-4 right-4 rounded border border-[#e6e6e3] bg-white p-4 text-[13px] shadow-sm sm:right-auto sm:min-w-[280px]">
                <strong className={`${DISPLAY} mb-1 block text-[16px]`}>{storeName}</strong>
                {store.hours && <span className="block text-[#6b6f6c]">{store.hours}</span>}
                {phone && (
                  <WhatsAppButton
                    phone={phone}
                    label="Chat WhatsApp →"
                    message={`Halo ${storeName}, saya ingin konsultasi.`}
                    className="!mt-2 !border-0 !bg-transparent !p-0 !text-[13px] !font-semibold !text-brand !shadow-none"
                  />
                )}
              </div>
            </div>
          </section>
        )}
      </Container>

      {/* Bar WhatsApp menempel di bawah (mobile) */}
      {phone && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 bg-[#0b0d0c] px-4 py-3 text-[13px] text-white md:hidden">
          <span className="flex min-w-0 items-center gap-2">
            <MessageCircle size={16} className="shrink-0" /> <span className="truncate">Butuh bantuan memilih?</span>
          </span>
          <WhatsAppButton
            phone={phone}
            label="Chat WhatsApp"
            message={`Halo ${storeName}, saya butuh bantuan memilih perangkat.`}
            className="!shrink-0 !rounded !border-0 !bg-brand !px-3.5 !py-2 !text-[12.5px] !font-semibold !text-brand-ink !shadow-none [&_svg]:!text-brand-ink"
          />
        </div>
      )}
    </div>
  );
}

export { PriceStack };
