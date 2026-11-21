import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authorizePlatform, tenantScope } from "@/lib/god-auth";
import { ALL_PLATFORM_ROLES } from "@/lib/platform-access";
import { tenantHealth } from "@/lib/platform-access";

/**
 * Portofolio tenant untuk dashboard (marketing: hanya tenant bawaannya).
 * Berisi KPI ringkas + checklist kesehatan onboarding per tenant. Tanpa data keuangan.
 */
export async function GET() {
  const auth = await authorizePlatform(ALL_PLATFORM_ROLES);
  if (!auth.ok) return auth.response;

  try {
    const tenants = await prisma.tenant.findMany({
      where: tenantScope(auth.session),
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        status: true,
        createdAt: true,
        siteStatus: true,
        demoTokenExpiresAt: true,
        acquiredBy: { select: { id: true, name: true } },
        settings: { select: { logoUrl: true, whatsappNumber: true, address: true, primaryColor: true } },
      },
    });
    const ids = tenants.map((t) => t.id);
    const since = new Date(Date.now() - 30 * 86_400_000);

    const [demoViews, demoViews7d] = ids.length
      ? await Promise.all([
          prisma.demoView.groupBy({ by: ["tenantId"], where: { tenantId: { in: ids } }, _count: { _all: true }, _max: { createdAt: true } }),
          prisma.demoView.groupBy({
            by: ["tenantId"],
            where: { tenantId: { in: ids }, createdAt: { gte: new Date(Date.now() - 7 * 86_400_000) } },
            _count: { _all: true },
          }),
        ])
      : [[], []];

    const [products, samples, banners, logins, inquiries] = ids.length
      ? await Promise.all([
          prisma.product.groupBy({ by: ["tenantId"], where: { tenantId: { in: ids }, deletedAt: null }, _count: { _all: true } }),
          prisma.product.groupBy({ by: ["tenantId"], where: { tenantId: { in: ids }, deletedAt: null, isSample: true }, _count: { _all: true } }),
          prisma.banner.groupBy({ by: ["tenantId"], where: { tenantId: { in: ids }, isActive: true }, _count: { _all: true } }),
          prisma.adminUser.groupBy({ by: ["tenantId"], where: { tenantId: { in: ids } }, _max: { lastLoginAt: true } }),
          prisma.inquiryLog.groupBy({ by: ["tenantId"], where: { tenantId: { in: ids }, createdAt: { gte: since } }, _count: { _all: true } }),
        ])
      : [[], [], [], [], []];

    const count = (rows: { tenantId: string | null; _count: { _all: number } }[], id: string) =>
      rows.find((r) => r.tenantId === id)?._count._all ?? 0;

    const now = new Date();
    const items = tenants.map((t) => {
      const lastAdminLoginAt = logins.find((r) => r.tenantId === t.id)?._max.lastLoginAt ?? null;
      const stats = {
        products: count(products, t.id),
        sampleProducts: count(samples, t.id),
        banners: count(banners, t.id),
        inquiries30d: count(inquiries, t.id),
      };
      return {
        id: t.id,
        name: t.name,
        slug: t.slug,
        plan: t.plan,
        status: t.status,
        createdAt: t.createdAt,
        primaryColor: t.settings?.primaryColor || "#cc252b",
        acquiredBy: t.acquiredBy,
        siteStatus: t.siteStatus,
        demo: {
          linkExpiresAt: t.demoTokenExpiresAt,
          views: demoViews.find((v) => v.tenantId === t.id)?._count._all ?? 0,
          views7d: demoViews7d.find((v) => v.tenantId === t.id)?._count._all ?? 0,
          lastViewAt: demoViews.find((v) => v.tenantId === t.id)?._max.createdAt ?? null,
        },
        lastAdminLoginAt,
        ...stats,
        health: tenantHealth(
          {
            ...stats,
            hasLogo: Boolean(t.settings?.logoUrl),
            whatsappNumber: t.settings?.whatsappNumber,
            address: t.settings?.address,
            lastAdminLoginAt,
          },
          now
        ),
      };
    });

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const kpi = {
      total: items.length,
      newThisMonth: items.filter((t) => t.createdAt >= monthStart).length,
      active: items.filter((t) => t.status === "ACTIVE").length,
      trial: items.filter((t) => t.status === "TRIAL").length,
      suspended: items.filter((t) => t.status === "SUSPENDED").length,
      needsAttention: items.filter((t) => t.health.stage === "baru" || t.health.stage === "onboarding").length,
      inquiries30d: items.reduce((sum, t) => sum + t.inquiries30d, 0),
      demo: items.filter((t) => t.siteStatus === "DEMO").length,
      demoViews7d: items.reduce((sum, t) => sum + t.demo.views7d, 0),
    };

    return NextResponse.json({ success: true, kpi, tenants: items });
  } catch (err) {
    console.error("GET /api/god-mode/portfolio error:", err);
    return NextResponse.json({ error: "Gagal memuat portofolio tenant." }, { status: 500 });
  }
}
