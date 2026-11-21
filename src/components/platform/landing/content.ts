/**
 * Teks & data landing page rigspace.id (satu tempat untuk wording, harga, dan template).
 * Aturan: tanpa angka/testimoni karangan, tanpa fitur yang belum ada kecuali diberi label "segera".
 */

export const BRAND_LINE = "Rig your store.";

export const HERO = {
  eyebrow: "Platform website khusus toko komputer",
  lines: ["Pembeli datang.", "Chat masuk.", "Margin utuh."],
  lead: "Website khusus toko komputer — katalog lengkap dengan spesifikasi, pembeli langsung chat WhatsApp, tanpa potongan marketplace.",
  tryLabel: "Coba sekarang — ketik nama toko Anda",
  cta: "Jadikan website asli — Demo Gratis",
  hint: "disiapkan dengan produk toko Anda sendiri",
};

export const AUDIENCE = ["Toko laptop", "Rakit PC", "Servis komputer", "Printer & aksesori", "Gaming gear", "Laptop bekas"];

export const PROBLEMS = [
  {
    title: "Potongan marketplace makan margin.",
    body: "Biaya admin marketplace bisa 4–8,5% per transaksi, sementara margin laptop sering hanya beberapa persen.",
  },
  {
    title: "Pembeli mudah pindah toko.",
    body: "Di marketplace, toko Anda bersebelahan dengan pesaing yang lebih murah sepuluh ribu.",
  },
  {
    title: "Website lama ribet dan rawan.",
    body: "Puluhan plugin, tidak ada yang merawat, dan kadang disusupi link judi tersembunyi tanpa Anda sadari.",
  },
];

export const STEPS = [
  { title: "Kirim link toko Anda", body: "Dari marketplace, website lama, atau file katalog." },
  { title: "Kami siapkan demonya", body: "Website dengan nama, logo, dan produk Anda sendiri — gratis." },
  { title: "Cocok? Langsung live", body: "Di namatoko.rigspace.id atau domain Anda sendiri." },
];

/** Galeri template — akan tumbuh >10 template; nanti diambil dari registry template. */
export const TEMPLATES = [
  { id: "precision", name: "Precision", note: "Bersih & presisi", image: "/platform/landing/tpl-precision.webp" },
  { id: "classic-retail", name: "Classic", note: "Toko serba ada", image: "/platform/landing/tpl-classic-retail.webp" },
  { id: "minimalist-boutique", name: "Boutique", note: "Minimalis", image: "/platform/landing/tpl-minimalist-boutique.webp" },
  { id: "gaming-arena", name: "Gaming Arena", note: "Untuk rakit PC", image: "/platform/landing/tpl-gaming-arena.webp" },
];

export const PLANS = [
  {
    id: "starter",
    name: "Starter",
    for: "Toko servis & aksesori",
    price: "Rp 1,49 jt",
    alt: "atau Rp 150rb / bulan",
    features: ["Katalog produk baru & bekas", "Tombol WhatsApp di setiap produk", "CMS sederhana", "Domain sendiri"],
    cta: "Minta Demo",
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    for: "Toko retail komputer & rakit PC",
    price: "Rp 2,79 jt",
    alt: "atau Rp 280rb / bulan",
    features: ["Semua fitur Starter", "PC Builder Simulator", "Kalkulator Trade-In", "SEO lokal", "Broadcast promo WhatsApp|segera"],
    cta: "Minta Demo Gratis",
    highlight: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    for: "Distributor & toko grosir",
    price: "Rp 4,9 jt",
    alt: "+ biaya setup",
    features: ["Semua fitur Pro", "Fitur & integrasi sesuai kebutuhan", "Pendampingan khusus"],
    cta: "Hubungi Sales",
    highlight: false,
  },
];

export const FAQS = [
  { q: "Perlu bisa coding?", a: "Tidak. Produk, banner, dan harga diatur dari CMS yang sederhana." },
  { q: "Bisa pakai domain sendiri?", a: "Bisa. Atau pakai alamat namatoko.rigspace.id tanpa biaya tambahan." },
  { q: "Produk di marketplace bisa dipindah?", a: "Bisa. Kami bantu impor dari Excel, marketplace, atau website lama." },
  { q: "Data toko milik siapa?", a: "Milik Anda. Katalog bisa diekspor kapan saja." },
  { q: "Pembeli bayar lewat mana?", a: "Lewat WhatsApp & transfer seperti biasa — langsung ke rekening toko Anda." },
  { q: "Kalau berhenti langganan?", a: "Website dinonaktifkan di akhir masa langganan, data katalog tetap bisa Anda ekspor." },
];

export const BRAND_COLORS = ["#dd2028", "#2563eb", "#111413", "#16a34a", "#facc15"];

/** Slug pratinjau dari nama toko yang diketik pengunjung (hanya tampilan). */
export function previewSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 30);
  return slug || "namatoko";
}
