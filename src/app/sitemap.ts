import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { getStorefrontSeo } from "@/lib/tenant-seo";

/** sitemap.xml per domain toko: hanya produk & layanan milik toko yang sedang dibuka. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const seo = await getStorefrontSeo();
  if (seo.tenant.resolution === "platform-root") {
    return [{ url: seo.origin, lastModified: new Date(), changeFrequency: "weekly", priority: 1 }];
  }
  if (!seo.indexable) return [];

  const base = seo.origin;
  const tenantId = seo.tenant.id;
  const [products, services] = await Promise.all([
    prisma.product.findMany({
      where: { tenantId, deletedAt: null, publicationStatus: "PUBLISHED" },
      select: { slug: true, updatedAt: true, images: { where: { isPrimary: true }, select: { url: true }, take: 1 } },
      orderBy: { updatedAt: "desc" },
      take: 5000,
    }),
    prisma.service.findMany({ where: { tenantId, isActive: true }, select: { slug: true, updatedAt: true } }),
  ]);

  const abs = (u: string) => (u.startsWith("http") ? u : `${base}${u}`);
  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/katalog`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/layanan`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/testimoni`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${base}/lokasi`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/kontak`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    ...products.map((p) => ({
      url: `${base}/produk/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      ...(p.images[0] ? { images: [abs(p.images[0].url)] } : {}),
    })),
    ...services.map((s) => ({
      url: `${base}/layanan/${s.slug}`,
      lastModified: s.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
