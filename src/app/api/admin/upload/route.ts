import { NextResponse } from "next/server";
import { authorizeAdmin } from "@/lib/auth";
import { ImageValidationError, MAX_INPUT_BYTES } from "@/lib/image-optimizer";
import { resolveUploadFolder, storeImage } from "@/lib/image-storage";

export async function POST(request: Request) {
  const auth = await authorizeAdmin([
    "products:create",
    "products:edit",
    "banners:manage",
    "testimonials:manage",
    "brands:manage",
    "categories:manage",
    "settings:appearance",
  ]);
  if (!auth.ok) return auth.response;

  // Tolak lebih awal sebelum body besar dibaca ke memori
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_INPUT_BYTES + 1024 * 1024) {
    return NextResponse.json({ error: "Ukuran file maksimal 15MB." }, { status: 413 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const folder = resolveUploadFolder(String(formData.get("folder") || "products"));

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    }

    const input = Buffer.from(await file.arrayBuffer());
    const { url, optimized } = await storeImage(input, { folder, fileName: file.name });
    console.info(`[upload] ${url}: ${optimized.summary}`);

    return NextResponse.json({
      success: true,
      url,
      width: optimized.width,
      height: optimized.height,
      bytes: optimized.bytes,
      originalBytes: optimized.originalBytes,
    });
  } catch (err) {
    if (err instanceof ImageValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Gagal mengunggah file" }, { status: 500 });
  }
}
