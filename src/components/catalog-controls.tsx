"use client";
import { useRef, useId, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { SlidersHorizontal, X, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { categories } from "@/lib/repository";
import { rupiah, type CatalogQuery } from "@/lib/catalog";
import { Input, Select, Label, DualRangeSlider } from "@/components/ui";
import { CurrencyInput } from "./ui/currency-input";

const SLIDER_MIN = 0;
const SLIDER_MAX = 25000000;
const SLIDER_STEP = 500000;

function FilterForm({
  query,
  brands,
  categories: categoriesProp,
  needs: needsProp,
}: {
  query: CatalogQuery;
  brands: string[];
  categories?: Array<{ name: string; value: string }>;
  needs?: Array<{ name: string; slug: string }>;
}) {
  const categoryList = categoriesProp && categoriesProp.length > 0 ? categoriesProp : categories;
  const needList = needsProp && needsProp.length > 0 ? needsProp : [
    { name: "Kerja", slug: "kerja" },
    { name: "Kuliah", slug: "kuliah" },
    { name: "Kreatif", slug: "kreatif" },
    { name: "Gaming", slug: "gaming" },
    { name: "Harian", slug: "harian" },
  ];
  const prefix = useId();

  const parseNum = (val?: string, fallback = 0) => {
    if (!val) return fallback;
    const n = parseInt(val, 10);
    return isNaN(n) ? fallback : n;
  };

  const initialMin = parseNum(query.min, SLIDER_MIN);
  const initialMax = parseNum(query.max, SLIDER_MAX);

  const [sliderRange, setSliderRange] = useState<[number, number]>([
    initialMin,
    initialMax,
  ]);
  const [minInput, setMinInput] = useState<string>(query.min ?? "");
  const [maxInput, setMaxInput] = useState<string>(query.max ?? "");

  // Sync state when query prop changes
  useEffect(() => {
    const newMin = parseNum(query.min, SLIDER_MIN);
    const newMax = parseNum(query.max, SLIDER_MAX);
    setSliderRange([newMin, newMax]);
    setMinInput(query.min ?? "");
    setMaxInput(query.max ?? "");
  }, [query.min, query.max]);

  const handleSliderChange = (vals: [number, number]) => {
    setSliderRange(vals);
    setMinInput(vals[0] > SLIDER_MIN ? String(vals[0]) : "");
    setMaxInput(vals[1] < SLIDER_MAX ? String(vals[1]) : "");
  };

  const handleMinInputChange = (raw: string) => {
    setMinInput(raw);
    const num = parseInt(raw, 10);
    if (!isNaN(num)) {
      setSliderRange(([_, curMax]) => [
        Math.min(Math.max(SLIDER_MIN, num), curMax),
        curMax,
      ]);
    } else {
      setSliderRange(([_, curMax]) => [SLIDER_MIN, curMax]);
    }
  };

  const handleMaxInputChange = (raw: string) => {
    setMaxInput(raw);
    const num = parseInt(raw, 10);
    if (!isNaN(num)) {
      setSliderRange(([curMin, _]) => [
        curMin,
        Math.max(Math.min(SLIDER_MAX, num), curMin),
      ]);
    } else {
      setSliderRange(([curMin, _]) => [curMin, SLIDER_MAX]);
    }
  };

  return (
    <form action="/katalog" className="filter-form">
      <div className="filter-heading">
        <h2>Filter produk</h2>
        <Link href="/katalog" className="filter-reset-link">
          Reset
        </Link>
      </div>

      <div className="form-group">
        <Label htmlFor={`${prefix}-search`}>Kata kunci</Label>
        <div className="filter-search">
          <Search size={16} />
          <Input
            id={`${prefix}-search`}
            name="q"
            placeholder="Nama atau model…"
            defaultValue={query.q}
          />
        </div>
      </div>

      <div className="form-group">
        <Label htmlFor={`${prefix}-cat`}>Kategori</Label>
        <Select
          id={`${prefix}-cat`}
          name="kategori"
          defaultValue={query.kategori ?? ""}
        >
          <option value="">Semua kategori</option>
          {categoryList.map((c) => (
            <option key={c.value} value={c.value}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="form-group">
        <Label htmlFor={`${prefix}-brand`}>Merek</Label>
        <Select
          id={`${prefix}-brand`}
          name="merek"
          defaultValue={query.merek ?? ""}
        >
          <option value="">Semua merek</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </Select>
      </div>

      <div className="form-group">
        <Label htmlFor={`${prefix}-condition`}>Kondisi</Label>
        <Select
          id={`${prefix}-condition`}
          name="kondisi"
          defaultValue={query.kondisi ?? ""}
        >
          <option value="">Baru & bekas</option>
          <option value="baru">Baru</option>
          <option value="bekas">Bekas</option>
        </Select>
      </div>

      <div className="form-group">
        <Label htmlFor={`${prefix}-status`}>Ketersediaan</Label>
        <Select
          id={`${prefix}-status`}
          name="status"
          defaultValue={query.status ?? ""}
        >
          <option value="">Semua status</option>
          <option value="tersedia">Tersedia</option>
          <option value="preorder">Preorder</option>
          <option value="habis">Stok habis</option>
        </Select>
      </div>

      <fieldset className="price-fieldset">
        <legend className="shadcn-label">Rentang harga</legend>
        <div className="price-slider-container">
          <DualRangeSlider
            min={SLIDER_MIN}
            max={SLIDER_MAX}
            step={SLIDER_STEP}
            value={sliderRange}
            onChange={handleSliderChange}
          />
          <div className="price-slider-labels">
            <span>{rupiah(sliderRange[0])}</span>
            <span>{rupiah(sliderRange[1])}</span>
          </div>
        </div>

        <div className="price-inputs-grid">
          <div>
            <label className="price-sublabel" htmlFor={`${prefix}-min`}>
              Min (Rp)
            </label>
              <CurrencyInput
                id={`${prefix}-min`}
                name="min"
                placeholder="0"
                value={minInput}
                onValueChange={handleMinInputChange}
              />
          </div>
          <div>
            <label className="price-sublabel" htmlFor={`${prefix}-max`}>
              Maks (Rp)
            </label>
              <CurrencyInput
                id={`${prefix}-max`}
                name="max"
                placeholder="25.000.000"
                value={maxInput}
                onValueChange={handleMaxInputChange}
              />
          </div>
        </div>
      </fieldset>

      <div className="form-group">
        <Label htmlFor={`${prefix}-collection`}>Koleksi</Label>
        <Select
          id={`${prefix}-collection`}
          name="koleksi"
          defaultValue={query.koleksi ?? ""}
        >
          <option value="">Semua koleksi</option>
          {["Promo", "Pilihan Hadi", "Terbaru", "Terlaris"].map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </div>

      <div className="form-group">
        <Label htmlFor={`${prefix}-need`}>Kebutuhan</Label>
        <Select
          id={`${prefix}-need`}
          name="kebutuhan"
          defaultValue={query.kebutuhan ?? ""}
        >
          <option value="">Semua kebutuhan</option>
          {needList.map((n) => (
            <option key={n.slug} value={n.slug}>
              {n.name}
            </option>
          ))}
        </Select>
      </div>

      {query.urut && <input type="hidden" name="urut" value={query.urut} />}
      <button type="submit" className="button primary filter-submit-button">
        Terapkan filter
        <SlidersHorizontal size={16} />
      </button>
    </form>
  );
}

export function CatalogFilters({
  query,
  brands,
  categories: categoriesProp,
  needs: needsProp,
}: {
  query: CatalogQuery;
  brands: string[];
  categories?: Array<{ name: string; value: string }>;
  needs?: Array<{ name: string; slug: string }>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <aside className="desktop-filters" aria-label="Filter katalog">
        <FilterForm query={query} brands={brands} categories={categoriesProp} needs={needsProp} />
      </aside>
      <button
        className="button secondary mobile-filter-button"
        onClick={() => dialog.current?.showModal()}
      >
        <SlidersHorizontal size={17} />
        Filter produk
      </button>
      <dialog
        ref={dialog}
        aria-label="Filter produk"
        className="filter-dialog"
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current?.close();
        }}
      >
        <div className="dialog-head">
          <strong>Sesuaikan pilihanmu</strong>
          <button
            className="icon-button"
            aria-label="Tutup filter"
            onClick={() => dialog.current?.close()}
          >
            <X size={20} />
          </button>
        </div>
        <FilterForm query={query} brands={brands} categories={categoriesProp} needs={needsProp} />
      </dialog>
    </>
  );
}

export function CatalogSort({ value }: { value?: string }) {
  const router = useRouter();
  const search = useSearchParams();
  return (
    <div className="sort-label">
      <span>Urutkan</span>
      <Select
        aria-label="Urutkan produk"
        value={value ?? "terbaru"}
        wrapperClassName="sort-select-wrapper"
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
          const params = new URLSearchParams(search);
          params.set("urut", e.target.value);
          params.delete("page");
          router.push(`/katalog?${params}`);
        }}
      >
        <option value="terbaru">Terbaru</option>
        <option value="harga-naik">Harga terendah</option>
        <option value="harga-turun">Harga tertinggi</option>
      </Select>
    </div>
  );
}

export function CatalogPagination({
  currentPage,
  totalPages,
  query,
}: {
  currentPage: number;
  totalPages: number;
  query: CatalogQuery;
}) {
  const router = useRouter();

  function getPageHref(page: number) {
    const params = new URLSearchParams(query as Record<string, string>);
    params.set("page", String(page));
    return `/katalog?${params.toString()}`;
  }

  const handlePageClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    e.preventDefault();
    const catalogElement =
      document.querySelector(".catalog-layout") ||
      document.querySelector(".page-heading");
    if (catalogElement) {
      const topOffset =
        catalogElement.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: Math.max(0, topOffset), behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    router.push(href, { scroll: false });
  };

  return (
    <nav className="pagination" aria-label="Halaman katalog">
      {currentPage > 1 && (
        <Link
          href={getPageHref(currentPage - 1)}
          aria-label="Halaman sebelumnya"
          onClick={(e) => handlePageClick(e, getPageHref(currentPage - 1))}
        >
          <ChevronLeft size={18} />
        </Link>
      )}
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <Link
          key={page}
          href={getPageHref(page)}
          aria-current={page === currentPage ? "page" : undefined}
          onClick={(e) => handlePageClick(e, getPageHref(page))}
        >
          {page}
        </Link>
      ))}
      {currentPage < totalPages && (
        <Link
          href={getPageHref(currentPage + 1)}
          aria-label="Halaman berikutnya"
          onClick={(e) => handlePageClick(e, getPageHref(currentPage + 1))}
        >
          <ChevronRight size={18} />
        </Link>
      )}
    </nav>
  );
}
