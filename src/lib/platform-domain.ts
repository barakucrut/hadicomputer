/**
 * Domain platform rigspace.id (murni, tanpa I/O — dipakai resolver, middleware, UI & tes).
 *
 *   rigspace.id / www.rigspace.id   -> landing page platform (bukan toko)
 *   {slug}.rigspace.id              -> etalase toko
 *   domain lain (bitcomplaza.com)   -> custom domain toko
 *   localhost, 127.0.0.1, IP LAN, *.trycloudflare.com, *.ngrok*  -> host pengembangan
 *     (boleh fallback ke toko pertama & ?store= bebas, supaya dev/demo lokal tetap nyaman)
 *
 * Domain utama diatur env NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN (bawaan "rigspace.id").
 */
export const DEFAULT_ROOT_DOMAIN = "rigspace.id";

export function platformRootDomain(): string {
  const raw = (process.env.NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN || DEFAULT_ROOT_DOMAIN).trim().toLowerCase();
  return raw.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "") || DEFAULT_ROOT_DOMAIN;
}

/** Subdomain yang tidak boleh dipakai sebagai slug toko. */
export const RESERVED_SLUGS = new Set([
  "www",
  "app",
  "admin",
  "api",
  "god-mode",
  "godmode",
  "demo",
  "preview",
  "mail",
  "email",
  "smtp",
  "ftp",
  "cdn",
  "static",
  "assets",
  "img",
  "blog",
  "docs",
  "help",
  "support",
  "status",
  "dashboard",
  "billing",
  "rigspace",
]);

export type HostKind =
  | { kind: "dev"; slug: string | null } // slug terisi untuk {slug}.localhost
  | { kind: "platform-root" }
  | { kind: "subdomain"; slug: string }
  | { kind: "reserved"; slug: string }
  | { kind: "custom"; domain: string };

const DEV_SUFFIXES = [".trycloudflare.com", ".ngrok-free.app", ".ngrok.app", ".ngrok.io", ".lhr.life"];

function isPrivateIp(host: string): boolean {
  return (
    /^127\.\d+\.\d+\.\d+$/.test(host) ||
    /^10\.\d+\.\d+\.\d+$/.test(host) ||
    /^192\.168\.\d+\.\d+$/.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(host) ||
    host === "::1" ||
    host === "[::1]"
  );
}

/** Ambil hostname bersih dari header Host (tanpa port, huruf kecil). */
export function cleanHostname(host: string | null | undefined): string {
  const h = (host || "").trim().toLowerCase();
  if (h.startsWith("[")) return h.slice(0, h.indexOf("]") + 1);
  return h.split(":")[0];
}

export function classifyHost(rawHost: string | null | undefined, root: string = platformRootDomain()): HostKind {
  const host = cleanHostname(rawHost);
  if (!host || host === "localhost" || isPrivateIp(host) || DEV_SUFFIXES.some((s) => host.endsWith(s))) {
    return { kind: "dev", slug: null };
  }
  // Alias pengembangan untuk landing platform: rigspace.localhost
  if (host === `${root.split(".")[0]}.localhost`) return { kind: "platform-root" };
  if (host.endsWith(".localhost")) {
    const slug = host.slice(0, -".localhost".length).split(".").pop() || "";
    return { kind: "dev", slug: slug && !RESERVED_SLUGS.has(slug) ? slug : null };
  }
  if (host === root || host === `www.${root}`) return { kind: "platform-root" };
  if (host.endsWith(`.${root}`)) {
    const sub = host.slice(0, -(root.length + 1));
    // Hanya satu tingkat: a.b.rigspace.id tidak dianggap toko
    if (!sub || sub.includes(".")) return { kind: "reserved", slug: sub };
    return RESERVED_SLUGS.has(sub) ? { kind: "reserved", slug: sub } : { kind: "subdomain", slug: sub };
  }
  return { kind: "custom", domain: host.replace(/^www\./, "") };
}

/** Validasi slug toko baru (dipakai API & form): huruf kecil, angka, strip; bukan kata cadangan. */
export function tenantSlugError(slug: string): string | null {
  if (!/^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$/.test(slug)) {
    return "Slug hanya huruf kecil, angka, dan tanda strip (3–63 karakter, tidak diawali/diakhiri strip).";
  }
  if (RESERVED_SLUGS.has(slug)) return `Slug "${slug}" dicadangkan sistem. Pilih nama lain.`;
  return null;
}

/** Alamat etalase publik toko (untuk ditampilkan di god-mode/dashboard). */
export function tenantStorefrontHost(slug: string, root: string = platformRootDomain()): string {
  return `${slug}.${root}`;
}

/**
 * Link demo untuk dibagikan. Produksi: selalu di subdomain toko. Host pengembangan
 * (localhost/tunnel): di origin request itu sendiri supaya bisa dites tanpa DNS.
 */
export function demoLinkUrl(slug: string, token: string, requestHost: string | null | undefined, root: string = platformRootDomain()): string {
  const kind = classifyHost(requestHost, root);
  if (kind.kind === "dev") {
    const host = (requestHost || "localhost:3000").trim();
    const bare = cleanHostname(host);
    const proto = bare === "localhost" || bare.endsWith(".localhost") || /^(127|10|192\.168|172)\./.test(bare) ? "http" : "https";
    return `${proto}://${host}/demo/${token}`;
  }
  return `https://${tenantStorefrontHost(slug, root)}/demo/${token}`;
}
