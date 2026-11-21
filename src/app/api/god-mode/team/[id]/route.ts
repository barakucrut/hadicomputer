import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { authorizePlatform } from "@/lib/god-auth";
import { parseTeamMemberInput, resolveManagerId, TEAM_SELECT } from "@/lib/platform-team";
import { isAssignableManager } from "@/lib/platform-tenant";
import type { PlatformRole } from "@/lib/platform-access";
import { notFoundResponse } from "@/lib/tenant-scope";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const auth = await authorizePlatform(["SUPERADMIN"]);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    const existing = await prisma.platformUser.findUnique({ where: { id }, select: { id: true, role: true, managerId: true } });
    if (!existing) return notFoundResponse("Akun tim");

    const parsed = parseTeamMemberInput(await request.json().catch(() => ({})), "update");
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const { name, phone, role, isActive, password } = parsed.data;

    // Jangan mengunci diri sendiri
    if (id === auth.session.userId && (isActive === false || (role && role !== "SUPERADMIN"))) {
      return NextResponse.json({ error: "Anda tidak dapat menonaktifkan atau menurunkan peran akun sendiri." }, { status: 400 });
    }

    const nextRole = (role ?? existing.role) as PlatformRole;
    const manager = resolveManagerId({
      role: nextRole,
      managerId: parsed.data.managerId !== undefined ? parsed.data.managerId : existing.managerId,
      selfId: id,
    });
    if (!manager.ok) return NextResponse.json({ error: manager.error }, { status: 400 });
    if (manager.managerId !== existing.managerId && !(await isAssignableManager(manager.managerId))) {
      return NextResponse.json({ error: "Atasan yang dipilih harus akun CMO yang aktif." }, { status: 400 });
    }

    const member = await prisma.$transaction(async (tx) => {
      // CMO turun peran -> anggota timnya dilepas (tidak lagi dihitung sebagai tim siapa pun)
      if (existing.role === "CMO" && nextRole !== "CMO") {
        await tx.platformUser.updateMany({ where: { managerId: id }, data: { managerId: null } });
      }
      return tx.platformUser.update({
        where: { id },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(phone !== undefined ? { phone } : {}),
          ...(role !== undefined ? { role } : {}),
          ...(isActive !== undefined ? { isActive } : {}),
          managerId: manager.managerId ?? null,
          ...(password ? { passwordHash: bcrypt.hashSync(password, 10) } : {}),
        },
        select: TEAM_SELECT,
      });
    });
    return NextResponse.json({ success: true, member });
  } catch (err) {
    console.error("PATCH /api/god-mode/team/[id] error:", err);
    return NextResponse.json({ error: "Gagal memperbarui akun tim." }, { status: 500 });
  }
}

/** Hapus akun. Bila masih memegang tenant, akun hanya dinonaktifkan agar riwayat penugasan tetap ada. */
export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const auth = await authorizePlatform(["SUPERADMIN"]);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    if (id === auth.session.userId) {
      return NextResponse.json({ error: "Anda tidak dapat menghapus akun sendiri." }, { status: 400 });
    }
    const existing = await prisma.platformUser.findUnique({ where: { id }, select: { id: true, _count: { select: { acquiredTenants: true } } } });
    if (!existing) return notFoundResponse("Akun tim");

    if (existing._count.acquiredTenants > 0) {
      await prisma.platformUser.update({ where: { id }, data: { isActive: false } });
      return NextResponse.json({
        success: true,
        deactivated: true,
        message: `Akun dinonaktifkan karena masih memegang ${existing._count.acquiredTenants} tenant. Pindahkan tenantnya dulu bila ingin menghapus permanen.`,
      });
    }
    await prisma.platformUser.delete({ where: { id } });
    return NextResponse.json({ success: true, deactivated: false, message: "Akun tim dihapus." });
  } catch (err) {
    console.error("DELETE /api/god-mode/team/[id] error:", err);
    return NextResponse.json({ error: "Gagal menghapus akun tim." }, { status: 500 });
  }
}
