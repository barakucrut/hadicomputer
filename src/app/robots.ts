import type { MetadataRoute } from "next";
import { getStorefrontSeo } from "@/lib/tenant-seo";

/** robots.txt per domain toko. Toko yang tidak boleh diindeks -> disallow semua. */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const seo = await getStorefrontSeo();
  // Landing page platform rigspace.id: boleh diindeks (kecuali CMS & API)
  if (seo.tenant.resolution === "platform-root") {
    return {
      rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/god-mode", "/api/", "/demo/"] },
      sitemap: `${seo.origin}/sitemap.xml`,
      host: seo.origin,
    };
  }
  if (!seo.indexable) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/god-mode", "/api/", "/docs"],
    },
    sitemap: `${seo.origin}/sitemap.xml`,
    host: seo.origin,
  };
}
