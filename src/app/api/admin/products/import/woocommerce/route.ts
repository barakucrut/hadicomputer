import { NextResponse } from "next/server";
import { authorizeAdmin } from "@/lib/auth";
import { buildPreview } from "@/lib/catalog-import/engine";
import { ImportFileError } from "@/lib/catalog-import/parse";
import { fetchWooCommerceRows } from "@/lib/catalog-import/woocommerce";

/** Ambil katalog dari website WooCommerce -> pratinjau import (belum ada yang disimpan). */
export async function POST(request: Request) {
  const auth = await authorizeAdmin(["products:create"]);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const url = typeof body?.url === "string" ? body.url.trim() : "";
  if (!url) return NextResponse.json({ error: "Alamat website wajib diisi" }, { status: 400 });

  try {
    const { rows, source } = await fetchWooCommerceRows(url);
    const preview = await buildPreview(
      auth.tenantId,
      rows,
      { createMissing: body?.createMissing !== false, updateExisting: body?.updateExisting !== false },
      source
    );
    return NextResponse.json(preview);
  } catch (err) {
    if (err instanceof ImportFileError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("WooCommerce import error:", err);
    return NextResponse.json({ error: "Gagal mengambil katalog dari website" }, { status: 500 });
  }
}
