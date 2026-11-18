import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signAdminToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password wajib diisi" },
        { status: 400 }
      );
    }

    const admin = await prisma.adminUser.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { roleRef: true },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Email atau password tidak valid" },
        { status: 401 }
      );
    }

    if (admin.isActive === false) {
      return NextResponse.json(
        { error: "Akun Anda dinonaktifkan oleh Administrator. Hubungi Owner toko." },
        { status: 403 }
      );
    }

    const isMatch = bcrypt.compareSync(password, admin.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Email atau password tidak valid" },
        { status: 401 }
      );
    }

    // Update lastLoginAt
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const permissions = Array.isArray(admin.roleRef?.permissions)
      ? (admin.roleRef.permissions as string[])
      : admin.role?.toUpperCase() === "OWNER" || admin.role === "owner"
      ? ["*"]
      : [];

    const token = await signAdminToken({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.roleRef?.slug || admin.role,
      roleName: admin.roleRef?.name || admin.role,
      permissions,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat login" },
      { status: 500 }
    );
  }
}
