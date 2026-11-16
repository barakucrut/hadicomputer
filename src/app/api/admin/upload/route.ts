import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getAdminSession } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "products";

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    }

    // Validate mime type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Format file tidak didukung. Harap gunakan JPEG, PNG, atau WebP." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const safeFolder = folder.replace(/[^a-z0-9_-]/gi, "");
    const uploadDir = path.join(process.cwd(), "public", "uploads", safeFolder);
    await mkdir(uploadDir, { recursive: true, mode: 0o755 });

    const ext = path.extname(file.name) || ".jpg";
    const baseName = path.basename(file.name, ext).replace(/[^a-z0-9_-]/gi, "-");
    const uniqueName = `${baseName}-${Date.now()}${ext}`;
    const filePath = path.join(uploadDir, uniqueName);

    await writeFile(filePath, buffer, { mode: 0o644 });

    const publicUrl = `/uploads/${safeFolder}/${uniqueName}`;
    return NextResponse.json({ success: true, url: publicUrl });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Gagal mengunggah file" }, { status: 500 });
  }
}
