import { fetchPublic, RemoteFetchError } from "../remote-fetch";
import { MAX_IMPORT_ROWS } from "./columns";
import { ImportFileError } from "./parse";
import type { ImportRow } from "./types";

/**
 * Importer katalog WooCommerce lewat Store API publik (/wp-json/wc/store/v1/products).
 * Hasilnya ImportRow biasa -> memakai pratinjau & commit yang sama dengan import Excel/CSV.
 */

interface WooProduct {
  id: number;
  name: string;
  sku?: string;
  short_description?: string;
  description?: string;
  prices?: { price?: string; regular_price?: string; sale_price?: string; currency_minor_unit?: number };
  categories?: { name: string; slug: string }[];
  images?: { src: string }[];
  is_in_stock?: boolean;
  is_purchasable?: boolean;
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", hellip: "…", rsquo: "'", lsquo: "'", rdquo: '"', ldquo: '"', times: "×", prime: "″", Prime: "″" };

export function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n] ?? m);
}

/** HTML deskripsi -> teks rapi dengan baris baru. */
export function htmlToText(html = ""): string {
  return decodeEntities(
    html
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n")
      .replace(/<li[^>]*>/gi, "• ")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
}

/** Merek umum toko komputer/elektronik Indonesia (dicocokkan sebagai kata di nama produk). */
const KNOWN_BRANDS = [
  "Apple", "Asus", "ROG", "Acer", "Lenovo", "HP", "Dell", "MSI", "Samsung", "Xiaomi", "Huawei", "Microsoft", "Axioo", "Advan",
  "Infinix", "Zyrex", "Toshiba", "Gigabyte", "Intel", "AMD", "Nvidia", "Epson", "Canon", "Brother", "Fuji Xerox", "Logitech",
  "Robot", "Rexus", "Fantech", "M-Tech", "Imperion", "Jete", "Seagate", "WD", "Western Digital", "Sandisk", "Kingston", "Adata",
  "Team", "Corsair", "Vgen", "Lexar", "TP-Link", "Mercusys", "Tenda", "D-Link", "Ubiquiti", "Mikrotik", "Totolink", "Xiaomi",
  "Anker", "Baseus", "Vivan", "Ugreen", "Orico", "Philips", "LG", "AOC", "ViewSonic", "BenQ", "Lenovo", "Sony", "JBL", "Edifier",
  "Sades", "Steelseries", "Razer", "HyperX", "Cooler Master", "NZXT", "Deepcool", "Armaggeddon", "Infocus", "Optoma", "Panasonic",
  "Mumuksu", "Nyk", "Digital Alliance", "Paradox", "Viper", "Votre", "Oppo", "Vivo", "Realme", "Tecno", "Itel", "Nokia",
  "Ventuz", "Iware", "Motorola", "Genius", "Prolink", "Mikuso", "Kodak", "Maxell", "Yuasa", "Kenika", "Qepo", "VenomRX",
  "Gamen", "Eppos", "Panda", "Xprinter", "Zebra", "Hikvision", "Ezviz", "Dahua", "Kenwood", "Krisbow", "ICA", "Prolink",
  "Enlight", "Simbadda", "Power Up", "Vention", "Robot", "Ezra", "Nexus", "Aula", "Noir", "Leotec", "Polytron",
];

/** Lini produk yang sering ditulis tanpa nama merek. */
const PRODUCT_LINES: [RegExp, string][] = [
  [/\b(vivobook|zenbook|expertbook|tuf gaming|rog strix|rog zephyrus|chromebook flip c)\b/i, "Asus"],
  [/\b(aspire|nitro|swift|predator|travelmate|extensa)\b/i, "Acer"],
  [/\b(ideapad|thinkpad|thinkbook|legion|yoga|loq|ideacentre|thinkcentre)\b/i, "Lenovo"],
  [/\b(deskjet|laserjet|officejet|smart tank|pavilion|victus|omen|envy|probook|elitebook)\b/i, "HP"],
  [/\b(inspiron|latitude|vostro|alienware|optiplex)\b/i, "Dell"],
  [/\b(macbook|imac|ipad|iphone|airpods)\b/i, "Apple"],
  [/\b(galaxy)\b/i, "Samsung"],
  [/\b(redmi|poco)\b/i, "Xiaomi"],
  [/\b(pixma|imageclass)\b/i, "Canon"],
  [/\b(ecotank)\b/i, "Epson"],
];

export function detectBrand(name: string): string {
  if (/\btp-?link\b/i.test(name)) return "TP-Link";
  const hay = ` ${name.toLowerCase().replace(/[^a-z0-9-]+/g, " ")} `;
  let best: { brand: string; pos: number } | null = null;
  for (const brand of KNOWN_BRANDS) {
    const needle = ` ${brand.toLowerCase().replace(/[^a-z0-9-]+/g, " ")} `;
    const pos = hay.indexOf(needle);
    if (pos !== -1 && (!best || pos < best.pos)) best = { brand: brand === "ROG" ? "Asus" : brand, pos };
  }
  if (best) return best.brand;
  const line = PRODUCT_LINES.find(([re]) => re.test(name));
  return line ? line[1] : "Lainnya";
}

const titleCase = (s: string) =>
  s
    .toLowerCase()
    .replace(/\b([a-z])/g, (c) => c.toUpperCase())
    .replace(/\b(Pc|Ssd|Hdd|Ram|Ups|Led|Lcd|Usb|Tws|Aio)\b/g, (w) => w.toUpperCase());

function mapCategory(raw?: string): string {
  const name = decodeEntities(raw || "").trim();
  if (!name || /^uncategori[sz]ed$/i.test(name)) return "Aksesori";
  if (/notebook|laptop/i.test(name)) return "Laptop";
  if (/accessor|aksesor/i.test(name)) return "Aksesori";
  return titleCase(name).slice(0, 100);
}

/** Buang akhiran nama toko, mis. "MOUSE ROBOT M205 | BITCOM PLAZA" -> "MOUSE ROBOT M205". */
export function cleanName(name: string, storeName: string): string {
  let out = decodeEntities(name).replace(/\s+/g, " ").trim();
  // Kata khas nama toko (>= 4 huruf), mis. "BITCOM PLAZA" -> ["bitcom", "plaza"]
  const tokens = storeName
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 4);
  if (tokens.length) {
    const words = tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
    // Segmen akhir setelah | – — - yang menyebut nama toko: "| PLAZA BITCOM", "| BITCOM PLAZA JEMBER"
    out = out.replace(new RegExp(`\\s*[|–—]\\s*[^|–—]*\\b(?:${words})\\b[^|–—]*$`, "i"), "");
    // Kata nama toko yang menempel di ujung: "... 6W USB BITCOM"
    out = out.replace(new RegExp(`(?:\\s+(?:${words}))+\\s*$`, "i"), "");
  }
  return out.replace(/\s*[|–—-]\s*$/, "").trim().slice(0, 200);
}

