"use client";

import * as React from "react";
import { MessageCircle } from "lucide-react";
import { trackEvent } from "@/components/storefront-analytics";
import { BRAND_COLORS, HERO, previewSlug } from "./content";
import { LANDING_EVENTS, readTrack } from "./tracking";

const STORE_EVENT = "rsl-store-name";
let lastStoreName = "";
/** Paket terakhir yang diklik di bagian Harga, ikut dikirim saat lead masuk. */
let lastPlan = "";

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

/** Animasi muncul saat di-scroll: menandai root .rsl-js lalu mengamati [data-reveal]. */
export function RevealOnScroll() {
  React.useEffect(() => {
    const root = document.querySelector(".rsl");
    if (!root) return;
    root.classList.add("rsl-js");
    const els = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}

function scrollToForm() {
  document.getElementById("minta-demo")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Hero interaktif: pengunjung mengetik nama toko & memilih warna -> alamat, logo di desktop & HP berubah.
 * Gambar website = tampilan asli template (nama contoh "Rig Computer"), logo ditimpa nama ketikan.
 */
export function HeroPreview({ desktopSrc, mobileSrc }: { desktopSrc: string; mobileSrc: string }) {
  const [name, setName] = React.useState("Rig Computer");
  const [color, setColor] = React.useState(BRAND_COLORS[0]);
  const [pulse, setPulse] = React.useState(0);
  const typedRef = React.useRef(false);
  const slug = previewSlug(name);
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = (words[0] || "Toko").slice(0, 14);
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
          <i /> {HERO.eyebrow}
        </span>
        <h1>
          <span>{HERO.lines[0]}</span>
          <span>{HERO.lines[1]}</span>
          <span className="gold">{HERO.lines[2]}</span>
        </h1>
        <p className="lead">{HERO.lead}</p>

        <div className="try">
          <label htmlFor="rsl-store">{HERO.tryLabel}</label>
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
              placeholder="Nama toko Anda"
            />
            <span>.rigspace.id</span>
          </div>
          <div className="colors" role="group" aria-label="Warna brand">
            Warna brand:
            {BRAND_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className="swatch"
                style={{ background: c }}
                aria-label={`Warna ${c}`}
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
            {HERO.cta} →
          </button>
        </div>
        <p className="hint">
          <b>Gratis</b> · {HERO.hint}
        </p>
      </div>

      <div className="stage">
        <div className="live-badge anim-badge">
          <i /> Pratinjau langsung, tanpa daftar
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
            <img src={desktopSrc} alt={`Contoh tampilan website toko ${name || "Anda"} di desktop`} width={1600} height={1000} fetchPriority="high" />
            {logo}
          </div>
        </div>
        <div className="phone anim-phone">
          <div className="screen">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mobileSrc} alt={`Contoh tampilan website toko ${name || "Anda"} di HP`} width={620} height={1342} />
            {logo}
          </div>
        </div>
        <div className="toast anim-toast">
          <div className="av">
            <MessageCircle size={18} />
          </div>
          <div>
            <b>Chat WhatsApp masuk</b>
            <span>&quot;Halo kak, promo bundling laptop minggu ini masih ada?&quot;</span>
            <small>Baru saja · dari {slug}.rigspace.id</small>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Form "Minta Demo": nama toko terisi otomatis dari hero; kirim ke /api/platform/demo-request. */
export function DemoForm({ waUrl }: { waUrl: string | null }) {
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
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        trackEvent(LANDING_EVENTS.formError, { form: "demo", status: String(res.status) });
        throw new Error(data.error || "Gagal mengirim permintaan.");
      }
      // Lead utama — tandai "generate_lead" sebagai Key event di GA4. Tanpa data pribadi.
      trackEvent(LANDING_EVENTS.generateLead, { method: "form", form: "demo", ...(lastPlan ? { plan: lastPlan } : {}) });
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim permintaan.");
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <div className="form" role="status">
        <div className="ok-box">
          <i>✓</i>
          <b>Permintaan demo terkirim</b>
          <p>Terima kasih{form.storeName ? `, ${form.storeName}` : ""}. Tim kami akan menghubungi Anda lewat WhatsApp untuk menyiapkan demonya.</p>
        </div>
      </div>
    );
  }

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value });

  return (
    <form className="form" onSubmit={submit} onFocus={onFormFocus} noValidate>
      <b>Minta Demo Gratis</b>
      {error && (
        <div className="err" role="alert">
          {error}
        </div>
      )}
      <div className="field">
        <label htmlFor="d-store">Nama toko *</label>
        <input
          id="d-store"
          required
          maxLength={150}
          value={form.storeName}
          onChange={(e) => {
            setTouchedName(true);
            set("storeName")(e);
          }}
          placeholder="Mis. Rig Computer"
          autoComplete="organization"
        />
      </div>
      <div className="field">
        <label htmlFor="d-city">Kota *</label>
        <input id="d-city" required maxLength={100} value={form.city} onChange={set("city")} placeholder="Mis. Jember" autoComplete="address-level2" />
      </div>
      <div className="field">
        <label htmlFor="d-wa">Nomor WhatsApp *</label>
        <input id="d-wa" required inputMode="tel" maxLength={20} value={form.whatsapp} onChange={set("whatsapp")} placeholder="08xxxxxxxxxx" autoComplete="tel" />
      </div>
      <div className="field">
        <label htmlFor="d-link">Link toko / marketplace (opsional)</label>
        <input id="d-link" maxLength={300} value={form.storeLink} onChange={set("storeLink")} placeholder="tokopedia.com/namatoko" inputMode="url" />
      </div>
      {/* Honeypot anti-bot: disembunyikan dari pengguna */}
      <div className="hp" aria-hidden>
        <label htmlFor="d-website">Website</label>
        <input id="d-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} />
      </div>
      <button type="submit" className="btn btn-dark" disabled={status === "sending"}>
        {status === "sending" ? "Mengirim..." : "Kirim Permintaan Demo"}
      </button>
      <small>
        Tim kami menghubungi Anda lewat WhatsApp.
        {waUrl && (
          <>
            {" "}
            Atau{" "}
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontWeight: 700, textDecoration: "underline" }}
              data-track={LANDING_EVENTS.generateLead}
              data-track-method="whatsapp"
              data-track-location="form"
            >
              chat langsung
            </a>
            .
          </>
        )}
      </small>
    </form>
  );
}
