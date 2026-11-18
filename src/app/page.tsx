import { resolveStorefrontTenant } from "@/lib/tenant-resolver";
import {
  getLiveProducts,
  getLiveBanners,
  getLiveCategories,
  getLiveNeeds,
  getLiveServices,
} from "@/lib/live-repository";
import {
  ClassicRetailHome,
  MinimalistBoutiqueHome,
} from "@/components/storefront/templates";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ store?: string; preview?: string; template?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const explicitStore = resolvedParams.store || resolvedParams.preview;
  const tenant = await resolveStorefrontTenant(explicitStore);
  const storeSettings = tenant.settings;
  const config = storeSettings.homepageConfig || {};

  // Template resolution: query preview takes precedence, then store config, fallback to classic-retail
  const templateId =
    resolvedParams.template ||
    config.templateId ||
    (storeSettings as any).templateId ||
    "classic-retail";

  const [products, liveBanners, liveCategories, liveNeeds, liveServices] = await Promise.all([
    getLiveProducts(tenant.id),
    getLiveBanners(tenant.id),
    getLiveCategories(tenant.id),
    getLiveNeeds(tenant.id),
    getLiveServices(tenant.id),
  ]);

  const templateProps = {
    tenant,
    products,
    banners: liveBanners,
    categories: liveCategories,
    needs: liveNeeds,
    services: liveServices,
  };

  if (templateId === "minimalist-boutique") {
    return <MinimalistBoutiqueHome {...templateProps} />;
  }

  return <ClassicRetailHome {...templateProps} />;
}
