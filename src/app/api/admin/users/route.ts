import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getAdminSession, hasPermission } from "@/lib/auth";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session, "users:view")) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  try {
    const users = await prisma.adminUser.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        roleId: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        roleRef: {
          select: {
            id: true,
            name: true,
            slug: true,
            isSystem: true,
            permissions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (err: any) {
    console.error("Fetch users error:", err);
    return NextResponse.json({ error: "Gagal memuat daftar pengguna" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session, "users:manage")) {
    return NextResponse.json({ error: "Akses ditolak: Hanya admin yang berhak menambah pengguna" }, { status: 403 });
  }

  try {
    const data = await request.json();
    const { name, email, password, roleId } = data;

    if (!name || !email || !password || !roleId) {
      return NextResponse.json(
        { error: "Nama, email, password, dan role wajib diisi" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    const existing = await prisma.adminUser.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Email sudah terdaftar untuk pengguna lain" },
        { status: 400 }
      );
    }

    const role = await prisma.adminRole.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return NextResponse.json({ error: "Role yang dipilih tidak valid" }, { status: 400 });
    }

    const passwordHash = bcrypt.hashSync(password, 10);

    const newUser = await prisma.adminUser.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        roleId: role.id,
        role: role.slug.toUpperCase(),
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        roleId: true,
        isActive: true,
        createdAt: true,
        roleRef: true,
      },
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (err: any) {
    console.error("Create user error:", err);
    return NextResponse.json({ error: err.message || "Gagal membuat pengguna baru" }, { status: 500 });
  }
}
