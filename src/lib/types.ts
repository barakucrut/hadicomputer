export type Availability = "tersedia" | "preorder" | "habis";
export type Condition = "baru" | "bekas";
export type ProductVariant = {
  id: string;
  name: string;
  price: number | null;
  originalPrice?: number | null;
  availability: Availability;
};
export type Product = {
  id: string;
  slug: string;
  code: string;
  name: string;
  brand: string;
  category: string;
  condition: Condition;
  price: number | null;
  originalPrice?: number | null;
  bonus?: string | null;
  availability: Availability;
  images: string[];
  summary: string;
  description: string;
  warranty: string;
  conditionNote?: string;
  specs: { name: string; value: string }[];
  variants: ProductVariant[];
  /** Jumlah stok (null = tidak dilacak) */
  stock?: number | null;
  /** Label stok siap tampil sesuai pengaturan toko, mis. "Sisa 4 unit" / "Stok terbatas" */
  stockLabel?: string | null;
  labels: string[];
  needs: string[];
  publishedAt: string;
};
export type Service = {
  slug: string;
  name: string;
  eyebrow: string;
  summary: string;
  description: string;
  image: string;
  price: number | null;
  inclusions: string[];
  steps: string[];
};
export type BannerHotspot = {
  label: string;
  x: number;
  y: number;
};
export type Banner = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  mobileTitle?: string;
  mobileDescription?: string;
  image: string;
  href: string;
  cta: string;
  theme: "light" | "dark" | "sage";
  hotspots?: BannerHotspot[];
  /** "hero" = banner utama (slide), "tile" = kartu samping */
  placement?: "hero" | "tile";
  /** Harga (dari produk tertaut atau isian manual) */
  price?: number | null;
  originalPrice?: number | null;
  /** Spek ringkas produk tertaut, mis. ["i7-13650HX", "RTX 4050"] */
  specs?: string[];
  productSlug?: string | null;
  /** "studio" = foto produk transparan di panggung gelap; "photo" = gambar banner biasa */
  style?: "studio" | "photo";
};

export type ServiceCaseItem = {
  id: string;
  title: string;
  device: string | null;
  summary: string;
  durationText: string | null;
  completedAt: string | null;
  images: string[];
  serviceName: string | null;
  serviceSlug: string | null;
};
export type HomepageSectionToggles = {
  heroSlider?: boolean;
  valueStrip?: boolean;
  categories?: boolean;
  promoWeek?: boolean;
  featured?: boolean;
  needs?: boolean;
  latest?: boolean;
  pcGaming?: boolean;
  services?: boolean;
  testimonials?: boolean;
  storeLocation?: boolean;
};

export type HomepageConfig = {
  templateId?: string;
  featuredTitle?: string;
  featuredEyebrow?: string;
  featuredDescription?: string;
  bestSellerTitle?: string;
  bestSellerEyebrow?: string;
  bestSellerDescription?: string;
  waConsultLabel?: string;
  waFloatingLabel?: string;
  storeSectionTitle?: string;
  storeSectionEyebrow?: string;
  storeSectionDescription?: string;
  sections?: HomepageSectionToggles;
};

export type StoreSettings = {
  id?: string;
  slug?: string;
  name: string;
  tagline?: string | null;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  whatsapp: string | null;
  address: string | null;
  hours: string | null;
  email: string | null;
  instagram: string | null;
  tiktok: string | null;
  facebook: string | null;
  mapsUrl: string | null;
  /** Link "Lihat semua ulasan di Google" (opsional) */
  googleReviewUrl?: string | null;
  homepageConfig?: HomepageConfig | null;
  /** Tampilan stok di etalase (diisi layout dari pengaturan toko) */
  stockDisplay?: "hidden" | "exact" | "limited";
  lowStockThreshold?: number;
  /** Bahasa & mata uang etalase toko (bilingual / pasar internasional) */
  locale?: "id" | "en";
  currency?: "IDR" | "USD" | "SGD" | "MYR" | "EUR";
};

export type Testimonial = {
  id: string;
  name: string;
  descriptor: string | null;
  quote: string;
  rating: number | null;
  label: string | null;
  photoUrl: string | null;
  source: "GOOGLE" | "WHATSAPP" | "DIRECT";
};
