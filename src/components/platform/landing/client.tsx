"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BatteryFull, MessageCircle, Signal, Wifi } from "lucide-react";
import { trackEvent } from "@/components/storefront-analytics";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n";
import { BRAND_COLORS, getLandingContent, previewSlug } from "./content";
import { LANDING_EVENTS, readTrack } from "./tracking";

const STORE_EVENT = "rsl-store-name";
let lastStoreName = "";
/** Paket terakhir yang diklik di bagian Harga, ikut dikirim saat lead masuk. */
let lastPlan = "";

function FlagID() {
  return (
    <svg className="rsl-flag" viewBox="0 0 16 12" aria-hidden="true">
      <rect width="16" height="6" fill="#CE1126" />
      <rect y="6" width="16" height="6" fill="#FFFFFF" />
    </svg>
  );
}

function FlagEN() {
  return (
    <svg className="rsl-flag" viewBox="0 0 16 12" aria-hidden="true">
      <rect width="16" height="12" fill="#012169" />
      <path d="M0 0L16 12M16 0L0 12" stroke="#FFFFFF" strokeWidth="2.4" />
      <path d="M0 0L16 12M16 0L0 12" stroke="#C8102E" strokeWidth="1.2" />
      <path d="M8 0V12M0 6H16" stroke="#FFFFFF" strokeWidth="3.6" />
      <path d="M8 0V12M0 6H16" stroke="#C8102E" strokeWidth="2" />
    </svg>
  );
}

