import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { authorizeAdmin } from "@/lib/auth";
import { validateTestimonial } from "@/lib/testimonials";

export async function GET() {
  const auth = await authorizeAdmin(["testimonials:view", "testimonials:manage"]);
  if (!auth.ok) return auth.response;

  const testimonials = await prisma.testimonial.findMany({
    where: { tenantId: auth.tenantId },
    orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ testimonials });
}

export async function POST(request: Request) {
  const auth = await authorizeAdmin(["testimonials:manage"]);
  if (!auth.ok) return auth.response;

  const result = validateTestimonial(await request.json().catch(() => null));
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  const testimonial = await prisma.testimonial.create({ data: { ...result.data, tenantId: auth.tenantId } });
  revalidatePath("/", "layout");
  return NextResponse.json({ success: true, testimonial });
}

const MAX_BULK = 200;

function parseIds(body: unknown): string[] | null {
  const ids = (body as { ids?: unknown } | null)?.ids;
  if (!Array.isArray(ids)) return null;
  const clean = [...new Set(ids.filter((id): id is string => typeof id === "string" && id.length > 0 && id.length <= 191))];
  return clean.length > 0 && clean.length <= MAX_BULK ? clean : null;
}

/** Hapus massal: { ids: string[] } — hanya baris milik toko ini yang ikut terhapus. */
export async function DELETE(request: Request) {
  const auth = await authorizeAdmin(["testimonials:manage"]);
  if (!auth.ok) return auth.response;

  const ids = parseIds(await request.json().catch(() => null));
  if (!ids) return NextResponse.json({ error: "Pilih testimoni yang akan dihapus." }, { status: 400 });

  const result = await prisma.testimonial.deleteMany({ where: { id: { in: ids }, tenantId: auth.tenantId } });
  revalidatePath("/", "layout");
  return NextResponse.json({ success: true, count: result.count });
}
