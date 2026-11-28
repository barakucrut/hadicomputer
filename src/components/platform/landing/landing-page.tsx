import { MessageCircle } from "lucide-react";
import { salesWhatsappUrl } from "@/lib/demo-request";
import type { Locale } from "@/lib/i18n";
import { BRAND_LINE, getLandingContent } from "./content";
import { DemoForm, HeroPreview, LandingTracker, LanguageSwitcher, NavHoverLine, RevealOnScroll } from "./client";
import { LANDING_EVENTS as E, track } from "./tracking";
import "./landing.css";

function Mark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label="Rigspace.id" style={{ borderRadius: size * 0.28, flex: "none" }}>
      <defs>
        <linearGradient id="rsl-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F6E3A1" />
          <stop offset="45%" stopColor="#D9B24C" />
          <stop offset="100%" stopColor="#A87C1F" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="13.4" fill="#111413" />
      <path
        d="M14 11h12.2c5.6 0 9.3 3.4 9.3 8.6 0 3.9-2.1 6.7-5.5 7.9L36.6 37h-6.9l-5.8-8.9H20.3V37H14V11zm6.3 5.6v6.2h5.5c2 0 3.3-1.2 3.3-3.1s-1.3-3.1-3.3-3.1h-5.5z"
        fill="url(#rsl-gold)"
      />
      <circle cx="39.5" cy="35.2" r="2.6" fill="#FFFFFF" />
    </svg>
  );
}

/**
 * Landing page platform rigspace.id (server component, bilingual ID / EN).
 * `salesPhone` = nomor WA CMO aktif (null -> tombol WhatsApp disembunyikan, form tetap jalan).
 */
