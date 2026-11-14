import productsData from "./products.json";
import type { Banner, Product, Service, StoreSettings } from "./types";

// Synchronous static fallback for build time & unit tests
export function getProducts(): Product[] {
  return productsData as Product[];
}

export function getProduct(slug: string) {
  return getProducts().find((product) => product.slug === slug);
}

export const categories = [
  {
    name: "PC Desktop",
    value: "pc",
    icon: "pc",
    description: "Gaming & produktivitas",
  },
  {
    name: "Laptop",
    value: "laptop",
    icon: "laptop",
    description: "Kerja, kuliah & kreasi",
  },
  {
    name: "Smartphone",
    value: "smartphone",
    icon: "smartphone",
    description: "Tetap terhubung",
  },
  {
    name: "Tablet",
    value: "tablet",
    icon: "tablet",
    description: "Ringkas & serbaguna",
  },
  {
    name: "Aksesori",
    value: "aksesori",
    icon: "headphones",
    description: "Lengkapi perangkatmu",
  },
];

export const banners: Banner[] = [
  {
    id: "promo-bundle",
    mobileTitle: "Perangkat idaman.\nBonus lebih lengkap.",
    mobileDescription: "Bonus pilihan untuk laptop & PC favoritmu pekan ini.",
    eyebrow: "PROMO SPESIAL MINGGU INI",
    title: "Beli Perangkat Idaman.\nBawa Pulang Bonus Lengkap.",
    description:
      "Dapatkan paket bundling Free Kaos eksklusif Hadi, Mouse, Keyboard, dan setup siap pakai untuk setiap pembelian laptop atau PC rakitan pilihan pekan ini.",
    image: "/images/banners/promo-bundle.png",
    href: "#promo-minggu-ini",
    cta: "Lihat Promo Spesial",
    theme: "dark",
    hotspots: [
      { label: "FREE Gaming Mouse", x: 84, y: 32 },
      { label: "FREE Keyboard", x: 92, y: 56 },
      { label: "FREE Kaos Hadi", x: 82, y: 76 },
    ],
  },
  {
    id: "gaming",
    mobileTitle: "Rakit PC.\nSesuai caramu.",
    mobileDescription: "Mulai dari kebutuhan dan budget, kita bantu pilihkan.",
    eyebrow: "BUAT SETUP IMPIANMU",
    title: "Level baru.\nPengalaman baru.",
    description:
      "Mulai dari ide hingga rakitan. Konsultasikan PC yang sesuai dengan game dan kebutuhanmu.",
    image: "/images/banners/gaming.png",
    href: "/layanan/rakit-pc",
    cta: "Jelajahi jasa rakit PC",
    theme: "dark",
  },
  {
    id: "used",
    mobileTitle: "Bekas pilihan.\nHarga bersahabat.",
    mobileDescription: "Laptop bekas dengan informasi kondisi yang jelas.",
    eyebrow: "PILIHAN CERDAS, NILAI LEBIH",
    title: "Tetap produktif.\nLebih bersahabat.",
    description:
      "Jelajahi pilihan laptop bekas dengan informasi kondisi yang jelas. Pilih yang pas untukmu.",
    image: "/images/banners/used.png",
    href: "/katalog?kondisi=bekas",
    cta: "Lihat pilihan bekas",
    theme: "sage",
  },
];

export const services: Service[] = [
  {
    slug: "servis-perangkat",
    name: "Servis & perawatan",
    eyebrow: "KEMBALI NYAMAN DIGUNAKAN",
    summary:
      "Perangkat mulai lambat atau butuh perhatian? Ceritakan kendalanya, kita cari solusinya.",
    description:
      "Konsultasikan kendala laptop atau komputer sebelum datang ke toko. Pemeriksaan awal membantu menentukan tindakan dan estimasi biaya yang sesuai dengan kebutuhan perangkatmu.",
    image: "/images/banners/work.png",
    price: null,
    inclusions: [
      "Konsultasi kendala perangkat",
      "Pemeriksaan dan diagnosis awal",
      "Pembersihan serta perawatan perangkat",
      "Konsultasi upgrade RAM dan penyimpanan",
    ],
    steps: [
      "Ceritakan kendala lewat WhatsApp",
      "Konfirmasi jadwal dan bawa perangkat",
      "Terima estimasi sebelum pengerjaan",
      "Pemeriksaan akhir dan pengambilan",
    ],
  },
  {
    slug: "rakit-pc",
    name: "Rakit PC sesuai kebutuhan",
    eyebrow: "SETUP PERSONAL UNTUKMU",
    summary:
      "Untuk kerja, kreasi, atau gaming. Mulai dari kebutuhan dan budget, bukan sekadar spesifikasi.",
    description:
      "Bangun PC dengan pilihan komponen yang sesuai kebutuhanmu. Diskusikan penggunaan, anggaran, dan preferensi agar owner dapat memberikan rekomendasi serta penawaran. Owner membantu menyusun rekomendasi dan estimasi setelah memahami kebutuhanmu.",
    image: "/images/banners/gaming.png",
    price: null,
    inclusions: [
      "Konsultasi kebutuhan dan anggaran",
      "Rekomendasi kompatibilitas komponen",
      "Perakitan dan penataan kabel",
      "Pengujian dasar sebelum serah terima",
    ],
    steps: [
      "Ceritakan kebutuhan dan budget",
      "Diskusikan rekomendasi komponen",
      "Setujui penawaran dari owner",
      "Perakitan, pengujian, dan pengambilan",
    ],
  },
];

export function getService(slug: string) {
  return services.find((service) => service.slug === slug);
}

export const store: StoreSettings = {
  name: "Hadi Computer",
  whatsapp: "+6285769000007",
  address: "Jl. Ahmad Yani No. 45, Lantai 1",
  hours: "Buka setiap hari: 08.00 – 22.00 WIB",
  email: null,
  instagram: null,
  tiktok: null,
  facebook: null,
  mapsUrl: null,
};
