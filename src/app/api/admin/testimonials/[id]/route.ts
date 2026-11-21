import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { authorizeAdmin } from "@/lib/auth";
import { validateTestimonial } from "@/lib/testimonials";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const auth = await authorizeAdmin(["testimonials:manage"]);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const existing = await prisma.testimonial.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Testimoni tidak ditemukan." }, { status: 404 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  // Partial update (mis. hanya toggle isActive): gabungkan dengan data lama lalu validasi ulang.
  const result = validateTestimonial({ ...existing, ...(body || {}) });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  const testimonial = await prisma.testimonial.update({ where: { id }, data: result.data });
  revalidatePath("/");
  revalidatePath("/testimoni");
  return NextResponse.json({ success: true, testimonial });
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await authorizeAdmin(["testimonials:manage"]);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const deleted = await prisma.testimonial.deleteMany({ where: { id } });
  if (deleted.count === 0) return NextResponse.json({ error: "Testimoni tidak ditemukan." }, { status: 404 });

  revalidatePath("/");
  revalidatePath("/testimoni");
  return NextResponse.json({ success: true });
}
