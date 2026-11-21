import { NextResponse } from "next/server";
import { authorizeAdmin } from "@/lib/auth";
import { getNextSku } from "@/lib/product-sku";

/** Pratinjau SKU untuk form Tambah Produk. Nomor final ditentukan ulang saat simpan. */
export async function GET() {
  const auth = await authorizeAdmin(["products:create"]);
  if (!auth.ok) return auth.response;

  return NextResponse.json({ code: await getNextSku(auth.tenantId) });
}
