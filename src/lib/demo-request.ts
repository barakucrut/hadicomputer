/**
 * Form "Minta Demo" di landing page rigspace.id (validasi murni, bisa dites).
 * Data yang disimpan hanya isian form; IP pengirim tidak disimpan.
 */
import { normalizeWhatsapp } from "./platform-access";
import type { Locale } from "./i18n";

export interface DemoRequestInput {
  storeName: string;
  city: string;
  whatsapp: string;
  storeLink: string | null;
}

export type DemoRequestResult = { ok: true; data: DemoRequestInput } | { ok: false; error: string; spam?: boolean };

export const DEMO_REQUEST_STATUSES = ["NEW", "CONTACTED", "CONVERTED", "REJECTED"] as const;
export type DemoRequestStatus = (typeof DEMO_REQUEST_STATUSES)[number];

export const DEMO_REQUEST_STATUS_LABEL: Record<DemoRequestStatus, string> = {
  NEW: "Baru",
  CONTACTED: "Sudah dihubungi",
  CONVERTED: "Jadi tenant",
  REJECTED: "Tidak lanjut",
};

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "";
}

export function parseDemoRequest(body: unknown, locale: Locale = "id"): DemoRequestResult {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const en = locale === "en";

  // Honeypot: kolom tersembunyi yang hanya diisi bot
  if (typeof b.website === "string" && b.website.trim() !== "") {
    return { ok: false, error: en ? "Request rejected." : "Permintaan ditolak.", spam: true };
  }

  const storeName = clean(b.storeName, 150);
  if (storeName.length < 2) {
    return { ok: false, error: en ? "Store name is required." : "Nama toko wajib diisi." };
  }

  const city = clean(b.city, 100);
  if (city.length < 2) {
    return { ok: false, error: en ? "City is required." : "Kota wajib diisi." };
  }

  const whatsapp = normalizeWhatsapp(typeof b.whatsapp === "string" ? b.whatsapp : "");
  if (!whatsapp) {
    return {
      ok: false,
      error: en ? "Invalid WhatsApp number. Example: +6591234567." : "Nomor WhatsApp tidak valid. Contoh: 0812xxxxxxxx.",
    };
  }

  let storeLink: string | null = clean(b.storeLink, 300) || null;
  if (storeLink) {
    const candidate = /^https?:\/\//i.test(storeLink) ? storeLink : `https://${storeLink}`;
    try {
      const url = new URL(candidate);
      if (!/^https?:$/.test(url.protocol) || !url.hostname.includes(".")) throw new Error("x");
      storeLink = url.toString().slice(0, 300);
    } catch {
      return {
        ok: false,
        error: en ? "Invalid store link. Example: yourstore.com." : "Link toko tidak valid. Contoh: tokopedia.com/namatoko.",
      };
    }
  }

  return { ok: true, data: { storeName, city, whatsapp, storeLink } };
}

/** Link wa.me ke sales dengan pesan pembuka (ID / EN). */
export function salesWhatsappUrl(phone: string, storeName?: string, locale: Locale = "id"): string {
  const text =
    locale === "en"
      ? storeName
        ? `Hi Rigspace, I'm from ${storeName}. I'd like to request a free store website demo.`
        : "Hi Rigspace, I'd like to request a free website demo for my computer store."
      : storeName
      ? `Halo Rigspace, saya dari ${storeName}. Saya ingin minta demo website toko.`
      : "Halo Rigspace, saya ingin minta demo website untuk toko komputer saya.";
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
