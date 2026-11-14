"use client";
import { useState } from "react";
import { CheckCheck, ShieldCheck, MessageCircle, ZoomIn } from "lucide-react";
import type { Product } from "@/lib/types";
import {
  availabilityLabel,
  effectiveOffer,
  getProductDiscount,
  priceLabel,
  productMessage,
  rupiah,
} from "@/lib/catalog";
import { SafeImage } from "./safe-image";
import { WhatsAppButton } from "./whatsapp-button";
import { ShareButton } from "./share-button";

export function ProductDetail({
  product,
  whatsappPhone,
}: {
  product: Product;
  whatsappPhone?: string | null;
}) {
  const [image, setImage] = useState(0),
    [variantId, setVariantId] = useState(product.variants[0]?.id);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isFading, setIsFading] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  const handleThumbnailClick = (index: number) => {
    if (index === image) return;
    setIsFading(true);
    setImage(index);
    setTimeout(() => setIsFading(false), 200);
  };

  const variant = product.variants.find((v) => v.id === variantId),
    offer = effectiveOffer(product, variant),
    discount = getProductDiscount(product, variant);
  const message = productMessage(
    product,
    variant,
    `{origin}/produk/${product.slug}`,
  );
  const label =
    offer.availability === "habis"
      ? "Tanya Ketersediaan"
      : "Tanya Produk via WhatsApp";
  const trackingData = {
    inquiryType: "PRODUCT" as const,
    productId: product.id,
    variantName: variant?.name,
    priceAtInquiry: offer.price ?? undefined,
  };

  return (
    <>
      <div className="product-detail-layout">
        <div className="product-gallery">
          <div
            className={`gallery-main ${isZoomed ? "zoomed" : ""}`}
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => {
              setIsZoomed(false);
              setZoomPos({ x: 50, y: 50 });
            }}
            onMouseMove={handleMouseMove}
          >
            <div
              className={`gallery-image-wrap ${isFading ? "fade" : ""}`}
              style={{
                transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                transform: isZoomed ? "scale(2.2)" : "scale(1)",
              }}
            >
              <SafeImage
                src={product.images[image]}
                alt={`${product.name} — foto ${image + 1}`}
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <span className="gallery-caption">
              <ZoomIn size={14} />
              {isZoomed
                ? "Geser kursor untuk memperbesar"
                : `Foto ${image + 1} dari ${product.images.length} · Arahkan untuk perbesar`}
            </span>
          </div>
          <div
            className="gallery-thumbnails"
            role="group"
            aria-label="Pilih foto produk"
          >
            {product.images.map((src, i) => (
              <button
                className={image === i ? "active" : ""}
                key={src}
                onClick={() => handleThumbnailClick(i)}
                aria-label={`Lihat foto ${i + 1}`}
                aria-pressed={image === i}
              >
                <SafeImage
                  src={src}
                  alt={`Sudut produk ${i + 1}`}
                  sizes="80px"
                />
              </button>
            ))}
          </div>
          <p className="small-note">
            Kondisi fisik unit & kelengkapan dapat dikonfirmasi langsung via WhatsApp.
          </p>
        </div>
        <div className="detail-info">
          <div className="detail-header-row">
            <div className="detail-badges">
              <span
                className={`badge ${product.condition === "bekas" ? "badge-sage" : "badge-neutral"}`}
              >
                {product.condition === "bekas" ? "Bekas pilihan" : "Produk baru"}
              </span>
              {product.labels.includes("Pilihan Hadi") && (
                <span className="badge badge-red">Pilihan Hadi</span>
              )}
            </div>
            <ShareButton
              product={product}
              offerPrice={offer.price}
              savings={discount?.savings}
            />
          </div>
          <span className="eyebrow">
            {product.brand} · {product.code}
          </span>
          <h1>{product.name}</h1>
          <p className="detail-summary">{product.summary}</p>
          <div className="detail-price-block" aria-live="polite">
            {discount && (
              <div className="price-strike-row">
                <span className="price-normal">Normal {rupiah(discount.originalPrice)}</span>
                <span className="discount-badge">-{discount.percent}%</span>
              </div>
            )}
            <strong className={`detail-price ${discount ? "promo-price" : ""}`}>
              {priceLabel(offer.price)}
            </strong>
            {discount && (
              <div className="savings-callout">
                <span>
                  💡 <strong>Penawaran Terbaik:</strong> Anda berhemat{" "}
                  <strong>{rupiah(discount.savings)}</strong> ({discount.percent}% lebih hemat)
                </span>
              </div>
            )}
            {product.bonus && (
              <div className="detail-bonus-card">
                <strong>🎁 Paket Bonus Spesial:</strong>
                <p>{product.bonus} + Setup Siap Pakai & Garansi Toko</p>
              </div>
            )}
            <span className={`stock stock-${offer.availability}`}>
              <i />
              {availabilityLabel[offer.availability]}
            </span>
          </div>
          {product.variants.length > 0 && (
            <fieldset className="variant-options">
              <legend>Pilih konfigurasi</legend>
              {product.variants.map((v) => (
                <label
                  key={v.id}
                  className={variantId === v.id ? "selected" : ""}
                >
                  <input
                    type="radio"
                    name="variant"
                    value={v.id}
                    checked={variantId === v.id}
                    onChange={() => setVariantId(v.id)}
                  />
                  <span>{v.name}</span>
                </label>
              ))}
            </fieldset>
          )}
          <div className="detail-benefits">
            <span>
              <ShieldCheck size={18} />
              {product.warranty}
            </span>
            <span>
              <CheckCheck size={18} />
              {product.condition === "bekas"
                ? "Baca catatan kondisi sebelum memilih"
                : "Konsultasikan kelengkapan dengan owner"}
            </span>
          </div>
          <div className="detail-cta">
            <WhatsAppButton
              label={label}
              message={message}
              trackingData={trackingData}
              phone={whatsappPhone}
            />
            <p>
              <MessageCircle size={14} />
              Tanpa checkout. Tanya langsung, pilih lebih tenang.
            </p>
          </div>
        </div>
      </div>
      <div className="product-information">
        <section>
          <h2>Tentang produk</h2>
          <p>{product.description}</p>
          {product.conditionNote && (
            <div className="condition-note">
              <h3>Catatan kondisi barang bekas</h3>
              <p>{product.conditionNote}</p>
            </div>
          )}
        </section>
        <section>
          <h2>Spesifikasi ringkas</h2>
          <dl className="spec-table">
            {product.specs.map((s) => (
              <div key={s.name}>
                <dt>{s.name}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
            {variant && (
              <div>
                <dt>Varian terpilih</dt>
                <dd>{variant.name}</dd>
              </div>
            )}
          </dl>
          <p className="small-note">
            Spesifikasi dapat disesuaikan dengan ketersediaan opsi varian unit.
          </p>
        </section>
      </div>
      <div className="mobile-product-cta">
        <div>
          {discount && (
            <span className="mobile-strike">
              Normal {rupiah(discount.originalPrice)} (-{discount.percent}%)
            </span>
          )}
          <small>{availabilityLabel[offer.availability]}</small>
          <strong className={discount ? "promo-price" : ""}>{priceLabel(offer.price)}</strong>
        </div>
        <WhatsAppButton
          label={offer.availability === "habis" ? "Tanya Stok" : "Tanya Hadi"}
          message={message}
          trackingData={trackingData}
          phone={whatsappPhone}
        />
      </div>
    </>
  );
}
