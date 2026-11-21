import { NextResponse } from "next/server";
import { GOD_COOKIE_NAME, getPlatformSession } from "@/lib/god-auth";
import { godNavFor } from "@/lib/platform-access";

/** Profil sesi god-mode untuk UI (menu & tombol mengikuti peran). */
export async function GET() {
  const session = await getPlatformSession();
  if (!session) {
    // Cookie bertanda tangan sah tapi akunnya dihapus/nonaktif: hapus cookie supaya middleware tidak
    // terus mengarahkan login -> dashboard -> login (redirect loop).
    const res = NextResponse.json({ error: "Sesi berakhir, silakan login ulang." }, { status: 401 });
    res.cookies.delete(GOD_COOKIE_NAME);
    res.cookies.delete("god_impersonated_tenant_id");
    return res;
  }
  return NextResponse.json({ success: true, user: session, nav: godNavFor(session.role) });
}
