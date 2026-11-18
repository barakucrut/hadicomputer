import type { HomepageConfig } from "./types";

export const STOREFRONT_TEMPLATES = ["classic-retail", "minimalist-boutique", "gaming-arena"] as const;
export type StorefrontTemplateId = (typeof STOREFRONT_TEMPLATES)[number];

/** Request header set by middleware when a `?template=` preview param is present. */
export const TEMPLATE_PREVIEW_HEADER = "x-rigspace-template-preview";

/** Request header set by middleware when a `?store=` / `?preview=` param is present. */
export const STORE_PREVIEW_HEADER = "x-rigspace-store-preview";

export function isTemplateId(value: unknown): value is StorefrontTemplateId {
  return typeof value === "string" && (STOREFRONT_TEMPLATES as readonly string[]).includes(value);
}

/** Preview override wins, then the store's saved choice, then the default. */
export function resolveTemplateId(
  config: HomepageConfig | null | undefined,
  preview?: string | null,
): StorefrontTemplateId {
  if (isTemplateId(preview)) return preview;
  if (isTemplateId(config?.templateId)) return config.templateId;
  return "classic-retail";
}
