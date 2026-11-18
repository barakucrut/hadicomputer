"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, ArrowUpRight, Clock, MapPin, Menu, Search, X } from "lucide-react";
import type { StoreSettings } from "@/lib/types";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { SocialLinks } from "@/components/social-links";
import { SHELL_NAV, isNavActive, useShell } from "./use-shell";

type ShellProps = {
  store: StoreSettings;
  categories?: Array<{ name: string; value: string }>;
};

/** Logo for dark surfaces: image logos sit on a light plate, text logos turn white. */
function GamingLogo({ store }: { store: StoreSettings }) {
  const name = store.name || "Toko";
  return (
    <Link href="/" aria-label={`${name} — Beranda`} className="flex shrink-0 items-center">
      {store.logoUrl ? (
        <span className="flex h-10 items-center rounded-md bg-white px-2 py-1 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
          <img src={store.logoUrl} alt={name} className="h-full w-auto max-w-[160px] object-contain" />
        </span>
      ) : (
        <span className="inline-flex items-center gap-2 text-lg font-black tracking-tight text-white">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-brand shadow-[0_0_12px_var(--red)]" />
          {name}
        </span>
      )}
    </Link>
  );
}

function SearchBox({ onDone, autoFocus }: { onDone?: () => void; autoFocus?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const term = q.trim();
        router.push(term ? `/katalog?q=${encodeURIComponent(term)}` : "/katalog");
        onDone?.();
      }}
      className="group flex h-10 w-full items-center gap-2 rounded-md border border-[#2f3644] bg-white/[0.04] px-3 transition-colors focus-within:border-brand"
    >
      <Search size={16} className="text-[#5d6574] group-focus-within:text-brand" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus={autoFocus}
        placeholder="Cari GPU, laptop gaming, rakitan…"
        aria-label="Cari produk"
        className="h-full w-full min-w-0 border-0 bg-transparent text-[13px] text-[#eef1f6] outline-none placeholder:text-[#5d6574] focus-visible:outline-none"
      />
    </form>
  );
}

