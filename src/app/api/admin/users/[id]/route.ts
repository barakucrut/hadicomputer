import { NextResponse } from "next/server";
import { passwordPolicyError } from "@/lib/password-policy";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { authorizeAdmin } from "@/lib/auth";
import { notFoundResponse } from "@/lib/tenant-scope";
import {
  countTenantOwners,
  findAssignableRole,
  isFullAccessRole,
  isOwnerSession,
  isOwnerUser,
} from "@/lib/admin-roles";

type Ctx = { params: Promise<{ id: string }> };

/** User milik tenant sesi, atau null (user tenant lain dianggap tidak ada). */
async function findTenantUser(tenantId: string, id: string) {
  return prisma.adminUser.findFirst({
    where: { id, tenantId },
    include: { roleRef: { select: { slug: true, permissions: true } } },
  });
}

export async function PUT(request: Request, { params }: Ctx) {
  const auth = await authorizeAdmin(["users:manage"]);
  if (!auth.ok) return auth.response;
  const { id } = await params;

  try {
    const user = await findTenantUser(auth.tenantId, id);
    if (!user) return notFoundResponse("Pengguna");

    const { name, email, roleId, isActive } = await request.json();

    if (auth.session.id === id && isActive === false) {
      return NextResponse.json({ error: "Anda tidak dapat menonaktifkan akun Anda sendiri" }, { status: 400 });
    }
    // Owner hanya boleh diubah oleh owner
    if (isOwnerUser(user) && !isOwnerSession(auth.session)) {
      return NextResponse.json({ error: "Hanya Owner yang dapat mengubah akun Owner." }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = String(name).trim();
    if (typeof isActive === "boolean") updateData.isActive = isActive;

    if (email) {
      const cleanEmail = String(email).toLowerCase().trim();
      if (cleanEmail !== user.email) {
        const exist = await prisma.adminUser.findUnique({ where: { email: cleanEmail }, select: { id: true } });
        if (exist) {
          return NextResponse.json({ error: "Email sudah digunakan oleh pengguna lain" }, { status: 400 });
        }
        updateData.email = cleanEmail;
      }
    }

    if (roleId) {
      const role = await findAssignableRole(auth.tenantId, roleId);
      if (!role) return NextResponse.json({ error: "Role tidak valid" }, { status: 400 });
      if (isFullAccessRole(role.permissions) && !isOwnerSession(auth.session)) {
        return NextResponse.json({ error: "Hanya Owner yang dapat memberikan role akses penuh." }, { status: 403 });
      }
      updateData.roleId = role.id;
      updateData.role = role.slug.toUpperCase();
    }

    // Jangan sampai toko kehilangan owner aktif terakhir
    const losesOwner =
      isOwnerUser(user) &&
      (updateData.isActive === false || (updateData.role && updateData.role !== "OWNER"));
    if (losesOwner && (await countTenantOwners(auth.tenantId, id)) === 0) {
      return NextResponse.json({ error: "Toko harus memiliki minimal satu Owner aktif." }, { status: 400 });
    }

    const updated = await prisma.adminUser.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, roleId: true, isActive: true, roleRef: true },
    });
    return NextResponse.json({ success: true, user: updated });
  } catch (err: any) {
    console.error("Update user error:", err);
    return NextResponse.json({ error: "Gagal memperbarui pengguna" }, { status: 500 });
  }
}

/** Reset password user oleh admin. */
export async function PATCH(request: Request, { params }: Ctx) {
  const auth = await authorizeAdmin(["users:manage"]);
  if (!auth.ok) return auth.response;
  const { id } = await params;

  try {
    const user = await findTenantUser(auth.tenantId, id);
    if (!user) return notFoundResponse("Pengguna");
    if (isOwnerUser(user) && !isOwnerSession(auth.session)) {
      return NextResponse.json({ error: "Hanya Owner yang dapat mereset password Owner." }, { status: 403 });
    }

    const { newPassword } = await request.json();
    const policyError = passwordPolicyError(newPassword);
    if (policyError) {
      return NextResponse.json({ error: policyError.replace(/^Password/, "Password baru") }, { status: 400 });
    }

    await prisma.adminUser.update({ where: { id }, data: { passwordHash: bcrypt.hashSync(newPassword, 10) } });
    return NextResponse.json({ success: true, message: "Password berhasil direset" });
  } catch (err: any) {
    console.error("Reset password error:", err);
    return NextResponse.json({ error: "Gagal mereset password" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const auth = await authorizeAdmin(["users:manage"]);
  if (!auth.ok) return auth.response;
  const { id } = await params;

  try {
    if (auth.session.id === id) {
      return NextResponse.json({ error: "Anda tidak dapat menghapus akun Anda sendiri" }, { status: 400 });
    }

    const user = await findTenantUser(auth.tenantId, id);
    if (!user) return notFoundResponse("Pengguna");

    if (isOwnerUser(user)) {
      if (!isOwnerSession(auth.session)) {
        return NextResponse.json({ error: "Hanya Owner yang dapat menghapus akun Owner." }, { status: 403 });
      }
      if ((await countTenantOwners(auth.tenantId, id)) === 0) {
        return NextResponse.json({ error: "Tidak dapat menghapus Owner terakhir toko." }, { status: 400 });
      }
    }

    await prisma.adminUser.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete user error:", err);
    return NextResponse.json({ error: "Gagal menghapus pengguna" }, { status: 500 });
  }
}
