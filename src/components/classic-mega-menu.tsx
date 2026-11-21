"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { StoreSettings } from "@/lib/types";
import type { StorefrontMenuData } from "@/lib/live-repository";
import { rupiah } from "@/lib/catalog";
import { CategoryIcon } from "@/components/storefront/templates/precision/category-icon";
import { prettyCategoryName } from "@/components/storefront/templates/precision/model";
import { WhatsAppButton } from "./whatsapp-button";

export type ClassicMegaKey = "katalog" | "layanan";

/** Menu nav Classic yang punya panel mega menu. */
export const CLASSIC_MEGA_BY_HREF: Record<string, ClassicMegaKey> = { "/katalog": "katalog", "/layanan": "layanan" };

export function classicMegaAvailable(menu: StorefrontMenuData | undefined, key: ClassicMegaKey): boolean {
  if (!menu) return false;
  return key === "katalog" ? menu.categories.length > 0 : menu.services.length > 0;
}

function KatalogPanel({ menu, close }: { menu: StorefrontMenuData; close: () => void }) {
  const f = menu.featured;
  const discount = f?.price && f.originalPrice && f.originalPrice > f.price ? f.originalPrice - f.price : 0;
  return (
    <div className="cl-mega-grid cl-mega-katalog">
      <div>
        <span className="cl-mega-label">Kategori</span>
        <div className="cl-mega-cats">
          {menu.categories.slice(0, 10).map((c) => (
            <Link key={c.slug} href={`/katalog?kategori=${c.slug}`} onClick={close} className="cl-mega-cat">
              <span className="cl-mega-cat-icon">
                <CategoryIcon name={c.name} stored={c.icon} size={17} />
              </span>
              <span className="cl-mega-cat-text">
                <b>{prettyCategoryName(c.name)}</b>
                <small>{c.count} produk</small>
              </span>
            </Link>
          ))}
        </div>
        <Link href="/katalog" onClick={close} className="cl-mega-more">
          Lihat semua produk <ArrowUpRight size={14} />
        </Link>
      </div>
      {menu.brands.length > 0 && (
        <div>
          <span className="cl-mega-label">Merek populer</span>
          <div className="cl-mega-brands">
            {menu.brands.slice(0, 12).map((b) => (
              <Link key={b.name} href={`/katalog?merek=${encodeURIComponent(b.name)}`} onClick={close} className="cl-mega-brand">
                <span>{b.name}</span>
                <small>{b.count}</small>
              </Link>
            ))}
          </div>
        </div>
      )}
      {f && (
        <Link href={f.href} onClick={close} className="cl-mega-featured">
          <span className="cl-mega-label">Sorotan minggu ini</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={f.image} alt="" />
          <b>{f.title}</b>
          <span className="cl-mega-price">
            {f.price ? rupiah(f.price) : "Hubungi"}
            {discount > 0 && <s>{rupiah(f.originalPrice!)}</s>}
          </span>
        </Link>
      )}
    </div>
  );
}

function LayananPanel({ menu, store, close }: { menu: StorefrontMenuData; store?: StoreSettings; close: () => void }) {
  return (
    <div className="cl-mega-grid cl-mega-layanan">
      <div>
        <span className="cl-mega-label">Layanan toko</span>
        <div className="cl-mega-services">
          {menu.services.map((s, i) => (
            <Link key={s.slug} href={`/layanan/${s.slug}`} onClick={close} className="cl-mega-service">
              <b>{String(i + 1).padStart(2, "0")}</b>
              <span>
                <strong>
                  {s.name} <ArrowUpRight size={13} />
                </strong>
                <small>{s.summary}</small>
              </span>
            </Link>
          ))}
        </div>
      </div>
      <div className="cl-mega-consult">
        <span className="cl-mega-label">Konsultasi gratis</span>
        <p className="cl-mega-consult-title">Bingung pilih perangkat atau perlu servis?</p>
        <p>Ceritakan kebutuhanmu, tim kami bantu carikan solusi terbaik.</p>
        <WhatsAppButton
          phone={store?.whatsapp}
          label="Chat WhatsApp"
          message={`Halo ${store?.name || "kak"}, saya ingin konsultasi.`}
        />
      </div>
    </div>
  );
}

/** Panel mega menu Classic (desktop). Dirender di dalam header yang sticky. */
export function ClassicMegaPanel({
  open,
  menu,
  store,
  onEnter,
  close,
}: {
  open: ClassicMegaKey | null;
  menu?: StorefrontMenuData;
  store?: StoreSettings;
  onEnter: () => void;
  close: () => void;
}) {
  if (!open || !menu || !classicMegaAvailable(menu, open)) return null;
  return (
    <div className="cl-mega" onMouseEnter={onEnter}>
      <div className="container">
        {open === "katalog" ? <KatalogPanel menu={menu} close={close} /> : <LayananPanel menu={menu} store={store} close={close} />}
      </div>
    </div>
  );
}
