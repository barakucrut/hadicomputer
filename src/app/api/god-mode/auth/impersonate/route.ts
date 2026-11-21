import { NextResponse } from "next/server";
import { authorizePlatform } from "@/lib/god-auth";
import { prisma } from "@/lib/db";
import { ALL_PLATFORM_ROLES } from "@/lib/platform-access";
import { findScopedTenant } from "@/lib/platform-tenant";
import { IMPERSONATION_COOKIE } from "@/lib/platform-cms";

export async function POST(request: Request) {
  try {
    // Superadmin: semua toko. CMO/Marketing: hanya toko dalam lingkupnya (lainnya 404).
    const auth = await authorizePlatform(ALL_PLATFORM_ROLES);
    if (!auth.ok) return auth.response;

    const { tenantId } = await request.json().catch(() => ({}));

    if (!tenantId || typeof tenantId !== "string") {
      return NextResponse.json(
        { error: "tenantId wajib diberikan." },
        { status: 400 }
      );
    }

    const owned = await findScopedTenant(auth.session, tenantId);
    const tenant = owned
      ? await prisma.tenant.findUnique({ where: { id: owned.id }, select: { id: true, name: true, slug: true } })
      : null;

    if (!tenant) {
      return NextResponse.json(
        { error: "Toko tidak ditemukan." },
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
      name: IMPERSONATION_COOKIE,
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
  response.cookies.delete(IMPERSONATION_COOKIE);
  return response;
}
