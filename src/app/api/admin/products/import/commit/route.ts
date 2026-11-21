import { NextResponse } from "next/server";
import { authorizeAdmin, hasPermission } from "@/lib/auth";
import { IMPORT_BATCH_SIZE } from "@/lib/catalog-import/columns";
import { commitRows } from "@/lib/catalog-import/engine";
import { sanitizeRow } from "@/lib/catalog-import/parse";
import type { ImportRow } from "@/lib/catalog-import/types";

/**
 * Simpan satu batch baris hasil preview (maks. IMPORT_BATCH_SIZE per request).
 * Klien mengirim batch berurutan sehingga ada progress bar dan tidak ada request yang terlalu lama.
 */
export async function POST(request: Request) {
  const auth = await authorizeAdmin(["products:create"]);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const rawRows: unknown[] = Array.isArray(body?.rows) ? body.rows : [];
  if (rawRows.length === 0) {
    return NextResponse.json({ error: "Tidak ada baris untuk disimpan" }, { status: 400 });
  }
  if (rawRows.length > IMPORT_BATCH_SIZE) {
    return NextResponse.json({ error: `Maksimal ${IMPORT_BATCH_SIZE} baris per batch` }, { status: 400 });
  }

  const rows = rawRows.map(sanitizeRow).filter((r): r is ImportRow => Boolean(r));
  const results = await commitRows(auth.tenantId, rows, {
    createMissing:
      body?.options?.createMissing !== false &&
      (hasPermission(auth.session, "categories:manage") || hasPermission(auth.session, "brands:manage")),
    // Update produk yang sudah ada butuh izin edit
    updateExisting: body?.options?.updateExisting !== false && hasPermission(auth.session, "products:edit"),
  });
  return NextResponse.json({ results });
}
