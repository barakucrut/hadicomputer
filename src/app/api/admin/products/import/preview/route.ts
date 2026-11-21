import { NextResponse } from "next/server";
import { authorizeAdmin } from "@/lib/auth";
import { buildPreview } from "@/lib/catalog-import/engine";
import { ImportFileError, normalizeRecord, readCatalogFile } from "@/lib/catalog-import/parse";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

/** Upload file CSV/XLSX -> validasi & rencana import (belum ada yang disimpan). */
export async function POST(request: Request) {
  const auth = await authorizeAdmin(["products:create", "products:edit"]);
  if (!auth.ok) return auth.response;

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "Ukuran file maksimal 10MB" }, { status: 413 });
    }

    const records = await readCatalogFile(file.name, Buffer.from(await file.arrayBuffer()));
    const rows = records.map(normalizeRecord);
    const preview = await buildPreview(
      auth.tenantId,
      rows,
      {
        createMissing: form.get("createMissing") !== "false",
        updateExisting: form.get("updateExisting") !== "false",
      },
      file.name
    );
    return NextResponse.json(preview);
  } catch (err) {
    if (err instanceof ImportFileError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("Import preview error:", err);
    return NextResponse.json({ error: "Gagal membaca file" }, { status: 500 });
  }
}