/** Switcher bahasa ID | EN dengan ikon bendera di navbar landing page. */
export function LanguageSwitcher({ locale, ariaLabel }: { locale: Locale; ariaLabel: string }) {
  const router = useRouter();
  const [active, setActive] = React.useState<Locale>(locale);
  const [, startTransition] = React.useTransition();

  React.useEffect(() => {
    setActive(locale);
  }, [locale]);

  const select = (next: Locale) => {
    if (next === active) return;
    setActive(next);
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax`;
    trackEvent(LANDING_EVENTS.langSwitch, { locale: next });
    const url = new URL(window.location.href);
    url.searchParams.set("lang", next);
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="rsl-lang" role="group" aria-label={ariaLabel}>
      <button type="button" aria-pressed={active === "id"} onClick={() => select("id")}>
        <FlagID />
        <span>ID</span>
      </button>
      <button type="button" aria-pressed={active === "en"} onClick={() => select("en")}>
        <FlagEN />
        <span>EN</span>
      </button>
    </div>
  );
}

/**
 * Pelacak event landing: klik elemen [data-track] (delegasi), buka FAQ, dan section terlihat.
 * Tanpa GA terpasang, trackEvent() tidak melakukan apa-apa.
 */
export function LandingTracker() {
  React.useEffect(() => {
    const root = document.querySelector(".rsl");
    if (!root) return;

    const onClick = (e: Event) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>("[data-track]");
      if (!el || !root.contains(el)) return;
      const parsed = readTrack(el.dataset);
      if (!parsed) return;
      if (parsed.event === LANDING_EVENTS.selectPlan && parsed.params.plan) lastPlan = parsed.params.plan;
      trackEvent(parsed.event, parsed.params);
    };

    // "toggle" pada <details> tidak bubble -> tangkap di fase capture
    const onToggle = (e: Event) => {
      const el = e.target as HTMLDetailsElement;
      if (el.tagName !== "DETAILS" || !el.open || !el.classList.contains("faq")) return;
      const question = el.querySelector("summary")?.textContent?.trim().slice(0, 100) || "";
      trackEvent(LANDING_EVENTS.faqOpen, { question });
    };

    root.addEventListener("click", onClick);
    root.addEventListener("toggle", onToggle, true);

    let io: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      const seen = new Set<string>();
      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const id = (entry.target as HTMLElement).id;
            if (!entry.isIntersecting || !id || seen.has(id)) continue;
            seen.add(id);
            trackEvent(LANDING_EVENTS.sectionView, { section: id });
            io?.unobserve(entry.target);
          }
        },
        { threshold: 0.35 }
      );
      root.querySelectorAll("section[id]").forEach((el) => io?.observe(el));
    }

    return () => {
      root.removeEventListener("click", onClick);
      root.removeEventListener("toggle", onToggle, true);
      io?.disconnect();
    };
  }, []);
  return null;
}

/** Animasi muncul saat di-scroll: pakai data-attribute agar aman saat React refresh (ganti bahasa). */
export function RevealOnScroll({ locale }: { locale: Locale }) {
  React.useEffect(() => {
    const root = document.querySelector<HTMLElement>(".rsl");
    if (!root) return;
    root.dataset.rslReady = "1";
    const els = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]")).filter(
      (el) => el.dataset.revealed !== "1"
    );
    if (!els.length) return;
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => {
        el.dataset.revealed = "1";
      });
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).dataset.revealed = "1";
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [locale]);
  return null;
}

/** Nav: garis emas yang berpindah ke menu yang sedang di-hover. */
export function NavHoverLine({ locale }: { locale: Locale }) {
  React.useEffect(() => {
    const nav = document.querySelector<HTMLElement>(".rsl .nav-links");
    if (!nav) return;
    nav.classList.remove("is-hovering");
    const links = Array.from(nav.querySelectorAll<HTMLAnchorElement>("a"));
    const show = (a: HTMLAnchorElement) => {
      nav.style.setProperty("--rsl-line-x", `${a.offsetLeft}px`);
      nav.style.setProperty("--rsl-line-w", `${a.offsetWidth}px`);
      nav.classList.add("is-hovering");
    };
    const hide = () => nav.classList.remove("is-hovering");
    const handlers = links.map((a) => {
      const h = () => show(a);
      a.addEventListener("mouseenter", h);
      a.addEventListener("focus", h);
      a.addEventListener("blur", hide);
      return [a, h] as const;
    });
    nav.addEventListener("mouseleave", hide);
    return () => {
      for (const [a, h] of handlers) {
        a.removeEventListener("mouseenter", h);
        a.removeEventListener("focus", h);
        a.removeEventListener("blur", hide);
      }
      nav.removeEventListener("mouseleave", hide);
    };
  }, [locale]);
  return null;
}

function scrollToForm() {
  document.getElementById("minta-demo")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Hero interaktif: pengunjung mengetik nama toko & memilih warna -> alamat, logo di desktop & HP berubah.
 * Gambar website = tampilan asli template (nama contoh "Rig Computer"), logo ditimpa nama ketikan.
 */
export function HeroPreview({
  desktopSrc,
  mobileSrc,
  locale = "id",
}: {
  desktopSrc: string;
  mobileSrc: string;
  locale?: Locale;
}) {
  const hero = getLandingContent(locale).hero;
  const [name, setName] = React.useState("Rig Computer");
  const [color, setColor] = React.useState(BRAND_COLORS[0]);
  const [pulse, setPulse] = React.useState(0);
  const typedRef = React.useRef(false);
  const slug = previewSlug(name, locale === "en" ? "yourstore" : "namatoko");
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = (words[0] || hero.fallbackStoreWord).slice(0, 14);
  const rest = words.slice(1).join(" ").slice(0, 22);

  React.useEffect(() => {
    lastStoreName = name.trim();
    window.dispatchEvent(new CustomEvent(STORE_EVENT, { detail: lastStoreName }));
    const t = setTimeout(() => setPulse((p) => p + 1), 0);
    return () => clearTimeout(t);
  }, [name, color]);

  const logo = (
    <span className="logo-cover" key={pulse} aria-hidden>
      <b className="pulse">{first}</b>
      {rest && <small>{rest}</small>}
    </span>
  );

  return (
    <div className="hero-grid" style={{ ["--accent" as string]: color }}>
      <div>
        <span className="pill">
          <i /> {hero.eyebrow}
        </span>
        <h1>
          <span>{hero.lines[0]}</span>
          <span>{hero.lines[1]}</span>
          <span className="gold">{hero.lines[2]}</span>
        </h1>
        <p className="lead">{hero.lead}</p>

        <div className="try">
          <label htmlFor="rsl-store">{hero.tryLabel}</label>
          <div className="try-input">
            <input
              id="rsl-store"
              value={name}
              maxLength={40}
              autoComplete="organization"
              onChange={(e) => {
                setName(e.target.value);
                if (!typedRef.current) {
                  typedRef.current = true;
                  trackEvent(LANDING_EVENTS.tryStoreName);
                }
              }}
              placeholder={hero.storePlaceholder}
            />
            <span>.rigspace.id</span>
          </div>
          <div className="colors" role="group" aria-label={hero.brandColorLabel}>
            {hero.brandColorLabel}
            {BRAND_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className="swatch"
                style={{ background: c }}
                aria-label={`${hero.colorAriaPrefix} ${c}`}
                aria-pressed={c === color}
                onClick={() => {
                  setColor(c);
                  trackEvent(LANDING_EVENTS.tryBrandColor, { color: c });
                }}
              />
            ))}
          </div>
        </div>

        <div className="hero-ctas">
          <button
            type="button"
            className="btn btn-dark"
            onClick={() => {
              trackEvent(LANDING_EVENTS.ctaClick, { location: "hero" });
              scrollToForm();
            }}
          >
            {hero.cta} →
          </button>
        </div>
        <p className="hint">
          <b>{hero.freeLabel}</b> · {hero.hint}
        </p>
      </div>

      <div className="stage">
        <div className="live-badge anim-badge">
          <i /> {hero.liveBadge}
        </div>
        <div className="desk anim-desk">
          <div className="bar">
            <span />
            <span />
            <span />
            <div className="url">
              🔒&nbsp;<em>{slug}</em>.rigspace.id
            </div>
          </div>
          <div className="shot">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={desktopSrc}
              alt={`${hero.desktopAltPrefix} ${name || hero.desktopAltFallback}`}
              width={1600}
              height={1000}
              fetchPriority="high"
            />
            {logo}
          </div>
        </div>
        <div className="phone anim-phone">
          <div className="screen">
            <div className="rsl-statusbar" aria-hidden>
              <span className="rsl-sb-time">9:41</span>
              <span className="rsl-sb-icons">
                <Signal className="rsl-sb-icon" strokeWidth={2.6} />
                <Wifi className="rsl-sb-icon" strokeWidth={2.6} />
                <BatteryFull className="rsl-sb-icon rsl-sb-battery" strokeWidth={2.2} />
              </span>
            </div>
            <div className="rsl-viewport">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mobileSrc}
                alt={`${hero.mobileAltPrefix} ${name || hero.desktopAltFallback}`}
                width={620}
                height={1342}
              />
              {logo}
            </div>
            <span className="rsl-home-indicator" aria-hidden />
          </div>
          {/* Bingkai HP (PNG transparan): rangka, bezel & Dynamic Island di atas layar */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="rsl-phone-frame" src="/platform/landing/phone-frame.webp" alt="" aria-hidden width={520} height={1048} />
        </div>
        <div className="toast anim-toast">
          <div className="av">
            <MessageCircle size={18} />
          </div>
          <div>
            <b>{hero.toastTitle}</b>
            <span>&quot;{hero.toastMessage}&quot;</span>
            <small>
              {hero.toastMetaPrefix} {slug}.rigspace.id
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Form "Minta Demo": nama toko terisi otomatis dari hero; kirim ke /api/platform/demo-request. */
export function DemoForm({ waUrl, locale = "id" }: { waUrl: string | null; locale?: Locale }) {
  const copy = getLandingContent(locale).form;
  const [form, setForm] = React.useState({ storeName: "", city: "", whatsapp: "", storeLink: "", website: "" });
  const [touchedName, setTouchedName] = React.useState(false);
  const [status, setStatus] = React.useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = React.useState<string | null>(null);
  const startedRef = React.useRef(false);
  const onFormFocus = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    trackEvent(LANDING_EVENTS.formStart, { form: "demo" });
  };

  React.useEffect(() => {
    const apply = (value: string) => {
      if (!touchedName && value && value !== "Rig Computer") setForm((f) => ({ ...f, storeName: value }));
    };
    apply(lastStoreName);
    const onName = (e: Event) => apply(String((e as CustomEvent<string>).detail || ""));
    window.addEventListener(STORE_EVENT, onName);
    return () => window.removeEventListener(STORE_EVENT, onName);
  }, [touchedName]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("sending");
    try {
      const res = await fetch("/api/platform/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, locale }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        trackEvent(LANDING_EVENTS.formError, { form: "demo", status: String(res.status) });
        throw new Error(data.error || copy.genericError);
      }
      // Lead utama — tandai "generate_lead" sebagai Key event di GA4. Tanpa data pribadi.
      trackEvent(LANDING_EVENTS.generateLead, { method: "form", form: "demo", ...(lastPlan ? { plan: lastPlan } : {}) });
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.genericError);
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <div className="form" role="status">
        <div className="ok-box">
          <i>✓</i>
          <b>{copy.doneTitle}</b>
          <p>
            {copy.doneThankYou}
            {form.storeName ? `, ${form.storeName}` : ""}. {copy.doneBody}
          </p>
        </div>
      </div>
    );
  }

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value });

  return (
    <form className="form" onSubmit={submit} onFocus={onFormFocus} noValidate>
      <b>{copy.title}</b>
      {error && (
        <div className="err" role="alert">
          {error}
        </div>
      )}
      <div className="field">
        <label htmlFor="d-store">{copy.storeLabel}</label>
        <input
          id="d-store"
          required
          maxLength={150}
          value={form.storeName}
          onChange={(e) => {
            setTouchedName(true);
            set("storeName")(e);
          }}
          placeholder={copy.storePlaceholder}
          autoComplete="organization"
        />
      </div>
      <div className="field">
        <label htmlFor="d-city">{copy.cityLabel}</label>
        <input
          id="d-city"
          required
          maxLength={100}
          value={form.city}
          onChange={set("city")}
          placeholder={copy.cityPlaceholder}
          autoComplete="address-level2"
        />
      </div>
      <div className="field">
        <label htmlFor="d-wa">{copy.whatsappLabel}</label>
        <input
          id="d-wa"
          required
          inputMode="tel"
          maxLength={20}
          value={form.whatsapp}
          onChange={set("whatsapp")}
          placeholder={copy.whatsappPlaceholder}
          autoComplete="tel"
        />
      </div>
      <div className="field">
        <label htmlFor="d-link">{copy.linkLabel}</label>
        <input
          id="d-link"
          maxLength={300}
          value={form.storeLink}
          onChange={set("storeLink")}
          placeholder={copy.linkPlaceholder}
          inputMode="url"
        />
      </div>
      {/* Honeypot anti-bot: disembunyikan dari pengguna */}
      <div className="hp" aria-hidden>
        <label htmlFor="d-website">Website</label>
        <input id="d-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} />
      </div>
      <button type="submit" className="btn btn-dark" disabled={status === "sending"}>
        {status === "sending" ? copy.sending : copy.submit}
      </button>
      <small>
        {copy.helperText}
        {waUrl && (
          <>
            {" "}
            {copy.orDirectPrefix}{" "}
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontWeight: 700, textDecoration: "underline" }}
              data-track={LANDING_EVENTS.generateLead}
              data-track-method="whatsapp"
              data-track-location="form"
            >
              {copy.directChatLink}
            </a>
            .
          </>
        )}
      </small>
    </form>
  );
}
