import { MessageCircle } from "lucide-react";
import { salesWhatsappUrl } from "@/lib/demo-request";
import { AUDIENCE, BRAND_LINE, FAQS, PLANS, PROBLEMS, STEPS, TEMPLATES } from "./content";
import { DemoForm, HeroPreview, LandingTracker, NavHoverLine, RevealOnScroll } from "./client";
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

const NAV = [
  { href: "#fitur", label: "Fitur" },
  { href: "#cara-kerja", label: "Cara Kerja" },
  { href: "#contoh", label: "Contoh" },
  { href: "#harga", label: "Harga" },
  { href: "#faq", label: "FAQ" },
];

/**
 * Landing page platform rigspace.id (server component).
 * `salesPhone` = nomor WA CMO aktif (null -> tombol WhatsApp disembunyikan, form tetap jalan).
 */
export function LandingPage({ salesPhone }: { salesPhone: string | null }) {
  const waUrl = salesPhone ? salesWhatsappUrl(salesPhone) : null;
  const year = new Date().getFullYear();

  return (
    <div className="rsl">
      <RevealOnScroll />
      <LandingTracker />
      <NavHoverLine />

      <header className="nav">
        <div className="wrap">
          <a href="#" className="brand" aria-label="Rigspace.id">
            <Mark />
            <span>
              Rigspace.id
              <small>{BRAND_LINE}</small>
            </span>
          </a>
          <nav className="nav-links" aria-label="Navigasi">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} {...track(E.navClick, { target: n.href.slice(1), location: "nav" })}>
                {n.label}
              </a>
            ))}
          </nav>
          <div className="nav-cta">
            <a href="/admin/login" className="btn btn-ghost" {...track(E.loginClick, { location: "nav" })}>
              Masuk
            </a>
            <a href="#minta-demo" className="btn btn-dark" {...track(E.ctaClick, { location: "nav" })}>
              Minta Demo
            </a>
          </div>
        </div>
      </header>

      <main id="main">
        <section className="rsl-hero" aria-label="Pengantar">
          <div className="wrap">
            <HeroPreview desktopSrc="/platform/landing/hero-desktop.webp" mobileSrc="/platform/landing/hero-mobile.webp" />
          </div>
        </section>

        <div className="marquee" aria-label="Dibuat untuk">
          <div className="marquee-track">
            {[...AUDIENCE, ...AUDIENCE].map((a, i) => (
              <span key={i} aria-hidden={i >= AUDIENCE.length}>
                {a}
              </span>
            ))}
          </div>
        </div>

        <section className="soft-bg" aria-labelledby="masalah">
          <div className="wrap">
            <div className="head" data-reveal>
              <div className="rsl-eyebrow">Masalahnya</div>
              <h2 id="masalah">Jualan online seharusnya tidak semahal ini.</h2>
            </div>
            <div className="grid3">
              {PROBLEMS.map((p, i) => (
                <article key={p.title} className="card" data-reveal style={{ ["--d" as string]: `${i * 90}ms` }}>
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
              <div className="rsl-eyebrow">Fitur</div>
              <h2 id="fitur-h">Semua yang dibutuhkan toko komputer. Tidak lebih, tidak kurang.</h2>
            </div>
            <div className="bento">
              <article className="b b-big" data-reveal>
                <span className="tag">INTI</span>
                <h3>Katalog dengan spesifikasi</h3>
                <p>Filter prosesor, RAM, VGA, baru atau bekas. Pembeli langsung paham, tidak perlu tanya satu per satu.</p>
                <div className="specs">
                  <div className="spec">
                    Prosesor <b>Intel Core i7 · Ryzen 7</b>
                  </div>
                  <div className="spec">
                    RAM <b>16 GB</b>
                  </div>
                  <div className="spec">
                    VGA <b>RTX 4060</b>
                  </div>
                  <div className="spec">
                    Kondisi <b>Baru · Bekas</b>
                  </div>
                </div>
              </article>
              <article className="b b-wide" data-reveal style={{ ["--d" as string]: "80ms" }}>
                <h3>Tombol WhatsApp di setiap produk</h3>
                <p>Pertanyaan masuk lengkap dengan nama produk dan harga — dan tercatat di laporan Anda.</p>
                <div className="wa-msg">
                  <b>WhatsApp · baru saja</b>
                  Halo, saya mau tanya stok <strong>Asus Zenbook Pro Dual Screen</strong> masih ada?
                </div>
              </article>
              <article className="b" data-reveal style={{ ["--d" as string]: "120ms" }}>
                <h3>Studio Banner</h3>
                <p>Foto produk diubah jadi banner promo yang rapi, tanpa desainer.</p>
              </article>
              <article className="b" data-reveal style={{ ["--d" as string]: "160ms" }}>
                <h3>Pindah tanpa ketik ulang</h3>
                <p>Katalog diimpor dari Excel atau website lama Anda.</p>
              </article>
              <article className="b b-wide" data-reveal style={{ ["--d" as string]: "200ms" }}>
                <span className="tag">PRO</span> <span className="soon">SEGERA</span>
                <h3>PC Builder & Trade-In</h3>
                <p>Pembeli merakit PC sendiri atau menaksir tukar tambah laptop lamanya — fitur yang tidak dimiliki website biasa.</p>
              </article>
              <article className="b" data-reveal style={{ ["--d" as string]: "240ms" }}>
                <h3>Domain sendiri & muncul di Google</h3>
                <p>SEO lokal per toko, tampil saat orang mencari toko komputer di kotanya.</p>
              </article>
            </div>
          </div>
        </section>

        <section id="cara-kerja" className="soft-bg" aria-labelledby="cara-h">
          <div className="wrap">
            <div className="head" data-reveal>
              <div className="rsl-eyebrow">Cara kerja</div>
              <h2 id="cara-h">Lihat dulu, baru putuskan.</h2>
            </div>
            <ol className="steps" data-reveal>
              {STEPS.map((s, i) => (
                <li key={s.title} className="step">
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
              <div className="rsl-eyebrow">Contoh website</div>
              <h2 id="contoh-h">Satu toko, banyak gaya.</h2>
              <p>Contoh tampilan untuk toko fiktif &quot;Rig Computer&quot;. Warna, logo, dan font mengikuti brand toko Anda.</p>
            </div>
            <div className="gallery">
              {TEMPLATES.map((t, i) => (
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
              Pilihan template & font terus bertambah.
            </p>
          </div>
        </section>

        <section className="soft-bg" aria-labelledby="laporan-h">
          <div className="wrap insight">
            <div data-reveal>
              <div className="rsl-eyebrow">Laporan</div>
              <h2 id="laporan-h">Tahu produk mana yang paling ditanyakan.</h2>
              <p>Bukan sekadar jumlah pengunjung — Anda melihat pertanyaan yang benar-benar masuk, produk apa, dan dari halaman mana.</p>
              <ul className="checks">
                <li>Klik WhatsApp per produk</li>
                <li>Produk paling banyak ditanyakan</li>
                <li>
                  Stok habis yang masih banyak ditanya <span className="soon">SEGERA</span>
                </li>
              </ul>
            </div>
            <div className="dash" data-reveal style={{ ["--d" as string]: "120ms" }}>
              <div className="dash-top">
                Inquiry WhatsApp <span>30 hari terakhir</span>
              </div>
              <div className="kpis">
                <div className="kpi">
                  <small>Chat masuk</small>
                  <div>128</div>
                </div>
                <div className="kpi">
                  <small>Produk ditanya</small>
                  <div>46</div>
                </div>
                <div className="kpi">
                  <small>Dari Google</small>
                  <div>38%</div>
                </div>
              </div>
              {[
                ["Asus Zenbook Pro Dual", 92, 24],
                ["MSI Pro DP21 14M", 70, 18],
                ["Rakit PC Gaming 12jt", 55, 14],
                ["Printer Epson L3250", 38, 10],
              ].map(([label, w, n]) => (
                <div key={label as string} className="barrow">
                  <span>{label}</span>
                  <div className="track">
                    <i style={{ width: `${w}%` }} />
                  </div>
                  <span>{n}</span>
                </div>
              ))}
              <p className="note">Ilustrasi tampilan laporan, bukan data toko sungguhan.</p>
            </div>
          </div>
        </section>

        <section id="harga" aria-labelledby="harga-h">
          <div className="wrap">
            <div className="head" data-reveal>
              <div className="rsl-eyebrow">Harga</div>
              <h2 id="harga-h">Harga jelas, tanpa potongan per transaksi.</h2>
            </div>
            <div className="plans">
              {PLANS.map((p, i) => (
                <article key={p.id} className={`plan${p.highlight ? " plan-pro" : ""}`} data-reveal style={{ ["--d" as string]: `${i * 90}ms` }}>
                  {p.highlight && <span className="plan-badge">Paling dipilih</span>}
                  <h3>{p.name}</h3>
                  <div className="for">{p.for}</div>
                  <div className="price">
                    {p.price} <small>/ tahun</small>
                  </div>
                  <div className="alt">{p.alt}</div>
                  <ul>
                    {p.features.map((f) => {
                      const [label, flag] = f.split("|");
                      return (
                        <li key={f}>
                          {label}
                          {flag === "segera" && <span className="soon">SEGERA</span>}
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
              Semua paket diawali demo gratis dengan produk toko Anda sendiri.
            </p>
          </div>
        </section>

        <section id="faq" className="soft-bg" aria-labelledby="faq-h">
          <div className="wrap">
            <div className="head" data-reveal>
              <div className="rsl-eyebrow">FAQ</div>
              <h2 id="faq-h">Pertanyaan yang sering muncul.</h2>
            </div>
            <div className="faqs">
              {FAQS.map((f, i) => (
                <details key={f.q} className="faq" data-reveal style={{ ["--d" as string]: `${(i % 2) * 80}ms` }}>
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
                  Mulai sekarang
                </div>
                <h2 id="demo-h">Website toko Anda bisa jadi minggu ini.</h2>
                <p>Kirim nama toko Anda. Tim kami siapkan demonya dengan produk Anda sendiri, gratis dan tanpa komitmen.</p>
                {waUrl && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-wa"
                    {...track(E.generateLead, { method: "whatsapp", location: "final" })}
                  >
                    <MessageCircle size={18} /> Chat Tim Sales di WhatsApp
                  </a>
                )}
              </div>
              <DemoForm waUrl={waUrl} />
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
              Fitur
            </a>
            <a href="#harga" {...track(E.navClick, { target: "harga", location: "footer" })}>
              Harga
            </a>
            <a href="/admin/login" {...track(E.loginClick, { location: "footer" })}>
              Masuk CMS
            </a>
            <a href="#minta-demo" {...track(E.ctaClick, { location: "footer" })}>
              Kontak
            </a>
          </nav>
          <div>© {year} Rigspace.id</div>
        </div>
      </footer>
    </div>
  );
}
