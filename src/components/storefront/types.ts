import type { Product, Banner, Service, StoreSettings } from "@/lib/types";

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
}
