import type { Product, Banner, Service, ServiceCaseItem, StoreSettings } from "@/lib/types";

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
  /** Data tambahan (dipakai template Precision; template lain boleh mengabaikan) */
  brands?: Array<{ id: string; name: string; slug: string; logoUrl: string | null; productCount: number }>;
  serviceCases?: ServiceCaseItem[];
  profile?: { foundedYear: number | null; quickSearches: string[] };
}
