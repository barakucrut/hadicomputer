import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminSession, hasPermission } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session, "roles:manage")) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const role = await prisma.adminRole.findUnique({ where: { id } });
    if (!role) {
      return NextResponse.json({ error: "Role tidak ditemukan" }, { status: 404 });
    }

    if (role.isSystem) {
      return NextResponse.json(
        { error: "Role sistem (Owner) tidak dapat dimodifikasi" },
        { status: 400 }
      );
    }

    const data = await request.json();
    const { name, description, permissions } = data;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Nama role wajib diisi" }, { status: 400 });
    }

    const cleanName = name.trim();
    const slug = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/(^_|_$)/g, "");

    // Check conflict with other roles
    const conflict = await prisma.adminRole.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          { OR: [{ name: cleanName }, { slug }] },
        ],
      },
    });

    if (conflict) {
      return NextResponse.json({ error: "Nama role sudah digunakan" }, { status: 400 });
    }

    const updated = await prisma.adminRole.update({
      where: { id },
      data: {
        name: cleanName,
        slug,
        description: description || null,
        permissions: Array.isArray(permissions) ? permissions : [],
      },
    });

    return NextResponse.json({ success: true, role: updated });
  } catch (err: any) {
    console.error("Update role error:", err);
    return NextResponse.json({ error: err.message || "Gagal memperbarui role" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session, "roles:manage")) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const role = await prisma.adminRole.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });

    if (!role) {
      return NextResponse.json({ error: "Role tidak ditemukan" }, { status: 404 });
    }

    if (role.isSystem) {
      return NextResponse.json(
        { error: "Role sistem bawaan tidak dapat dihapus" },
        { status: 400 }
      );
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
    return NextResponse.json({ error: err.message || "Gagal menghapus role" }, { status: 500 });
  }
}
