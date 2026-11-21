import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { authorizePlatform } from "@/lib/god-auth";
import { parseTeamMemberInput, resolveManagerId, TEAM_SELECT } from "@/lib/platform-team";
import { isAssignableManager } from "@/lib/platform-tenant";


/** Daftar akun tim platform (hanya superadmin). */
export async function GET() {
  const auth = await authorizePlatform(["SUPERADMIN"]);
  if (!auth.ok) return auth.response;
  try {
    const members = await prisma.platformUser.findMany({ orderBy: [{ isActive: "desc" }, { createdAt: "desc" }], select: TEAM_SELECT });
    return NextResponse.json({ success: true, members, currentUserId: auth.session.userId });
  } catch (err) {
    console.error("GET /api/god-mode/team error:", err);
    return NextResponse.json({ error: "Gagal memuat tim platform." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await authorizePlatform(["SUPERADMIN"]);
  if (!auth.ok) return auth.response;
  try {
    const parsed = parseTeamMemberInput(await request.json().catch(() => ({})), "create");
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const { name, email, phone, role, password } = parsed.data;

    const manager = resolveManagerId({ role: role!, managerId: parsed.data.managerId });
    if (!manager.ok) return NextResponse.json({ error: manager.error }, { status: 400 });
    if (!(await isAssignableManager(manager.managerId))) {
      return NextResponse.json({ error: "Atasan yang dipilih harus akun CMO yang aktif." }, { status: 400 });
    }

    const member = await prisma.platformUser.create({
      data: {
        name: name!,
        email: email!,
        phone: phone ?? null,
        role: role!,
        managerId: manager.managerId ?? null,
        passwordHash: bcrypt.hashSync(password!, 10),
      },
      select: TEAM_SELECT,
    });
    return NextResponse.json({ success: true, member });
  } catch (err) {
    if ((err as { code?: string })?.code === "P2002") {
      return NextResponse.json({ error: "Email ini sudah terdaftar sebagai akun tim." }, { status: 409 });
    }
    console.error("POST /api/god-mode/team error:", err);
    return NextResponse.json({ error: "Gagal menambah akun tim." }, { status: 500 });
  }
}
