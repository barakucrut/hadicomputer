import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { authorizePlatform } from "@/lib/god-auth";
import { ALL_PLATFORM_ROLES } from "@/lib/platform-access";
import { findScopedTenant } from "@/lib/platform-tenant";
import { notFoundResponse } from "@/lib/tenant-scope";
import { demoExpiry, generateDemoToken, isDemoLinkActive } from "@/lib/demo-access";
import { demoLinkUrl } from "@/lib/platform-domain";

type Ctx = { params: Promise<{ id: string }> };

function payload(slug: string, token: string | null, expiresAt: Date | null, host: string | null) {
  const active = Boolean(token && isDemoLinkActive(expiresAt));
  return { active, url: active ? demoLinkUrl(slug, token!, host) : null, expiresAt: active ? expiresAt : null };
}

async function load(request: NextRequest, id: string) {
  const auth = await authorizePlatform(ALL_PLATFORM_ROLES);
  if (!auth.ok) return { error: auth.response } as const;
  // Marketing/CMO: hanya toko dalam lingkupnya (lainnya 404)
  if (!(await findScopedTenant(auth.session, id))) return { error: notFoundResponse("Tenant") } as const;
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    select: { id: true, slug: true, siteStatus: true, demoToken: true, demoTokenExpiresAt: true },
  });
  if (!tenant) return { error: notFoundResponse("Tenant") } as const;
  return { tenant, host: request.headers.get("x-forwarded-host") || request.headers.get("host") } as const;
}

/** Link demo yang masih berlaku (tanpa membuat baru). */
export async function GET(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const r = await load(request, id);
  if ("error" in r) return r.error;
  return NextResponse.json({ success: true, siteStatus: r.tenant.siteStatus, ...payload(r.tenant.slug, r.tenant.demoToken, r.tenant.demoTokenExpiresAt, r.host) });
}

/** Buat link demo baru (berlaku 30 hari). Link & akses lama langsung tidak berlaku. */
export async function POST(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const r = await load(request, id);
  if ("error" in r) return r.error;
  if (r.tenant.siteStatus !== "DEMO") {
    return NextResponse.json({ error: "Website toko ini sudah live, tidak perlu link demo." }, { status: 400 });
  }
  try {
    const token = generateDemoToken();
    const expiresAt = demoExpiry();
    await prisma.tenant.update({ where: { id }, data: { demoToken: token, demoTokenExpiresAt: expiresAt } });
    return NextResponse.json({ success: true, siteStatus: "DEMO", ...payload(r.tenant.slug, token, expiresAt, r.host) });
  } catch (err) {
    console.error("POST demo-link error:", err);
    return NextResponse.json({ error: "Gagal membuat link demo." }, { status: 500 });
  }
}
