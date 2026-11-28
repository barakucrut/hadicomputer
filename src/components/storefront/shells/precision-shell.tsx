"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ChevronDown, Clock, LayoutGrid, Menu, Phone, Search, X } from "lucide-react";
import type { StoreSettings } from "@/lib/types";
import type { StorefrontMenuData } from "@/lib/live-repository";
import { rupiah } from "@/lib/catalog";
import { getStorefrontCopy } from "@/lib/i18n/storefront";
import { useStoreSettings } from "@/components/store-context";
import { CategoryIcon } from "@/components/storefront/templates/precision/category-icon";
import { prettyCategoryName } from "@/components/storefront/templates/precision/model";
import { PrecisionSearchBox } from "./precision-search";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { SocialLinks } from "@/components/social-links";
import { SHELL_NAV, isNavActive, useShell } from "./use-shell";

type ShellProps = {
  store: StoreSettings;
  categories?: Array<{ name: string; value: string }>;
  /** Data mega menu & pencarian (diisi layout untuk template Precision) */
  menu?: StorefrontMenuData;
};

const MONO = "[font-family:var(--pc-mono)] tabular-nums";
const DISPLAY = "[font-family:var(--pc-display)] tracking-[-0.02em]";

function formatPhone(raw: string | null) {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 9) return null; // nomor belum lengkap: jangan tampilkan
  const local = digits.startsWith("62") ? `0${digits.slice(2)}` : digits;
  return local.replace(/^(\d{4})(\d{4})(\d+)$/, "$1-$2-$3");
}

function PrecisionLogo({ store }: { store: StoreSettings }) {
  const name = store.name || "Toko";
  return (
    <Link href="/" aria-label={`${name} — Beranda`} className="flex shrink-0 items-center no-underline">
      {store.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={store.logoUrl} alt={name} className="h-9 w-auto max-w-[170px] object-contain" />
      ) : (
        <span className={`${DISPLAY} inline-flex items-center gap-2 text-[19px] font-extrabold text-[#0b0d0c]`}>
          <span className="h-2 w-2 rounded-[2px] bg-brand" />
          {name}
        </span>
      )}
    </Link>
  );
}

const NAV_MEGA: Record<string, "katalog" | "layanan"> = { "/katalog": "katalog", "/layanan": "layanan" };

function MegaPrice({ price, originalPrice, dark }: { price: number | null; originalPrice: number | null; dark: boolean }) {
  const store = useStoreSettings();
  const locale = store?.locale ?? "id";
  const currency = store?.currency ?? "IDR";
  const copy = getStorefrontCopy(locale);
  const discount = price && originalPrice && originalPrice > price ? originalPrice - price : 0;
  return (
    <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className={`${MONO} text-[16px] font-semibold ${dark ? "text-white" : "text-[#0b0d0c]"}`}>
        {price ? rupiah(price, currency, locale) : copy.contactShort}
      </span>
      {discount > 0 && (
        <>
          <span className={`${MONO} text-[12px] line-through ${dark ? "text-white/45" : "text-[#9a9d99]"}`}>
            {rupiah(originalPrice!, currency, locale)}
          </span>
          <span className="rounded-full bg-brand px-2 py-0.5 text-[10.5px] font-semibold text-brand-ink">
            {copy.savePrefix} {rupiah(discount, currency, locale)}
          </span>
        </>
      )}
    </div>
  );
}