export function GamingHeader({ store, categories = [] }: ShellProps) {
  const { path, menuOpen, setMenuOpen, isScrolled, hidden } = useShell();
  if (hidden) return null;

  return (
    <>
      <a href="#main" className="skip-link">
        Langsung ke konten
      </a>
      <header
        className={`sticky top-0 z-40 border-b bg-[#0a0c10]/90 backdrop-blur-md transition-[border-color,box-shadow] duration-300 ${
          isScrolled ? "border-[#2f3644] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.8)]" : "border-[#232833]"
        }`}
      >
        {/* thin accent line */}
        <div
          aria-hidden="true"
          className="h-[2px] w-full bg-[linear-gradient(90deg,transparent,var(--red)_30%,var(--red)_70%,transparent)] opacity-80"
        />
        <div className="container flex h-16 items-center gap-6">
          <GamingLogo store={store} />

          <nav aria-label="Navigasi utama" className="hidden h-full items-center gap-1 lg:flex">
            {SHELL_NAV.map((n) => {
              const active = isNavActive(path, n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex h-full items-center px-3 text-[13px] font-bold tracking-wide uppercase transition-colors ${
                    active ? "text-white" : "text-[#8b93a3] hover:text-white"
                  }`}
                >
                  {n.label}
                  {active && (
                    <span className="absolute inset-x-3 bottom-0 h-[2px] bg-brand shadow-[0_0_10px_var(--red)]" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto hidden w-full max-w-[320px] md:block">
            <SearchBox />
          </div>

          <WhatsAppButton
            label={store.homepageConfig?.waConsultLabel || "Konsultasi"}
            phone={store.whatsapp}
            className="hidden! min-h-10! rounded-md! border! border-[#25d366]/40! bg-[#25d366]/10! px-4! py-2! text-[12px]! text-white! hover:bg-[#25d366]/20! lg:inline-flex!"
          />

          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={menuOpen}
            aria-controls="gaming-mobile-nav"
            className="ml-auto flex h-10 w-10 items-center justify-center rounded-md border border-[#2f3644] bg-transparent text-white md:ml-0 lg:hidden"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {menuOpen && (
        <div
          id="gaming-mobile-nav"
          role="dialog"
          aria-modal="true"
          aria-label="Navigasi menu"
          className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-[#0a0c10] text-[#eef1f6] lg:hidden"
        >
          <div className="container flex h-16 shrink-0 items-center justify-between border-b border-[#232833]">
            <GamingLogo store={store} />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Tutup menu"
              className="flex h-10 w-10 items-center justify-center rounded-md border border-[#2f3644] bg-transparent text-white"
            >
              <X size={20} />
            </button>
          </div>
          <div className="container flex flex-col gap-8 py-6">
            <SearchBox onDone={() => setMenuOpen(false)} />
            <nav aria-label="Menu navigasi" className="flex flex-col">
              {SHELL_NAV.map((n, i) => {
                const active = isNavActive(path, n.href);
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center justify-between border-b border-[#232833] py-4 text-xl font-black uppercase tracking-tight ${
                      active ? "text-brand" : "text-white"
                    }`}
                  >
                    <span className="flex items-baseline gap-3">
                      <span className="font-mono text-[11px] text-[#5d6574]">{String(i + 1).padStart(2, "0")}</span>
                      {n.label}
                    </span>
                    <ArrowRight size={18} className="text-[#5d6574]" />
                  </Link>
                );
              })}
            </nav>
            {categories.length > 0 && (
              <div className="flex flex-col gap-3">
                <span className="font-mono text-[11px] font-bold tracking-[0.16em] text-brand uppercase">Kategori</span>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <Link
                      key={c.value}
                      href={`/katalog?kategori=${c.value}`}
                      onClick={() => setMenuOpen(false)}
                      className="rounded-md border border-[#2f3644] px-3 py-2 text-[13px] font-bold text-[#8b93a3] hover:border-brand hover:text-white"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-col gap-3 rounded-xl border border-[#232833] bg-[#12151b] p-4 text-[13px] text-[#8b93a3]">
              <span className="flex items-start gap-2">
                <Clock size={15} className="mt-0.5 text-brand" />
                {store.hours || "Buka setiap hari: 08.00 – 22.00 WIB"}
              </span>
              {store.address && (
                <span className="flex items-start gap-2">
                  <MapPin size={15} className="mt-0.5 text-brand" />
                  {store.address}
                </span>
              )}
              <WhatsAppButton
                label="Konsultasi via WhatsApp"
                phone={store.whatsapp}
                className="mt-2 w-full! rounded-md! bg-[#25d366]! text-[#06140b]! [&_svg]:text-[#06140b]!"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function GamingFooter({ store, categories = [] }: ShellProps) {
  const { hidden } = useShell();
  if (hidden) return null;

  const name = store.name || "Toko";

  return (
    <footer className="relative overflow-hidden border-t border-[#232833] bg-[#07090c] text-[#8b93a3]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[720px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--red)_30%,transparent)_0%,transparent_70%)] opacity-40 blur-2xl"
      />
      <div className="container relative grid grid-cols-1 gap-10 py-16 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div className="flex flex-col gap-5">
          <GamingLogo store={store} />
          <p className="m-0 max-w-xs text-[13px] leading-relaxed text-[#8b93a3]">
            {store.tagline || "Rig siap tempur, laptop gaming, dan komponen pilihan."}
          </p>
          <div className="[&_a]:text-[#8b93a3] [&_a:hover]:text-white">
            <SocialLinks store={store} variant="footer" />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <span className="mb-1 font-mono text-[11px] font-bold tracking-[0.16em] text-brand uppercase">Arena</span>
          {categories.slice(0, 6).map((c) => (
            <Link key={c.value} href={`/katalog?kategori=${c.value}`} className="text-[13px] hover:text-white">
              {c.name}
            </Link>
          ))}
          <Link href="/katalog?kondisi=bekas" className="text-[13px] hover:text-white">
            Unit second
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          <span className="mb-1 font-mono text-[11px] font-bold tracking-[0.16em] text-brand uppercase">Pit Stop</span>
          <Link href="/layanan/rakit-pc" className="text-[13px] hover:text-white">
            Jasa rakit PC
          </Link>
          <Link href="/layanan/servis-perangkat" className="text-[13px] hover:text-white">
            Servis & upgrade
          </Link>
          <Link href="/layanan" className="text-[13px] hover:text-white">
            Semua layanan
          </Link>
          <Link href="/kontak" className="text-[13px] hover:text-white">
            Kontak
          </Link>
        </div>

        <div className="flex flex-col gap-4">
          <span className="mb-1 font-mono text-[11px] font-bold tracking-[0.16em] text-brand uppercase">Base Camp</span>
          {store.address && (
            <span className="flex items-start gap-2 text-[13px] leading-relaxed">
              <MapPin size={15} className="mt-0.5 shrink-0 text-brand" />
              {store.address}
            </span>
          )}
          <span className="flex items-start gap-2 text-[13px] leading-relaxed">
            <Clock size={15} className="mt-0.5 shrink-0 text-brand" />
            {store.hours || "Buka setiap hari: 08.00 – 22.00 WIB"}
          </span>
          <Link href="/lokasi" className="inline-flex items-center gap-1 text-[13px] font-bold text-white hover:text-brand">
            Lihat peta <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>

      <div className="relative border-t border-[#232833]">
        <div className="container flex flex-col gap-2 py-5 text-[12px] text-[#5d6574] sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} {name}. All rights reserved.
          </span>
          <span className="inline-flex items-center gap-1.5">
            Powered by
            <a href="https://rigspace.id" target="_blank" rel="noopener noreferrer" className="font-extrabold text-brand">
              ⚡ rigspace.id
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