/** Ekstrak spek laptop/PC dari judul produk (CPU, RAM, storage, layar, OS). */
export function extractSpecs(name: string): { key: string; value: string }[] {
  const specs: { key: string; value: string }[] = [];
  const add = (key: string, value?: string) => value && !specs.some((s) => s.key === key) && specs.push({ key, value: value.trim() });

  add(
    "Prosesor",
    name.match(/\b(?:intel\s+)?(?:core\s+)?(?:ultra\s+)?(?:c?i[3579]|core\s*[3579]|ultra\s*[579])[-\s]?\d{3,5}[a-z]{0,3}\b/i)?.[0] ||
      name.match(/\bryzen\s*[3579]\s*\d{4}[a-z]{0,3}\b/i)?.[0] ||
      name.match(/\b(?:celeron|pentium|athlon)\s*[a-z]?\d{3,5}[a-z]?\b/i)?.[0] ||
      name.match(/\bapple\s+m[1-4](?:\s+(?:pro|max))?\b|\bm[1-4]\s+(?:chip|pro|max)\b/i)?.[0]
  );
  const ram = name.match(/\b(\d{1,3})\s*G(?:B)?\s*(?:DDR\d[a-z]?|LPDDR\d[a-z]?)\b/i) || name.match(/(?:^|[\/\s,])(\d{1,2})\s*GB?(?=\s*(?:\/|,|RAM))/i) || name.match(/RAM\s*(\d{1,3}(?:\+\d{1,3})?)\s*GB/i);
  if (ram) add("RAM", `${ram[1]}GB${/ddr\d/i.exec(ram[0])?.[0] ? " " + /l?p?ddr\d[a-z]?/i.exec(ram[0])![0].toUpperCase() : ""}`);
  const gb = name.match(/\b(\d{3,4})\s*G(?:B)?\s*(SSD|NVME|HDD|EMMC)?\b/i);
  const tb = name.match(/\b(\d)\s*T(?:B)?\s*(SSD|NVME|HDD)?\b/i);
  if (gb) add("Penyimpanan", `${gb[1]}GB ${(gb[2] || "SSD").toUpperCase()}`);
  else if (tb) add("Penyimpanan", `${tb[1]}TB ${(tb[2] || "SSD").toUpperCase()}`);
  const screen = name.match(/\b(1[0-8](?:[.,]\d)?)\s*(?:"|″|inch|in\b|”)/i) || name.match(/\b(1[0-8](?:[.,]\d)?)\s*(?=FHD|HD|OLED|IPS|WUXGA|QHD)/i);
  if (screen) add("Layar", `${screen[1].replace(",", ".")} inci`);
  const gpu = name.match(/\b(?:RTX|GTX)\s*\d{4}(?:\s*Ti)?\b|\bRadeon\s*(?:RX\s*)?\d{3,4}[a-z]?\b/i)?.[0];
  if (gpu) add("Grafis", gpu.toUpperCase().replace(/\s+/g, " "));
  const win = name.match(/\bW(?:in(?:dows)?)?\s*(1[01])\b/i);
  const office = /\b(OHS|OHS\d{2}|Office\s*Home)/i.test(name);
  if (win || office) add("Sistem Operasi", `Windows${win ? " " + win[1] : ""}${office ? " + Office Home & Student" : ""}`);
  return specs;
}

function toRupiah(raw: string | undefined, minor = 2): number | null {
  if (!raw) return null;
  const n = Number(raw) / Math.pow(10, minor);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

function normalizeBaseUrl(input: string): URL {
  let s = input.trim();
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  const url = new URL(s);
  url.pathname = "/";
  url.search = "";
  url.hash = "";
  return url;
}

export async function fetchWooCommerceRows(siteUrl: string): Promise<{ rows: ImportRow[]; storeName: string; source: string }> {
  let base: URL;
  try {
    base = normalizeBaseUrl(siteUrl);
  } catch {
    throw new ImportFileError("Alamat website tidak valid.");
  }

  // Nama situs (untuk membersihkan akhiran nama produk)
  let storeName = "";
  try {
    const { buffer } = await fetchPublic(new URL("/wp-json/", base).toString(), { maxBytes: 2 * 1024 * 1024, accept: "application/json" });
    storeName = decodeEntities(String(JSON.parse(buffer.toString("utf8")).name || ""));
  } catch {
    // opsional
  }

  const products: WooProduct[] = [];
  try {
    for (let page = 1; page <= 20 && products.length < MAX_IMPORT_ROWS; page++) {
      const url = new URL("/wp-json/wc/store/v1/products", base);
      url.searchParams.set("per_page", "100");
      url.searchParams.set("page", String(page));
      const { buffer } = await fetchPublic(url.toString(), { maxBytes: 15 * 1024 * 1024, accept: "application/json", timeoutMs: 30000 });
      const batch = JSON.parse(buffer.toString("utf8"));
      if (!Array.isArray(batch) || batch.length === 0) break;
      products.push(...batch);
      if (batch.length < 100) break;
    }
  } catch (err) {
    if (err instanceof RemoteFetchError || err instanceof SyntaxError) {
      throw new ImportFileError(
        "Katalog WooCommerce tidak dapat dibaca dari website ini. Pastikan website memakai WooCommerce dan Store API-nya aktif."
      );
    }
    throw err;
  }
  if (products.length === 0) throw new ImportFileError("Tidak ada produk yang ditemukan di website ini.");

  const rows: ImportRow[] = products.slice(0, MAX_IMPORT_ROWS).map((p, i) => {
    const name = cleanName(p.name || "", storeName);
    const minor = p.prices?.currency_minor_unit ?? 2;
    const price = toRupiah(p.prices?.price, minor);
    const regular = toRupiah(p.prices?.regular_price, minor);
    const summaryText = htmlToText(p.short_description).split("\n")[0] || "";
    const description = htmlToText(p.description) || htmlToText(p.short_description);
    const category = mapCategory(p.categories?.[0]?.name);
    return {
      rowNumber: i + 1,
      code: (p.sku || "").trim().toUpperCase().slice(0, 50),
      name,
      category,
      brand: detectBrand(name),
      condition: /\b(bekas|second|seken|used|refurb)/i.test(name) ? "BEKAS" : "BARU",
      basePrice: price,
      originalPrice: regular && price && regular > price ? regular : null,
      availability: p.is_in_stock === false ? "HABIS" : "TERSEDIA",
      stock: null,
      publicationStatus: "PUBLISHED",
      warranty: "",
      bonus: "",
      summary: summaryText.slice(0, 255),
      description: description.slice(0, 20000),
      specs: category === "Laptop" || /desktop|pc|all in one/i.test(category) ? extractSpecs(name) : [],
      images: (p.images || []).map((im) => im.src).filter((u) => /^https?:\/\//.test(u)).slice(0, 5),
      needs: [],
      isFeatured: false,
      isBestSeller: false,
      isPromo: Boolean(regular && price && regular > price),
      isNewArrival: false,
    };
  });

  return { rows, storeName, source: base.hostname };
}
