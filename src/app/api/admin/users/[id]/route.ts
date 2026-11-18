import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getAdminSession, hasPermission } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session, "users:manage")) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const user = await prisma.adminUser.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    }

    const data = await request.json();
    const { name, email, roleId, isActive } = data;

    // Prevent deactivating own account
    if (session.id === id && isActive === false) {
      return NextResponse.json(
        { error: "Anda tidak dapat menonaktifkan akun Anda sendiri" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (typeof isActive === "boolean") updateData.isActive = isActive;

    if (email) {
      const cleanEmail = email.toLowerCase().trim();
      if (cleanEmail !== user.email) {
        const exist = await prisma.adminUser.findUnique({ where: { email: cleanEmail } });
        if (exist) {
          return NextResponse.json({ error: "Email sudah digunakan oleh pengguna lain" }, { status: 400 });
        }
        updateData.email = cleanEmail;
      }
    }

    if (roleId) {
      const role = await prisma.adminRole.findUnique({ where: { id: roleId } });
      if (!role) {
        return NextResponse.json({ error: "Role tidak valid" }, { status: 400 });
      }
      updateData.roleId = role.id;
      updateData.role = role.slug.toUpperCase();
    }

    const updated = await prisma.adminUser.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        roleId: true,
        isActive: true,
        roleRef: true,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (err: any) {
    console.error("Update user error:", err);
    return NextResponse.json({ error: err.message || "Gagal memperbarui pengguna" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session, "users:manage")) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const data = await request.json();
    const { newPassword } = data;

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password baru minimal 6 karakter" },
        { status: 400 }
      );
    }

    const passwordHash = bcrypt.hashSync(newPassword, 10);
    await prisma.adminUser.update({
      where: { id },
      data: { passwordHash },
    });

    return NextResponse.json({ success: true, message: "Password berhasil direset" });
  } catch (err: any) {
    console.error("Reset password error:", err);
    return NextResponse.json({ error: err.message || "Gagal mereset password" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session, "users:manage")) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const { id } = await params;
  try {
    if (session.id === id) {
      return NextResponse.json(
        { error: "Anda tidak dapat menghapus akun Anda sendiri" },
        { status: 400 }
      );
    }

    const user = await prisma.adminUser.findUnique({
      where: { id },
      include: { roleRef: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    }

    if (user.roleRef?.isSystem && user.role?.toUpperCase() === "OWNER") {
      const ownerCount = await prisma.adminUser.count({
        where: {
          OR: [{ role: "OWNER" }, { roleRef: { slug: "owner" } }],
        },
      });
      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: "Tidak dapat menghapus Owner utama toko" },
          { status: 400 }
        );
      }
    }

    await prisma.adminUser.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete user error:", err);
    return NextResponse.json({ error: err.message || "Gagal menghapus pengguna" }, { status: 500 });
  }
}
