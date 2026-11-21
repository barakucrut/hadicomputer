/**
 * Logika data template Precision (murni, tanpa React) — mudah dites.
 * Semua bagian dirancang aman untuk toko kosong maupun katalog ratusan produk.
 */
import type { Banner, Product } from "@/lib/types";
import { getProductDiscount } from "@/lib/catalog";

/** Kelas utilitas font (variabel didefinisikan di globals.css untuk data-template="precision"). */
export const DISPLAY = "[font-family:var(--pc-display)] tracking-[-0.02em]";
export const MONO = "[font-family:var(--pc-mono)] tabular-nums";

/** studio = produk transparan di panggung gelap · photo = banner foto penuh · product = otomatis dari foto produk */
export type SlideStyle = "studio" | "photo" | "product";

export interface HeroSlide {
  id: string;
  style: SlideStyle;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  href: string;
  cta: string;
  price: number | null;
  originalPrice: number | null;
  specs: string[];
  hotspots: { label: string; x: number; y: number }[];
}

export interface SideTile {
  id: string;
  style: SlideStyle;
  variant: "light" | "dark";
  eyebrow: string;
  title: string;
  meta: string;
  image: string;
  href: string;
  price: number | null;
  originalPrice: number | null;
}

/** Nama produk panjang -> judul singkat: potong di koma/garis miring pertama. */
export function shortName(name: string, max = 44): string {
  const cut = name.split(/,|\s\/\s|\s–\s|\s-\s/)[0].trim();
  const base = cut.length >= 12 ? cut : name;
  return base.length > max ? `${base.slice(0, max - 1).trimEnd()}…` : base;
}

/** Diskon nyata sebuah produk (harga coret > harga) atau null. */
export function discountOf(p: Product) {
  return getProductDiscount(p);
}

/** Produk paling layak tampil: bergambar asli, berharga, dan diutamakan label Pilihan/Promo. */
export function rankProducts(products: Product[]): Product[] {
  const hasRealImage = (p: Product) => p.images.length > 0 && !p.images[0].includes("/images/banners/");
  return [...products]
    .filter((p) => hasRealImage(p) && p.price !== null && p.availability !== "habis")
    .sort((a, b) => {
      const score = (p: Product) =>
        (p.labels.includes("Pilihan Toko") ? 4 : 0) +
        (discountOf(p) ? 3 : 0) +
        (p.labels.includes("Terlaris") ? 2 : 0) +
        (p.specs.length >= 3 ? 1 : 0);
      return score(b) - score(a) || (b.price || 0) - (a.price || 0);
    });
}

const slideFromProduct = (p: Product, category?: string): HeroSlide => {
  const d = discountOf(p);
  return {
    id: `auto-${p.id}`,
    style: "product",
    eyebrow: [category?.toUpperCase(), d ? `HEMAT ${d.percent}%` : "PILIHAN TOKO"].filter(Boolean).join(" · "),
    title: shortName(p.name, 40),
    description: p.summary && p.summary !== p.name ? p.summary : p.specs.slice(0, 3).map((s) => s.value).join(" · "),
    image: p.images[0],
    href: `/produk/${p.slug}`,
    cta: "Lihat Produk",
    price: p.price,
    originalPrice: d ? d.originalPrice : null,
    specs: p.specs.slice(0, 3).map((s) => s.value),
    hotspots: [],
  };
};

/**
 * Slide hero: banner CMS ber-posisi "hero". Bila toko belum punya banner,
 * otomatis disusun dari produk unggulan (maks. 3) — toko baru langsung terlihat jadi.
 */
export function buildHeroSlides(banners: Banner[], products: Product[], categoryName: (slug: string) => string): HeroSlide[] {
  const hero = banners.filter((b) => (b.placement ?? "hero") === "hero" && b.image);
  if (hero.length > 0) {
    return hero.map((b) => ({
      id: b.id,
      style: b.style === "studio" ? "studio" : "photo",
      eyebrow: b.eyebrow,
      title: b.title,
      description: b.description,
      image: b.image,
      href: b.href,
      cta: b.cta,
      price: b.price ?? null,
      originalPrice: b.originalPrice && b.price && b.originalPrice > b.price ? b.originalPrice : null,
      specs: b.specs ?? [],
      hotspots: b.hotspots ?? [],
    }));
  }
  return rankProducts(products)
    .slice(0, 3)
    .map((p) => slideFromProduct(p, categoryName(p.category)));
}

/**
 * Dua tile samping: banner CMS ber-posisi "tile"; sisanya otomatis
 * (kategori terbesar kedua & produk Pilihan Toko/promo).
 */
export function buildSideTiles(
  banners: Banner[],
  products: Product[],
  index: CategoryIndexRow[],
  excludeIds: Set<string>
): SideTile[] {
  const tiles: SideTile[] = banners
    .filter((b) => b.placement === "tile" && b.image)
    .slice(0, 2)
    .map((b, i) => ({
      id: b.id,
      style: b.style === "studio" ? "studio" : "photo",
      variant: b.style === "studio" || i === 1 ? "dark" : "light",
      eyebrow: b.eyebrow,
      title: b.title,
      meta: b.description,
      image: b.image,
      href: b.href,
      price: b.price ?? null,
      originalPrice: b.originalPrice && b.price && b.originalPrice > b.price ? b.originalPrice : null,
    }));

  if (tiles.length < 1) {
    const cat = index.find((c) => c.image) ;
    if (cat) {
      tiles.push({
        id: `cat-${cat.slug}`,
        style: "product",
        variant: "light",
        eyebrow: cat.name.toUpperCase(),
        title: `Koleksi ${cat.name}`,
        meta: `${cat.count} unit${cat.minPrice ? ` · mulai ${shortRupiah(cat.minPrice)}` : ""}`,
        image: cat.image!,
        href: `/katalog?kategori=${cat.slug}`,
        price: null,
        originalPrice: null,
      });
    }
  }
  if (tiles.length < 2) {
    const pick = rankProducts(products).find((p) => !excludeIds.has(`auto-${p.id}`));
    if (pick) {
      const d = discountOf(pick);
      tiles.push({
        id: `pick-${pick.id}`,
        style: "product",
        variant: "dark",
        eyebrow: "PILIHAN TOKO",
        title: shortName(pick.name, 34),
        meta: pick.specs.slice(0, 2).map((s) => s.value).join(" · "),
        image: pick.images[0],
        href: `/produk/${pick.slug}`,
        price: pick.price,
        originalPrice: d ? d.originalPrice : null,
      });
    }
  }
  return tiles.slice(0, 2);
}

