"use client";

import { useEffect, useRef, useState } from "react";
import { Share2, Check, Copy, MessageCircle } from "lucide-react";
import type { Product } from "@/lib/types";
import { priceLabel, rupiah } from "@/lib/catalog";
import { useStoreSettings } from "@/components/store-context";

export function ShareButton({
  product,
  offerPrice,
  savings,
  className = "",
}: {
  product: Product;
  offerPrice: number | null;
  savings?: number | null;
  className?: string;
}) {
  const store = useStoreSettings();
  const storeName = store?.name || (store?.locale === "en" ? "our store" : "toko kami");
  const [copied, setCopied] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown]);

  async function handleShare() {
    const currentUrl = typeof window !== "undefined" ? window.location.href : "";
    const locale = store?.locale ?? "id";
    const currency = store?.currency ?? "IDR";
    const savingsText = savings
      ? ` (${locale === "en" ? "Save" : "Hemat"} ${rupiah(savings, currency, locale)})`
      : "";
    const title = `${product.name} | ${storeName}`;
    const text =
      locale === "en"
        ? `Check out ${product.name} at ${storeName}: ${priceLabel(offerPrice, currency, locale)}${savingsText}`
        : `Cek ${product.name} di ${storeName}: ${priceLabel(offerPrice, currency, locale)}${savingsText}`;

    // 1. Native Web Share API (Primary for smartphones / modern browsers)
    if (
      typeof navigator !== "undefined" &&
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({ url: currentUrl })
    ) {
      try {
        await navigator.share({
          title,
          text,
          url: currentUrl,
        });
        return;
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          return; // User canceled the share prompt
        }
      }
    }

    // 2. Desktop / Fallback: Copy link and toggle menu
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setShowDropdown(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setShowDropdown(true);
    }
  }

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareLocale = store?.locale ?? "id";
  const shareCurrency = store?.currency ?? "IDR";
  const savingsText = savings
    ? ` (${shareLocale === "en" ? "Save" : "Hemat"} ${rupiah(savings, shareCurrency, shareLocale)})`
    : "";
  const waShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    shareLocale === "en"
      ? `Check out ${product.name} at ${storeName}: ${priceLabel(offerPrice, shareCurrency, shareLocale)}${savingsText}\n${currentUrl}`
      : `Cek ${product.name} di ${storeName}: ${priceLabel(offerPrice, shareCurrency, shareLocale)}${savingsText}\n${currentUrl}`,
  )}`;

  return (
    <div className={`share-button-wrap ${className}`} ref={wrapRef}>
      <button
        type="button"
        className={`share-btn ${copied ? "copied" : ""}`}
        onClick={handleShare}
        aria-label="Bagikan produk ini"
        title="Bagikan produk ini"
      >
        {copied ? <Check size={16} /> : <Share2 size={16} />}
        <span>{copied ? "Tautan Disalin!" : "Bagikan"}</span>
      </button>

      {showDropdown && (
        <div className="share-dropdown">
          <div className="share-dropdown-header">
            <span>Bagikan Produk</span>
            <button
              type="button"
              className="share-close-btn"
              onClick={() => setShowDropdown(false)}
              aria-label="Tutup"
            >
              ×
            </button>
          </div>
          <div className="share-options">
            <button
              type="button"
              className="share-opt-btn"
              onClick={async () => {
                await navigator.clipboard.writeText(currentUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
              <span>{copied ? "Tautan Berhasil Disalin" : "Salin Tautan"}</span>
            </button>
            <a
              href={waShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="share-opt-btn share-opt-wa"
              onClick={() => setShowDropdown(false)}
            >
              <MessageCircle size={15} />
              <span>Kirim via WhatsApp</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
