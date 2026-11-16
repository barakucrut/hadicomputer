import { NextResponse } from "next/server";
import { getGodSession } from "@/lib/god-auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const godSession = await getGodSession();
    if (!godSession) {
      return NextResponse.json(
        { error: "Akses ditolak: Hanya Superadmin yang berhak melakukan impersonasi tenant." },
        { status: 403 }
      );
    }

    const { tenantId } = await request.json();

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId wajib diberikan." },
        { status: 400 }
      );
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { settings: true },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant toko tidak ditemukan di database." },
        { status: 404 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: `Berhasil beralih ke mode CMS tenant ${tenant.name}`,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
    });

    // Set impersonation cookie (valid 1 day)
    response.cookies.set({
      name: "god_impersonated_tenant_id",
      value: tenant.id,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    console.error("Impersonate error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat impersonasi tenant." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: "Keluar dari mode impersonasi tenant.",
  });
  response.cookies.delete("god_impersonated_tenant_id");
  return response;
}
