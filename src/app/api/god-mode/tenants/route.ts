import { NextResponse } from "next/server";
import { getAllTenants, createTenant } from "@/lib/tenant-service";

export async function GET() {
  try {
    const tenants = await getAllTenants();
    return NextResponse.json({ success: true, tenants });
  } catch (err: any) {
    console.error("GET /api/god-mode/tenants error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal memuat daftar tenant" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, slug, customDomain, plan, primaryColor, whatsappNumber, address, openHours, features } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Nama toko dan slug subdomain wajib diisi" },
        { status: 400 }
      );
    }

    const tenant = await createTenant({
      name,
      slug,
      customDomain,
      plan,
      primaryColor,
      whatsappNumber,
      address,
      openHours,
      features,
    });

    return NextResponse.json({ success: true, tenant });
  } catch (err: any) {
    console.error("POST /api/god-mode/tenants error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal membuat tenant baru" },
      { status: 500 }
    );
  }
}
