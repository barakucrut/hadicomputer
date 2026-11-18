import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession, hasPermission } from "@/lib/auth";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Any authenticated admin with roles:manage or owner can access
  if (!hasPermission(session, "roles:manage") && !hasPermission(session, "users:view")) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  try {
    const roles = await prisma.adminRole.findMany({
      include: {
        _count: {
          select: { users: true },
        },
      },
      orderBy: [{ isSystem: "desc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({ roles });
  } catch (err: any) {
    console.error("Fetch roles error:", err);
    return NextResponse.json({ error: "Gagal memuat daftar role" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session, "roles:manage")) {
    return NextResponse.json({ error: "Hanya Owner yang dapat membuat role baru" }, { status: 403 });
  }

  try {
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

    const existing = await prisma.adminRole.findFirst({
      where: {
        OR: [{ name: cleanName }, { slug }],
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Role dengan nama tersebut sudah ada" }, { status: 400 });
    }

    const validPermissions = Array.isArray(permissions) ? permissions : [];

    const newRole = await prisma.adminRole.create({
      data: {
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
    return NextResponse.json({ error: err.message || "Gagal membuat role" }, { status: 500 });
  }
}
