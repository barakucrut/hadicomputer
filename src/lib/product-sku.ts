import { prisma } from "./db";

/** Prefix bawaan dari inisial nama toko: "Hadi Computer" -> "HC", "Plaza Bitcom Jember" -> "PBJ". */
export function prefixFromName(name: string): string {
  const initials = name
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 4);
  return initials.length >= 2 ? initials : (name.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase() || "SKU");
}

/** Prefix SKU tenant, mis. "HC-" (dari pengaturan toko, atau otomatis dari nama). */
export async function getSkuPrefix(tenantId: string): Promise<string> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true, settings: { select: { skuPrefix: true } } },
  });
  const raw = tenant?.settings?.skuPrefix?.trim() || prefixFromName(tenant?.name || "");
  return `${raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || "SKU"}-`;
}

export function formatSku(prefix: string, n: number): string {
  return `${prefix}${String(n).padStart(4, "0")}`;
}

/** Rapikan input manual: hapus spasi di tepi & jadikan huruf besar. */
export function normalizeSku(code: unknown): string {
  return typeof code === "string" ? code.trim().toUpperCase() : "";
}

/**
 * SKU berikutnya untuk satu toko = angka PREFIX-NNNN terbesar + 1.
 * Menghitung SEMUA produk toko itu, termasuk yang sudah di-soft-delete,
 * sehingga nomor yang pernah dipakai tidak akan pernah diterbitkan ulang.
 */
export async function getNextSku(tenantId: string): Promise<string> {
  const prefix = await getSkuPrefix(tenantId);
  const pattern = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\d+)$`);
  const codes = await prisma.product.findMany({
    where: { tenantId, code: { startsWith: prefix } },
    select: { code: true },
  });
  let max = 0;
  for (const { code } of codes) {
    const m = pattern.exec(code);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return formatSku(prefix, max + 1);
}

/** Cek SKU sudah dipakai produk lain DI TOKO YANG SAMA (termasuk yang sudah dihapus). */
export async function isSkuTaken(tenantId: string, code: string, excludeId?: string): Promise<boolean> {
  const found = await prisma.product.findFirst({
    where: { tenantId, code, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
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
