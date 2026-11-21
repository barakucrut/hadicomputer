import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { classifyHost, platformRootDomain } from "@/lib/platform-domain";
import { GOD_COOKIE_NAME, verifyGodToken } from "@/lib/god-auth";
import { demoCookieName, deviceFromUserAgent, isDemoLinkActive, isDemoTokenFormat, signDemoCookie } from "@/lib/demo-access";

type Ctx = { params: Promise<{ token: string }> };

/** Respons tanpa jejak token: tidak diindeks & tidak bocor lewat Referer. */
function withSafeHeaders(res: NextResponse) {
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Referrer-Policy", "no-referrer");
  res.headers.set("Cache-Control", "no-store");
  return res;
}

/**
 * Pintu masuk link demo: https://{slug}.rigspace.id/demo/{token}
 * Token sah -> catat DemoView -> cookie akses bertanda tangan -> etalase.
 */
export async function GET(request: NextRequest, { params }: Ctx) {
  const { token } = await params;
  // Origin dari alamat yang dibuka pengunjung (bukan alamat bind server, mis. 0.0.0.0)
  const reqHost = request.headers.get("x-forwarded-host") || request.headers.get("host") || request.nextUrl.host;
  const proto = request.headers.get("x-forwarded-proto") || request.nextUrl.protocol.replace(":", "");
  const origin = `${proto}://${reqHost}`;
  const home = new URL("/", origin);
  const expired = new URL("/?demo=kedaluwarsa", origin);

  if (!isDemoTokenFormat(token)) return withSafeHeaders(NextResponse.redirect(expired));

  const tenant = await prisma.tenant.findFirst({
    where: { demoToken: token, siteStatus: "DEMO" },
    select: { id: true, slug: true, customDomain: true, demoTokenExpiresAt: true },
  });
  if (!tenant || !isDemoLinkActive(tenant.demoTokenExpiresAt)) {
    return withSafeHeaders(NextResponse.redirect(expired));
  }

  // Link hanya berlaku di alamat toko itu sendiri
  const host = classifyHost(reqHost);
  if (host.kind === "platform-root" || host.kind === "reserved") {
    const target = new URL(`https://${tenant.slug}.${platformRootDomain()}/demo/${token}`);
    return withSafeHeaders(NextResponse.redirect(target));
  }
  if (
    (host.kind === "subdomain" && host.slug !== tenant.slug) ||
    (host.kind === "custom" && host.domain !== tenant.customDomain?.replace(/^www\./, ""))
  ) {
    return withSafeHeaders(NextResponse.redirect(expired));
  }

  // Tim internal yang mengetes link tidak dihitung sebagai "dibuka calon klien"
  const godToken = request.cookies.get(GOD_COOKIE_NAME)?.value;
  const isTeam = Boolean(godToken && (await verifyGodToken(godToken)));
  if (!isTeam) {
    await prisma.demoView
      .create({ data: { tenantId: tenant.id, device: deviceFromUserAgent(request.headers.get("user-agent")) } })
      .catch((err) => console.error("DemoView log error:", err));
  }

  const res = NextResponse.redirect(home);
  const expires = new Date(tenant.demoTokenExpiresAt!);
  res.cookies.set({
    name: demoCookieName(tenant.id),
    value: signDemoCookie(tenant.id, token, expires),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
  // Host pengembangan (localhost/tunnel) memilih toko lewat cookie preview
  if (host.kind === "dev") {
    res.cookies.set({ name: "rigspace_store_slug", value: tenant.slug, httpOnly: true, sameSite: "lax", path: "/", expires });
  }
  return withSafeHeaders(res);
}
