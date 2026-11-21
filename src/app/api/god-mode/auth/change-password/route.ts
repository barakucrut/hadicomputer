import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { authorizePlatform } from "@/lib/god-auth";
import { ALL_PLATFORM_ROLES } from "@/lib/platform-access";
import { passwordChangeError } from "@/lib/password-policy";

/** Ubah password akun tim platform yang sedang login (superadmin & marketing). */
export async function POST(request: Request) {
  const auth = await authorizePlatform(ALL_PLATFORM_ROLES);
  if (!auth.ok) return auth.response;

  // Superadmin bawaan dari env tidak tersimpan di database
  if (!auth.session.userId) {
    return NextResponse.json(
      { error: "Password superadmin bawaan diatur lewat env GOD_MODE_PASSWORD di server, tidak bisa diubah dari sini." },
      { status: 400 }
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const user = await prisma.platformUser.findUnique({
      where: { id: auth.session.userId },
      select: { id: true, email: true, isActive: true, passwordHash: true },
    });
    if (!user || !user.isActive) {
      return NextResponse.json({ error: "Sesi berakhir, silakan login ulang." }, { status: 401 });
    }

    const invalid = passwordChangeError(body, { email: user.email });
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

    if (!bcrypt.compareSync(body.currentPassword as string, user.passwordHash)) {
      return NextResponse.json({ error: "Password saat ini salah." }, { status: 400 });
    }

    await prisma.platformUser.update({
      where: { id: user.id },
      data: { passwordHash: bcrypt.hashSync(body.newPassword as string, 10) },
    });
    return NextResponse.json({ success: true, message: "Password berhasil diperbarui." });
  } catch (err) {
    console.error("God-mode change password error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan saat mengubah password." }, { status: 500 });
  }
}