export function LandingPage({ salesPhone, locale = "id" }: { salesPhone: string | null; locale?: Locale }) {
  const copy = getLandingContent(locale);
  const waUrl = salesPhone ? salesWhatsappUrl(salesPhone, undefined, locale) : null;
  const year = new Date().getFullYear();

  return (
    <div className="rsl">
      <RevealOnScroll locale={locale} />
      <LandingTracker />
      <NavHoverLine locale={locale} />

      <header className="nav">
        <div className="wrap">
          <a href="#" className="brand" aria-label="Rigspace.id">
            <Mark />
            <span>
              Rigspace.id
              <small>{BRAND_LINE}</small>
            </span>
          </a>
          <nav className="nav-links" aria-label={copy.nav.ariaLabel}>
            {copy.nav.items.map((n) => (
              <a key={n.href} href={n.href} {...track(E.navClick, { target: n.href.slice(1), location: "nav" })}>
                {n.label}
              </a>
            ))}
          </nav>
          <div className="nav-cta">
            <LanguageSwitcher locale={locale} ariaLabel={copy.nav.langAriaLabel} />
            <a href="/admin/login" className="btn btn-ghost" {...track(E.loginClick, { location: "nav" })}>
              {copy.nav.login}
            </a>
            <a href="#minta-demo" className="btn btn-dark" {...track(E.ctaClick, { location: "nav" })}>
              {copy.nav.cta}
            </a>
          </div>
        </div>
      </header>

      <main id="main">
        <section className="rsl-hero" aria-label={copy.hero.ariaLabel}>
          <div className="wrap">
            <HeroPreview
              desktopSrc="/platform/landing/hero-desktop.webp"
              mobileSrc="/platform/landing/hero-mobile.webp"
              locale={locale}
            />
          </div>
        </section>

        <div className="marquee" aria-label={copy.marquee.ariaLabel}>
          <div className="marquee-track">
            {[...copy.marquee.items, ...copy.marquee.items].map((a, i) => (
              <span key={i} aria-hidden={i >= copy.marquee.items.length}>
                {a}
              </span>
            ))}
          </div>
        </div>

        <section className="soft-bg" aria-labelledby="masalah">
          <div className="wrap">
            <div className="head" data-reveal>
              <div className="rsl-eyebrow">{copy.problems.eyebrow}</div>
              <h2 id="masalah">{copy.problems.heading}</h2>
            </div>
            <div className="grid3">
              {copy.problems.items.map((p, i) => (
                <article key={i} className="card" data-reveal style={{ ["--d" as string]: `${i * 90}ms` }}>
                  <div className="num">0{i + 1}</div>
                  <h3>{p.title}</h3>
                  <p>{p.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="fitur" aria-labelledby="fitur-h">
          <div className="wrap">
            <div className="head" data-reveal>
              <div className="rsl-eyebrow">{copy.features.eyebrow}</div>
              <h2 id="fitur-h">{copy.features.heading}</h2>
            </div>
            <div className="bento">
              <article className="b b-big" data-reveal>
                <span className="tag">{copy.features.coreTag}</span>
                <h3>{copy.features.catalogTitle}</h3>
                <p>{copy.features.catalogBody}</p>
                <div className="specs">
                  {copy.features.specs.map((s) => (
                    <div key={s.label} className="spec">
                      {s.label} <b>{s.value}</b>
                    </div>
                  ))}
                </div>
              </article>
              <article className="b b-wide" data-reveal style={{ ["--d" as string]: "80ms" }}>
                <h3>{copy.features.waTitle}</h3>
                <p>{copy.features.waBody}</p>
                <div className="wa-msg">
                  <b>{copy.features.waTimestamp}</b>
                  {copy.features.waPrefix}
                  <strong>{copy.features.waProduct}</strong>
                  {copy.features.waSuffix}
                </div>
              </article>
              <article className="b" data-reveal style={{ ["--d" as string]: "120ms" }}>
                <h3>{copy.features.studioTitle}</h3>
                <p>{copy.features.studioBody}</p>
              </article>
              <article className="b" data-reveal style={{ ["--d" as string]: "160ms" }}>
                <h3>{copy.features.migrateTitle}</h3>
                <p>{copy.features.migrateBody}</p>
              </article>
              <article className="b b-wide" data-reveal style={{ ["--d" as string]: "200ms" }}>
                <span className="tag">{copy.features.proTag}</span> <span className="soon">{copy.soonLabel}</span>
                <h3>{copy.features.pcBuilderTitle}</h3>
                <p>{copy.features.pcBuilderBody}</p>
              </article>
              <article className="b" data-reveal style={{ ["--d" as string]: "240ms" }}>
                <h3>{copy.features.domainTitle}</h3>
                <p>{copy.features.domainBody}</p>
              </article>
            </div>
          </div>
        </section>

        <section id="cara-kerja" className="soft-bg" aria-labelledby="cara-h">
          <div className="wrap">
            <div className="head" data-reveal>
              <div className="rsl-eyebrow">{copy.steps.eyebrow}</div>
              <h2 id="cara-h">{copy.steps.heading}</h2>
            </div>
            <ol className="steps" data-reveal>
              {copy.steps.items.map((s, i) => (
                <li key={i} className="step">
                  <div className="dot">{i + 1}</div>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="contoh" aria-labelledby="contoh-h">
          <div className="wrap">
            <div className="head" data-reveal>
              <div className="rsl-eyebrow">{copy.templates.eyebrow}</div>
              <h2 id="contoh-h">{copy.templates.heading}</h2>
              <p>{copy.templates.lead}</p>
            </div>
            <div className="gallery">
              {copy.templates.items.map((t, i) => (
                <figure key={t.id} className="tpl" data-reveal style={{ ["--d" as string]: `${i * 80}ms`, margin: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.image} alt={`Template ${t.name}`} width={1200} height={750} loading="lazy" />
                  <figcaption>
                    {t.name} <span>{t.note}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
            <p className="more" data-reveal>
              {copy.templates.more}
            </p>
          </div>
        </section>

        <section className="soft-bg" aria-labelledby="laporan-h">
          <div className="wrap insight">
            <div data-reveal>
              <div className="rsl-eyebrow">{copy.report.eyebrow}</div>
              <h2 id="laporan-h">{copy.report.heading}</h2>
              <p>{copy.report.lead}</p>
              <ul className="checks">
                {copy.report.checks.map((c) => (
                  <li key={c.label}>
                    {c.label} {c.soon && <span className="soon">{copy.soonLabel}</span>}
                  </li>
                ))}
              </ul>
            </div>
            <div className="dash" data-reveal style={{ ["--d" as string]: "120ms" }}>
              <div className="dash-top">
                {copy.report.dashTitle} <span>{copy.report.dashPeriod}</span>
              </div>
              <div className="kpis">
                {copy.report.kpis.map((k) => (
                  <div key={k.label} className="kpi">
                    <small>{k.label}</small>
                    <div>{k.value}</div>
                  </div>
                ))}
              </div>
              {copy.report.bars.map(([label, w, n]) => (
                <div key={label} className="barrow">
                  <span>{label}</span>
                  <div className="track">
                    <i style={{ width: `${w}%` }} />
                  </div>
                  <span>{n}</span>
                </div>
              ))}
              <p className="note">{copy.report.note}</p>
            </div>
          </div>
        </section>

        <section id="harga" aria-labelledby="harga-h">
          <div className="wrap">
            <div className="head" data-reveal>
              <div className="rsl-eyebrow">{copy.pricing.eyebrow}</div>
              <h2 id="harga-h">{copy.pricing.heading}</h2>
            </div>
            <div className="plans">
              {copy.pricing.plans.map((p, i) => (
                <article key={p.id} className={`plan${p.highlight ? " plan-pro" : ""}`} data-reveal style={{ ["--d" as string]: `${i * 90}ms` }}>
                  {p.highlight && <span className="plan-badge">{copy.pricing.popularBadge}</span>}
                  <h3>{p.name}</h3>
                  <div className="for">{p.for}</div>
                  <div className="price">
                    {p.price} <small>{p.period}</small>
                  </div>
                  <div className="alt">{p.alt}</div>
                  <ul>
                    {p.features.map((f) => {
                      const [label, flag] = f.split("|");
                      return (
                        <li key={f}>
                          {label}
                          {flag === "segera" && <span className="soon">{copy.soonLabel}</span>}
                        </li>
                      );
                    })}
                  </ul>
                  <a
                    href="#minta-demo"
                    className={`btn ${p.highlight ? "btn-gold" : "btn-ghost"}`}
                    {...track(E.selectPlan, { plan: p.id, location: "pricing" })}
                  >
                    {p.cta}
                  </a>
                </article>
              ))}
            </div>
            <p className="foot-note" data-reveal>
              {copy.pricing.footNote}
            </p>
          </div>
        </section>

        <section id="faq" className="soft-bg" aria-labelledby="faq-h">
          <div className="wrap">
            <div className="head" data-reveal>
              <div className="rsl-eyebrow">{copy.faq.eyebrow}</div>
              <h2 id="faq-h">{copy.faq.heading}</h2>
            </div>
            <div className="faqs">
              {copy.faq.items.map((f, i) => (
                <details key={i} className="faq" data-reveal style={{ ["--d" as string]: `${(i % 2) * 80}ms` }}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section id="minta-demo" className="final" aria-labelledby="demo-h" style={{ scrollMarginTop: 80 }}>
          <div className="wrap" style={{ paddingTop: 72 }}>
            <div className="final-box" data-reveal>
              <div style={{ position: "relative", zIndex: 1 }}>
                <div className="rsl-eyebrow" style={{ color: "var(--gold1)" }}>
                  {copy.final.eyebrow}
                </div>
                <h2 id="demo-h">{copy.final.heading}</h2>
                <p>{copy.final.lead}</p>
                {waUrl && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-wa"
                    {...track(E.generateLead, { method: "whatsapp", location: "final" })}
                  >
                    <MessageCircle size={18} /> {copy.final.waCta}
                  </a>
                )}
              </div>
              <DemoForm waUrl={waUrl} locale={locale} />
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <a href="#" className="brand" style={{ fontSize: 16 }}>
            <Mark size={30} />
            <span>
              Rigspace.id
              <small>{BRAND_LINE}</small>
            </span>
          </a>
          <nav aria-label="Footer">
            <a href="#fitur" {...track(E.navClick, { target: "fitur", location: "footer" })}>
              {copy.footer.features}
            </a>
            <a href="#harga" {...track(E.navClick, { target: "harga", location: "footer" })}>
              {copy.footer.pricing}
            </a>
            <a href="/admin/login" {...track(E.loginClick, { location: "footer" })}>
              {copy.footer.loginCms}
            </a>
            <a href="#minta-demo" {...track(E.ctaClick, { location: "footer" })}>
              {copy.footer.contact}
            </a>
          </nav>
          <div>© {year} Rigspace.id</div>
        </div>
      </footer>
    </div>
  );
}
