import { resolveStorefrontTenant } from "@/lib/tenant-resolver";
import { resolveTemplateId } from "@/lib/storefront-template";
import {
  getLiveProducts,
  getLiveBanners,
  getLiveCategories,
  getLiveNeeds,
  getLiveServices,
  getLiveBrands,
  getLiveServiceCases,
  getLiveStoreProfile,
  getLiveTestimonials,
} from "@/lib/live-repository";
import {
  ClassicRetailHome,
  MinimalistBoutiqueHome,
  GamingArenaHome,
  PrecisionHome,
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
  // ?store= hanya berlaku untuk tim internal / host dev (dicek di resolver)
  const tenant = await resolveStorefrontTenant(undefined, { previewSlug: explicitStore });
  const storeSettings = tenant.settings;
  const config = storeSettings.homepageConfig || {};

  // Template resolution: query preview takes precedence, then store config, fallback to classic-retail
  const templateId = resolveTemplateId(config, resolvedParams.template);

  const [products, liveBanners, liveCategories, liveNeeds, liveServices, testimonials] = await Promise.all([
    getLiveProducts(tenant.id),
    getLiveBanners(tenant.id),
    getLiveCategories(tenant.id),
    getLiveNeeds(tenant.id),
    getLiveServices(tenant.id),
    getLiveTestimonials(tenant.id),
  ]);

  const templateProps = {
    tenant,
    products,
    banners: liveBanners,
    categories: liveCategories,
    needs: liveNeeds,
    services: liveServices,
    testimonials,
  };

  if (templateId === "precision") {
    const [brands, serviceCases, profile] = await Promise.all([
      getLiveBrands(tenant.id),
      getLiveServiceCases(tenant.id, 6),
      getLiveStoreProfile(tenant.id),
    ]);
    return <PrecisionHome {...templateProps} brands={brands} serviceCases={serviceCases} profile={profile} />;
  }

  if (templateId === "gaming-arena") {
    return <GamingArenaHome {...templateProps} />;
  }

  if (templateId === "minimalist-boutique") {
    return <MinimalistBoutiqueHome {...templateProps} />;
  }

  return <ClassicRetailHome {...templateProps} />;
}
