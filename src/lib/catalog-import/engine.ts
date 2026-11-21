import { revalidatePath } from "next/cache";
import { prisma } from "../db";
import { getNextSku, isUniqueViolation } from "../product-sku";
import { storeRemoteImage } from "../image-storage";
import { applyStockRule } from "../stock";
import type { ImportOptions, ImportPreview, ImportRow, RowIssue, RowPlan, RowResult } from "./types";

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 140);

const key = (s: string) => slugify(s) || s.toLowerCase().trim();

/** Indeks kategori/merek/kebutuhan/SKU milik tenant untuk pencocokan cepat. */
async function loadTenantIndex(tenantId: string) {
  const [categories, brands, needs, products] = await Promise.all([
    prisma.category.findMany({ where: { tenantId }, select: { id: true, name: true, slug: true } }),
    prisma.brand.findMany({ where: { tenantId }, select: { id: true, name: true, slug: true } }),
    prisma.productNeed.findMany({ where: { tenantId }, select: { name: true, slug: true } }),
    prisma.product.findMany({ where: { tenantId }, select: { id: true, code: true, deletedAt: true } }),
  ]);
  const byNameOrSlug = <T extends { name: string; slug: string }>(list: T[]) => {
    const m = new Map<string, T>();
    for (const item of list) {
      m.set(key(item.name), item);
      m.set(item.slug, item);
    }
    return m;
  };
  return {
    categories: byNameOrSlug(categories),
    brands: byNameOrSlug(brands),
    needs: byNameOrSlug(needs),
    productsByCode: new Map(products.map((p) => [p.code.toUpperCase(), p])),
  };
}

function validateRow(row: ImportRow, issues: RowIssue[]) {
  const add = (level: RowIssue["level"], message: string) => issues.push({ rowNumber: row.rowNumber, level, message });
  if (!row.name) add("error", "Nama produk wajib diisi");
  if (!row.category) add("error", "Kategori wajib diisi");
  if (!row.brand) add("error", "Merek wajib diisi");
  if (row.originalPrice && row.basePrice && row.originalPrice <= row.basePrice) {
    add("warning", "Harga coret lebih kecil/sama dengan harga — harga coret diabaikan");
    row.originalPrice = null;
  }
  // Produk berharga varian boleh punya harga coret tanpa harga dasar -> dibiarkan apa adanya
  if (!row.basePrice) add("warning", "Tanpa harga dasar — tampil harga varian / 'Hubungi untuk harga'");
  if (row.images.length === 0) add("warning", "Tanpa foto");
}

/**
 * Validasi seluruh baris dan susun rencana (buat / update / lewati) tanpa menyimpan apa pun.
 */
export async function buildPreview(
  tenantId: string,
  rows: ImportRow[],
  options: ImportOptions,
  source: string
): Promise<ImportPreview> {
  const index = await loadTenantIndex(tenantId);
  const issues: RowIssue[] = [];
  const plans: RowPlan[] = [];
  const newCategories = new Set<string>();
  const newBrands = new Set<string>();
  const seenCodes = new Map<string, number>();

  for (const row of rows) {
    const before = issues.length;
    validateRow(row, issues);

    if (row.category && !index.categories.has(key(row.category))) {
      if (options.createMissing) newCategories.add(row.category);
      else issues.push({ rowNumber: row.rowNumber, level: "error", message: `Kategori "${row.category}" belum ada` });
    }
    if (row.brand && !index.brands.has(key(row.brand))) {
      if (options.createMissing) newBrands.add(row.brand);
      else issues.push({ rowNumber: row.rowNumber, level: "error", message: `Merek "${row.brand}" belum ada` });
    }
    const unknownNeeds = row.needs.filter((n) => !index.needs.has(key(n)));
    if (unknownNeeds.length) {
      issues.push({ rowNumber: row.rowNumber, level: "warning", message: `Kebutuhan tidak dikenal diabaikan: ${unknownNeeds.join(", ")}` });
    }

    let action: RowPlan["action"] = "create";
    if (row.code) {
      const dup = seenCodes.get(row.code);
      if (dup) {
        issues.push({ rowNumber: row.rowNumber, level: "error", message: `SKU ${row.code} dobel dengan baris ${dup}` });
      }
      seenCodes.set(row.code, row.rowNumber);
      const existing = index.productsByCode.get(row.code);
      if (existing?.deletedAt) {
        issues.push({ rowNumber: row.rowNumber, level: "error", message: `SKU ${row.code} milik produk yang sudah dihapus` });
      } else if (existing) {
        action = options.updateExisting ? "update" : "skip";
      }
    }

    const hasError = issues.slice(before).some((i) => i.level === "error");
    plans.push({
      rowNumber: row.rowNumber,
      action: hasError ? "skip" : action,
      name: row.name,
      code: row.code,
      category: row.category,
      brand: row.brand,
      basePrice: row.basePrice,
      imageCount: row.images.length,
    });
  }

  const invalidRows = new Set(issues.filter((i) => i.level === "error").map((i) => i.rowNumber));
  return {
    source,
    rows,
    plans,
    issues,
    summary: {
      total: rows.length,
      valid: rows.length - invalidRows.size,
      invalid: invalidRows.size,
      create: plans.filter((p) => p.action === "create").length,
      update: plans.filter((p) => p.action === "update").length,
      skip: plans.filter((p) => p.action === "skip").length,
      newCategories: Array.from(newCategories),
      newBrands: Array.from(newBrands),
    },
  };
}

