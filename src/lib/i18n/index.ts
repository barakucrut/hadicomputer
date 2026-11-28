/**
 * Pondasi i18n (bilingual ID / EN) untuk platform & storefront Rigspace.
 * Semua fungsi di sini murni (tanpa dependensi React/Next) agar mudah dites & dipakai di server/client/middleware.
 */

export const SUPPORTED_LOCALES = ["id", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "id";
export const LOCALE_COOKIE = "rigspace_locale";
export const LOCALE_HEADER = "x-rigspace-locale";

/** Validasi string mentah menjadi Locale yang sah, atau null bila tidak dikenali. */
export function parseLocale(value?: string | null): Locale | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "id" || normalized.startsWith("id-")) return "id";
  if (normalized === "en" || normalized.startsWith("en-")) return "en";
  return null;
}

/**
 * Deteksi bahasa awal dari header `Accept-Language` browser.
 * Pengunjung berbahasa Indonesia/Melayu -> "id"; pengunjung internasional (en, dsb.) -> "en".
 * Kosong / tidak terbaca -> DEFAULT_LOCALE ("id").
 */
export function detectLocaleFromAcceptLanguage(header?: string | null): Locale {
  if (!header || !header.trim()) return DEFAULT_LOCALE;
  const entries = header
    .split(",")
    .map((part) => {
      const [langRaw, ...params] = part.trim().split(";");
      const lang = (langRaw || "").trim().toLowerCase();
      let q = 1;
      for (const p of params) {
        const m = p.trim().match(/^q=([0-9.]+)$/);
        if (m) {
          const parsed = Number(m[1]);
          if (Number.isFinite(parsed)) q = parsed;
        }
      }
      return { lang, q };
    })
    .filter((e) => e.lang && e.q > 0)
    .sort((a, b) => b.q - a.q);

  for (const { lang } of entries) {
    if (lang === "*" || lang === "id" || lang.startsWith("id-") || lang === "ms" || lang.startsWith("ms-")) {
      return "id";
    }
    if (lang === "en" || lang.startsWith("en-")) {
      return "en";
    }
  }
  // Bahasa non-Indonesia lain (mis. de, fr, ja, es) -> tawarkan English untuk pasar internasional
  return entries.length > 0 ? "en" : DEFAULT_LOCALE;
}

/**
 * Resolusi bahasa dengan urutan prioritas:
 * 1. Query `?lang=id|en` (atau header yang diteruskan middleware)
 * 2. Cookie pilihan pengguna (`rigspace_locale`)
 * 3. Header `Accept-Language` browser
 * 4. Fallback (bawaan `"id"`)
 */
export function resolveLocale(opts: {
  query?: string | null;
  cookie?: string | null;
  acceptLanguage?: string | null;
  fallback?: Locale;
}): Locale {
  const fromQuery = parseLocale(opts.query);
  if (fromQuery) return fromQuery;

  const fromCookie = parseLocale(opts.cookie);
  if (fromCookie) return fromCookie;

  if (opts.acceptLanguage) {
    return detectLocaleFromAcceptLanguage(opts.acceptLanguage);
  }

  return opts.fallback ?? DEFAULT_LOCALE;
}
