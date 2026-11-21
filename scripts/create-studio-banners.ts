/**
 * Buat Studio Banner otomatis untuk satu toko (onboarding / demo cepat).
 *
 *   npx tsx scripts/create-studio-banners.ts <slug-toko>            # pratinjau (tidak menulis)
 *   npx tsx scripts/create-studio-banners.ts <slug-toko> --apply    # buat 3 banner utama + 2 tile
 *   npx tsx scripts/create-studio-banners.ts <slug-toko> --apply --replace  # hapus Studio Banner lama dulu
 *
 * Produk dipilih dari katalog toko (diskon nyata & harga tertinggi dulu, kategori bervariasi),
 * foto produknya diproses jadi cutout transparan. Foto poster/latar ramai dilewati.
 */
import "dotenv/config";
import { prisma } from "../src/lib/db";
import { createCutoutFromUpload } from "../src/lib/product-cutout";
import { unlink } from "fs/promises";
import path from "path";
import { shortName } from "../src/components/storefront/templates/precision/model";

/**
 * Judul banner ringkas: berhenti setelah kata pertama yang memuat angka (nomor seri/model),
 * mis. "ASUS VIVOBOOK S14 M3407HA-OLED7151M, RYZEN 7…" -> "ASUS VIVOBOOK S14".
 */
function bannerTitle(name: string, max: number) {
  const words = shortName(name, 80).replace(/[,–]/g, " ").split(/\s+/).filter(Boolean);
  const cut = words.findIndex((w, i) => i >= 1 && /\d/.test(w));
  const title = cut >= 1 ? words.slice(0, cut + 1).join(" ") : words.join(" ");
  return shortName(title, max);
}

const [slug, ...flags] = process.argv.slice(2);
const apply = flags.includes("--apply");
const replace = flags.includes("--replace");

async function main() {
  if (!slug) throw new Error("Pakai: npx tsx scripts/create-studio-banners.ts <slug-toko> [--apply] [--replace]");
  const tenant = await prisma.tenant.findUnique({ where: { slug }, select: { id: true, name: true } });
  if (!tenant) throw new Error(`Toko "${slug}" tidak ditemukan`);

  const products = await prisma.product.findMany({
    where: { tenantId: tenant.id, deletedAt: null, publicationStatus: "PUBLISHED", basePrice: { gt: 0 }, availability: { not: "HABIS" } },
    select: {
      id: true,
      slug: true,
      name: true,
      summary: true,
      basePrice: true,
      originalPrice: true,
      category: { select: { name: true } },
      brand: { select: { name: true } },
      images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1, select: { url: true } },
      specs: { orderBy: { sortOrder: "asc" }, take: 3, select: { value: true } },
    },
  });

  const discount = (p: (typeof products)[number]) =>
    p.originalPrice && p.basePrice && p.originalPrice > p.basePrice ? Number(p.originalPrice - p.basePrice) / Number(p.originalPrice) : 0;
  const ranked = products
    .filter((p) => p.images[0])
    .sort((a, b) => (discount(b) > 0 ? 1 : 0) - (discount(a) > 0 ? 1 : 0) || Number(b.basePrice! - a.basePrice!));

  // 3 banner utama (produk unggulan) + 2 tile (kategori lain supaya bervariasi)
  const picks: { product: (typeof products)[number]; placement: "hero" | "tile"; imageUrl: string }[] = [];
  const usedCategories = new Set<string>();
  for (const placement of ["hero", "hero", "hero", "tile", "tile"] as const) {
    for (const p of ranked) {
      if (picks.some((x) => x.product.id === p.id)) continue;
      const cat = p.category?.name || "";
      // Hero boleh satu kategori (biasanya laptop); tile wajib kategori yang belum dipakai tile lain
      if (placement === "tile" && usedCategories.has(cat)) continue;
      if (placement === "tile" && picks.filter((x) => x.placement === "hero").some((x) => x.product.category?.name === cat)) continue;
      // Bervariasi: satu merek per banner
      const brand = (x: (typeof products)[number]) => (x.brand?.name || x.name.split(/\s+/)[0]).toLowerCase();
      if (picks.some((x) => brand(x.product) === brand(p))) continue;
      const cut = apply
        ? await createCutoutFromUpload(p.images[0].url, p.slug.slice(0, 40))
        : await import("../src/lib/product-cutout").then(async ({ createCutout }) => {
            const { readFile } = await import("fs/promises");
            const r = await createCutout(await readFile(`public${p.images[0].url}`));
            return r.ok ? { ok: true as const, url: "(pratinjau)" } : { ok: false as const, reason: r.reason! };
          });
      if (!cut.ok) continue;
      picks.push({ product: p, placement, imageUrl: cut.url });
      if (placement === "tile") usedCategories.add(cat);
      break;
    }
  }

  console.log(`${tenant.name}: ${picks.length} Studio Banner`);
  for (const x of picks) console.log(`  [${x.placement}] ${x.product.name.slice(0, 70)} → ${x.imageUrl}`);
  if (!apply) {
    console.log("\nPratinjau saja. Tambahkan --apply untuk menulis ke database.");
    return;
  }

  if (replace) {
    const old = await prisma.banner.findMany({ where: { tenantId: tenant.id, bgTheme: "studio" }, select: { imageUrl: true } });
    const removed = await prisma.banner.deleteMany({ where: { tenantId: tenant.id, bgTheme: "studio" } });
    // Foto studio lama hanya dipakai banner ini -> ikut dihapus
    for (const { imageUrl } of old) {
      if (imageUrl && /^\/uploads\/banners\/studio-[A-Za-z0-9._-]+$/.test(imageUrl)) {
        await unlink(path.join(process.cwd(), "public", imageUrl)).catch(() => undefined);
      }
    }
    console.log(`Studio Banner lama dihapus: ${removed.count}`);
  }
  const maxOrder = await prisma.banner.aggregate({ where: { tenantId: tenant.id }, _max: { sortOrder: true } });
  let order = (maxOrder._max.sortOrder ?? -1) + 1;
  for (const { product: p, placement, imageUrl } of picks) {
    const d = discount(p);
    const cat = (p.category?.name || "Pilihan").toUpperCase();
    await prisma.banner.create({
      data: {
        tenantId: tenant.id,
        title: bannerTitle(p.name, placement === "hero" ? 32 : 36),
        subtitle: p.summary && p.summary !== p.name ? p.summary.slice(0, 255) : p.specs.map((s) => s.value).join(" · ").slice(0, 255),
        badgeText: d > 0 ? `${cat} · HEMAT ${Math.round(d * 100)}%` : placement === "hero" ? `${cat} · PILIHAN TOKO` : cat,
        ctaLabel: "Lihat Produk",
        ctaUrl: `/produk/${p.slug}`,
        imageUrl,
        imageAlt: p.name.slice(0, 150),
        bgTheme: "studio",
        placement,
        productId: p.id,
        sortOrder: order++,
        isActive: true,
      },
    });
  }
  console.log("Selesai.");
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