function KatalogPanel({ menu, close }: { menu: StorefrontMenuData; close: () => void }) {
  const f = menu.featured;
  return (
    <div className="pc-rise-children grid gap-8 py-8 lg:grid-cols-[1.45fr_1fr_1.05fr]">
      <div>
        <span className={`${MONO} mb-3 block text-[10.5px] uppercase tracking-[0.14em] text-[#8b8e8a]`}>Kategori</span>
        <div className="grid grid-cols-2 gap-1">
          {menu.categories.slice(0, 10).map((c) => (
            <Link
              key={c.slug}
              href={`/katalog?kategori=${c.slug}`}
              onClick={close}
              className="group flex items-center gap-3 rounded-xl px-2 py-2 no-underline transition-colors hover:bg-[#f6f6f4]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f1f1ef] text-[#3d413e] transition-colors duration-300 group-hover:bg-brand group-hover:text-brand-ink">
                <CategoryIcon name={c.name} stored={c.icon} size={17} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[13.5px] font-semibold text-[#0b0d0c]">{prettyCategoryName(c.name)}</span>
                <span className={`${MONO} text-[11px] text-[#8b8e8a]`}>{c.count} produk</span>
              </span>
            </Link>
          ))}
        </div>
        <Link href="/katalog" onClick={close} className="mt-4 inline-flex items-center gap-1.5 px-2 text-[13px] font-semibold text-[#0b0d0c] no-underline hover:text-brand">
          Lihat semua produk <ArrowUpRight size={14} className="pc-arrow" />
        </Link>
      </div>
      {menu.brands.length > 0 && (
        <div>
          <span className={`${MONO} mb-3 block text-[10.5px] uppercase tracking-[0.14em] text-[#8b8e8a]`}>Merek populer</span>
          <div className="grid grid-cols-2 gap-x-4">
            {menu.brands.slice(0, 12).map((b) => (
              <Link
                key={b.name}
                href={`/katalog?merek=${encodeURIComponent(b.name)}`}
                onClick={close}
                className="group flex items-center justify-between border-b border-[#f0f0ee] py-2 text-[13px] text-[#3d413e] no-underline hover:text-[#0b0d0c]"
              >
                <span className="truncate font-medium transition-transform duration-300 group-hover:translate-x-1">{b.name}</span>
                <span className={`${MONO} text-[11px] text-[#b9bbb7]`}>{b.count}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
      {f && (
        <Link
          href={f.href}
          onClick={close}
          className={`pc-shine group relative flex min-h-[230px] flex-col justify-between overflow-hidden rounded-2xl p-5 no-underline ${f.studio ? "bg-[#0b0d0c]" : "border border-[#e6e6e3] bg-[#f6f6f4]"}`}
        >
          {f.studio && (
            <div aria-hidden className="pc-glow absolute -right-6 top-2 aspect-square w-[75%] rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--red)_45%,transparent)_0%,transparent_65%)] blur-xl" />
          )}
          <span className={`${MONO} relative text-[10.5px] uppercase tracking-[0.14em] ${f.studio ? "text-[#f6e3a1]" : "text-brand"}`}>Sorotan minggu ini</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={f.image} alt="" className="pc-zoom relative mx-auto my-3 max-h-[120px] max-w-[85%] object-contain drop-shadow-[0_16px_18px_rgba(0,0,0,0.45)]" />
          <div className="relative">
            <span className={`${DISPLAY} block text-[17px] font-bold leading-snug ${f.studio ? "text-white" : "text-[#0b0d0c]"}`}>{f.title}</span>
            <MegaPrice price={f.price} originalPrice={f.originalPrice} dark={f.studio} />
          </div>
        </Link>
      )}
    </div>
  );
}

function LayananPanel({ menu, store, close }: { menu: StorefrontMenuData; store: StoreSettings; close: () => void }) {
  return (
    <div className="pc-rise-children grid gap-8 py-8 lg:grid-cols-[2fr_1fr]">
      <div>
        <span className={`${MONO} mb-3 block text-[10.5px] uppercase tracking-[0.14em] text-[#8b8e8a]`}>Layanan toko</span>
        <div className="grid grid-cols-2 gap-2">
          {menu.services.map((s, i) => (
            <Link
              key={s.slug}
              href={`/layanan/${s.slug}`}
              onClick={close}
              className="group grid grid-cols-[34px_1fr] gap-2 rounded-xl px-3 py-3 no-underline transition-colors hover:bg-[#f6f6f4]"
            >
              <b className={`${MONO} pt-0.5 text-[12px] text-brand`}>{String(i + 1).padStart(2, "0")}</b>
              <span className="min-w-0">
                <span className="flex items-center gap-1 text-[14px] font-semibold text-[#0b0d0c]">
                  {s.name} <ArrowUpRight size={13} className="pc-arrow text-[#b9bbb7]" />
                </span>
                <span className="mt-0.5 block line-clamp-2 text-[12.5px] leading-relaxed text-[#6b6f6c]">{s.summary}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
      <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[#0b0d0c] p-6 text-white">
        <div aria-hidden className="pc-glow absolute -bottom-10 -right-10 aspect-square w-[70%] rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--red)_42%,transparent)_0%,transparent_65%)] blur-xl" />
        <div className="relative">
          <span className={`${MONO} text-[10.5px] uppercase tracking-[0.14em] text-[#f6e3a1]`}>Konsultasi gratis</span>
          <p className={`${DISPLAY} mb-0 mt-2 text-[20px] font-bold leading-snug`}>Bingung pilih perangkat atau perlu servis?</p>
          <p className="mb-0 mt-2 text-[13px] text-[#b9bbb7]">Ceritakan kebutuhanmu, tim kami bantu carikan solusi terbaik.</p>
        </div>
        <WhatsAppButton
          phone={store.whatsapp}
          label="Chat WhatsApp"
          message={`Halo ${store.name || "kak"}, saya ingin konsultasi.`}
          className="relative mt-5 w-fit! rounded-full! border-0! bg-brand! px-4! py-2! text-[13px]! font-semibold! text-brand-ink! shadow-none! [&_svg]:text-brand-ink!"
        />
      </div>
    </div>
  );
}

export function PrecisionHeader({ store, categories = [], menu }: ShellProps) {
  const { path, menuOpen, setMenuOpen, isScrolled, hidden } = useShell();
  const [mega, setMega] = useState<"katalog" | "layanan" | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const openTimer = useRef<number | undefined>(undefined);
  const closeTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    setMega(null);
    setSearchOpen(false);
  }, [path]);

  useEffect(() => {
    if (!mega && !searchOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMega(null);
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mega, searchOpen]);

  useEffect(() => {
    document.body.style.overflow = searchOpen ? "hidden" : document.body.style.overflow;
    return () => {
      if (searchOpen) document.body.style.overflow = "";
    };
  }, [searchOpen]);

  if (hidden) return null;
  const phone = formatPhone(store.whatsapp);
  const data: StorefrontMenuData = menu || {
    categories: categories.map((c) => ({ name: c.name, slug: c.value, icon: "", count: 0 })),
    brands: [],
    services: [],
    featured: null,
    quickSearches: [],
  };
  const searchCategories = data.categories;
  const hasMega = (key: "katalog" | "layanan") => (key === "katalog" ? data.categories.length > 0 : data.services.length > 0);

  // Hover intent: buka setelah jeda singkat, tutup sedikit lebih lambat (tidak berkedip saat kursor lewat)
  const hoverOpen = (key: "katalog" | "layanan" | null) => {
    window.clearTimeout(closeTimer.current);
    window.clearTimeout(openTimer.current);
    openTimer.current = window.setTimeout(() => setMega(key), mega ? 0 : 110);
  };
  const hoverClose = () => {
    window.clearTimeout(openTimer.current);
    closeTimer.current = window.setTimeout(() => setMega(null), 180);
  };
  const close = () => setMega(null);

  return (
    <>
      <a href="#main" className="skip-link">
        Langsung ke konten
      </a>
      <div className={`${MONO} hidden bg-brand-2 text-[11.5px] text-brand-2-ink/75 md:block`}>
        <div className="container flex h-8 items-center justify-between gap-4">
          <span className="flex items-center gap-2 truncate">
            <Clock size={12} className="text-brand-2-accent" />
            {store.hours || "Hubungi kami untuk jam buka"}
          </span>
          {phone && (
            <span className="flex items-center gap-2">
              <Phone size={12} className="text-brand-2-accent" />
              {phone}
            </span>
          )}
        </div>
      </div>

      {mega && (
        <div aria-hidden onClick={close} className="pc-fade fixed inset-0 z-30 hidden bg-[#0b0d0c]/25 backdrop-blur-[3px] lg:block" />
      )}

      <header
        className={`sticky top-0 z-40 border-b bg-white/95 backdrop-blur-md transition-shadow duration-300 ${
          isScrolled || mega ? "border-[#e6e6e3] shadow-[0_8px_30px_-24px_rgba(11,13,12,0.5)]" : "border-[#f0f0ee]"
        }`}
        onMouseLeave={hoverClose}
      >
        <div className="container flex h-[68px] items-center gap-4 lg:gap-8">
          <PrecisionLogo store={store} />
          <div className="hidden min-w-0 max-w-[620px] flex-1 md:block">
            <PrecisionSearchBox categories={searchCategories} popular={data.quickSearches} />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Cari produk"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e6e6e3] bg-white text-[#0b0d0c] md:hidden"
            >
              <Search size={18} />
            </button>
            <WhatsAppButton
              label="Chat WhatsApp"
              phone={store.whatsapp}
              className="hidden! min-h-10! rounded-full! border-0! bg-brand! px-4! py-2! text-[12.5px]! font-semibold! text-brand-ink! shadow-none! [&_svg]:text-brand-ink! transition-[transform,filter]! hover:-translate-y-0.5! hover:brightness-110! lg:inline-flex!"
            />
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
              aria-expanded={menuOpen}
              aria-controls="precision-mobile-nav"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e6e6e3] bg-white text-[#0b0d0c] lg:hidden"
            >
              <Menu size={19} />
            </button>
          </div>
        </div>

        <div className="hidden border-t border-[#f0f0ee] lg:block">
          <nav aria-label="Navigasi utama" className="container flex h-11 items-center gap-1">
            {data.categories.length > 0 && (
              <button
                type="button"
                aria-expanded={mega === "katalog"}
                onMouseEnter={() => hoverOpen("katalog")}
                onClick={() => setMega(mega === "katalog" ? null : "katalog")}
                className="mr-3 flex items-center gap-2 rounded-full border-0 bg-[#f1f1ef] px-3.5 py-1.5 text-[13px] font-semibold text-[#0b0d0c] transition-colors hover:bg-brand hover:text-brand-ink"
              >
                <LayoutGrid size={14} /> Semua Kategori
              </button>
            )}
            {SHELL_NAV.map((n) => {
              const active = isNavActive(path, n.href);
              const key = NAV_MEGA[n.href];
              const withMega = key && hasMega(key);
              return (
                <div key={n.href} className="flex items-center" onMouseEnter={() => (withMega ? hoverOpen(key) : hoverOpen(null))}>
                  <Link
                    href={n.href}
                    aria-current={active ? "page" : undefined}
                    onFocus={() => withMega && setMega(key)}
                    className={`pc-nav-link flex items-center gap-1 rounded px-3 py-2 text-[13.5px] no-underline transition-colors ${
                      active || (withMega && mega === key) ? "font-semibold text-[#0b0d0c]" : "text-[#3d413e] hover:text-[#0b0d0c]"
                    }`}
                  >
                    {n.label}
                    {withMega && <ChevronDown size={13} className={`transition-transform duration-300 ${mega === key ? "rotate-180" : ""}`} />}
                  </Link>
                </div>
              );
            })}
          </nav>
        </div>

        {mega && hasMega(mega) && (
          <div className="pc-mega absolute inset-x-0 top-full hidden border-b border-[#e6e6e3] bg-white lg:block" onMouseEnter={() => hoverOpen(mega)}>
            <div className="container">
              {mega === "katalog" ? <KatalogPanel menu={data} close={close} /> : <LayananPanel menu={data} store={store} close={close} />}
            </div>
          </div>
        )}
      </header>

      {searchOpen && (
        <div role="dialog" aria-modal="true" aria-label="Cari produk" className="pc-fade fixed inset-0 z-50 overflow-y-auto bg-white md:hidden">
          <div className="container flex items-start gap-2 pb-2 pt-3">
            <div className="flex-1">
              <PrecisionSearchBox categories={searchCategories} popular={data.quickSearches} autoFocus variant="sheet" onNavigate={() => setSearchOpen(false)} />
            </div>
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="h-12 shrink-0 border-0 bg-transparent px-2 text-[13px] font-semibold text-[#0b0d0c]"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {menuOpen && (
        <div
          id="precision-mobile-nav"
          role="dialog"
          aria-modal="true"
          aria-label="Navigasi menu"
          className="pc-fade fixed inset-0 z-50 flex flex-col overflow-y-auto bg-white text-[#0b0d0c] lg:hidden"
        >
          <div className="container flex h-[68px] shrink-0 items-center justify-between border-b border-[#e6e6e3]">
            <PrecisionLogo store={store} />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Tutup menu"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e6e6e3] bg-white text-[#0b0d0c]"
            >
              <X size={19} />
            </button>
          </div>
          <div className="pc-rise-children container flex flex-1 flex-col gap-8 pb-10 pt-5">
            <nav aria-label="Menu navigasi" className="flex flex-col border-t border-[#0b0d0c]">
              {SHELL_NAV.map((n, i) => {
                const active = isNavActive(path, n.href);
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    onClick={() => setMenuOpen(false)}
                    className="grid grid-cols-[40px_1fr_20px] items-center border-b border-[#e6e6e3] py-4 no-underline"
                  >
                    <b className={`${MONO} text-[12px] text-brand`}>{String(i + 1).padStart(2, "0")}</b>
                    <span className={`${DISPLAY} text-[22px] font-bold ${active ? "text-brand" : "text-[#0b0d0c]"}`}>{n.label}</span>
                    <ArrowUpRight size={18} className="text-[#9a9d99]" />
                  </Link>
                );
              })}
            </nav>
            {data.categories.length > 0 && (
              <div>
                <span className={`${MONO} mb-3 block text-[11px] uppercase tracking-[0.12em] text-[#6b6f6c]`}>Kategori</span>
                <div className="grid grid-cols-2 gap-2">
                  {data.categories.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/katalog?kategori=${c.slug}`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl border border-[#e6e6e3] px-3 py-2.5 text-[12.5px] font-semibold text-[#0b0d0c] no-underline"
                    >
                      <CategoryIcon name={c.name} stored={c.icon} size={16} className="shrink-0 text-brand" />
                      <span className="truncate">{prettyCategoryName(c.name)}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-auto flex flex-col gap-3 border-t border-[#e6e6e3] pt-5 text-[13px] text-[#6b6f6c]">
              {store.hours && <span className={MONO}>{store.hours}</span>}
              {store.address && <span>{store.address}</span>}
              <WhatsAppButton label="Chat via WhatsApp" phone={store.whatsapp} className="w-full! rounded-full!" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function PrecisionFooter({ store, categories = [] }: ShellProps) {
  const { hidden } = useShell();
  if (hidden) return null;
  const name = store.name || "Toko";
  const phone = formatPhone(store.whatsapp);

  return (
    <footer className="bg-brand-2 pb-16 text-brand-2-ink/70 md:pb-0">
      <div className="container grid grid-cols-1 gap-10 py-14 md:grid-cols-12">
        <div className="md:col-span-5">
          <span className={`${DISPLAY} block text-[22px] font-extrabold text-brand-2-ink`}>{name}</span>
          <p className="mb-0 mt-3 max-w-[380px] text-[13.5px] leading-relaxed">
            {store.tagline || "Perangkat original, spesifikasi jelas, harga jelas. Konsultasi langsung sebelum membeli."}
          </p>
          <div className="mt-5">
            <SocialLinks store={store} variant="footer" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-7">
          {categories.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <span className={`${MONO} mb-1 text-[11px] uppercase tracking-[0.12em] text-brand-2-accent`}>Kategori</span>
              {categories.slice(0, 6).map((c) => (
                <Link key={c.value} href={`/katalog?kategori=${c.value}`} className="text-[13px] text-brand-2-ink/70 no-underline hover:text-brand-2-ink">
                  {c.name}
                </Link>
              ))}
            </div>
          )}
          <div className="flex flex-col gap-2.5">
            <span className={`${MONO} mb-1 text-[11px] uppercase tracking-[0.12em] text-brand-2-accent`}>Toko</span>
            {SHELL_NAV.slice(1).map((n) => (
              <Link key={n.href} href={n.href} className="text-[13px] text-brand-2-ink/70 no-underline hover:text-brand-2-ink">
                {n.label}
              </Link>
            ))}
          </div>
          <div className="col-span-2 flex flex-col gap-2.5 sm:col-span-1">
            <span className={`${MONO} mb-1 text-[11px] uppercase tracking-[0.12em] text-brand-2-accent`}>Kunjungi</span>
            {store.address && <span className="text-[13px] leading-relaxed">{store.address}</span>}
            {store.hours && <span className={`${MONO} text-[12px]`}>{store.hours}</span>}
            {phone && <span className={`${MONO} text-[12px] text-brand-2-ink`}>{phone}</span>}
          </div>
        </div>
      </div>
      <div className="border-t border-brand-2-ink/10">
        <div className={`${MONO} container flex flex-col gap-2 py-5 text-[11.5px] text-brand-2-ink/55 sm:flex-row sm:items-center sm:justify-between`}>
          <span>
            © {new Date().getFullYear()} {name}
          </span>
          <span>
            Powered by{" "}
            <a href="https://rigspace.id" target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-2-ink no-underline">
              rigspace.id
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
