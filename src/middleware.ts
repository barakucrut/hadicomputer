import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { canAccessGodPath, isPlatformRole } from "@/lib/platform-access";
import { IMPERSONATION_COOKIE } from "@/lib/platform-cms";
import { STORE_PREVIEW_HEADER, TEMPLATE_PREVIEW_HEADER, isTemplateId, CMS_AREA_HEADER, CMS_PATH_HEADER } from "@/lib/storefront-template";

const ADMIN_JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || "hadi-computer-cms-secret-key-32-chars-long-2026"
);

const GOD_JWT_SECRET = new TextEncoder().encode(
  process.env.GOD_MODE_JWT_SECRET ||
    process.env.ADMIN_JWT_SECRET ||
    "platform-superadmin-god-mode-secret-key-32-chars-2026"
);

const ADMIN_COOKIE_NAME = "hadi_admin_session";
const GOD_COOKIE_NAME = "platform_god_session";

/** Lanjutkan request CMS dengan penanda area agar root layout tidak merender output storefront. */
function cmsNext(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(CMS_AREA_HEADER, "cms");
  requestHeaders.set(CMS_PATH_HEADER, request.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 0. Storefront previews (?template=..., ?store=...): forward them as request headers
  //    so the root layout renders the same store and header/footer shell as the page.
  if (!pathname.startsWith("/admin") && !pathname.startsWith("/god-mode")) {
    const preview = request.nextUrl.searchParams.get("template");
    const requestHeaders = new Headers(request.headers);
    requestHeaders.delete(TEMPLATE_PREVIEW_HEADER);
    if (isTemplateId(preview)) {
      requestHeaders.set(TEMPLATE_PREVIEW_HEADER, preview);
    }
    const storePreview = request.nextUrl.searchParams.get("store") || request.nextUrl.searchParams.get("preview");
    requestHeaders.delete(STORE_PREVIEW_HEADER);
    requestHeaders.delete(CMS_AREA_HEADER); // tidak boleh dipalsukan klien
    if (storePreview && /^[a-z0-9-]{1,100}$/i.test(storePreview)) {
      requestHeaders.set(STORE_PREVIEW_HEADER, storePreview);
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Favicon CMS (src/app/{admin,god-mode}/icon.svg & apple-icon.png) publik: dibutuhkan halaman login
  if (/^\/(admin|god-mode)\/(icon\.svg|apple-icon\.png)$/.test(pathname)) {
    return NextResponse.next();
  }

  // 1. Protect /god-mode routes (except /god-mode/login)
  if (pathname.startsWith("/god-mode") && pathname !== "/god-mode/login") {
    const godToken = request.cookies.get(GOD_COOKIE_NAME)?.value;

    if (!godToken) {
      const loginUrl = new URL("/god-mode/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const { payload } = await jwtVerify(godToken, GOD_JWT_SECRET);
      const role = isPlatformRole(payload.role) ? payload.role : null;
      if (!role) throw new Error("invalid role");
      // Halaman di luar hak peran (mis. marketing membuka Keuangan) -> kembali ke dashboard.
      // Penegakan sebenarnya tetap di API (authorizePlatform).
      if (!canAccessGodPath(role, pathname)) {
        return NextResponse.redirect(new URL("/god-mode", request.url));
      }
      return cmsNext(request);
    } catch {
      const loginUrl = new URL("/god-mode/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete(GOD_COOKIE_NAME);
      return res;
    }
  }

  // If already logged into god-mode, redirect away from /god-mode/login to /god-mode
  if (pathname === "/god-mode/login") {
    const godToken = request.cookies.get(GOD_COOKIE_NAME)?.value;
    if (godToken) {
      try {
        await jwtVerify(godToken, GOD_JWT_SECRET);
        return NextResponse.redirect(new URL("/god-mode", request.url));
      } catch {
        // invalid token, stay on login
      }
    }
  }

  // 2. Protect /admin routes (except /admin/login)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const godToken = request.cookies.get(GOD_COOKIE_NAME)?.value;

    // Tim platform dari god-mode:
    // - Superadmin: akses CMS semua toko.
    // - CMO/Marketing: hanya saat sedang membuka toko (cookie impersonasi). Kepemilikan toko
    //   dicek live di server (requireAdminSession -> tenantScope); di luar lingkup = tanpa akses.
    if (godToken) {
      try {
        const { payload } = await jwtVerify(godToken, GOD_JWT_SECRET);
        if (payload.role === "SUPERADMIN") return cmsNext(request);
        if ((payload.role === "CMO" || payload.role === "MARKETING") && request.cookies.get(IMPERSONATION_COOKIE)?.value) {
          return cmsNext(request);
        }
      } catch {
        // invalid god token, fall through to regular admin session check
      }
    }

    if (!token) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      await jwtVerify(token, ADMIN_JWT_SECRET);
      return cmsNext(request);
    } catch {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete(ADMIN_COOKIE_NAME);
      return res;
    }
  }

  // If authenticated user visits /admin/login, redirect to /admin
  if (pathname === "/admin/login") {
    const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (token) {
      try {
        await jwtVerify(token, ADMIN_JWT_SECRET);
        return NextResponse.redirect(new URL("/admin", request.url));
      } catch {
        // invalid token, stay on login
      }
    }
  }

  return cmsNext(request);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/god-mode/:path*",
    // Storefront pages (for template preview); skip API, Next internals and static files
    "/((?!api|_next/static|_next/image|uploads|images|favicon.ico|.*\\..*).*)",
  ],
};
