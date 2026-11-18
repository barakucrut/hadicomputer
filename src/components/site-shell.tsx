"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  MapPin,
  Menu,
  Search,
  X,
  ArrowRight,
  MessageCircle,
} from "lucide-react";
import { categories } from "@/lib/repository";
import type { StoreSettings } from "@/lib/types";
import { WhatsAppButton } from "./whatsapp-button";
import { HeaderSearch } from "./header-search";
import { SocialLinks } from "./social-links";
import { NavLinks } from "./nav-links";

export function Logo({ store }: { store?: StoreSettings }) {
  if (store?.logoUrl) {
    return (
      <Link href="/" aria-label={`${store.name || "Toko"} — Beranda`} className="logo">
        <img
          src={store.logoUrl}
          alt={store.name || "Logo Toko"}
          style={{ objectFit: "contain", maxHeight: "44px", width: "auto", maxWidth: "100%" }}
        />
      </Link>
    );
  }

  return (
    <Link href="/" aria-label={`${store?.name || "Hadi Computer"} — Beranda`} className="logo">
      <span
        style={{
          fontSize: "18px",
          fontWeight: 900,
          letterSpacing: "-0.5px",
          color: "var(--ink)",
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span
          style={{
            width: "10px",
            height: "10px",
            borderRadius: "3px",
            backgroundColor: "var(--red)",
            display: "inline-block",
            flexShrink: 0,
          }}
        />
        <span>{store?.name || "Hadi Computer"}</span>
      </span>
    </Link>
  );
}
export function Header({
  store,
  categories: categoriesProp,
}: {
  store?: StoreSettings;
  categories?: Array<{ name: string; value: string }>;
}) {
  const categoryList = categoriesProp && categoriesProp.length > 0 ? categoriesProp : categories;
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const path = usePathname();

  // Sticky header on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 36);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Close menu automatically on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [path]);

  // Do not render public header on admin, god-mode, or styleguide pages
  if (
    path?.startsWith("/admin") ||
    path?.startsWith("/god-mode") ||
    path?.startsWith("/docs/styleguide")
  ) {
    return null;
  }

  return (
    <>
      <a href="#main" className="skip-link">
        Langsung ke konten
      </a>
      <div className="topbar">
        <div className="container">
          <span>Teknologi untuk keseharianmu.</span>
          <span className="topbar-hours">
            {store?.hours || "Buka setiap hari: 08.00 – 22.00 WIB"}
          </span>
        </div>
      </div>
      <header
        className={`site-header ${isScrolled ? "is-sticky" : ""}`}
        data-home={path === "/"}
      >
        <div className="container header-main">
          <Logo store={store} />
          <HeaderSearch />
          <div className="header-contact">
            <WhatsAppButton
              label={store?.homepageConfig?.waConsultLabel || `Tanya ${store?.name || "Hadi"}`}
              phone={store?.whatsapp}
            />
          </div>
          <button
            className="icon-button mobile-menu-button"
            aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
        <div className="nav-border">
          <nav className="container main-nav" aria-label="Navigasi utama">
            <details className="category-menu">
              <summary>
                <Menu size={17} />
                Semua kategori
                <ChevronDown size={14} />
              </summary>
              <div className="category-popover">
                {categoryList.map((c) => (
                  <Link
                    key={c.value}
                    href={`/katalog?kategori=${c.value}`}
                    onClick={(e) => {
                      e.currentTarget
                        .closest("details")
                        ?.removeAttribute("open");
                    }}
                  >
                    {c.name}
                    <ArrowUpRight size={15} />
                  </Link>
                ))}
              </div>
            </details>
            <NavLinks />
            <Link className="location-nav" href="/lokasi">
              <MapPin size={16} />
              Lokasi toko
              <ArrowUpRight size={14} />
            </Link>
          </nav>
        </div>
        {menuOpen && (
          <div
            id="mobile-navigation"
            className="mobile-nav-fullscreen"
            role="dialog"
            aria-modal="true"
            aria-label="Navigasi Menu Ponsel"
          >
            <div className="mobile-nav-header container">
              <Logo store={store} />
              <button
                className="icon-button mobile-menu-close"
                aria-label="Tutup menu"
                onClick={() => setMenuOpen(false)}
              >
                <X size={22} />
              </button>
            </div>

            <div className="mobile-nav-body container">
              <div className="mobile-nav-search-wrap">
                <HeaderSearch />
              </div>

              <nav className="mobile-nav-list" aria-label="Menu navigasi">
                {[
                  { href: "/", label: "Beranda" },
                  { href: "/katalog", label: "Katalog Produk" },
                  { href: "/layanan", label: "Layanan" },
                  { href: "/lokasi", label: "Lokasi Toko" },
                  { href: "/kontak", label: "Kontak Kami" },
                ].map((n, idx) => {
                  const isActive = n.href === "/" ? path === "/" : path.startsWith(n.href);
                  return (
                    <Link
                      key={n.href}
                      href={n.href}
                      onClick={() => setMenuOpen(false)}
                      className={`mobile-nav-item ${isActive ? "active" : ""}`}
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      <span>{n.label}</span>
                      <ArrowRight size={18} className="nav-arrow" />
                    </Link>
                  );
                })}
              </nav>

              <div className="mobile-nav-categories">
                <span className="mobile-nav-cat-title">Kategori Populer</span>
                <div className="mobile-nav-cat-grid">
                  {categoryList.map((c) => (
                    <Link
                      key={c.value}
                      href={`/katalog?kategori=${c.value}`}
                      onClick={() => setMenuOpen(false)}
                      className="mobile-cat-pill"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mobile-nav-footer">
                <div className="mobile-nav-store-info">
                  <span className="info-hours">
                    {store?.hours || "Buka setiap hari: 08.00 – 22.00 WIB"}
                  </span>
                  <span className="info-address">
                    {store?.address || "Tempurejo, Kabupaten Jember"}
                  </span>
                </div>
                <WhatsAppButton
                  label="Konsultasi via WhatsApp"
                  phone={store?.whatsapp}
                  className="mobile-full-wa"
                />
                <SocialLinks store={store} variant="footer" />
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
export function Footer({ store }: { store?: StoreSettings }) {
  const path = usePathname();

  // Do not render public footer on admin, god-mode, or styleguide pages
  if (
    path?.startsWith("/admin") ||
    path?.startsWith("/god-mode") ||
    path?.startsWith("/docs/styleguide")
  ) {
    return null;
  }

  const storeName = store?.name || "Hadi Computer";
  const featuredTitle = store?.homepageConfig?.featuredTitle || `Pilihan ${storeName}`;

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Logo store={store} />
          <p>
            Perangkat yang tepat.
            <br />
            Teman untuk setiap kebutuhan.
          </p>
          <WhatsAppButton
            label={store?.homepageConfig?.waConsultLabel || `Mari ngobrol dengan ${storeName}`}
            className="footer-wa"
            phone={store?.whatsapp}
          />
          <SocialLinks store={store} variant="footer" />
        </div>
        <div>
          <h3>Jelajahi</h3>
          <Link href="/katalog">Semua produk</Link>
          <Link href="/katalog?kondisi=bekas">Produk bekas</Link>
          <Link href="/katalog?koleksi=Pilihan%20Toko">{featuredTitle}</Link>
        </div>
        <div>
          <h3>Kami siap membantu</h3>
          <Link href="/layanan/servis-perangkat">Servis & perawatan</Link>
          <Link href="/layanan/rakit-pc">Jasa rakit PC</Link>
          <Link href="/kontak">Kontak kami</Link>
        </div>
        <div>
          <h3>Kenali {storeName}</h3>
          <Link href="/lokasi">
            Lokasi toko
            <ArrowUpRight size={13} />
          </Link>
          <p>
            {store?.address || "Jl. Ahmad Yani No. 45, Lantai 1"}
            <br />
            {store?.hours || "Buka setiap hari: 08.00 – 22.00 WIB"}
          </p>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>
          © {new Date().getFullYear()} {storeName}. All rights reserved.
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <span>Powered by</span>
          <a
            href="https://rigspace.id"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontWeight: 800, color: "var(--red)", textDecoration: "none" }}
          >
            ⚡ rigspace.id
          </a>
        </span>
      </div>
    </footer>
  );
}

/**
 * Real-time live theme synchronizer:
 * Listens for color & font updates dispatched from the admin settings panel
 * and instantly applies them to the live storefront without page reload.
 */
export function ThemeLiveSync() {
  useEffect(() => {
    function handleSync(e: StorageEvent) {
      if (e.key === "rigspace_live_theme_sync" && e.newValue) {
        try {
          const payload = JSON.parse(e.newValue);
          if (payload.primaryColor) {
            document.documentElement.style.setProperty("--red", payload.primaryColor);
            document.documentElement.style.setProperty("--red-dark", payload.primaryColor);
            document.documentElement.style.setProperty("--border-focus", payload.primaryColor);
            document.documentElement.style.setProperty("--ring", `${payload.primaryColor}33`);
          }
          if (payload.fontFamily) {
            document.documentElement.style.setProperty(
              "--font",
              `'${payload.fontFamily}', "Plus Jakarta Sans", sans-serif`
            );
          }
        } catch {}
      }
    }

    window.addEventListener("storage", handleSync);
    return () => window.removeEventListener("storage", handleSync);
  }, []);

  return null;
}
