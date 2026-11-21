import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authorizePlatform } from "@/lib/god-auth";

/** Daftar permintaan demo dari landing page. Superadmin: semua; CMO: yang ditugaskan kepadanya. */
export async function GET() {
  const auth = await authorizePlatform(["SUPERADMIN", "CMO"]);
  if (!auth.ok) return auth.response;
  try {
    const where = auth.session.role === "SUPERADMIN" ? {} : { assignedToId: auth.session.userId ?? "__none__" };
    const requests = await prisma.demoRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 500,
      select: {
        id: true, storeName: true, city: true, whatsapp: true, storeLink: true, status: true, note: true, createdAt: true,
        assignedTo: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json({ success: true, requests });
  } catch (err) {
    console.error("GET /api/god-mode/demo-requests error:", err);
    return NextResponse.json({ error: "Gagal memuat permintaan demo." }, { status: 500 });
  }
}
