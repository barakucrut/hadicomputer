/**
 * Event GA4 landing page rigspace.id (satu tempat untuk nama & parameter event).
 * Elemen di landing-page.tsx (server component) cukup diberi atribut dari `track()`;
 * `LandingTracker` (client) menangkap klik lewat delegasi lalu mengirim event.
 * Aturan: tidak pernah mengirim data pribadi (nama toko, nomor WA, kota) ke GA.
 */

export const LANDING_EVENTS = {
  /** Klik tombol ajakan "Minta Demo" (nav, hero, harga, footer). */
  ctaClick: "cta_click",
  /** Klik tombol paket di bagian Harga. */
  selectPlan: "select_plan",
  /** Klik menu navigasi (Fitur, Harga, ...). */
  navClick: "nav_click",
  /** Klik "Masuk" / "Masuk CMS". */
  loginClick: "login_click",
  /** Calon pelanggan menjadi lead: form demo terkirim atau klik WhatsApp sales. */
  generateLead: "generate_lead",
  /** Pertama kali mengetik nama toko di hero (sekali per kunjungan). */
  tryStoreName: "try_store_name",
  /** Memilih warna brand di hero. */
  tryBrandColor: "try_brand_color",
  /** Mulai mengisi form demo (sekali per kunjungan). */
  formStart: "form_start",
  /** Form demo ditolak (validasi / batas kirim). */
  formError: "form_error",
  /** Membuka pertanyaan FAQ. */
  faqOpen: "faq_open",
  /** Section terlihat di layar (sekali per section per kunjungan). */
  sectionView: "section_view",
  /** Pengunjung mengganti bahasa landing page (id / en). */
  langSwitch: "lang_switch",
} as const;

export type LandingEvent = (typeof LANDING_EVENTS)[keyof typeof LANDING_EVENTS];

const ALLOWED = new Set<string>(Object.values(LANDING_EVENTS));
const PARAM_RE = /^[a-z][a-z0-9_]{0,39}$/;

/** Atribut data-track untuk elemen yang diklik: `<a {...track("cta_click", { location: "nav" })}>`. */
export function track(event: LandingEvent, params: Record<string, string> = {}): Record<string, string> {
  const attrs: Record<string, string> = { "data-track": event };
  for (const [k, v] of Object.entries(params)) {
    if (PARAM_RE.test(k)) attrs[`data-track-${k.replace(/_/g, "-")}`] = v;
  }
  return attrs;
}

/** Baca kembali atribut data-track (dari `element.dataset`) menjadi nama event + parameter yang aman. */
export function readTrack(dataset: Record<string, string | undefined>): { event: LandingEvent; params: Record<string, string> } | null {
  const event = dataset.track;
  if (!event || !ALLOWED.has(event)) return null;
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(dataset)) {
    if (!key.startsWith("track") || key === "track" || value == null) continue;
    const name = key
      .slice(5)
      .replace(/^[A-Z]/, (c) => c.toLowerCase())
      .replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
    if (PARAM_RE.test(name)) params[name] = value.slice(0, 100);
  }
  return { event: event as LandingEvent, params };
}
