import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Product } from "@/lib/types";
import {
  availabilityLabel,
  effectiveOffer,
  getProductDiscount,
  priceLabel,
  rupiah,
} from "@/lib/catalog";
import { SafeImage } from "./safe-image";

export function ProductCard({
  product,
  priority = false,
  className = "",
}: {
  product: Product;
  priority?: boolean;
  className?: string;
}) {
  const offer = effectiveOffer(product);
  const discount = getProductDiscount(product);

  return (
    <Link
      href={`/produk/${product.slug}`}
      className={`product-card ${className}`}
    >
      <div className="product-image">
        <SafeImage
          src={product.images[0]}
          alt={product.name}
          priority={priority}
        />
        <div className="product-badges">
          <span
            className={`badge ${product.condition === "bekas" ? "badge-sage" : "badge-neutral"}`}
          >
            {product.condition === "bekas" ? "Bekas pilihan" : "Baru"}
          </span>
          {discount && (
            <span className="badge badge-discount">
              Hemat {rupiah(discount.savings)}
            </span>
          )}
          {product.labels.includes("Pilihan Toko") && !discount && (
            <span className="badge badge-red">Pilihan Toko</span>
          )}
        </div>
        <span className="product-open" aria-hidden="true">
          <ArrowUpRight size={18} />
        </span>
      </div>
      <div className="product-info">
        <span className="product-brand">{product.brand}</span>
        <h3>{product.name}</h3>
        <p className="product-summary">{product.summary}</p>
        <div className="product-price-wrap">
          {discount && (
            <div className="price-strike-row">
              <span className="price-normal">
                Normal {rupiah(discount.originalPrice)}
              </span>
              <span className="discount-badge">-{discount.percent}%</span>
            </div>
          )}
          <strong
            className={
              offer.price === null
                ? "product-price contact-price"
                : discount
                  ? "product-price promo-price"
                  : "product-price"
            }
          >
            {priceLabel(offer.price)}
          </strong>
        </div>
        {product.bonus && (
          <div className="product-bonus-tag" title={product.bonus}>
            <span>🎁 {product.bonus}</span>
          </div>
        )}
        <span className={`stock stock-${offer.availability}`}>
          <i />
          {availabilityLabel[offer.availability]}
          {product.stockLabel && (
            <strong className="stock-label-urgent" style={{ color: "var(--red)", fontWeight: 700 }}>
              {" · "}{product.stockLabel}
            </strong>
          )}
          {product.variants.length > 0 && (
            <span className="variant-count">
              · {product.variants.length} varian
            </span>
          )}
        </span>
      </div>
    </Link>
  );
}
export function ProductGrid({
  products,
  mobileProducts,
}: {
  products: Product[];
  mobileProducts?: Product[];
}) {
  const mobileIds = mobileProducts && new Set(mobileProducts.map((p) => p.id));
  const additional =
    mobileProducts?.filter((p) => !products.some((item) => item.id === p.id)) ??
    [];
  return (
    <div className="product-grid">
      {products.map((p) => (
        <ProductCard
          key={p.id}
          product={p}
          className={
            mobileIds && !mobileIds.has(p.id) ? "product-desktop-only" : ""
          }
        />
      ))}
      {additional.map((p) => (
        <ProductCard key={p.id} product={p} className="product-mobile-only" />
      ))}
    </div>
  );
}
