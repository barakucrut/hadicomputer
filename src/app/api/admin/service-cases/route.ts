import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { authorizeAdmin } from "@/lib/auth";
import { notFoundResponse } from "@/lib/tenant-scope";

const MAX_IMAGES = 8;

/** Validasi & rapikan input form portofolio servis. */
async function normalizeCase(tenantId: string, data: Record<string, unknown>) {
  const title = typeof data.title === "string" ? data.title.trim().slice(0, 150) : "";
  const summary = typeof data.summary === "string" ? data.summary.trim().slice(0, 5000) : "";
  if (!title) return { error: "Judul dokumentasi wajib diisi" } as const;
  if (!summary) return { error: "Ringkasan pekerjaan wajib diisi" } as const;

  let serviceId = typeof data.serviceId === "string" && data.serviceId ? data.serviceId : null;
  if (serviceId) {
    const owned = await prisma.service.findFirst({ where: { id: serviceId, tenantId }, select: { id: true } });
    if (!owned) serviceId = null;
  }

  // Hanya foto hasil upload CMS / aset lokal
  const images = (Array.isArray(data.images) ? data.images : [])
    .filter((u): u is string => typeof u === "string" && (u.startsWith("/uploads/") || u.startsWith("/images/")))
    .slice(0, MAX_IMAGES);
  if (images.length === 0) return { error: "Tambahkan minimal 1 foto dokumentasi" } as const;

  const completedAt = typeof data.completedAt === "string" && data.completedAt ? new Date(data.completedAt) : null;
  return {
    value: {
      title,
      summary,
      serviceId,
      images,
      device: typeof data.device === "string" && data.device.trim() ? data.device.trim().slice(0, 150) : null,
      durationText: typeof data.durationText === "string" && data.durationText.trim() ? data.durationText.trim().slice(0, 60) : null,
      completedAt: completedAt && !Number.isNaN(completedAt.getTime()) ? completedAt : null,
      isPublished: data.isPublished !== false,
      sortOrder: Number.isFinite(Number(data.sortOrder)) ? Number(data.sortOrder) : 0,
    },
  } as const;
}

export async function GET() {
  const auth = await authorizeAdmin(["services:view", "services:manage"]);
  if (!auth.ok) return auth.response;

  const cases = await prisma.serviceCase.findMany({
    where: { tenantId: auth.tenantId },
    include: { service: { select: { id: true, title: true } } },
    orderBy: [{ completedAt: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ cases });
}

export async function POST(request: Request) {
  const auth = await authorizeAdmin(["services:manage"]);
  if (!auth.ok) return auth.response;

  const norm = await normalizeCase(auth.tenantId, (await request.json().catch(() => ({}))) || {});
  if ("error" in norm) return NextResponse.json({ error: norm.error }, { status: 400 });

  const created = await prisma.serviceCase.create({ data: { tenantId: auth.tenantId, ...norm.value } });
  revalidatePath("/", "layout");
  return NextResponse.json({ success: true, case: created });
}

export async function PUT(request: Request) {
  const auth = await authorizeAdmin(["services:manage"]);
  if (!auth.ok) return auth.response;

  const data = (await request.json().catch(() => ({}))) || {};
  const owned = await prisma.serviceCase.findFirst({ where: { id: String(data.id || ""), tenantId: auth.tenantId }, select: { id: true } });
  if (!owned) return notFoundResponse("Dokumentasi");

  const norm = await normalizeCase(auth.tenantId, data);
  if ("error" in norm) return NextResponse.json({ error: norm.error }, { status: 400 });

  const updated = await prisma.serviceCase.update({ where: { id: owned.id }, data: norm.value });
  revalidatePath("/", "layout");
  return NextResponse.json({ success: true, case: updated });
}

export async function DELETE(request: Request) {
  const auth = await authorizeAdmin(["services:manage"]);
  if (!auth.ok) return auth.response;

  const id = new URL(request.url).searchParams.get("id") || "";
  const owned = await prisma.serviceCase.findFirst({ where: { id, tenantId: auth.tenantId }, select: { id: true } });
  if (!owned) return notFoundResponse("Dokumentasi");

  await prisma.serviceCase.delete({ where: { id: owned.id } });
  revalidatePath("/", "layout");
  return NextResponse.json({ success: true });
}