export interface CategoryIndexRow {
  slug: string;
  name: string;
  count: number;
  minPrice: number | null;
  image: string | null;
}

/**
 * Indeks kategori: jumlah unit & harga "mulai" yang wajar.
 * Harga mulai mengabaikan outlier (produk salah kategori, mis. kabel Rp 4.000 di kategori Laptop):
 * diambil harga terendah yang ≥ 15% dari median harga kategori.
 */
export function buildCategoryIndex(
  products: Product[],
  categories: Array<{ name: string; value: string }>
): CategoryIndexRow[] {
  const rows = categories.map((c) => {
    const items = products.filter((p) => p.category === c.value);
    const prices = items.map((p) => p.price).filter((v): v is number => typeof v === "number" && v > 0).sort((a, b) => a - b);
    const median = prices.length ? prices[Math.floor(prices.length / 2)] : 0;
    const minPrice = prices.find((v) => v >= median * 0.15) ?? null;
    const image = rankProducts(items)[0]?.images[0] ?? null;
    return { slug: c.value, name: c.name, count: items.length, minPrice, image };
  });
  return rows.filter((r) => r.count > 0).sort((a, b) => b.count - a.count);
}

/** Papan harga: produk ber-diskon nyata (hemat terbesar dulu), dilengkapi produk terbaru. */
export function buildPriceBoard(products: Product[], limit = 10): Product[] {
  const discounted = products
    .filter((p) => discountOf(p))
    .sort((a, b) => (discountOf(b)!.savings || 0) - (discountOf(a)!.savings || 0));
  const rest = products.filter((p) => !discountOf(p) && p.price !== null);
  return [...discounted, ...rest].slice(0, limit);
}

/** "Rp 4.900.000" -> "Rp 4,9 jt" untuk teks ringkas. */
export function shortRupiah(v: number): string {
  if (v >= 1_000_000) return `Rp ${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1).replace(".", ",")} jt`;
  if (v >= 1_000) return `Rp ${Math.round(v / 1_000)} rb`;
  return `Rp ${v}`;
}

/**
 * Rapikan nama kategori hasil impor untuk tampilan (data asli tidak diubah):
 * "Printer And Fax" -> "Printer & Fax", "Desktop & All In One PC" -> "Desktop & All-in-One PC".
 */
export function prettyCategoryName(name: string): string {
  return name
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\bAll In One\b/gi, "All-in-One")
    .replace(/\s+(and|dan)\s+/gi, " & ");
}

/** Kunci ikon kategori berdasarkan nama (dipetakan ke ikon di category-icon.tsx). */
export type CategoryIconKey =
  | "laptop" | "desktop" | "monitor" | "printer" | "tablet" | "phone" | "accessory" | "storage"
  | "network" | "audio" | "camera" | "gaming" | "component" | "projector" | "watch" | "ink" | "package";

const ICON_RULES: Array<[CategoryIconKey, RegExp]> = [
  ["laptop", /laptop|notebook|ultrabook|macbook/i],
  ["desktop", /desktop|all[- ]?in[- ]?one|\bpc\b|komputer|computer/i],
  ["monitor", /monitor|display|layar/i],
  ["printer", /printer|scanner|fax/i],
  ["ink", /tinta|ink|toner|cartridge/i],
  ["tablet", /tablet|ipad/i],
  ["phone", /phone|ponsel|handphone|hp\b|smartphone/i],
  ["watch", /watch|jam/i],
  ["projector", /projector|proyektor/i],
  ["storage", /ssd|hdd|storage|penyimpanan|flash|memory|memori/i],
  ["network", /network|jaringan|router|wifi|modem/i],
  ["audio", /audio|speaker|headset|headphone|earphone|tws/i],
  ["camera", /camera|kamera|cctv|webcam/i],
  ["gaming", /gaming|game|console/i],
  ["component", /komponen|component|vga|processor|motherboard|ram|psu/i],
  ["accessory", /aksesori|accessor|mouse|keyboard|kabel|cable/i],
];

export function categoryIconKey(name: string, stored?: string | null): CategoryIconKey {
  for (const [key, rule] of ICON_RULES) if (rule.test(name)) return key;
  const known = ICON_RULES.map(([k]) => k as string);
  return stored && known.includes(stored) ? (stored as CategoryIconKey) : "package";
}

/** Merek "keranjang" (bukan merek asli) tidak ditampilkan di menu & dinding merek. */
export function isGenericBrand(name: string): boolean {
  return /^(lainnya|lain[- ]?lain|other|others|no ?brand|non ?brand|tanpa merek|oem|generic|umum)$/i.test(name.trim());
}
