import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { authorizeAdmin } from "@/lib/auth";
import { notFoundResponse } from "@/lib/tenant-scope";
import { validateTestimonial } from "@/lib/testimonials";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const auth = await authorizeAdmin(["testimonials:manage"]);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const existing = await prisma.testimonial.findFirst({ where: { id, tenantId: auth.tenantId } });
  if (!existing) return notFoundResponse("Testimoni");

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  // Partial update (mis. hanya toggle isActive): gabungkan dengan data lama lalu validasi ulang.
  const result = validateTestimonial({ ...existing, ...(body || {}) });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  const testimonial = await prisma.testimonial.update({ where: { id: existing.id }, data: result.data });
  revalidatePath("/", "layout");
  return NextResponse.json({ success: true, testimonial });
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await authorizeAdmin(["testimonials:manage"]);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const owned = await prisma.testimonial.findFirst({ where: { id, tenantId: auth.tenantId }, select: { id: true } });
  if (!owned) return notFoundResponse("Testimoni");

  await prisma.testimonial.delete({ where: { id: owned.id } });
  revalidatePath("/", "layout");
  return NextResponse.json({ success: true });
}
