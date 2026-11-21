import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const segments = resolvedParams?.path;
    if (!segments || segments.length === 0) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Prevent directory traversal attacks
    const uploadsRoot = path.resolve(process.cwd(), "public", "uploads");
    const filePath = path.resolve(uploadsRoot, ...segments);
    if (!filePath.startsWith(uploadsRoot + path.sep)) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Verify file exists and is a file
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const fileBuffer = await readFile(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileStat.size.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        // SVG dibuka langsung tidak boleh menjalankan script (lapisan kedua setelah sanitasi saat upload)
        ...(ext === ".svg"
          ? { "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; img-src data:; sandbox" }
          : {}),
      },
    });
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }
}