/** Pastikan kategori/merek ada (dibuat bila perlu), kembalikan id-nya. */
async function ensureTaxonomy(tenantId: string, kind: "category" | "brand", name: string, create: boolean) {
  const slug = slugify(name) || `item-${Date.now()}`;
  const model = kind === "category" ? prisma.category : prisma.brand;
  const existing = await (model as typeof prisma.category).findFirst({
    where: { tenantId, OR: [{ slug }, { name }] },
    select: { id: true },
  });
  if (existing) return existing.id;
  if (!create) return null;
  try {
    const createdItem =
      kind === "category"
        ? await prisma.category.create({ data: { tenantId, name, slug, icon: "package" }, select: { id: true } })
        : await prisma.brand.create({ data: { tenantId, name, slug }, select: { id: true } });
    return createdItem.id;
  } catch (err) {
    // Dibuat bersamaan oleh batch lain -> ambil yang sudah ada
    if (isUniqueViolation(err, "slug")) {
      const again = await (model as typeof prisma.category).findFirst({ where: { tenantId, slug }, select: { id: true } });
      return again?.id ?? null;
    }
    throw err;
  }
}

async function uniqueSlug(tenantId: string, base: string, excludeId?: string) {
  const root = slugify(base) || "produk";
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const clash = await prisma.product.findFirst({
      where: { tenantId, slug: candidate, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
      select: { id: true },
    });
    if (!clash) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

/** Unduh & optimasi foto (paralel, urutan dipertahankan); URL lokal (/uploads, /images) dipakai apa adanya. */
async function resolveImages(urls: string[], warnings: string[]) {
  const settled = await Promise.all(
    urls.map(async (url) => {
      if (url.startsWith("/uploads/") || url.startsWith("/images/")) return url;
      try {
        return await storeRemoteImage(url, "products");
      } catch (err) {
        warnings.push(`Foto gagal diunduh (${(err as Error).message}): ${url.slice(0, 80)}`);
        return null;
      }
    })
  );
  return settled.filter((u): u is string => Boolean(u));
}

/** Jalankan fn untuk setiap item dengan batas paralel, hasil tetap sesuai urutan input. */
async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return out;
}

/**
 * Simpan satu batch baris. Setiap baris divalidasi ulang di server dan diproses
 * sendiri-sendiri, jadi satu baris gagal tidak menggagalkan baris lain.
 */
export async function commitRows(
  tenantId: string,
  rows: ImportRow[],
  options: ImportOptions & { isSample?: boolean }
): Promise<RowResult[]> {
  const index = await loadTenantIndex(tenantId);

  const processRow = async (row: ImportRow): Promise<RowResult> => {
    const issues: RowIssue[] = [];
    validateRow(row, issues);
    const errors = issues.filter((i) => i.level === "error");
    if (errors.length) {
      return { rowNumber: row.rowNumber, status: "failed", name: row.name, message: errors.map((e) => e.message).join("; ") };
    }

    try {
      const existing = row.code ? index.productsByCode.get(row.code) : undefined;
      if (existing?.deletedAt) {
        return { rowNumber: row.rowNumber, status: "failed", name: row.name, code: row.code, message: "SKU milik produk yang sudah dihapus" };
      }
      if (existing && !options.updateExisting) {
        return { rowNumber: row.rowNumber, status: "skipped", name: row.name, code: row.code, message: "SKU sudah ada" };
      }

      const [categoryId, brandId] = await Promise.all([
        ensureTaxonomy(tenantId, "category", row.category, options.createMissing),
        ensureTaxonomy(tenantId, "brand", row.brand, options.createMissing),
      ]);
      if (!categoryId || !brandId) {
        return { rowNumber: row.rowNumber, status: "failed", name: row.name, message: "Kategori atau merek belum ada" };
      }

      const imageWarnings: string[] = [];
      const imageUrls = row.images.length ? await resolveImages(row.images, imageWarnings) : [];
      const needs = row.needs.map((n) => index.needs.get(key(n))?.slug).filter((s): s is string => Boolean(s));

      const data = {
        name: row.name,
        summary: row.summary || row.name.slice(0, 255),
        description: row.description || row.summary || "",
        condition: row.condition,
        basePrice: row.basePrice !== null ? BigInt(row.basePrice) : null,
        originalPrice: row.originalPrice !== null ? BigInt(row.originalPrice) : null,
        availability: applyStockRule(row.stock, row.availability),
        stock: row.stock,
        publicationStatus: row.publicationStatus,
        warranty: row.warranty || "Garansi Toko 1 Bulan",
        bonus: row.bonus || null,
        isFeatured: row.isFeatured,
        isBestSeller: row.isBestSeller,
        isPromo: row.isPromo,
        isNewArrival: row.isNewArrival,
        needs,
        categoryId,
        brandId,
      };
      const imageCreate = imageUrls.map((url, i) => ({
        url,
        altText: `${row.name} - ${i + 1}`.slice(0, 150),
        isPrimary: i === 0,
        sortOrder: i,
      }));
      const specCreate = row.specs.map((s, i) => ({ key: s.key, value: s.value, sortOrder: i }));

      if (existing) {
        // Update: field diganti; foto & spek hanya diganti bila kolomnya diisi di file
        await prisma.$transaction(async (tx) => {
          // Kolom stok kosong = jangan ubah stok yang sudah ada
          const { stock: _ignoredStock, ...withoutStock } = data;
          await tx.product.update({ where: { id: existing.id }, data: row.stock === null ? withoutStock : data });
          if (imageCreate.length) {
            await tx.productImage.deleteMany({ where: { productId: existing.id } });
            await tx.productImage.createMany({ data: imageCreate.map((im) => ({ ...im, productId: existing.id })) });
          }
          if (specCreate.length) {
            await tx.productSpec.deleteMany({ where: { productId: existing.id } });
            await tx.productSpec.createMany({ data: specCreate.map((sp) => ({ ...sp, productId: existing.id })) });
          }
        });
        return { rowNumber: row.rowNumber, status: "updated", name: row.name, code: row.code, imageWarnings };
      }

      let created: { id: string; code: string } | null = null;
      for (let attempt = 0; attempt < 5 && !created; attempt++) {
        const code = row.code || (await getNextSku(tenantId));
        const slug = await uniqueSlug(tenantId, row.name);
        try {
          created = await prisma.product.create({
            data: {
              ...data,
              tenantId,
              code,
              slug,
              isSample: options.isSample === true,
              images: { create: imageCreate },
              specs: { create: specCreate },
            },
            select: { id: true, code: true },
          });
        } catch (err) {
          if (row.code && isUniqueViolation(err, "code")) throw new Error(`SKU ${row.code} sudah dipakai`);
          if (!isUniqueViolation(err, "code") && !isUniqueViolation(err, "slug")) throw err;
        }
      }
      if (!created) throw new Error("Gagal membuat SKU/slug unik");
      index.productsByCode.set(created.code, { id: created.id, code: created.code, deletedAt: null });
      return { rowNumber: row.rowNumber, status: "created", name: row.name, code: created.code, imageWarnings };
    } catch (err) {
      return { rowNumber: row.rowNumber, status: "failed", name: row.name, message: (err as Error).message.slice(0, 200) };
    }
    };

  // 4 baris paralel: unduhan foto jauh lebih cepat, konflik SKU/slug ditangani retry
  const results = await mapPool(rows, 4, processRow);

  revalidatePath("/", "layout");
  revalidatePath("/katalog");
  return results;
}
