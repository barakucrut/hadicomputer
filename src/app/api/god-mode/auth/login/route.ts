import { NextResponse } from "next/server";
import { checkGodCredentials, checkPlatformUserCredentials, signGodToken, GOD_COOKIE_NAME, type GodSessionPayload } from "@/lib/god-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!username || !password) {
      return NextResponse.json({ error: "Email dan password wajib diisi" }, { status: 400 });
    }

    // 1. Superadmin bawaan dari env, 2. akun tim platform (superadmin/marketing) di database
    let payload: GodSessionPayload | null = null;
    if (checkGodCredentials(username, password)) {
      payload = { username, role: "SUPERADMIN" };
    } else {
      const user = await checkPlatformUserCredentials(username, password);
      if (user) payload = { username: user.email, role: user.role, userId: user.id, name: user.name };
    }

    if (!payload) {
      return NextResponse.json({ error: "Email atau password salah, atau akun sedang dinonaktifkan." }, { status: 401 });
    }

    const token = await signGodToken(payload);
    const response = NextResponse.json({
      success: true,
      user: { username: payload.username, name: payload.name || "Superadmin", role: payload.role },
    });

    response.cookies.set({
      name: GOD_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 2, // 2 days
    });
    // Sesi impersonasi lama tidak boleh terbawa ke akun lain
    response.cookies.delete("god_impersonated_tenant_id");

    return response;
  } catch (error) {
    console.error("God-mode login error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server saat login." }, { status: 500 });
  }
}
