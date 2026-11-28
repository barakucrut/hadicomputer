/**
 * Serialisasi data terstruktur (JSON-LD) untuk `<script type="application/ld+json">`.
 *
 * Data milik tenant (nama produk, alamat, dsb.) bisa berisi `</script>` —
 * tanpa escape, teks itu menutup tag script dan menyuntikkan HTML/JS (XSS).
 * Semua "<" diganti `\u003c` (tetap JSON valid & dibaca sama oleh mesin pencari).
 * U+2028/U+2029 ikut di-escape agar aman untuk parser JS lama.
 */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
