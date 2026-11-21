import type { Product, ProductVariant } from "./types";

export const rupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
export const priceLabel = (value: number | null) =>
  value === null ? "Hubungi untuk harga" : rupiah(value);
export const availabilityLabel = {
  tersedia: "Tersedia",
  preorder: "Preorder",
  habis: "Stok habis",
};
export function effectiveOffer(product: Product, variant?: ProductVariant) {
  const selected = variant ?? product.variants[0];
  return selected
    ? { price: selected.price, availability: selected.availability }
    : { price: product.price, availability: product.availability };
}
export function getProductDiscount(product: Product, variant?: ProductVariant) {
  const selected = variant ?? product.variants[0];
  const price = selected ? selected.price : product.price;
  const originalPrice =
    (selected && selected.originalPrice) ?? product.originalPrice ?? null;
  if (!originalPrice || !price || originalPrice <= price) return null;
  const savings = originalPrice - price;
  const percent = Math.round((savings / originalPrice) * 100);
  return { originalPrice, price, savings, percent };
}
export type CatalogQuery = {
  q?: string;
  kategori?: string;
  merek?: string;
  kondisi?: string;
  status?: string;
  min?: string;
  max?: string;
  urut?: string;
  page?: string;
  koleksi?: string;
  kebutuhan?: string;
};
export function queryCatalog(
  products: Product[],
  query: CatalogQuery,
  pageSize = 12,
) {
  const hasMin = !!query.min && Number.isFinite(Number(query.min));
  const hasMax = !!query.max && Number.isFinite(Number(query.max));
  const filtered = products.filter((product) => {
    const offer = effectiveOffer(product);
    const text =
      `${product.name} ${product.brand} ${product.code}`.toLocaleLowerCase(
        "id",
      );
    return (
      (!query.q || text.includes(query.q.trim().toLocaleLowerCase("id"))) &&
      (!query.kategori || product.category === query.kategori) &&
      (!query.merek || product.brand === query.merek) &&
      (!query.kondisi || product.condition === query.kondisi) &&
      (!query.status || offer.availability === query.status) &&
      (!query.koleksi ||
        (query.koleksi.toLowerCase() === "promo"
          ? product.labels.includes("Promo") ||
            (Boolean(product.originalPrice) &&
              Boolean(product.price) &&
              (product.originalPrice as number) > (product.price as number)) ||
            product.variants.some(
              (v) =>
                Boolean(v.originalPrice) &&
                Boolean(v.price) &&
                (v.originalPrice as number) > (v.price as number),
            )
          : product.labels.includes(query.koleksi === "Pilihan Hadi" ? "Pilihan Toko" : query.koleksi))) &&
      (!query.kebutuhan || product.needs.includes(query.kebutuhan)) &&
      (!(hasMin || hasMax) ||
        (offer.price !== null &&
          (!hasMin || offer.price >= Number(query.min)) &&
          (!hasMax || offer.price <= Number(query.max))))
    );
  });
  filtered.sort((a, b) => {
    if (query.urut === "harga-naik" || query.urut === "harga-turun") {
      const x = effectiveOffer(a).price,
        y = effectiveOffer(b).price;
      if (x === null) return y === null ? a.name.localeCompare(b.name) : 1;
      if (y === null) return -1;
      return query.urut === "harga-naik" ? x - y : y - x;
    }
    return b.publishedAt.localeCompare(a.publishedAt);
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const requested = Number(query.page);
  const page = Number.isFinite(requested)
    ? Math.min(totalPages, Math.max(1, Math.floor(requested)))
    : 1;
  return {
    products: filtered.slice((page - 1) * pageSize, page * pageSize),
    total: filtered.length,
    page,
    totalPages,
  };
}
export function productMessage(
  product: Product,
  variant: ProductVariant | undefined,
  url: string,
  storeName = "",
) {
  const offer = effectiveOffer(product, variant);
  const discount = getProductDiscount(product, variant);
  const discountLine = discount
    ? `\nPromo: Hemat ${rupiah(discount.savings)} (${discount.percent}%)`
    : "";
  const bonusLine = product.bonus ? `\nBonus: ${product.bonus}` : "";

  return `Halo ${storeName || "kak"}, saya ingin bertanya tentang:\n\nProduk: ${product.name}\nKode: ${product.code}${variant ? `\nVarian: ${variant.name}` : ""}\nHarga katalog: ${priceLabel(offer.price)}${discountLine}${bonusLine}\nTautan: ${url}\n\nApakah produk ini masih tersedia?`;
}
