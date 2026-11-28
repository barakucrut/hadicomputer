"use client";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { getAvailabilityLabel, priceLabel, rupiah } from "@/lib/catalog";
import { getStorefrontCopy } from "@/lib/i18n/storefront";
import { useStoreSettings } from "@/components/store-context";
import { DISPLAY, MONO, discountOf } from "./model";

const STOCK_DOT: Record<Product["availability"], string> = {
  tersedia: "bg-[#16a34a]",
  preorder: "bg-[#d97706]",
  habis: "bg-[#a3a39c]",
};
const STOCK_TEXT: Record<Product["availability"], string> = {
  tersedia: "text-[#15803d]",
  preorder: "text-[#b45309]",
  habis: "text-[#6b6f6c]",
};

/**
 * Harga + harga coret + "Hemat Rp …" (hanya bila diskon nyata: harga normal > harga jual).
 * Ukuran lg (hero): harga coret besar bergaris warna toko + pill hemat & persen — kesan "untung" langsung terbaca.
 */
export function PriceStack({
  price,
  originalPrice,
  size = "md",
  tone = "light",
}: {
  price: number | null;
  originalPrice?: number | null;
  size?: "sm" | "md" | "lg";
  tone?: "light" | "dark";
}) {
  const store = useStoreSettings();
  const locale = store?.locale ?? "id";
  const currency = store?.currency ?? "IDR";
  const copy = getStorefrontCopy(locale);
  const hasDiscount = Boolean(price && originalPrice && originalPrice > price);
  const savings = hasDiscount ? originalPrice! - price! : 0;
  const percent = hasDiscount ? Math.round((savings / originalPrice!) * 100) : 0;
  const dark = tone === "dark";

  if (size === "lg") {
    return (
      <div className="flex flex-col gap-1.5">
        {hasDiscount && (
          <div className="flex flex-wrap items-center gap-2">
            <span className={`${MONO} text-[16px] line-through decoration-brand decoration-2 ${dark ? "text-white/55" : "text-[#8b8e8a]"}`}>
              {rupiah(originalPrice!, currency, locale)}
            </span>
            <span className="rounded-full bg-brand px-2.5 py-0.5 text-[12px] font-bold text-brand-ink">−{percent}%</span>
          </div>
        )}
        <span className={`${MONO} text-[28px] font-semibold leading-none md:text-[32px] ${dark ? "text-white" : "text-[#0b0d0c]"}`}>
          {priceLabel(price, currency, locale)}
        </span>
        {hasDiscount && (
          <span
            className={`mt-1 inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-semibold ${
              dark ? "border-white/15 bg-white/10 text-white" : "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]"
            }`}
          >
            <i className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" /> {copy.youSavePrefix} {rupiah(savings, currency, locale)}
          </span>
        )}
      </div>
    );
  }

  const priceCls = size === "sm" ? "text-[13px]" : "text-[15px]";
  return (
    <div className="flex flex-col gap-0.5">
      {hasDiscount && (
        <span className={`${MONO} text-[11.5px] line-through ${dark ? "text-[#8b8e8a]" : "text-[#9a9d99]"}`}>
          {rupiah(originalPrice!, currency, locale)}
          <b className="ml-1.5 font-semibold text-brand no-underline">−{percent}%</b>
        </span>
      )}
      <span className={`${MONO} ${priceCls} font-semibold ${dark ? "text-white" : "text-[#0b0d0c]"}`}>
        {priceLabel(price, currency, locale)}
      </span>
      {hasDiscount && (
        <span className={`text-[11px] font-semibold ${dark ? "text-[#86efac]" : "text-[#15803d]"}`}>
          {copy.savePrefix} {rupiah(savings, currency, locale)}
        </span>
      )}
    </div>
  );
}

