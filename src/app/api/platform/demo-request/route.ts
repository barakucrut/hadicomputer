import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseDemoRequest } from "@/lib/demo-request";
import { parseLocale } from "@/lib/i18n";
import { getSalesContact } from "@/lib/platform-tenant";

// Batas sederhana per IP (memori proses; IP tidak disimpan ke database)
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

/** Form "Minta Demo" landing page rigspace.id -> DemoRequest milik CMO aktif. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const locale = parseLocale(typeof body.locale === "string" ? body.locale : null) ?? "id";
  const en = locale === "en";

  const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "local";
  if (limited(ip)) {
    return NextResponse.json(
      {
        error: en
          ? "Too many requests. Please try again in an hour or contact us via WhatsApp."
          : "Terlalu banyak permintaan. Coba lagi dalam satu jam atau hubungi kami lewat WhatsApp.",
      },
      { status: 429 }
    );
  }

  const parsed = parseDemoRequest(body, locale);
  if (!parsed.ok) {
    // Bot (honeypot) diberi respons sukses palsu supaya tidak mencoba ulang
    if (parsed.spam) return NextResponse.json({ success: true });
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const sales = await getSalesContact();
    await prisma.demoRequest.create({ data: { ...parsed.data, assignedToId: sales?.id ?? null } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/platform/demo-request error:", err);
    return NextResponse.json(
      {
        error: en
          ? "Failed to send request. Please try again or reach us via WhatsApp."
          : "Gagal mengirim permintaan. Silakan coba lagi atau hubungi kami lewat WhatsApp.",
      },
      { status: 500 }
    );
  }
}
