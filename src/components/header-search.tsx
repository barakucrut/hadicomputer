"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, Loader2 } from "lucide-react";

interface SearchProductItem {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number | null;
  priceFormatted: string;
  image: string;
  category: string;
}

export function HeaderSearch() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [results, setResults] = React.useState<SearchProductItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [hasMore, setHasMore] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Fetch search results with debounce
  React.useEffect(() => {
    const trimmed = searchTerm.trim();

    // Trigger only when user types 3 or more letters
    if (trimmed.length < 3) {
      setResults([]);
      setTotal(0);
      setHasMore(false);
      setIsOpen(false);
      setLoading(false);
      setActiveIndex(-1);
      return;
    }

    setActiveIndex(-1);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setIsOpen(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setResults(data.products || []);
        setTotal(data.total || 0);
        setHasMore(Boolean(data.hasMore));
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error(err);
          setResults([]);
          setTotal(0);
          setHasMore(false);
        }
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchTerm]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = searchTerm.trim();
    if (!trimmed) return;
    setIsOpen(false);
    setActiveIndex(-1);
    router.push(`/katalog?q=${encodeURIComponent(trimmed)}`);
  }

  function handleItemClick() {
    setIsOpen(false);
    setActiveIndex(-1);
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown || results.length === 0) return;

    const maxIndex = hasMore ? results.length : results.length - 1;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < maxIndex ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : maxIndex));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < results.length) {
        e.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
        router.push(`/produk/${results[activeIndex].slug}`);
      } else if (activeIndex === results.length && hasMore) {
        e.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
        router.push(`/katalog?q=${encodeURIComponent(trimmed)}`);
      }
    }
  }

  const trimmed = searchTerm.trim();
  const showDropdown = isOpen && trimmed.length >= 3;

  return (
    <div
      ref={containerRef}
      className="header-search-wrap"
    >
      <form
        onSubmit={handleSubmit}
        className="header-search"
        role="search"
      >
        <Search size={19} />
        <input
          aria-label="Cari produk"
          name="q"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleInputKeyDown}
          onFocus={() => {
            if (trimmed.length >= 3) {
              setIsOpen(true);
            }
          }}
          placeholder="Cari laptop, gadget, dan kebutuhanmu…"
          autoComplete="off"
        />
        {loading ? (
          <div
            style={{
              width: "29px",
              height: "29px",
              display: "grid",
              placeItems: "center",
              color: "#8d918e",
            }}
          >
            <Loader2 size={16} className="animate-spin" />
          </div>
        ) : (
          <button type="submit" aria-label="Cari">
            <ArrowRight size={18} />
          </button>
        )}
      </form>

      {/* Autocomplete Dropdown */}
      {showDropdown && (
        <div className="header-search-dropdown" role="listbox">
          {loading && results.length === 0 ? (
            <div className="header-search-empty">
              Mencari perangkat untuk &quot;{trimmed}&quot;...
            </div>
          ) : results.length > 0 ? (
            <>
              {results.map((product, idx) => (
                <Link
                  key={product.id}
                  href={`/produk/${product.slug}`}
                  onClick={handleItemClick}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={`header-search-item ${activeIndex === idx ? "is-active" : ""}`}
                  role="option"
                  aria-selected={activeIndex === idx}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="header-search-thumb"
                  />
                  <div className="header-search-info">
                    <span className="header-search-name" title={product.name}>
                      {product.name}
                    </span>
                    <span className="header-search-price">
                      {product.priceFormatted}
                    </span>
                  </div>
                </Link>
              ))}

              {hasMore && (
                <Link
                  href={`/katalog?q=${encodeURIComponent(trimmed)}`}
                  onClick={handleItemClick}
                  onMouseEnter={() => setActiveIndex(results.length)}
                  className={`header-search-footer ${activeIndex === results.length ? "is-active" : ""}`}
                >
                  <span>Lihat selengkapnya ({total} produk)</span>
                  <ArrowRight size={15} />
                </Link>
              )}
            </>
          ) : (
            <div className="header-search-empty">
              Tidak ada produk yang cocok dengan &quot;{trimmed}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
}
