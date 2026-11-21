import { NextResponse } from "next/server";
import { passwordPolicyError } from "@/lib/password-policy";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { authorizeAdmin } from "@/lib/auth";
import { findAssignableRole, isFullAccessRole, isOwnerSession } from "@/lib/admin-roles";

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  roleId: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  roleRef: { select: { id: true, name: true, slug: true, isSystem: true, permissions: true } },
} as const;

export async function GET() {
  const auth = await authorizeAdmin(["users:view", "users:manage"]);
  if (!auth.ok) return auth.response;

  const users = await prisma.adminUser.findMany({
    where: { tenantId: auth.tenantId },
    select: USER_SELECT,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const auth = await authorizeAdmin(["users:manage"]);
  if (!auth.ok) return auth.response;

  try {
    const { name, email, password, roleId } = await request.json();

    if (!name || !email || !password || !roleId) {
      return NextResponse.json({ error: "Nama, email, password, dan role wajib diisi" }, { status: 400 });
    }
    const policyError = passwordPolicyError(password, { email });
    if (policyError) {
      return NextResponse.json({ error: policyError }, { status: 400 });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    // Email login unik di seluruh platform (dipakai untuk login)
    const existing = await prisma.adminUser.findUnique({ where: { email: cleanEmail }, select: { id: true } });
    if (existing) {
      return NextResponse.json({ error: "Email sudah terdaftar untuk pengguna lain" }, { status: 400 });
    }

    const role = await findAssignableRole(auth.tenantId, roleId);
    if (!role) {
      return NextResponse.json({ error: "Role yang dipilih tidak valid" }, { status: 400 });
    }
    if (isFullAccessRole(role.permissions) && !isOwnerSession(auth.session)) {
      return NextResponse.json({ error: "Hanya Owner yang dapat memberikan role akses penuh." }, { status: 403 });
    }

    const newUser = await prisma.adminUser.create({
      data: {
        tenantId: auth.tenantId,
        name: String(name).trim(),
        email: cleanEmail,
        passwordHash: bcrypt.hashSync(password, 10),
        roleId: role.id,
        role: role.slug.toUpperCase(),
        isActive: true,
      },
      select: USER_SELECT,
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (err: any) {
    console.error("Create user error:", err);
    return NextResponse.json({ error: "Gagal membuat pengguna baru" }, { status: 500 });
  }
}
