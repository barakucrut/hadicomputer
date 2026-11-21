/**
 * Rapikan foto produk satu toko: buang bingkai poster (warna + logo + nama toko), putihkan
 * tempelan logo/watermark, dan pusatkan produk di kanvas putih persegi (lihat src/lib/product-photo-clean.ts).
 *
 *   npx tsx scripts/clean-product-photos.ts <slug-toko>                  # pratinjau (tidak menulis)
 *   npx tsx scripts/clean-product-photos.ts <slug-toko> --apply          # tulis foto baru & update database
 *   npx tsx scripts/clean-product-photos.ts --revert <file-backup.json>  # kembalikan URL foto lama
 *
 * Foto lama TIDAK dihapus; pemetaan lama -> baru disimpan di .upload-backups/ untuk rollback.
 */
import "dotenv/config";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "../src/lib/db";
import { storeImage } from "../src/lib/image-storage";
import { cleanProductPhoto } from "../src/lib/product-photo-clean";

const args = process.argv.slice(2);
const LOCAL = /^\/(uploads\/[a-z]+|images\/products)\/[A-Za-z0-9._-]+$/;

interface BackupRow {
  imageId: string;
  oldUrl: string;
  newUrl: string;
}

async function revert(file: string) {
  const rows = JSON.parse(await readFile(file, "utf8")) as BackupRow[];
  let restored = 0;
  for (const row of rows) {
    const res = await prisma.productImage.updateMany({ where: { id: row.imageId, url: row.newUrl }, data: { url: row.oldUrl } });
    restored += res.count;
  }
  console.log(`Dikembalikan: ${restored}/${rows.length} foto.`);
}

async function main() {
  if (args[0] === "--revert") {
    if (!args[1]) throw new Error("Pakai: --revert <file-backup.json>");
    return revert(args[1]);
  }
  const [slug, ...flags] = args;
  const apply = flags.includes("--apply");
  if (!slug) throw new Error("Pakai: npx tsx scripts/clean-product-photos.ts <slug-toko> [--apply]");
  const tenant = await prisma.tenant.findUnique({ where: { slug }, select: { id: true, name: true } });
  if (!tenant) throw new Error(`Toko "${slug}" tidak ditemukan`);

  const images = await prisma.productImage.findMany({
    where: { product: { tenantId: tenant.id, deletedAt: null } },
    select: { id: true, url: true, product: { select: { slug: true } } },
  });

  const stats: Record<string, number> = {};
  const backup: BackupRow[] = [];
  const t0 = Date.now();
  for (const image of images) {
    if (!LOCAL.test(image.url) || image.url.includes("..")) {
      stats.dilewati = (stats.dilewati || 0) + 1;
      continue;
    }
    try {
      const result = await cleanProductPhoto(await readFile(path.join(process.cwd(), "public", image.url)));
      stats[result.kind] = (stats[result.kind] || 0) + 1;
      if (!result.changed || !apply) continue;
      const { url } = await storeImage(result.buffer, { folder: "products", fileName: `${image.product.slug.slice(0, 40)}-clean` });
      await prisma.productImage.update({ where: { id: image.id }, data: { url } });
      backup.push({ imageId: image.id, oldUrl: image.url, newUrl: url });
    } catch (err) {
      stats.gagal = (stats.gagal || 0) + 1;
      console.error(`  gagal: ${image.url}`, err instanceof Error ? err.message : err);
    }
  }

  console.log(`${tenant.name}: ${images.length} foto dalam ${((Date.now() - t0) / 1000).toFixed(1)} dtk`);
  console.log(
    `  produk dipusatkan: ${stats["product-centered"] || 0} · bingkai dibuang: ${stats["frame-removed"] || 0} · ` +
      `tidak berubah: ${stats.unchanged || 0} · dilewati: ${stats.dilewati || 0} · gagal: ${stats.gagal || 0}`
  );
  if (!apply) {
    console.log("\nPratinjau saja. Tambahkan --apply untuk menulis.");
    return;
  }
  const dir = path.join(process.cwd(), ".upload-backups");
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `clean-photos-${slug}-${Date.now()}.json`);
  await writeFile(file, JSON.stringify(backup, null, 2));
  console.log(`Backup pemetaan: ${path.relative(process.cwd(), file)}`);
  console.log(`Rollback: npx tsx scripts/clean-product-photos.ts --revert ${path.relative(process.cwd(), file)}`);
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
