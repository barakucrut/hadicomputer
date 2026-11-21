import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authorizeAdmin } from "@/lib/auth";
import { notFoundResponse } from "@/lib/tenant-scope";
import { isFullAccessRole, isOwnerSession, rolesVisibleTo } from "@/lib/admin-roles";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Ctx) {
  const auth = await authorizeAdmin(["roles:manage"]);
  if (!auth.ok) return auth.response;
  const { id } = await params;

  try {
    // Hanya custom role milik tenant ini yang bisa diubah
    const role = await prisma.adminRole.findFirst({ where: { id, ...rolesVisibleTo(auth.tenantId) } });
    if (!role) return notFoundResponse("Role");
    if (role.isSystem || role.tenantId !== auth.tenantId) {
      return NextResponse.json({ error: "Role sistem bawaan tidak dapat dimodifikasi" }, { status: 400 });
    }

    const { name, description, permissions } = await request.json();
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Nama role wajib diisi" }, { status: 400 });
    }
    const cleanName = name.trim();
    const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_|_$)/g, "");
    const validPermissions = Array.isArray(permissions) ? permissions.filter((p) => typeof p === "string") : [];

    if (isFullAccessRole(validPermissions) && !isOwnerSession(auth.session)) {
      return NextResponse.json({ error: "Hanya Owner yang dapat memberikan akses penuh." }, { status: 403 });
    }

    const conflict = await prisma.adminRole.findFirst({
      where: { ...rolesVisibleTo(auth.tenantId), NOT: { id }, AND: [{ OR: [{ name: cleanName }, { slug }] }] },
      select: { id: true },
    });
    if (conflict) {
      return NextResponse.json({ error: "Nama role sudah digunakan" }, { status: 400 });
    }

    const updated = await prisma.adminRole.update({
      where: { id },
      data: { name: cleanName, slug, description: description || null, permissions: validPermissions },
    });
    return NextResponse.json({ success: true, role: updated });
  } catch (err: any) {
    console.error("Update role error:", err);
    return NextResponse.json({ error: "Gagal memperbarui role" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const auth = await authorizeAdmin(["roles:manage"]);
  if (!auth.ok) return auth.response;
  const { id } = await params;

  try {
    const role = await prisma.adminRole.findFirst({
      where: { id, ...rolesVisibleTo(auth.tenantId) },
      include: { _count: { select: { users: true } } },
    });
    if (!role) return notFoundResponse("Role");
    if (role.isSystem || role.tenantId !== auth.tenantId) {
      return NextResponse.json({ error: "Role sistem bawaan tidak dapat dihapus" }, { status: 400 });
    }
    if (role._count.users > 0) {
      return NextResponse.json(
        { error: `Tidak dapat menghapus role ini karena masih digunakan oleh ${role._count.users} pengguna.` },
        { status: 400 }
      );
    }

    await prisma.adminRole.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete role error:", err);
    return NextResponse.json({ error: "Gagal menghapus role" }, { status: 500 });
  }
}
