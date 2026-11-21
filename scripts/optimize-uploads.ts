/**
 * Optimasi ulang file yang SUDAH ada di public/uploads.
 *
 * File lama direferensikan lewat URL di database, jadi script ini TIDAK mengganti
 * nama/ekstensi: gambar dikompres ulang dalam format aslinya, sisi terpanjang
 * dibatasi 1900px, metadata dibuang, dan file hanya diganti bila hasilnya lebih kecil.
 *
 * Pemakaian:
 *   npx tsx scripts/optimize-uploads.ts            # dry run: hanya laporan
 *   npx tsx scripts/optimize-uploads.ts --apply    # tulis hasil + backup original
 *
 * Backup original disimpan di .upload-backups/<timestamp>/ (di luar folder public).
 */
import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";
import { MAX_DIMENSION, sanitizeSvg } from "../src/lib/image-optimizer";

const APPLY = process.argv.includes("--apply");
const ROOT = path.join(process.cwd(), "public", "uploads");
const BACKUP_DIR = path.join(process.cwd(), ".upload-backups", new Date().toISOString().replace(/[:.]/g, "-"));

const kb = (n: number) => `${(n / 1024).toFixed(0)}KB`;

async function walk(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = await Promise.all(
    entries.map((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]))
  );
  return files.flat();
}

async function reencode(file: string, input: Buffer): Promise<Buffer | null> {
  const ext = path.extname(file).toLowerCase();

  if (ext === ".svg") {
    return Buffer.from(sanitizeSvg(input.toString("utf8")).replace(/>\s+</g, "><").trim(), "utf8");
  }

  const base = () =>
    sharp(input, { animated: false })
      .rotate()
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true });

  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return base().jpeg({ quality: 82, mozjpeg: true, progressive: true }).toBuffer();
    case ".png": {
      // Coba palet (sangat efektif untuk logo) dan truecolor, ambil yang terkecil
      const [palette, full] = await Promise.all([
        base().png({ palette: true, quality: 90, compressionLevel: 9, effort: 10 }).toBuffer(),
        base().png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer(),
      ]);
      return palette.length < full.length ? palette : full;
    }
    case ".webp":
      return base().webp({ quality: 80, alphaQuality: 100, effort: 5 }).toBuffer();
    default:
      return null; // format lain dibiarkan
  }
}

async function main() {
  const files = await walk(ROOT);
  let before = 0;
  let after = 0;
  let changed = 0;

  console.log(`${APPLY ? "APPLY" : "DRY RUN"} — ${files.length} file di public/uploads\n`);

  for (const file of files) {
    const rel = path.relative(ROOT, file);
    const input = await fs.readFile(file);
    before += input.length;

    let output: Buffer | null = null;
    try {
      output = await reencode(file, input);
    } catch (err) {
      console.log(`  SKIP  ${rel} (gagal dibaca: ${(err as Error).message})`);
      after += input.length;
      continue;
    }

    if (!output || output.length >= input.length) {
      after += input.length;
      console.log(`  keep  ${rel.padEnd(70)} ${kb(input.length)}`);
      continue;
    }

    after += output.length;
    changed++;
    const pct = Math.round((1 - output.length / input.length) * 100);
    console.log(`  ${APPLY ? "write" : "would"} ${rel.padEnd(70)} ${kb(input.length)} -> ${kb(output.length)} (-${pct}%)`);

    if (APPLY) {
      const backupPath = path.join(BACKUP_DIR, rel);
      await fs.mkdir(path.dirname(backupPath), { recursive: true });
      await fs.copyFile(file, backupPath);
      await fs.writeFile(file, output, { mode: 0o644 });
    }
  }

  console.log(
    `\n${changed} file ${APPLY ? "dioptimasi" : "bisa dioptimasi"}: ${kb(before)} -> ${kb(after)} (hemat ${kb(before - after)})`
  );
  if (APPLY && changed > 0) console.log(`Backup original: ${path.relative(process.cwd(), BACKUP_DIR)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
