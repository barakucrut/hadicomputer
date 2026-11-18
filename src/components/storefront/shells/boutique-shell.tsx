"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Menu, Search, X } from "lucide-react";
import type { StoreSettings } from "@/lib/types";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { SocialLinks } from "@/components/social-links";
import { SHELL_NAV, isNavActive, useShell } from "./use-shell";

type ShellProps = {
  store: StoreSettings;
  categories?: Array<{ name: string; value: string }>;
};

function BoutiqueLogo({ store }: { store: StoreSettings }) {
  const name = store.name || "Toko";
  return (
    <Link href="/" aria-label={`${name} — Beranda`} className="flex shrink-0 items-center">
      {store.logoUrl ? (
        <img src={store.logoUrl} alt={name} className="h-9 w-auto max-w-[150px] object-contain mix-blend-multiply" />
      ) : (
        <span className="inline-flex items-center gap-2 text-lg font-semibold tracking-[-0.03em] text-[#141412]">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          {name}
        </span>
      )}
    </Link>
  );
}

function SearchPanel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="border-t border-[#dedcd5] bg-[#f7f6f2]">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          const term = q.trim();
          router.push(term ? `/katalog?q=${encodeURIComponent(term)}` : "/katalog");
          onClose();
        }}
        className="container flex items-center gap-4 py-5"
      >
        <Search size={20} className="shrink-0 text-[#8a8a83]" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari perangkat, merek, atau kebutuhan…"
          aria-label="Cari produk"
          className="w-full min-w-0 border-0 bg-transparent text-xl font-light tracking-[-0.02em] text-[#141412] outline-none placeholder:text-[#a3a39c] focus-visible:outline-none md:text-2xl"
        />
        <button
          type="submit"
          className="hidden shrink-0 items-center gap-1.5 border-0 bg-transparent text-sm font-medium text-[#141412] underline decoration-brand underline-offset-[6px] sm:inline-flex"
        >
          Cari <ArrowRight size={15} />
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup pencarian"
          className="flex h-9 w-9 shrink-0 items-center justify-center border-0 bg-transparent text-[#6b6b65] hover:text-[#141412]"
        >
          <X size={18} />
        </button>
      </form>
    </div>
  );
}

