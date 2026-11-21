import { NextResponse } from "next/server";
import { authorizePlatform, tenantScope } from "@/lib/god-auth";
import { ALL_PLATFORM_ROLES } from "@/lib/platform-access";
import { getAllTenants, createTenant } from "@/lib/tenant-service";
import { seedStarterPack } from "@/lib/starter-pack";
import { normalizeWhatsapp } from "@/lib/platform-access";
import { tenantSlugError } from "@/lib/platform-domain";
import { isAssignablePlatformUser, tenantConflictResponse } from "@/lib/platform-tenant";

export async function GET() {
  const auth = await authorizePlatform(ALL_PLATFORM_ROLES);
  if (!auth.ok) return auth.response;

  try {
    const tenants = await getAllTenants(tenantScope(auth.session));
    return NextResponse.json({ success: true, tenants });
  } catch (err) {
    console.error("GET /api/god-mode/tenants error:", err);
    return NextResponse.json({ error: "Gagal memuat daftar tenant." }, { status: 500 });
  }
}

const PLANS = ["STARTER", "PRO", "ENTERPRISE"] as const;
type Plan = (typeof PLANS)[number];

export async function POST(request: Request) {
  const auth = await authorizePlatform(ALL_PLATFORM_ROLES);
  if (!auth.ok) return auth.response;
  const { session } = auth;
  const isSuper = session.role === "SUPERADMIN";

  try {
    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 150) : "";
    const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";

    if (!name || !slug) {
      return NextResponse.json({ error: "Nama toko dan slug subdomain wajib diisi." }, { status: 400 });
    }
    const slugError = tenantSlugError(slug);
    if (slugError) return NextResponse.json({ error: slugError }, { status: 400 });
    let whatsappNumber: string | undefined;
    if (body.whatsappNumber && body.whatsappNumber !== "628") {
      const wa = normalizeWhatsapp(body.whatsappNumber);
      if (!wa) return NextResponse.json({ error: "Nomor WhatsApp tidak valid. Gunakan format 628xxxxxxxxxx." }, { status: 400 });
      whatsappNumber = wa;
    }
    const primaryColor = typeof body.primaryColor === "string" && /^#[0-9a-f]{6}$/i.test(body.primaryColor) ? body.primaryColor : undefined;
    const address = typeof body.address === "string" ? body.address.trim().slice(0, 500) : undefined;
    const openHours = typeof body.openHours === "string" ? body.openHours.trim().slice(0, 150) : undefined;

    // Paket, fitur, domain & status hanya ditentukan superadmin. Tenant bawaan marketing = TRIAL atas namanya.
    let acquiredById: string | null = session.userId;
    if (isSuper) {
      acquiredById = typeof body.acquiredById === "string" && body.acquiredById ? body.acquiredById : null;
      if (!(await isAssignablePlatformUser(acquiredById))) {
        return NextResponse.json({ error: "Akun marketing yang dipilih tidak ditemukan atau nonaktif." }, { status: 400 });
      }
    }
    const plan: Plan | undefined = isSuper && PLANS.includes(body.plan) ? body.plan : undefined;

    const tenant = await createTenant({
      name,
      slug,
      customDomain: isSuper && typeof body.customDomain === "string" ? body.customDomain : undefined,
      plan,
      primaryColor,
      whatsappNumber,
      address,
      openHours,
      features: isSuper && body.features && typeof body.features === "object" ? body.features : undefined,
      status: isSuper ? undefined : "TRIAL",
      acquiredById,
    });

    // Starter Pack: data contoh agar storefront langsung siap didemokan (default aktif)
    let starterPack = null;
    if (body.withStarterPack !== false) {
      try {
        starterPack = await seedStarterPack(tenant.id);
      } catch (seedErr) {
        console.error("Starter Pack seeding failed:", seedErr);
      }
    }

    return NextResponse.json({ success: true, tenant, starterPack });
  } catch (err) {
    const conflict = tenantConflictResponse(err);
    if (conflict) return conflict;
    console.error("POST /api/god-mode/tenants error:", err);
    return NextResponse.json({ error: "Gagal membuat tenant baru." }, { status: 500 });
  }
}
