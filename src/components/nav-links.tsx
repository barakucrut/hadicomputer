"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Beranda" },
  { href: "/katalog", label: "Katalog Produk" },
  { href: "/layanan", label: "Layanan" },
  { href: "/kontak", label: "Kontak Kami" },
];

export function NavLinks({
  onItemEnter,
  openHref,
  megaHrefs = [],
}: {
  /** Dipanggil saat kursor/fokus masuk ke menu (header membuka mega menu). */
  onItemEnter?: (href: string) => void;
  /** Menu yang mega menu-nya sedang terbuka (tetap bergaris bawah). */
  openHref?: string | null;
  /** Menu yang punya mega menu (diberi ikon panah). */
  megaHrefs?: string[];
} = {}) {
  const pathname = usePathname() || "/";
  const navRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const [isReady, setIsReady] = useState(false);

  // Sub-page awareness:
  // e.g. /produk/[slug] keeps "Katalog Produk" active, /layanan/[slug] keeps "Layanan" active
  const getActiveIndex = () => {
    if (pathname === "/") return 0;
    if (pathname.startsWith("/katalog") || pathname.startsWith("/produk")) return 1;
    if (pathname.startsWith("/layanan")) return 2;
    if (pathname.startsWith("/kontak")) return 3;
    return -1;
  };

  const activeIndex = getActiveIndex();
  const openIndex = openHref ? NAV_ITEMS.findIndex((n) => n.href === openHref) : -1;
  const targetIndex = hoveredIndex !== null ? hoveredIndex : openIndex >= 0 ? openIndex : activeIndex;

  useEffect(() => {
    const updatePosition = () => {
      if (!navRef.current) return;
      if (targetIndex >= 0 && linkRefs.current[targetIndex]) {
        const targetEl = linkRefs.current[targetIndex]!;
        const navRect = navRef.current.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();

        setIndicatorStyle({
          left: targetRect.left - navRect.left,
          width: targetRect.width,
          opacity: 1,
        });
      } else {
        setIndicatorStyle((prev) => ({ ...prev, opacity: 0 }));
      }
      setIsReady(true);
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [pathname, targetIndex]);

  return (
    <div
      ref={navRef}
      className={`nav-links ${isReady ? "has-slider" : ""}`}
      onMouseLeave={() => setHoveredIndex(null)}
      style={{ position: "relative" }}
    >
      {NAV_ITEMS.map((item, index) => {
        const isActive = activeIndex === index;
        return (
          <Link
            key={item.href}
            href={item.href}
            ref={(el) => {
              linkRefs.current[index] = el;
            }}
            aria-current={isActive ? "page" : undefined}
            onMouseEnter={() => {
              setHoveredIndex(index);
              onItemEnter?.(item.href);
            }}
            onFocus={() => onItemEnter?.(item.href)}
            aria-expanded={megaHrefs.includes(item.href) ? openHref === item.href : undefined}
            className={`nav-link-item ${isActive ? "active" : ""}`}
            style={{
              fontWeight: isActive ? 600 : 500,
            }}
          >
            {item.label}
            {megaHrefs.includes(item.href) && (
              <ChevronDown size={13} className={`nav-mega-chevron ${openHref === item.href ? "is-open" : ""}`} aria-hidden />
            )}
          </Link>
        );
      })}

      {/* Sliding Magnetic Underline */}
      <div
        className="nav-indicator-slider"
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: "2.5px",
          backgroundColor: "var(--red)",
          borderRadius: "2px 2px 0 0",
          transform: `translateX(${indicatorStyle.left}px)`,
          width: `${indicatorStyle.width}px`,
          opacity: indicatorStyle.opacity,
          transition: isReady
            ? "transform 0.28s cubic-bezier(0.25, 1, 0.5, 1), width 0.28s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.2s ease"
            : "none",
          pointerEvents: "none",
        }}
        aria-hidden="true"
      />
    </div>
  );
}
