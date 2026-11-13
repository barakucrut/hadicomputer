"use client";
import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";

const DEFAULT_WHATSAPP_PHONE = "+6285769000007";

export interface WhatsAppTrackingData {
  inquiryType?: "PRODUCT" | "SERVICE" | "GENERAL";
  productId?: string;
  serviceId?: string;
  variantName?: string;
  priceAtInquiry?: number;
}

export function WhatsAppButton({
  message = "Halo Hadi Computer, saya ingin konsultasi tentang produk dan layanan.",
  label = "Konsultasi via WhatsApp",
  className = "",
  phone = DEFAULT_WHATSAPP_PHONE,
  trackingData,
}: {
  message?: string;
  label?: string;
  className?: string;
  phone?: string | null;
  trackingData?: WhatsAppTrackingData;
}) {
  const rawPhone = phone || DEFAULT_WHATSAPP_PHONE;
  const phoneDigits = rawPhone.replace(/\D/g, "");

  // Initial URL (safe for SSR / before JS hydration)
  const initialUrl = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(
    message.replace("{origin}", ""),
  )}`;

  const [url, setUrl] = useState(initialUrl);

  // When loaded on client, resolve actual origin dynamically (whether localhost, ngrok, or cloudflare)
  useEffect(() => {
    const origin = window.location.origin;
    const resolvedMessage = message.replace("{origin}", origin);
    setUrl(
      `https://wa.me/${phoneDigits}?text=${encodeURIComponent(resolvedMessage)}`,
    );
  }, [message, phoneDigits]);

  const handleClick = () => {
    if (trackingData) {
      try {
        const payload = JSON.stringify(trackingData);
        if (typeof navigator !== "undefined" && navigator.sendBeacon) {
          navigator.sendBeacon("/api/inquiry/track", payload);
        } else {
          fetch("/api/inquiry/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
            keepalive: true,
          }).catch(() => {});
        }
      } catch (err) {
        // non-blocking
      }
    }
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={`button whatsapp ${className}`}
    >
      <MessageCircle size={18} />
      <span>{label}</span>
    </a>
  );
}
