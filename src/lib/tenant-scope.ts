import { NextResponse } from "next/server";
import { isUniqueViolation } from "./product-sku";

/** Respons standar bila data tidak ada ATAU milik tenant lain (tidak dibedakan, agar tidak bocor). */
export function notFoundResponse(label = "Data") {
  return NextResponse.json({ error: `${label} tidak ditemukan` }, { status: 404 });
}

/** Ubah error unik Prisma (mis. slug ganda dalam satu toko) menjadi pesan yang jelas. */
export function uniqueConflictResponse(err: unknown, label: string) {
  if (isUniqueViolation(err, "slug")) {
    return NextResponse.json({ error: `Slug ${label} sudah dipakai di toko ini.` }, { status: 409 });
  }
  return null;
}
