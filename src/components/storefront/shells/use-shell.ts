"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export const SHELL_NAV = [
  { href: "/", label: "Beranda" },
  { href: "/katalog", label: "Katalog" },
  { href: "/layanan", label: "Layanan" },
  { href: "/lokasi", label: "Lokasi" },
  { href: "/kontak", label: "Kontak" },
];

export function isNavActive(path: string, href: string) {
  if (href === "/") return path === "/";
  if (href === "/katalog") return path.startsWith("/katalog") || path.startsWith("/produk");
  return path.startsWith(href);
}

/** Shared state for template headers: route, scroll, mobile menu, hidden on CMS routes. */
export function useShell() {
  const path = usePathname() || "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [path]);

  const hidden =
    path.startsWith("/admin") || path.startsWith("/god-mode") || path.startsWith("/docs/styleguide");

  return { path, menuOpen, setMenuOpen, isScrolled, hidden };
}