export function BoutiqueHeader({ store, categories = [] }: ShellProps) {
  const { path, menuOpen, setMenuOpen, isScrolled, hidden } = useShell();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    setSearchOpen(false);
  }, [path]);

  if (hidden) return null;

  return (
    <>
      <a href="#main" className="skip-link">
        Langsung ke konten
      </a>
      <header
        className={`sticky top-0 z-40 border-b bg-[#f7f6f2]/90 backdrop-blur-md transition-colors duration-300 ${
          isScrolled ? "border-[#dedcd5]" : "border-transparent"
        }`}
      >
        <div className="container grid h-[72px] grid-cols-[1fr_auto_1fr] items-center gap-6">
          <BoutiqueLogo store={store} />

          <nav aria-label="Navigasi utama" className="hidden items-center gap-8 lg:flex">
            {SHELL_NAV.map((n) => {
              const active = isNavActive(path, n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className={`text-[13px] tracking-[0.01em] transition-colors ${
                    active
                      ? "font-medium text-[#141412] underline decoration-brand decoration-1 underline-offset-[8px]"
                      : "text-[#6b6b65] hover:text-[#141412]"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="col-start-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Cari produk"
              aria-expanded={searchOpen}
              className="flex h-10 w-10 items-center justify-center rounded-full border-0 bg-transparent text-[#141412] transition-colors hover:bg-[#ecebe6]"
            >
              <Search size={18} />
            </button>
            <WhatsAppButton
              label="Hubungi"
              phone={store.whatsapp}
              className="hidden! min-h-10! rounded-full! px-5! py-2! text-[12px]! font-medium! lg:inline-flex!"
            />
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
              aria-expanded={menuOpen}
              aria-controls="boutique-mobile-nav"
              className="flex h-10 w-10 items-center justify-center rounded-full border-0 bg-transparent text-[#141412] hover:bg-[#ecebe6] lg:hidden"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
        {searchOpen && <SearchPanel onClose={() => setSearchOpen(false)} />}
      </header>

      {menuOpen && (
        <div
          id="boutique-mobile-nav"
          role="dialog"
          aria-modal="true"
          aria-label="Navigasi menu"
          className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-[#f7f6f2] text-[#141412] lg:hidden"
        >
          <div className="container flex h-[72px] shrink-0 items-center justify-between">
            <BoutiqueLogo store={store} />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Tutup menu"
              className="flex h-10 w-10 items-center justify-center rounded-full border-0 bg-transparent text-[#141412] hover:bg-[#ecebe6]"
            >
              <X size={20} />
            </button>
          </div>
          <div className="container flex flex-1 flex-col gap-10 pt-6 pb-10">
            <nav aria-label="Menu navigasi" className="flex flex-col border-t border-[#dedcd5]">
              {SHELL_NAV.map((n) => {
                const active = isNavActive(path, n.href);
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between border-b border-[#dedcd5] py-5"
                  >
                    <span
                      className={`text-[32px] leading-none font-medium tracking-[-0.04em] ${
                        active ? "text-brand" : "text-[#141412]"
                      }`}
                    >
                      {n.label}
                    </span>
                    <ArrowUpRight size={20} className="text-[#a3a39c]" />
                  </Link>
                );
              })}
            </nav>
            {categories.length > 0 && (
              <div className="flex flex-col gap-3">
                <span className="text-[11px] font-semibold tracking-[0.2em] text-[#8a8a83] uppercase">Kategori</span>
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  {categories.map((c) => (
                    <Link
                      key={c.value}
                      href={`/katalog?kategori=${c.value}`}
                      onClick={() => setMenuOpen(false)}
                      className="text-[15px] text-[#6b6b65] underline decoration-[#dedcd5] underline-offset-4 hover:text-[#141412] hover:decoration-brand"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-auto flex flex-col gap-4 border-t border-[#dedcd5] pt-6 text-sm text-[#6b6b65]">
              <span>{store.hours || "Buka setiap hari: 08.00 – 22.00 WIB"}</span>
              {store.address && <span>{store.address}</span>}
              <WhatsAppButton label="Hubungi via WhatsApp" phone={store.whatsapp} className="w-full! rounded-full!" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function BoutiqueFooter({ store, categories = [] }: ShellProps) {
  const { hidden } = useShell();
  if (hidden) return null;

  const name = store.name || "Toko";

  return (
    <footer className="border-t border-[#dedcd5] bg-[#f7f6f2] text-[#141412]">
      <div className="container py-16 md:py-24">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
          <div className="flex flex-col gap-6 md:col-span-5">
            <p className="m-0 text-3xl leading-[1.1] font-semibold tracking-[-0.035em] text-[#141412] md:text-[40px]">
              {store.tagline || "Dipilih dengan teliti."}
            </p>
            <Link
              href="/kontak"
              className="inline-flex w-fit items-center gap-1.5 text-sm font-medium underline decoration-brand underline-offset-[6px]"
            >
              Mulai percakapan <ArrowUpRight size={15} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-7">
            <div className="flex flex-col gap-3">
              <span className="mb-1 text-[11px] font-semibold tracking-[0.2em] text-[#8a8a83] uppercase">Koleksi</span>
              {categories.slice(0, 6).map((c) => (
                <Link key={c.value} href={`/katalog?kategori=${c.value}`} className="text-sm text-[#6b6b65] hover:text-[#141412]">
                  {c.name}
                </Link>
              ))}
            </div>
            <div className="flex flex-col gap-3">
              <span className="mb-1 text-[11px] font-semibold tracking-[0.2em] text-[#8a8a83] uppercase">Layanan</span>
              <Link href="/layanan" className="text-sm text-[#6b6b65] hover:text-[#141412]">
                Semua layanan
              </Link>
              <Link href="/katalog?kondisi=bekas" className="text-sm text-[#6b6b65] hover:text-[#141412]">
                Unit second
              </Link>
              <Link href="/kontak" className="text-sm text-[#6b6b65] hover:text-[#141412]">
                Kontak
              </Link>
            </div>
            <div className="col-span-2 flex flex-col gap-3 sm:col-span-1">
              <span className="mb-1 text-[11px] font-semibold tracking-[0.2em] text-[#8a8a83] uppercase">Kunjungi</span>
              {store.address && <span className="text-sm leading-relaxed text-[#6b6b65]">{store.address}</span>}
              <span className="text-sm leading-relaxed text-[#6b6b65]">
                {store.hours || "Buka setiap hari: 08.00 – 22.00 WIB"}
              </span>
              <Link href="/lokasi" className="inline-flex items-center gap-1 text-sm font-medium hover:text-brand">
                Petunjuk arah <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[#dedcd5]">
        <div className="container flex flex-col gap-4 py-6 text-[12px] text-[#8a8a83] sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-3">
            <BoutiqueLogo store={store} />
            <span>
              © {new Date().getFullYear()} {name}
            </span>
          </span>
          <div className="flex items-center gap-6">
            <SocialLinks store={store} variant="footer" />
            <span className="inline-flex items-center gap-1.5">
              Powered by
              <a href="https://rigspace.id" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#141412]">
                rigspace.id
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
