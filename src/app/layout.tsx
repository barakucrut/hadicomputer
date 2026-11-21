import type { Metadata } from "next";
import { brandCssVars } from "@/lib/brand-color";
import { PlatformHostPage } from "@/components/platform/platform-host-page";
import { LandingPage } from "@/components/platform/landing/landing-page";
import { getSalesContact } from "@/lib/platform-tenant";
import "@fontsource-variable/plus-jakarta-sans";
import "./tailwind.css";
import "./globals.css";
import "./mobile.css";
import { headers } from "next/headers";
import { Header, Footer, ThemeLiveSync } from "@/components/site-shell";
import { GamingHeader, GamingFooter } from "@/components/storefront/shells/gaming-shell";
import { BoutiqueHeader, BoutiqueFooter } from "@/components/storefront/shells/boutique-shell";
import { PrecisionHeader, PrecisionFooter } from "@/components/storefront/shells/precision-shell";
import { CMS_AREA_HEADER, resolveTemplateId, TEMPLATE_PREVIEW_HEADER } from "@/lib/storefront-template";
import { resolveStorefrontTenant } from "@/lib/tenant-resolver";
import { StoreProvider } from "@/components/store-context";
import { getLiveCategories, getLiveMenuData } from "@/lib/live-repository";
import { getStorefrontSeo } from "@/lib/tenant-seo";
import { StorefrontAnalytics } from "@/components/storefront-analytics";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  // Halaman CMS (/admin, /god-mode): tanpa metadata storefront toko mana pun
  if ((await headers()).get(CMS_AREA_HEADER) === "cms") {
    return {
      title: { absolute: "Rigspace.id — Content Management System" },
      robots: { index: false, follow: false },
    };
  }

  const seo = await getStorefrontSeo();
  // rigspace.id (sementara) & alamat toko yang tidak terdaftar: tanpa metadata toko mana pun
  if (seo.tenant.resolution === "platform-root") {
    const title = "Rigspace.id — Website Toko Komputer, Siap Jualan";
    const description =
      "Platform website khusus toko komputer: katalog dengan spesifikasi, chat WhatsApp langsung, tanpa potongan marketplace. Minta demo gratis dengan produk toko Anda sendiri.";
    return {
      metadataBase: new URL(seo.origin),
      title: { absolute: title },
      description,
      alternates: { canonical: "/" },
      robots: { index: true, follow: true },
      openGraph: {
        type: "website",
        locale: "id_ID",
        url: "/",
        siteName: "Rigspace.id",
        title,
        description,
        images: [{ url: "/platform/landing/hero-desktop.webp", width: 1600, height: 1000, alt: "Contoh website toko komputer di Rigspace.id" }],
      },
      twitter: { card: "summary_large_image", title, description, images: ["/platform/landing/hero-desktop.webp"] },
    };
  }
  if (seo.tenant.resolution && seo.tenant.resolution !== "tenant") {
    return {
      title: {
        absolute: seo.tenant.resolution === "demo-locked" ? "Segera hadir" : "Toko tidak ditemukan — Rigspace.id",
      },
      robots: { index: false, follow: false },
    };
  }
  const ogImage = seo.ogImage.startsWith("http") ? seo.ogImage : `${seo.origin}${seo.ogImage}`;

  return {
    metadataBase: new URL(seo.origin),
    title: {
      default: seo.title,
      template: `%s | ${seo.name}`,
    },
    description: seo.description,
    keywords: seo.keywords.length ? seo.keywords : [seo.name, "toko laptop", "laptop bekas", "rakit PC", "servis laptop"],
    authors: [{ name: seo.name, url: seo.origin }],
    creator: seo.name,
    publisher: seo.name,
    // noindex otomatis: data contoh, toko minta disembunyikan, atau ditangguhkan
    robots: {
      index: seo.indexable,
      follow: seo.indexable,
      googleBot: {
        index: seo.indexable,
        follow: seo.indexable,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    verification: seo.googleSiteVerification ? { google: seo.googleSiteVerification } : undefined,
    icons: seo.tenant.settings.faviconUrl ? { icon: seo.tenant.settings.faviconUrl } : undefined,
    openGraph: {
      type: "website",
      locale: "id_ID",
      url: "/",
      siteName: seo.name,
      title: seo.title,
      description: seo.description,
      images: [{ url: ogImage, alt: seo.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: [ogImage],
    },
    alternates: {
      canonical: "/",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const headerStore = await headers();

  // Halaman CMS: hanya kerangka minimal (font + warna aksen), tanpa header/footer,
  // JSON-LD, analitik, atau data storefront toko (cepat & tidak membocorkan data toko lain).
  if (headerStore.get(CMS_AREA_HEADER) === "cms") {
    const tenant = await resolveStorefrontTenant(undefined, { cms: true });
    return (
      <html
        lang="id"
        style={brandCssVars(tenant.settings.primaryColor, tenant.settings.secondaryColor) as React.CSSProperties}
      >
        <body data-area="cms">
          <ThemeLiveSync />
          {children}
        </body>
      </html>
    );
  }

  const seo = await getStorefrontSeo();
  const tenant = seo.tenant;
  if (tenant.resolution === "platform-root") {
    // Landing page platform rigspace.id; kontak sales = CMO aktif
    const sales = await getSalesContact();
    return (
      <html lang="id" data-scroll-behavior="smooth">
        <body data-area="platform" style={{ margin: 0, background: "#fff" }}>
          {/* GA4 platform: tenant = "platform" agar landing terpisah dari etalase toko di laporan */}
          <StorefrontAnalytics platformGaId={seo.analytics.platformGaId} tenantGaId={null} gtmId={null} tenantSlug="platform" />
          <LandingPage salesPhone={sales?.phone ?? null} />
        </body>
      </html>
    );
  }
  if (tenant.resolution && tenant.resolution !== "tenant") {
    return (
      <html lang="id">
        <body data-area="platform">
          <PlatformHostPage resolution={tenant.resolution} />
        </body>
      </html>
    );
  }
  const store = { ...tenant.settings, stockDisplay: seo.stock.display, lowStockThreshold: seo.stock.lowThreshold };
  const liveCategories = await getLiveCategories(tenant.id);
  const templateId = resolveTemplateId(store.homepageConfig, headerStore.get(TEMPLATE_PREVIEW_HEADER));
  // Mega menu & dropdown pencarian template Precision
  const menuData = templateId === "precision" ? await getLiveMenuData(tenant.id) : undefined;

  const fontFamily = store.fontFamily || "Plus Jakarta Sans";

  const storeSchema = {
    "@context": "https://schema.org",
    "@type": "ComputerStore",
    name: seo.name,
    url: seo.origin,
    image: seo.ogImage.startsWith("http") ? seo.ogImage : `${seo.origin}${seo.ogImage}`,
    ...(store.whatsapp ? { telephone: `+${store.whatsapp.replace(/\D/g, "")}` } : {}),
    ...(store.address ? { address: { "@type": "PostalAddress", streetAddress: store.address, addressCountry: "ID" } } : {}),
    ...(store.hours ? { openingHours: store.hours } : {}),
  };
  // Escape "<" agar teks milik toko (nama/alamat) tidak bisa menutup tag <script> (XSS)
  const storeSchemaJson = JSON.stringify(storeSchema).replace(/</g, "\\u003c");

  return (
    <html
      lang="id"
      data-scroll-behavior="smooth"
      style={
        {
          "--font": `'${fontFamily}', "Plus Jakarta Sans", sans-serif`,
          ...brandCssVars(store.primaryColor, store.secondaryColor),
        } as React.CSSProperties
      }
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700;800;900&family=Poppins:wght@400;500;600;700;800&family=Inter+Tight:wght@500;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: storeSchemaJson }}
        />
      </head>
      <body data-template={templateId}>
        <StorefrontAnalytics {...seo.analytics} />
        <ThemeLiveSync />
        <StoreProvider store={store}>
          {templateId === "precision" ? (
            <PrecisionHeader store={store} categories={liveCategories} menu={menuData} />
          ) : templateId === "gaming-arena" ? (
            <GamingHeader store={store} categories={liveCategories} />
          ) : templateId === "minimalist-boutique" ? (
            <BoutiqueHeader store={store} categories={liveCategories} />
          ) : (
            <Header store={store} categories={liveCategories} />
          )}
          <main id="main">{children}</main>
          {templateId === "precision" ? (
            <PrecisionFooter store={store} categories={liveCategories} />
          ) : templateId === "gaming-arena" ? (
            <GamingFooter store={store} categories={liveCategories} />
          ) : templateId === "minimalist-boutique" ? (
            <BoutiqueFooter store={store} categories={liveCategories} />
          ) : (
            <Footer store={store} />
          )}
        </StoreProvider>
      </body>
    </html>
  );
}
