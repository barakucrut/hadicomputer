import type { Metadata } from "next";
import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";
import "./mobile.css";
import { Header, Footer } from "@/components/site-shell";
import { getLiveStoreSettings, getLiveCategories } from "@/lib/live-repository";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Hadi Computer — Perangkat tepat untuk kebutuhanmu",
    template: "%s | Hadi Computer",
  },
  description:
    "Pusat laptop baru & bekas pilihan, jasa rakit PC custom, dan servis profesional terpercaya di Hadi Computer. Konsultasikan kebutuhanmu langsung via WhatsApp.",
  keywords: [
    "Hadi Computer",
    "toko laptop",
    "laptop baru",
    "laptop bekas berkualitas",
    "jasa rakit PC",
    "servis laptop",
    "PC gaming",
    "promo laptop",
    "toko komputer terpercaya",
  ],
  authors: [{ name: "Hadi Computer", url: siteUrl }],
  creator: "Hadi Computer",
  publisher: "Hadi Computer",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    siteName: "Hadi Computer",
    title: "Hadi Computer — Perangkat Tepat untuk Kebutuhanmu",
    description:
      "Pusat laptop baru & bekas pilihan, jasa rakit PC custom, dan servis profesional terpercaya. Konsultasikan kebutuhanmu langsung dengan Hadi.",
    images: [
      {
        url: "/images/banners/promo-bundle.png",
        width: 1200,
        height: 630,
        alt: "Hadi Computer - Promo Bundling Laptop & PC Rakitan",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hadi Computer — Perangkat Tepat untuk Kebutuhanmu",
    description:
      "Pusat laptop baru & bekas pilihan, jasa rakit PC custom, dan servis profesional terpercaya.",
    images: ["/images/banners/promo-bundle.png"],
  },
  alternates: {
    canonical: "/",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [store, liveCategories] = await Promise.all([
    getLiveStoreSettings(),
    getLiveCategories(),
  ]);

  const storeSchema = {
    "@context": "https://schema.org",
    "@type": "ComputerStore",
    name: store.name || "Hadi Computer",
    image: `${siteUrl}/images/banners/promo-bundle.png`,
    telephone: store.whatsapp || "+6285769000007",
    url: siteUrl,
    address: {
      "@type": "PostalAddress",
      streetAddress: store.address || "Jl. Ahmad Yani No. 45, Lantai 1",
      addressCountry: "ID",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "08:00",
        closes: "22:00",
      },
    ],
    priceRange: "$$",
  };

  return (
    <html lang="id" data-scroll-behavior="smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(storeSchema) }}
        />
      </head>
      <body>
        <Header store={store} categories={liveCategories} />
        <main id="main">{children}</main>
        <Footer store={store} />
      </body>
    </html>
  );
}
