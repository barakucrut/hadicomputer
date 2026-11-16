import { NextRequest, NextResponse } from "next/server";
import { updateTenantFeatures, updateTenantStatus, deleteTenant, getTenantById } from "@/lib/tenant-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenant = await getTenantById(id);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ success: true, tenant });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal memuat detail tenant" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    let updatedTenant;
    if (body.features) {
      updatedTenant = await updateTenantFeatures(id, body.features);
    }
    if (body.status) {
      updatedTenant = await updateTenantStatus(id, body.status);
    }

    return NextResponse.json({ success: true, tenant: updatedTenant });
  } catch (err: any) {
    console.error("PATCH /api/god-mode/tenants error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal memperbarui data tenant" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteTenant(id);
    return NextResponse.json({ success: true, message: "Tenant berhasil dihapus" });
  } catch (err: any) {
    console.error("DELETE /api/god-mode/tenants error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal menghapus tenant" },
      { status: 400 }
    );
  }
}
