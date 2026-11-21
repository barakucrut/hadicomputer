/**
 * Testimoni pelanggan: validasi input CMS dan pemilihan kartu untuk beranda.
 * Logika murni (tanpa Prisma) agar mudah diuji.
 */

export const TESTIMONIAL_SOURCES = ["GOOGLE", "WHATSAPP", "DIRECT"] as const;
export type TestimonialSource = (typeof TESTIMONIAL_SOURCES)[number];

export const TESTIMONIAL_SOURCE_LABELS: Record<TestimonialSource, string> = {
  GOOGLE: "Ulasan Google",
  WHATSAPP: "WhatsApp",
  DIRECT: "Langsung di toko",
};

export const TESTIMONIAL_LIMITS = {
  name: 100,
  descriptor: 120,
  quote: 300,
  label: 80,
  photoUrl: 255,
  sourceUrl: 500,
} as const;

/** Jumlah kartu maksimal yang tampil di beranda. */
export const HOME_TESTIMONIAL_LIMIT = 6;

export type TestimonialInput = {
  name: string;
  descriptor: string | null;
  quote: string;
  rating: number | null;
  label: string | null;
  photoUrl: string | null;
  source: TestimonialSource;
  sourceUrl: string | null;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
};

export type ValidationResult =
  | { ok: true; data: TestimonialInput }
  | { ok: false; error: string };

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown): string | null {
  const v = text(value);
  return v ? v : null;
}

function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/** Foto hanya hasil unggahan CMS (lewat storeImage) atau aset lokal — tanpa hotlink eksternal. */
function isSafePhotoUrl(value: string): boolean {
  return (value.startsWith("/uploads/") || value.startsWith("/images/")) && !value.includes("..");
}

export function validateTestimonial(raw: unknown): ValidationResult {
  const body = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  const name = text(body.name);
  if (!name) return { ok: false, error: "Nama pelanggan wajib diisi." };
  if (name.length > TESTIMONIAL_LIMITS.name)
    return { ok: false, error: `Nama maksimal ${TESTIMONIAL_LIMITS.name} karakter.` };

  const quote = text(body.quote);
  if (!quote) return { ok: false, error: "Isi testimoni wajib diisi." };
  if (quote.length > TESTIMONIAL_LIMITS.quote)
    return { ok: false, error: `Isi testimoni maksimal ${TESTIMONIAL_LIMITS.quote} karakter.` };

  const descriptor = optionalText(body.descriptor);
  if (descriptor && descriptor.length > TESTIMONIAL_LIMITS.descriptor)
    return { ok: false, error: `Keterangan maksimal ${TESTIMONIAL_LIMITS.descriptor} karakter.` };

  const label = optionalText(body.label);
  if (label && label.length > TESTIMONIAL_LIMITS.label)
    return { ok: false, error: `Label layanan maksimal ${TESTIMONIAL_LIMITS.label} karakter.` };

  let rating: number | null = null;
  if (body.rating !== null && body.rating !== undefined && body.rating !== "") {
    const n = Number(body.rating);
    if (!Number.isInteger(n) || n < 1 || n > 5)
      return { ok: false, error: "Rating harus angka bulat 1 sampai 5, atau dikosongkan." };
    rating = n;
  }

  const sourceRaw = text(body.source).toUpperCase() || "DIRECT";
  if (!(TESTIMONIAL_SOURCES as readonly string[]).includes(sourceRaw))
    return { ok: false, error: "Sumber testimoni tidak dikenal." };
  const source = sourceRaw as TestimonialSource;

  const photoUrl = optionalText(body.photoUrl);
  if (photoUrl && (photoUrl.length > TESTIMONIAL_LIMITS.photoUrl || !isSafePhotoUrl(photoUrl)))
    return { ok: false, error: "Alamat foto tidak valid." };

  const sourceUrl = optionalText(body.sourceUrl);
  if (sourceUrl && (sourceUrl.length > TESTIMONIAL_LIMITS.sourceUrl || !isSafeHttpUrl(sourceUrl)))
    return { ok: false, error: "Link ulasan asli harus diawali https://." };

  const sortOrderNum = Number(body.sortOrder ?? 0);
  const sortOrder = Number.isFinite(sortOrderNum) ? Math.trunc(sortOrderNum) : 0;

  return {
    ok: true,
    data: {
      name,
      descriptor,
      quote,
      rating,
      label,
      photoUrl,
      source,
      sourceUrl,
      isActive: body.isActive === undefined ? true : Boolean(body.isActive),
      isFeatured: Boolean(body.isFeatured),
      sortOrder,
    },
  };
}

type Selectable = {
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  createdAt: Date | string;
};

/**
 * Urutan tampil di beranda: hanya yang aktif, unggulan dulu, lalu sortOrder
 * kecil, lalu yang terbaru. Dibatasi HOME_TESTIMONIAL_LIMIT kartu.
 */
export function selectHomeTestimonials<T extends Selectable>(items: T[], limit = HOME_TESTIMONIAL_LIMIT): T[] {
  return items
    .filter((t) => t.isActive)
    .sort((a, b) => {
      if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, limit);
}

/** Inisial untuk avatar tanpa foto: "Budi Santoso" -> "BS". */
export function testimonialInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase();
}
