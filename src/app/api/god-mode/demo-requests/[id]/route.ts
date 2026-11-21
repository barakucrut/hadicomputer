import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { authorizePlatform } from "@/lib/god-auth";
import { notFoundResponse } from "@/lib/tenant-scope";
import { DEMO_REQUEST_STATUSES, type DemoRequestStatus } from "@/lib/demo-request";

type Ctx = { params: Promise<{ id: string }> };

/** Ubah status / catatan permintaan demo. CMO hanya miliknya (lainnya 404). */
export async function PATCH(request: NextRequest, { params }: Ctx) {
  const auth = await authorizePlatform(["SUPERADMIN", "CMO"]);
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const owned = await prisma.demoRequest.findFirst({
    where: { id, ...(auth.session.role === "SUPERADMIN" ? {} : { assignedToId: auth.session.userId ?? "__none__" }) },
    select: { id: true },
  });
  if (!owned) return notFoundResponse("Permintaan demo");

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const data: { status?: DemoRequestStatus; note?: string | null } = {};
  if (body.status !== undefined) {
    if (!DEMO_REQUEST_STATUSES.includes(body.status as DemoRequestStatus)) {
      return NextResponse.json({ error: "Status tidak dikenal." }, { status: 400 });
    }
    data.status = body.status as DemoRequestStatus;
  }
  if (body.note !== undefined) {
    data.note = typeof body.note === "string" ? body.note.trim().slice(0, 2000) || null : null;
  }

  try {
    const updated = await prisma.demoRequest.update({ where: { id }, data, select: { id: true, status: true, note: true } });
    return NextResponse.json({ success: true, request: updated });
  } catch (err) {
    console.error("PATCH /api/god-mode/demo-requests/[id] error:", err);
    return NextResponse.json({ error: "Gagal memperbarui permintaan demo." }, { status: 500 });
  }
}
