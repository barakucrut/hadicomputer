import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, LOCALE_HEADER, resolveLocale, type Locale } from "./index";

/** Resolusi locale request di Server Component / generateMetadata (query ?lang -> cookie -> Accept-Language -> "id"). */
export async function getRequestLocale(fallback?: Locale): Promise<Locale> {
  const [headerStore, cookieStore] = await Promise.all([headers(), cookies()]);
  return resolveLocale({
    query: headerStore.get(LOCALE_HEADER),
    cookie: cookieStore.get(LOCALE_COOKIE)?.value,
    acceptLanguage: headerStore.get("accept-language"),
    fallback,
  });
}
