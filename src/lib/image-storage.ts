import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { MAX_INPUT_BYTES, optimizeImage, type ImageProfile, type OptimizedImage } from "./image-optimizer";
import { fetchPublic } from "./remote-fetch";

/** Folder unggahan yang diizinkan beserta profil optimasinya. */
export const UPLOAD_FOLDERS: Record<string, { profile: ImageProfile; trim: boolean }> = {
  products: { profile: "photo", trim: false },
  banners: { profile: "photo", trim: false },
  services: { profile: "photo", trim: false },
  testimonials: { profile: "photo", trim: false },
  brands: { profile: "logo", trim: true },
  logos: { profile: "logo", trim: true },
  favicons: { profile: "logo", trim: true },
};

export function resolveUploadFolder(requested: string | null | undefined): string {
  return requested && UPLOAD_FOLDERS[requested] ? requested : "products";
}

function safeBaseName(name: string) {
  return (
    path
      .basename(name, path.extname(name))
      .replace(/[^a-z0-9_-]/gi, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "image"
  );
}

/**
 * Optimasi + simpan gambar ke public/uploads/<folder>. Mengembalikan URL publik.
 * Semua jalur upload (form admin, import CSV/Excel, importer WooCommerce) lewat sini.
 */
export async function storeImage(
  input: Buffer,
  { folder, fileName }: { folder: string; fileName: string }
): Promise<{ url: string; optimized: OptimizedImage }> {
  const safeFolder = resolveUploadFolder(folder);
  const { profile, trim } = UPLOAD_FOLDERS[safeFolder];
  const optimized = await optimizeImage(input, { profile, trim });

  const uploadDir = path.join(process.cwd(), "public", "uploads", safeFolder);
  await mkdir(uploadDir, { recursive: true, mode: 0o755 });

  const unique = `${safeBaseName(fileName)}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}${optimized.ext}`;
  await writeFile(path.join(uploadDir, unique), optimized.buffer, { mode: 0o644 });

  return { url: `/uploads/${safeFolder}/${unique}`, optimized };
}

/** Unduh gambar dari URL publik (aman SSRF), optimasi, lalu simpan. */
export async function storeRemoteImage(url: string, folder = "products"): Promise<string> {
  const { buffer, finalUrl } = await fetchPublic(url, {
    maxBytes: MAX_INPUT_BYTES,
    accept: "image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8",
  });
  const name = decodeURIComponent(new URL(finalUrl).pathname.split("/").pop() || "image");
  const { url: stored } = await storeImage(buffer, { folder, fileName: name });
  return stored;
}
