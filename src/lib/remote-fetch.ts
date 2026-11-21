import { lookup } from "dns/promises";
import net from "net";

/**
 * Fetch URL publik dengan proteksi SSRF.
 * Dipakai importer (foto produk dari URL, katalog WooCommerce) supaya admin tenant
 * tidak bisa membuat server mengakses jaringan internal (localhost, database,
 * metadata cloud 169.254.169.254, jaringan privat, dll).
 */

export class RemoteFetchError extends Error {}

const MAX_REDIRECTS = 3;

function isPrivateIPv4(ip: string): boolean {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => Number.isNaN(n))) return true;
  const [a, b] = p;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) || // CGNAT
    (a === 169 && b === 254) || // link-local / metadata cloud
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224 // multicast & reserved
  );
}

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) return isPrivateIPv4(ip);
  const v6 = ip.toLowerCase();
  if (v6.startsWith("::ffff:")) return isPrivateIPv4(v6.slice(7));
  return (
    v6 === "::" ||
    v6 === "::1" ||
    v6.startsWith("fc") ||
    v6.startsWith("fd") || // unique local
    v6.startsWith("fe8") ||
    v6.startsWith("fe9") ||
    v6.startsWith("fea") ||
    v6.startsWith("feb") || // link-local
    v6.startsWith("ff") // multicast
  );
}

async function assertPublicUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new RemoteFetchError("URL tidak valid");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new RemoteFetchError("Hanya URL http/https yang diizinkan");
  }
  if (url.username || url.password) throw new RemoteFetchError("URL berisi kredensial tidak diizinkan");
  if (url.port && !["80", "443", "8080", "8443"].includes(url.port)) {
    throw new RemoteFetchError("Port URL tidak diizinkan");
  }

  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (/^(localhost|.*\.local|.*\.internal|.*\.localhost)$/i.test(host)) {
    throw new RemoteFetchError("Alamat internal tidak diizinkan");
  }
  const addresses = net.isIP(host) ? [{ address: host }] : await lookup(host, { all: true }).catch(() => []);
  if (addresses.length === 0) throw new RemoteFetchError("Domain tidak ditemukan");
  if (addresses.some((a) => isPrivateIp(a.address))) {
    throw new RemoteFetchError("Alamat jaringan internal tidak diizinkan");
  }
  return url;
}

/**
 * GET URL publik -> Buffer, dengan batas ukuran, timeout, dan cek ulang setiap redirect.
 */
export async function fetchPublic(
  rawUrl: string,
  { maxBytes, timeoutMs = 15000, accept }: { maxBytes: number; timeoutMs?: number; accept?: string }
): Promise<{ buffer: Buffer; contentType: string; finalUrl: string }> {
  let current = rawUrl;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const url = await assertPublicUrl(current);
      const res = await fetch(url, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent": "RigSpaceImporter/1.0 (+https://rigspace.id)",
          ...(accept ? { Accept: accept } : {}),
        },
      });

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (!location) throw new RemoteFetchError("Redirect tanpa tujuan");
        current = new URL(location, url).toString();
        continue;
      }
      if (!res.ok) throw new RemoteFetchError(`Server membalas ${res.status}`);

      const declared = Number(res.headers.get("content-length") || 0);
      if (declared > maxBytes) throw new RemoteFetchError("File terlalu besar");

      // Baca bertahap supaya file raksasa tanpa content-length tetap dihentikan
      const reader = res.body?.getReader();
      if (!reader) throw new RemoteFetchError("Respons kosong");
      const chunks: Uint8Array[] = [];
      let total = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > maxBytes) {
          await reader.cancel();
          throw new RemoteFetchError("File terlalu besar");
        }
        chunks.push(value);
      }
      return {
        buffer: Buffer.concat(chunks),
        contentType: res.headers.get("content-type") || "",
        finalUrl: url.toString(),
      };
    }
    throw new RemoteFetchError("Terlalu banyak redirect");
  } catch (err) {
    if (err instanceof RemoteFetchError) throw err;
    if ((err as Error).name === "AbortError") throw new RemoteFetchError("Waktu unduh habis");
    throw new RemoteFetchError("Gagal mengunduh");
  } finally {
    clearTimeout(timer);
  }
}
