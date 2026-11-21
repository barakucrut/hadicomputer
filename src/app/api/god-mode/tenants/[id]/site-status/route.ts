import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { authorizePlatform } from "@/lib/god-auth";
import { notFoundResponse } from "@/lib/tenant-scope";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Aktifkan website (DEMO -> LIVE) atau kembalikan ke demo. Superadmin saja:
 * go-live terkait pembayaran/kontrak. LIVE mematikan link demo.
 */
export async function POST(request: NextRequest, { params }: Ctx) {
  const auth = await authorizePlatform(["SUPERADMIN"]);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { status?: unknown };
  if (body.status !== "LIVE" && body.status !== "DEMO") {
    return NextResponse.json({ error: "Status website harus LIVE atau DEMO." }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({ where: { id }, select: { id: true, liveAt: true } });
  if (!tenant) return notFoundResponse("Tenant");

  try {
    const updated = await prisma.tenant.update({
      where: { id },
      data:
        body.status === "LIVE"
          ? { siteStatus: "LIVE", liveAt: tenant.liveAt ?? new Date(), demoToken: null, demoTokenExpiresAt: null }
          : { siteStatus: "DEMO" },
      select: { id: true, siteStatus: true, liveAt: true },
    });
    revalidatePath("/", "layout");
    return NextResponse.json({ success: true, tenant: updated });
  } catch (err) {
    console.error("POST site-status error:", err);
    return NextResponse.json({ error: "Gagal mengubah status website." }, { status: 500 });
  }
}
