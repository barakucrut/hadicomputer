import type { Locale } from "./index";

/**
 * Mata uang yang didukung etalase Rigspace (multi-tenant / pasar internasional).
 * Harga produk di database disimpan sebagai angka bulat (unit utama: Rupiah, Dollar, Ringgit, Euro).
 */
export const SUPPORTED_CURRENCIES = ["IDR", "USD", "SGD", "MYR", "EUR"] as const;
export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

export const DEFAULT_CURRENCY: CurrencyCode = "IDR";

export const CURRENCY_META: Record<
  CurrencyCode,
  { code: CurrencyCode; label: string; symbol: string; intlLocale: string; approxIdrRate: number }
> = {
  IDR: { code: "IDR", label: "IDR — Rupiah Indonesia (Rp)", symbol: "Rp", intlLocale: "id-ID", approxIdrRate: 1 },
  USD: { code: "USD", label: "USD — US Dollar ($)", symbol: "$", intlLocale: "en-US", approxIdrRate: 16000 },
  SGD: { code: "SGD", label: "SGD — Singapore Dollar (S$)", symbol: "S$", intlLocale: "en-SG", approxIdrRate: 12000 },
  MYR: { code: "MYR", label: "MYR — Malaysian Ringgit (RM)", symbol: "RM", intlLocale: "ms-MY", approxIdrRate: 3600 },
  EUR: { code: "EUR", label: "EUR — Euro (€)", symbol: "€", intlLocale: "en-IE", approxIdrRate: 17200 },
};

export const CURRENCY_OPTIONS = SUPPORTED_CURRENCIES.map((c) => CURRENCY_META[c]);

export function parseCurrency(value?: string | null): CurrencyCode | null {
  if (!value) return null;
  const upper = value.trim().toUpperCase();
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(upper) ? (upper as CurrencyCode) : null;
}

/** Format angka harga sesuai mata uang toko (contoh: "Rp 15.000.000", "$1,299", "S$1,499", "RM 3,299"). */
export function formatMoney(value: number, currency: CurrencyCode = "IDR", locale?: Locale): string {
  const code = parseCurrency(currency) ?? DEFAULT_CURRENCY;
  const meta = CURRENCY_META[code];
  const intlLocale = code === "IDR" ? (locale === "en" ? "id-ID" : meta.intlLocale) : meta.intlLocale;
  try {
    return new Intl.NumberFormat(intlLocale, {
      style: "currency",
      currency: code,
      currencyDisplay: code === "SGD" || code === "MYR" ? "narrowSymbol" : "symbol",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${meta.symbol} ${Math.round(value).toLocaleString("en-US")}`;
  }
}

/** Format ringkas untuk etalase (mis. "Rp15,5jt" untuk IDR, "$1.3k" / "$850" untuk USD/lainnya). */
export function formatCompactMoney(value: number, currency: CurrencyCode = "IDR"): string {
  const code = parseCurrency(currency) ?? DEFAULT_CURRENCY;
  if (code === "IDR") {
    if (value >= 1_000_000) {
      const jt = value / 1_000_000;
      return `Rp${jt % 1 === 0 ? jt.toFixed(0) : jt.toFixed(1).replace(".", ",")}jt`;
    }
    if (value >= 1_000) return `Rp${Math.round(value / 1_000)}rb`;
    return `Rp${value}`;
  }
  const sym = CURRENCY_META[code].symbol;
  if (value >= 10_000) {
    const k = value / 1_000;
    return `${sym}${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return `${sym}${Math.round(value).toLocaleString("en-US")}`;
}

/** Konversi perkiraan harga Starter Pack (IDR -> mata uang target) lalu bulatkan ke angka cantik. */
export function convertSamplePrice(idrAmount: number | null, currency: CurrencyCode): number | null {
  if (idrAmount === null) return null;
  const code = parseCurrency(currency) ?? DEFAULT_CURRENCY;
  if (code === "IDR") return idrAmount;
  const raw = idrAmount / CURRENCY_META[code].approxIdrRate;
  if (raw >= 500) return Math.round(raw / 50) * 50 - 1; // mis. 999, 1249
  if (raw >= 100) return Math.round(raw / 10) * 10 - 1; // mis. 149, 299
  if (raw >= 20) return Math.round(raw / 5) * 5 - 1; // mis. 29, 49
  return Math.max(5, Math.round(raw));
}
