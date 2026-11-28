"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowUpRight, Loader2, Search, TrendingUp, X } from "lucide-react";
import { rupiah } from "@/lib/catalog";
import { useStoreSettings } from "@/components/store-context";
import { CategoryIcon } from "@/components/storefront/templates/precision/category-icon";
import { prettyCategoryName } from "@/components/storefront/templates/precision/model";

const MONO = "[font-family:var(--pc-mono)] tabular-nums";

type Suggestion = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number | null;
  originalPrice: number | null;
  image: string;
};

type Item =
  | { kind: "popular"; label: string; href: string }
  | { kind: "category"; label: string; href: string; name: string; icon: string; count: number }
  | { kind: "product"; label: string; href: string; product: Suggestion }
  | { kind: "all"; label: string; href: string };

export interface SearchCategory {
  name: string;
  slug: string;
  icon: string;
  count: number;
}

/**
 * Pencarian header: kolom abu lembut + tombol panah, dropdown saran langsung
 * (pencarian populer, kategori, produk dengan foto & harga coret), navigasi keyboard,
 * pintasan "/" atau ⌘K.
 */
export function PrecisionSearchBox({
  categories,
  popular,
  autoFocus = false,
  onNavigate,
  variant = "header",
}: {
  categories: SearchCategory[];
  popular: string[];
  autoFocus?: boolean;
  onNavigate?: () => void;
  variant?: "header" | "sheet";
}) {
  const router = useRouter();
  const store = useStoreSettings();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const boxRef = React.useRef<HTMLDivElement>(null);
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<{ products: Suggestion[]; total: number }>({ products: [], total: 0 });
  const [active, setActive] = React.useState(-1);
  const [isMac, setIsMac] = React.useState(true);
  const listId = React.useId();

  React.useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent));
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  // Pintasan "/" dan ⌘K / Ctrl+K
  React.useEffect(() => {
    if (variant !== "header") return;
    const onKey = (e: KeyboardEvent) => {
      const typing = /input|textarea|select/i.test((e.target as HTMLElement)?.tagName || "") || (e.target as HTMLElement)?.isContentEditable;
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [variant]);

  // Tutup saat klik di luar
  React.useEffect(() => {
    if (!open || variant !== "header") return;
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, variant]);

  // Saran produk (debounce, minimal 3 huruf sesuai API)
  React.useEffect(() => {
    const term = q.trim();
    if (term.length < 3) {
      setResults({ products: [], total: 0 });
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const t = window.setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : { products: [], total: 0 }))
        .then((d) => setResults({ products: d.products || [], total: d.total || 0 }))
        .catch(() => undefined)
        .finally(() => setLoading(false));
    }, 220);
    return () => {
      ctrl.abort();
      window.clearTimeout(t);
    };
  }, [q]);

  const term = q.trim();
  const items: Item[] = React.useMemo(() => {
    if (!term) {
      const pop = (popular.length ? popular : categories.slice(0, 5).map((c) => prettyCategoryName(c.name))).slice(0, 6);
      return [
        ...pop.map((label) => ({ kind: "popular" as const, label, href: `/katalog?q=${encodeURIComponent(label)}` })),
        ...categories.slice(0, 6).map((c) => ({
          kind: "category" as const,
          label: prettyCategoryName(c.name),
          name: c.name,
          icon: c.icon,
          count: c.count,
          href: `/katalog?kategori=${c.slug}`,
        })),
      ];
    }
    const lower = term.toLowerCase();
    const cats = categories
      .filter((c) => c.name.toLowerCase().includes(lower))
      .slice(0, 3)
      .map((c) => ({ kind: "category" as const, label: prettyCategoryName(c.name), name: c.name, icon: c.icon, count: c.count, href: `/katalog?kategori=${c.slug}` }));
    const prods = results.products.map((p) => ({ kind: "product" as const, label: p.name, href: `/produk/${p.slug}`, product: p }));
    return [...cats, ...prods, { kind: "all" as const, label: term, href: `/katalog?q=${encodeURIComponent(term)}` }];
  }, [term, popular, categories, results.products]);

  React.useEffect(() => setActive(-1), [term]);

  const go = (href: string) => {
    setOpen(false);
    setQ("");
    inputRef.current?.blur();
    onNavigate?.();
    router.push(href);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (active >= 0 && items[active]) return go(items[active].href);
    go(term ? `/katalog?q=${encodeURIComponent(term)}` : "/katalog");
  };

  const popularItems = items.filter((i) => i.kind === "popular");
  const categoryItems = items.filter((i) => i.kind === "category");
  const productItems = items.filter((i) => i.kind === "product");
  const allItem = items.find((i) => i.kind === "all");
  const indexOf = (item: Item) => items.indexOf(item);
  const showPanel = open || variant === "sheet";

  return (
    <div ref={boxRef} className="relative w-full">
      <form role="search" onSubmit={submit} className="relative">
        <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8b8e8a]" aria-hidden />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Cari laptop, printer, aksesori, atau kode produk…"
          aria-label="Cari produk"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          className={`h-11 w-full rounded-full border border-transparent bg-[#f1f1ef] pl-11 pr-24 text-[14px] text-[#0b0d0c] outline-none transition-[background-color,border-color,box-shadow] duration-300 placeholder:text-[#8b8e8a] hover:bg-[#ececea] focus:border-[#d9d9d5] focus:bg-white focus:shadow-[0_8px_30px_-12px_rgba(11,13,12,0.25)] ${
            variant === "sheet" ? "h-12 text-[15px]" : ""
          }`}
        />
        <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
          {term ? (
            <button
              type="button"
              aria-label="Hapus pencarian"
              onClick={() => {
                setQ("");
                inputRef.current?.focus();
              }}
              className="flex h-7 w-7 items-center justify-center rounded-full border-0 bg-transparent text-[#8b8e8a] hover:bg-[#e6e6e3] hover:text-[#0b0d0c]"
            >
              <X size={14} />
            </button>
          ) : (
            variant === "header" && (
              <kbd className={`${MONO} hidden rounded-md border border-[#dcdcd8] bg-white px-1.5 py-0.5 text-[10.5px] text-[#6b6f6c] lg:inline`}>
                {isMac ? "⌘K" : "Ctrl K"}
              </kbd>
            )
          )}
          <button
            type="submit"
            aria-label="Cari"
            className={`flex h-8 w-8 items-center justify-center rounded-full border-0 bg-brand text-brand-ink transition-[filter,transform] duration-300 hover:scale-105 ${
              term ? "" : "opacity-85"
            }`}
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
          </button>
        </div>
      </form>

      {showPanel && (
        <div
          id={listId}
          role="listbox"
          className={`pc-drop z-50 overflow-hidden ${
            variant === "header"
              ? "absolute left-0 right-0 top-[calc(100%+8px)] rounded-2xl border border-[#e6e6e3] bg-white shadow-[0_24px_60px_-20px_rgba(11,13,12,0.35)]"
              : "mt-4"
          }`}
        >
          <div className="max-h-[70vh] overflow-y-auto p-2">
            {popularItems.length > 0 && (
              <div className="px-2 pb-2 pt-2">
                <span className={`${MONO} mb-2 flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.12em] text-[#8b8e8a]`}>
                  <TrendingUp size={12} /> Pencarian populer
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {popularItems.map((it) => (
                    <button
                      key={it.label}
                      id={`${listId}-${indexOf(it)}`}
                      type="button"
                      role="option"
                      aria-selected={active === indexOf(it)}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => go(it.href)}
                      className={`rounded-full border px-3 py-1.5 text-[12.5px] transition-colors ${
                        active === indexOf(it) ? "border-[#0b0d0c] bg-[#0b0d0c] text-white" : "border-[#e6e6e3] bg-white text-[#0b0d0c] hover:border-[#0b0d0c]"
                      }`}
                    >
                      {it.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {categoryItems.length > 0 && (
              <div className="px-1 pb-1 pt-2">
                <span className={`${MONO} mb-1 block px-1 text-[10.5px] uppercase tracking-[0.12em] text-[#8b8e8a]`}>Kategori</span>
                <div className={`grid gap-0.5 ${!term ? "sm:grid-cols-2" : ""}`}>
                  {categoryItems.map((it) =>
                    it.kind === "category" ? (
                      <button
                        key={it.href}
                        id={`${listId}-${indexOf(it)}`}
                        type="button"
                        role="option"
                        aria-selected={active === indexOf(it)}
                        onMouseDown={(e) => e.preventDefault()}
                        onMouseEnter={() => setActive(indexOf(it))}
                        onClick={() => go(it.href)}
                        className={`group flex items-center gap-3 rounded-xl border-0 px-2 py-2 text-left transition-colors ${active === indexOf(it) ? "bg-[#f6f6f4]" : "bg-transparent"}`}
                      >
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${active === indexOf(it) ? "bg-brand text-brand-ink" : "bg-[#f1f1ef] text-[#3d413e]"}`}>
                          <CategoryIcon name={it.name} stored={it.icon} size={17} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-semibold text-[#0b0d0c]">{it.label}</span>
                          <span className={`${MONO} text-[11px] text-[#8b8e8a]`}>{it.count} produk</span>
                        </span>
                        <ArrowUpRight size={14} className="pc-arrow text-[#b9bbb7]" />
                      </button>
                    ) : null
                  )}
                </div>
              </div>
            )}

            {term && (
              <div className="px-1 pb-1 pt-2">
                <span className={`${MONO} mb-1 block px-1 text-[10.5px] uppercase tracking-[0.12em] text-[#8b8e8a]`}>Produk</span>
                {term.length < 3 ? (
                  <p className="m-0 px-2 py-2 text-[12.5px] text-[#8b8e8a]">Ketik minimal 3 huruf untuk melihat produk…</p>
                ) : loading && productItems.length === 0 ? (
                  <p className="m-0 px-2 py-2 text-[12.5px] text-[#8b8e8a]">Mencari…</p>
                ) : productItems.length === 0 ? (
                  <p className="m-0 px-2 py-2 text-[12.5px] text-[#8b8e8a]">Belum ada produk yang cocok dengan “{term}”.</p>
                ) : (
                  productItems.map((it) =>
                    it.kind === "product" ? (
                      <button
                        key={it.href}
                        id={`${listId}-${indexOf(it)}`}
                        type="button"
                        role="option"
                        aria-selected={active === indexOf(it)}
                        onMouseDown={(e) => e.preventDefault()}
                        onMouseEnter={() => setActive(indexOf(it))}
                        onClick={() => go(it.href)}
                        className={`flex w-full items-center gap-3 rounded-xl border-0 px-2 py-2 text-left transition-colors ${active === indexOf(it) ? "bg-[#f6f6f4]" : "bg-transparent"}`}
                      >
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#ececea] bg-white p-1">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={it.product.image} alt="" loading="lazy" className="max-h-full max-w-full object-contain" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-medium text-[#0b0d0c]">{it.product.name}</span>
                          <span className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
                            <span className={`${MONO} text-[12.5px] font-semibold text-[#0b0d0c]`}>
                              {it.product.price !== null
                                ? rupiah(it.product.price, store?.currency ?? "IDR", store?.locale ?? "id")
                                : store?.locale === "en"
                                  ? "Inquire"
                                  : "Hubungi"}
                            </span>
                            {it.product.originalPrice && (
                              <>
                                <span className={`${MONO} text-[11px] text-[#9a9d99] line-through`}>
                                  {rupiah(it.product.originalPrice, store?.currency ?? "IDR", store?.locale ?? "id")}
                                </span>
                                <span className="text-[11px] font-semibold text-brand">
                                  −{Math.round(((it.product.originalPrice - (it.product.price || 0)) / it.product.originalPrice) * 100)}%
                                </span>
                              </>
                            )}
                          </span>
                        </span>
                      </button>
                    ) : null
                  )
                )}
              </div>
            )}

            {allItem && (
              <button
                id={`${listId}-${indexOf(allItem)}`}
                type="button"
                role="option"
                aria-selected={active === indexOf(allItem)}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(indexOf(allItem))}
                onClick={() => go(allItem.href)}
                className={`mt-1 flex w-full items-center justify-between rounded-xl border-0 px-3 py-3 text-left text-[13px] font-semibold transition-colors ${
                  active === indexOf(allItem) ? "bg-[#0b0d0c] text-white" : "bg-[#f6f6f4] text-[#0b0d0c]"
                }`}
              >
                <span className="truncate">
                  Lihat semua hasil untuk “{allItem.label}”{results.total > 0 ? ` · ${results.total} produk` : ""}
                </span>
                <ArrowRight size={15} className="pc-arrow shrink-0" />
              </button>
            )}
          </div>
          {variant === "header" && (
            <div className={`${MONO} hidden items-center gap-4 border-t border-[#f0f0ee] px-4 py-2 text-[10.5px] text-[#8b8e8a] md:flex`}>
              <span>↑↓ pilih</span>
              <span>↵ buka</span>
              <span>esc tutup</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
