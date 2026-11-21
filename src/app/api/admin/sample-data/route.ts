import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { authorizeAdmin } from "@/lib/auth";
import { clearSampleData, countSampleData } from "@/lib/starter-pack";

/** Jumlah data contoh (Starter Pack) di toko ini. */
export async function GET() {
  const auth = await authorizeAdmin();
  if (!auth.ok) return auth.response;
  return NextResponse.json(await countSampleData(auth.tenantId));
}

/** Hapus seluruh data contoh toko ini (produk, banner, layanan contoh). */
export async function DELETE() {
  const auth = await authorizeAdmin(["products:delete"]);
  if (!auth.ok) return auth.response;

  const removed = await clearSampleData(auth.tenantId);
  revalidatePath("/", "layout");
  revalidatePath("/katalog");
  return NextResponse.json({ success: true, removed });
}
