"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

/**
 * Google Analytics 4 & Google Tag Manager untuk storefront.
 * - platformGaId: property GA4 milik RigSpace (env NEXT_PUBLIC_PLATFORM_GA_ID), semua toko,
 *   dengan parameter "tenant" di setiap event agar bisa difilter per toko.
 * - tenantGaId / gtmId: milik toko (opsional, diisi di Pengaturan → SEO & Analitik).
 * Tidak pernah dimuat di halaman CMS (/admin, /god-mode, /docs).
 * ID sudah divalidasi ketat di server (format G-XXXX / GTM-XXXX), aman disisipkan ke script.
 */
export function StorefrontAnalytics({
  platformGaId,
  tenantGaId,
  gtmId,
  tenantSlug,
}: {
  platformGaId: string | null;
  tenantGaId: string | null;
  gtmId: string | null;
  tenantSlug: string;
}) {
  const pathname = usePathname() || "/";
  if (/^\/(admin|god-mode|docs)(\/|$)/.test(pathname)) return null;

  const safe = (id: string | null, re: RegExp) => (id && re.test(id) ? id : null);
  const platform = safe(platformGaId, /^G-[A-Z0-9]{4,12}$/);
  const own = safe(tenantGaId, /^G-[A-Z0-9]{4,12}$/);
  const gtm = safe(gtmId, /^GTM-[A-Z0-9]{4,10}$/);
  const slug = tenantSlug.replace(/[^a-z0-9_-]/gi, "");
  const gaIds = [platform, own].filter((x): x is string => Boolean(x) && x !== null);
  const loaderId = gaIds[0];

  return (
    <>
      {loaderId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${loaderId}`} strategy="afterInteractive" />
          <Script id="rigspace-gtag" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
${platform ? `gtag('config', '${platform}', { tenant: '${slug}' });` : ""}
${own ? `gtag('config', '${own}');` : ""}`}
          </Script>
        </>
      )}
      {gtm && (
        <>
          <Script id="rigspace-gtm" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');`}
          </Script>
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtm}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
              title="Google Tag Manager"
            />
          </noscript>
        </>
      )}
    </>
  );
}

/** Kirim event ke GA4/GTM bila terpasang (aman dipanggil kapan saja). */
export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const w = window as unknown as { gtag?: (...args: unknown[]) => void; dataLayer?: unknown[] };
  try {
    if (typeof w.gtag === "function") w.gtag("event", name, params);
    else if (Array.isArray(w.dataLayer)) w.dataLayer.push({ event: name, ...params });
  } catch {
    // analitik tidak boleh mengganggu pembeli
  }
}
