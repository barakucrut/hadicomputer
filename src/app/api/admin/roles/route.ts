import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authorizeAdmin } from "@/lib/auth";
import { isFullAccessRole, isOwnerSession, rolesVisibleTo } from "@/lib/admin-roles";

export async function GET() {
  const auth = await authorizeAdmin(["roles:manage", "users:view", "users:manage"]);
  if (!auth.ok) return auth.response;

  const roles = await prisma.adminRole.findMany({
    where: rolesVisibleTo(auth.tenantId),
    include: { _count: { select: { users: { where: { tenantId: auth.tenantId } } } } },
    orderBy: [{ isSystem: "desc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ roles });
}

export async function POST(request: Request) {
  const auth = await authorizeAdmin(["roles:manage"]);
  if (!auth.ok) return auth.response;

  try {
    const { name, description, permissions } = await request.json();
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Nama role wajib diisi" }, { status: 400 });
    }

    const cleanName = name.trim();
    const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_|_$)/g, "");
    const validPermissions = Array.isArray(permissions) ? permissions.filter((p) => typeof p === "string") : [];

    if (isFullAccessRole(validPermissions) && !isOwnerSession(auth.session)) {
      return NextResponse.json({ error: "Hanya Owner yang dapat membuat role akses penuh." }, { status: 403 });
    }

    const existing = await prisma.adminRole.findFirst({
      where: { ...rolesVisibleTo(auth.tenantId), AND: [{ OR: [{ name: cleanName }, { slug }] }] },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ error: "Role dengan nama tersebut sudah ada" }, { status: 400 });
    }

    const newRole = await prisma.adminRole.create({
      data: {
        tenantId: auth.tenantId,
        name: cleanName,
        slug,
        description: description || null,
        permissions: validPermissions,
        isSystem: false,
      },
    });
    return NextResponse.json({ success: true, role: newRole });
  } catch (err: any) {
    console.error("Create role error:", err);
    return NextResponse.json({ error: "Gagal membuat role" }, { status: 500 });
  }
}
