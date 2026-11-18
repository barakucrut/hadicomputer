import { prisma } from "./db";

/** Format SKU unit: HC-0001, HC-0002, ... (minimal 4 digit, boleh lebih). */
export const SKU_PREFIX = "HC-";
const SKU_PATTERN = /^HC-(\d+)$/;

export function formatSku(n: number): string {
  return `${SKU_PREFIX}${String(n).padStart(4, "0")}`;
}

/** Rapikan input manual: hapus spasi di tepi & jadikan huruf besar. */
export function normalizeSku(code: unknown): string {
  return typeof code === "string" ? code.trim().toUpperCase() : "";
}

/**
 * SKU berikutnya = angka HC-NNNN terbesar + 1.
 * Menghitung SEMUA produk, termasuk yang sudah di-soft-delete, sehingga
 * nomor yang pernah dipakai tidak akan pernah diterbitkan ulang.
 */
export async function getNextSku(): Promise<string> {
  const codes = await prisma.product.findMany({
    where: { code: { startsWith: SKU_PREFIX } },
    select: { code: true },
  });
  let max = 0;
  for (const { code } of codes) {
    const m = SKU_PATTERN.exec(code);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return formatSku(max + 1);
}

/** Cek SKU sudah dipakai produk lain (termasuk yang sudah dihapus). */
export async function isSkuTaken(code: string, excludeId?: string): Promise<boolean> {
  const found = await prisma.product.findFirst({
    where: { code, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    select: { id: true },
  });
  return Boolean(found);
}

/** Prisma unique-constraint error pada kolom tertentu? */
export function isUniqueViolation(err: unknown, field: string): boolean {
  const e = err as { code?: string; meta?: { target?: unknown } } | null;
  if (!e || e.code !== "P2002") return false;
  const target = e.meta?.target;
  if (Array.isArray(target)) return target.some((t) => String(t).includes(field));
  if (typeof target === "string") return target.includes(field);
  return true;
}

/** Slug untuk produk yang di-soft-delete, supaya slug aslinya bisa dipakai lagi. */
export function deletedSlug(slug: string, id: string): string {
  const suffix = `--deleted-${id.slice(-8)}`;
  return `${slug.slice(0, 150 - suffix.length)}${suffix}`;
}
