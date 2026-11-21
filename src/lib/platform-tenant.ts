import { NextResponse } from "next/server";
import { prisma } from "./db";
import type { PlatformSession } from "./god-auth";
import { tenantScope } from "./god-auth";

/** Tenant milik sesi (superadmin: semua; marketing: hanya bawaannya). null = 404 tanpa membedakan. */
export async function findScopedTenant(session: PlatformSession, id: string) {
  if (!id || typeof id !== "string") return null;
  return prisma.tenant.findFirst({ where: { id, ...tenantScope(session) }, select: { id: true, acquiredById: true } });
}

/** Validasi target penugasan: harus akun penjual (MARKETING atau CMO) yang aktif. */
export async function isAssignablePlatformUser(id: string | null | undefined): Promise<boolean> {
  if (!id) return true; // null = lepas penugasan (dikelola pusat)
  const user = await prisma.platformUser.findFirst({ where: { id, isActive: true, role: { in: ["CMO", "MARKETING"] } }, select: { id: true } });
  return Boolean(user);
}

/** P2002 (slug/ID turunan slug/custom domain) -> 409 dengan pesan aman. */
export function tenantConflictResponse(err: unknown) {
  const e = err as { code?: string } | null;
  if (e?.code === "P2002") {
    return NextResponse.json({ error: "Slug subdomain atau custom domain sudah dipakai toko lain." }, { status: 409 });
  }
  return null;
}

/** Atasan valid = akun CMO yang aktif. */
export async function isAssignableManager(id: string | null | undefined): Promise<boolean> {
  if (!id) return true;
  const user = await prisma.platformUser.findFirst({ where: { id, isActive: true, role: "CMO" }, select: { id: true } });
  return Boolean(user);
}

/**
 * Kontak sales di landing page: CMO aktif pertama (permintaan demo & tombol WhatsApp ditujukan ke sini).
 * phone = nomor WA ternormalisasi (62…) atau null bila belum diisi di akun.
 */
export async function getSalesContact(): Promise<{ id: string; name: string; phone: string | null } | null> {
  const cmo = await prisma.platformUser.findFirst({
    where: { role: "CMO", isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, phone: true },
  });
  if (!cmo) return null;
  const { normalizeWhatsapp } = await import("./platform-access");
  return { id: cmo.id, name: cmo.name, phone: normalizeWhatsapp(cmo.phone || "") };
}
