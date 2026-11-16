import { NextResponse } from "next/server";
import { checkGodCredentials, signGodToken, GOD_COOKIE_NAME } from "@/lib/god-auth";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username dan password wajib diisi" },
        { status: 400 }
      );
    }

    const isValid = checkGodCredentials(username, password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Kredensial Superadmin tidak valid. Periksa username dan password." },
        { status: 401 }
      );
    }

    const token = await signGodToken({
      username: username.trim(),
      role: "SUPERADMIN",
    });

    const response = NextResponse.json({
      success: true,
      user: {
        username: username.trim(),
        role: "SUPERADMIN",
      },
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

    return response;
  } catch (error) {
    console.error("God-mode login error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat autentikasi God Mode" },
      { status: 500 }
    );
  }
}