/** Kartu produk "spec row": garis rambut, chip spek mono, harga tabular. */
export function SpecCard({ product, layout = "grid" }: { product: Product; layout?: "grid" | "list" }) {
  const store = useStoreSettings();
  const locale = store?.locale ?? "id";
  const d = discountOf(product);
  const chips = product.specs.slice(0, 3).map((s) => s.value);
  const image = product.images[0];

  if (layout === "list") {
    return (
      <Link
        href={`/produk/${product.slug}`}
        className="group grid grid-cols-[88px_1fr] items-center gap-4 border-b border-[#e6e6e3] px-2 py-4 transition-colors hover:bg-[#fafaf8] sm:grid-cols-[120px_1fr_auto]"
      >
        <div className="flex aspect-square items-center justify-center overflow-hidden rounded border border-[#e6e6e3] bg-white p-2">
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={product.name} loading="lazy" className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105" />
          )}
        </div>
        <div className="min-w-0">
          <div className={`${MONO} flex gap-3 text-[11px] uppercase tracking-[0.06em] text-[#6b6f6c]`}>
            <span>{product.brand}</span>
            <span>{product.code}</span>
          </div>
          <h3 className="mt-1 line-clamp-2 text-[14.5px] font-semibold leading-snug text-[#0b0d0c] group-hover:underline">{product.name}</h3>
          {chips.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {chips.map((c) => (
                <span key={c} className={`${MONO} rounded-[3px] border border-[#e6e6e3] bg-[#f6f6f4] px-1.5 py-0.5 text-[10.5px] text-[#3d413e]`}>
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="col-span-2 sm:col-span-1 sm:text-right">
          <PriceStack price={product.price} originalPrice={d?.originalPrice} />
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/produk/${product.slug}`} className="pc-lift group flex flex-col border-b border-r border-[#e6e6e3] bg-white">
      <div className="relative flex aspect-[4/3] items-center justify-center p-5">
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            className="pc-zoom max-h-full max-w-full object-contain"
          />
        )}
        {d && (
          <span className={`${MONO} absolute left-3 top-3 rounded-[3px] bg-[#0b0d0c] px-2 py-1 text-[10.5px] font-semibold text-[#f6e3a1]`}>
            −{d.percent}%
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2.5 border-t border-[#e6e6e3] px-4 pb-4 pt-3.5">
        <div className={`${MONO} flex justify-between text-[11px] uppercase tracking-[0.06em] text-[#6b6f6c]`}>
          <span className="truncate">{product.brand}</span>
          <span>{product.code}</span>
        </div>
        <h3 className="line-clamp-2 min-h-[38px] text-[14px] font-semibold leading-snug text-[#0b0d0c] group-hover:underline">
          {product.name}
        </h3>
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {chips.map((c) => (
              <span key={c} className={`${MONO} rounded-[3px] border border-[#e6e6e3] bg-[#f6f6f4] px-1.5 py-0.5 text-[10.5px] text-[#3d413e]`}>
                {c}
              </span>
            ))}
          </div>
        )}
        <div className="mt-auto flex flex-col items-start gap-1.5 pt-1 sm:flex-row sm:items-end sm:justify-between sm:gap-2">
          <PriceStack price={product.price} originalPrice={d?.originalPrice} />
          <span className={`flex shrink-0 items-center gap-1.5 text-[11.5px] ${STOCK_TEXT[product.availability]}`}>
            <i className={`h-1.5 w-1.5 rounded-full ${STOCK_DOT[product.availability]}`} />
            {product.stockLabel || getAvailabilityLabel(product.availability, locale)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function SectionHead({
  index,
  eyebrow,
  title,
  action,
}: {
  index: string;
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <span className={`${MONO} mb-2 block text-[12px] uppercase tracking-[0.1em] text-[#6b6f6c]`}>
          {index} — {eyebrow}
        </span>
        <h2 className={`${DISPLAY} m-0 text-[26px] font-bold leading-tight text-[#0b0d0c] sm:text-[30px]`}>{title}</h2>
      </div>
      {action}
    </div>
  );
}
