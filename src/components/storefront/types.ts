import type { Product, Banner, Service, StoreSettings, Testimonial } from "@/lib/types";

export interface StorefrontTemplateProps {
  tenant: {
    id: string;
    slug: string;
    name: string;
    settings: StoreSettings;
  };
  products: Product[];
  banners: Banner[];
  categories: Array<{ name: string; value: string; icon: string; description: string }>;
  needs: Array<{ id: string; name: string; slug: string; description: string; icon: string }>;
  services: Service[];
  /** Testimoni aktif (maks. 6, unggulan dulu). Kosong = section tidak tampil. */
  testimonials: Testimonial[];
  /** Data tambahan (dipakai template Precision; template lain boleh mengabaikan) */
  brands?: Array<{ id: string; name: string; slug: string; logoUrl: string | null; productCount: number }>;
  profile?: { foundedYear: number | null; quickSearches: string[] };
}
