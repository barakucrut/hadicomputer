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
};
export type StoreSettings = {
  name: string;
  whatsapp: string | null;
  address: string | null;
  hours: string | null;
  email: string | null;
  instagram: string | null;
  tiktok: string | null;
  facebook: string | null;
  mapsUrl: string | null;
  googleReviewUrl?: string | null;
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
