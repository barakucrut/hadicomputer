import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { authorizePlatform } from "@/lib/god-auth";
import { ALL_PLATFORM_ROLES } from "@/lib/platform-access";
import { updateTenantFull, deleteTenant, getTenantById } from "@/lib/tenant-service";
import { pickTenantUpdate } from "@/lib/platform-access";
import { findScopedTenant, isAssignablePlatformUser, tenantConflictResponse } from "@/lib/platform-tenant";
import { notFoundResponse } from "@/lib/tenant-scope";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Ctx) {
  const auth = await authorizePlatform(ALL_PLATFORM_ROLES);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const owned = await findScopedTenant(auth.session, id);
    if (!owned) return notFoundResponse("Tenant");
    const tenant = await getTenantById(id);
    return NextResponse.json({ success: true, tenant });
  } catch (err) {
    console.error("GET /api/god-mode/tenants/[id] error:", err);
    return NextResponse.json({ error: "Gagal memuat detail tenant." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const auth = await authorizePlatform(ALL_PLATFORM_ROLES);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const owned = await findScopedTenant(auth.session, id);
    if (!owned) return notFoundResponse("Tenant");

    const picked = pickTenantUpdate(auth.session.role, await request.json().catch(() => ({})));
    if (!picked.ok) return NextResponse.json({ error: picked.error }, { status: 400 });
    // Penugasan yang tidak berubah tidak divalidasi ulang (mis. marketing lama sudah nonaktif)
    if (
      picked.data.acquiredById !== undefined &&
      picked.data.acquiredById !== owned.acquiredById &&
      !(await isAssignablePlatformUser(picked.data.acquiredById))
    ) {
      return NextResponse.json({ error: "Akun marketing yang dipilih tidak ditemukan atau nonaktif." }, { status: 400 });
    }

    const updatedTenant = await updateTenantFull(id, picked.data);
    // Nama, warna tema, WA & alamat tampil di etalase
    revalidatePath("/", "layout");
    return NextResponse.json({ success: true, tenant: updatedTenant });
  } catch (err) {
    const conflict = tenantConflictResponse(err);
    if (conflict) return conflict;
    console.error("PATCH /api/god-mode/tenants/[id] error:", err);
    return NextResponse.json({ error: "Gagal memperbarui data tenant." }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const auth = await authorizePlatform(["SUPERADMIN"]);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    if (!(await findScopedTenant(auth.session, id))) return notFoundResponse("Tenant");
    await deleteTenant(id);
    return NextResponse.json({ success: true, message: "Tenant berhasil dihapus" });
  } catch (err) {
    console.error("DELETE /api/god-mode/tenants/[id] error:", err);
    const message = err instanceof Error && err.message.includes("tidak dapat dihapus") ? err.message : "Gagal menghapus tenant.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
