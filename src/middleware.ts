import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { STORE_PREVIEW_HEADER, TEMPLATE_PREVIEW_HEADER, isTemplateId } from "@/lib/storefront-template";

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
    if (storePreview && /^[a-z0-9-]{1,100}$/i.test(storePreview)) {
      requestHeaders.set(STORE_PREVIEW_HEADER, storePreview);
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
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
      await jwtVerify(godToken, GOD_JWT_SECRET);
      return NextResponse.next();
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

    // Superadmin in God Mode has master access to all tenant CMS
    if (godToken) {
      try {
        await jwtVerify(godToken, GOD_JWT_SECRET);
        return NextResponse.next();
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
      return NextResponse.next();
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

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/god-mode/:path*",
    // Storefront pages (for template preview); skip API, Next internals and static files
    "/((?!api|_next/static|_next/image|uploads|images|favicon.ico|.*\\..*).*)",
  ],
};
