import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { authorizeAdmin } from "@/lib/auth";
import { prefixFromName } from "@/lib/product-sku";
import { parseAdvancedSettings, SettingsValidationError } from "@/lib/store-seo";

const SELECT = {
  seoTitle: true,
  seoDescription: true,
  seoKeywords: true,
  ogImageUrl: true,
  googleSiteVerification: true,
  searchIndexing: true,
  gaMeasurementId: true,
  gtmContainerId: true,
  stockDisplay: true,
  lowStockThreshold: true,
  skuPrefix: true,
  foundedYear: true,
  quickSearches: true,
} as const;

/** Pengaturan SEO, analitik & katalog toko (terpisah dari pengaturan tampilan). */
export async function GET() {
  const auth = await authorizeAdmin();
  if (!auth.ok) return auth.response;

  const tenant = await prisma.tenant.findUnique({
    where: { id: auth.tenantId },
    select: { name: true, slug: true, customDomain: true, settings: { select: SELECT } },
  });
  return NextResponse.json({
    settings: tenant?.settings ?? null,
    store: {
      name: tenant?.name || "",
      slug: tenant?.slug || "",
      domain: tenant?.customDomain || null,
      defaultSkuPrefix: prefixFromName(tenant?.name || ""),
      platformAnalytics: Boolean(process.env.NEXT_PUBLIC_PLATFORM_GA_ID),
    },
  });
}

export async function PUT(request: Request) {
  const auth = await authorizeAdmin(["settings:appearance", "settings:store_info", "settings:sections"]);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  try {
    const data = parseAdvancedSettings(body as Record<string, unknown>);
    const settings = await prisma.tenantSetting.upsert({
      where: { tenantId: auth.tenantId },
      update: data,
      create: { tenantId: auth.tenantId, ...data },
      select: SELECT,
    });
    revalidatePath("/", "layout");
    return NextResponse.json({ success: true, settings });
  } catch (err) {
    if (err instanceof SettingsValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("Advanced settings error:", err);
    return NextResponse.json({ error: "Gagal menyimpan pengaturan" }, { status: 500 });
  }
}
