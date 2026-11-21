import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { passwordChangeError } from "@/lib/password-policy";
import { isPlatformCmsSessionId } from "@/lib/platform-cms";

/** Ubah password akun admin toko yang sedang login (berlaku untuk semua role, tanpa izin khusus). */
export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Sesi berakhir, silakan login ulang." }, { status: 401 });
    }
    // Tim platform yang membuka CMS toko tidak punya akun AdminUser
    if (isPlatformCmsSessionId(session.id)) {
      return NextResponse.json(
        { error: "Anda masuk lewat god-mode. Ubah password lewat menu akun di /god-mode." },
        { status: 400 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const admin = await prisma.adminUser.findUnique({
      where: { id: session.id },
      select: { id: true, email: true, isActive: true, passwordHash: true },
    });
    if (!admin || !admin.isActive) {
      return NextResponse.json({ error: "Sesi berakhir, silakan login ulang." }, { status: 401 });
    }

    const invalid = passwordChangeError(body, { email: admin.email });
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

    if (!bcrypt.compareSync(body.currentPassword as string, admin.passwordHash)) {
      return NextResponse.json({ error: "Password saat ini salah." }, { status: 400 });
    }

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { passwordHash: bcrypt.hashSync(body.newPassword as string, 10) },
    });
    return NextResponse.json({ success: true, message: "Password berhasil diperbarui." });
  } catch (err) {
    console.error("Change password error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan saat mengubah password." }, { status: 500 });
  }
}
