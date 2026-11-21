"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { PriceStack } from "./card";
import { DISPLAY, MONO, type HeroSlide, type SideTile } from "./model";

const HOTSPOT_SPOTS = [
  { x: 4, y: 16 },
  { x: 66, y: 10 },
  { x: 62, y: 80 },
];

function Hotspot({ label, x, y, delay }: { label: string; x: number; y: number; delay: number }) {
  return (
    <span
      className={`${MONO} pc-enter absolute z-[2] hidden max-w-[46%] items-center gap-2 truncate rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] text-white backdrop-blur-md sm:flex`}
      style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${0.35 + delay * 0.12}s` }}
    >
      <i className="pc-pulse h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
      <span className="truncate">{label}</span>
    </span>
  );
}

function SlideText({ slide, phone, storeName, dark }: { slide: HeroSlide; phone: string | null; storeName: string; dark: boolean }) {
  return (
    <div className="pc-rise">
      <span className={`${MONO} inline-flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.14em] ${dark ? "text-white/80" : "text-brand"}`}>
        {dark && <i className="pc-pulse h-1.5 w-1.5 rounded-full bg-brand" />}
        {slide.eyebrow}
      </span>
      <h1 className={`${DISPLAY} mb-3 mt-3 line-clamp-3 text-[30px] font-extrabold leading-[1.04] md:text-[42px] ${dark ? "text-white" : "text-[#0b0d0c]"}`}>
        {slide.title}
      </h1>
      {slide.description ? (
        <p className={`m-0 max-w-[430px] text-[14.5px] leading-relaxed ${dark ? "text-[#b9bbb7]" : "text-[#6b6f6c]"}`}>{slide.description}</p>
      ) : (
        <span />
      )}
      {slide.price !== null ? (
        <div className="mt-5">
          <PriceStack price={slide.price} originalPrice={slide.originalPrice} size="lg" tone={dark ? "dark" : "light"} />
        </div>
      ) : (
        <span />
      )}
      <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-5">
        <Link
          href={slide.href}
          className="group inline-flex items-center gap-2 whitespace-nowrap rounded bg-brand px-5 py-3 text-[13px] font-semibold text-brand-ink no-underline shadow-[0_10px_24px_-10px_var(--red)] transition-transform hover:-translate-y-0.5"
        >
          {slide.cta} <ArrowUpRight size={15} className="pc-arrow" />
        </Link>
        {phone && (
          <WhatsAppButton
            phone={phone}
            label="Tanya stok via WhatsApp →"
            message={`Halo ${storeName}, saya tertarik dengan ${slide.title}. Apakah masih tersedia?\n\n{origin}${slide.href}`}
            className={`!whitespace-nowrap !border-0 !bg-transparent !p-0 !text-[13px] !font-semibold !shadow-none ${dark ? "!text-white" : "!text-[#0b0d0c]"}`}
          />
        )}
      </div>
    </div>
  );
}

/** Panggung gelap untuk Studio Banner: cahaya warna brand, grid halus, garis cahaya & bayangan lantai. */
function StudioStage() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_45%,#1c1f1d_0%,#0b0d0c_60%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_at_70%_50%,black_10%,transparent_70%)]" />
      <div className="pc-glow absolute right-[6%] top-1/2 aspect-square w-[58%] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--red)_48%,transparent)_0%,transparent_62%)] blur-2xl" />
      <svg className="absolute inset-0 h-full w-full opacity-60" preserveAspectRatio="none" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="pc-streak" x1="0" x2="1">
            <stop offset="0" stopColor="var(--red)" stopOpacity="0" />
            <stop offset="0.6" stopColor="var(--red)" stopOpacity="0.55" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M38 100 L100 18" stroke="url(#pc-streak)" strokeWidth="0.25" />
        <path d="M52 100 L100 40" stroke="url(#pc-streak)" strokeWidth="0.15" />
      </svg>
      <div className="absolute inset-x-0 bottom-0 h-[45%] bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.45))]" />
    </div>
  );
}

function Slide({ slide, phone, storeName }: { slide: HeroSlide; phone: string | null; storeName: string }) {
  if (slide.style === "studio") {
    return (
      <div className="relative grid h-full grid-cols-1 md:min-h-[452px] md:grid-cols-[1fr_1.1fr]">
        <StudioStage />
        <div className="relative z-[1] order-2 flex flex-col justify-center px-5 pb-6 pt-2 md:order-1 md:py-12 md:pl-10 md:pr-0">
          <SlideText slide={slide} phone={phone} storeName={storeName} dark />
        </div>
        <div className="relative z-[1] order-1 flex min-h-[250px] items-center justify-center px-6 pt-8 md:order-2 md:min-h-0 md:p-8">
          <div className="pc-enter relative w-full max-w-[460px]">
            <div className="pc-float">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slide.image}
                alt={slide.title}
                className="mx-auto max-h-[230px] w-full object-contain drop-shadow-[0_34px_38px_rgba(0,0,0,0.65)] md:max-h-[330px]"
              />
            </div>
            <div aria-hidden className="mx-auto -mt-3 h-5 w-[62%] rounded-[50%] bg-black/70 blur-xl" />
          </div>
          {slide.specs.slice(0, 3).map((label, i) => (
            <Hotspot key={label} label={label} {...HOTSPOT_SPOTS[i]} delay={i} />
          ))}
        </div>
      </div>
    );
  }

  if (slide.style === "photo") {
    return (
      <div className="relative h-full md:min-h-[452px]">
        <div className="relative aspect-[16/10] overflow-hidden md:absolute md:inset-0 md:aspect-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={slide.image} alt={slide.title} className="pc-kenburns absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(11,13,12,0.9))] md:bg-[linear-gradient(90deg,rgba(11,13,12,0.94)_0%,rgba(11,13,12,0.72)_38%,rgba(11,13,12,0)_72%)]" />
          {slide.hotspots.map((h, i) => (
            <Hotspot key={h.label} label={h.label} x={h.x} y={h.y} delay={i} />
          ))}
        </div>
        <div className="relative z-[1] bg-[#0b0d0c] px-5 pb-6 pt-4 md:flex md:min-h-[452px] md:max-w-[56%] md:flex-col md:justify-center md:bg-transparent md:py-12 md:pl-10">
          <SlideText slide={slide} phone={phone} storeName={storeName} dark />
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-full grid-cols-1 md:min-h-[452px] md:grid-cols-[1.05fr_1fr]">
      <div className="order-2 flex flex-col justify-center px-5 pb-4 pt-5 md:order-1 md:py-10 md:pl-10 md:pr-0">
        <SlideText slide={slide} phone={phone} storeName={storeName} dark={false} />
      </div>
      <div className="relative order-1 flex items-center justify-center px-6 pt-6 md:order-2 md:p-7">
        <div aria-hidden className="absolute aspect-square w-[78%] rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--red)_16%,transparent),transparent_68%)]" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={slide.image} alt={slide.title} className="pc-enter relative max-h-[260px] w-full max-w-[400px] object-contain mix-blend-multiply md:max-h-[340px]" />
        {slide.specs.length > 0 && (
          <span className={`${MONO} absolute right-4 top-4 max-w-[70%] truncate rounded-[3px] bg-[#0b0d0c] px-2.5 py-1.5 text-[10.5px] text-[#f6e3a1] md:right-7 md:top-7`}>
            {slide.specs.join(" · ")}
          </span>
        )}
      </div>
    </div>
  );
}

function Tile({ tile }: { tile: SideTile }) {
  const dark = tile.variant === "dark";
  const studio = tile.style === "studio";
  return (
    <Link
      href={tile.href}
      className={`pc-shine group grid grid-cols-[1fr_108px] items-center gap-3 rounded-md border p-4 no-underline transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-20px_rgba(11,13,12,0.45)] sm:grid-cols-[1fr_132px] sm:p-5 ${
        dark ? "border-[#0b0d0c] bg-[#0b0d0c] text-white" : "border-[#e6e6e3] bg-white text-[#0b0d0c]"
      }`}
    >
      <div className="min-w-0">
        <span className={`${MONO} text-[11px] font-semibold uppercase tracking-[0.12em] ${dark ? "text-[#f6e3a1]" : "text-brand"}`}>
          {tile.eyebrow}
        </span>
        <h3 className={`${DISPLAY} mb-1.5 mt-2 line-clamp-2 text-[18px] font-bold leading-tight sm:text-[20px]`}>{tile.title}</h3>
        {tile.meta && <span className={`${MONO} block truncate text-[12px] ${dark ? "text-[#b9bbb7]" : "text-[#6b6f6c]"}`}>{tile.meta}</span>}
        {tile.price !== null && (
          <div className="mt-2.5">
            <PriceStack price={tile.price} originalPrice={tile.originalPrice} size="sm" tone={dark ? "dark" : "light"} />
          </div>
        )}
        <span className={`mt-2 inline-flex items-center gap-1 text-[12px] font-semibold ${dark ? "text-white" : "text-[#0b0d0c]"}`}>
          Lihat <ArrowUpRight size={13} className="pc-arrow" />
        </span>
      </div>
      {studio ? (
        <div className="relative flex aspect-square items-center justify-center">
          <div aria-hidden className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--red)_45%,transparent)_0%,transparent_68%)] blur-md" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={tile.image} alt="" loading="lazy" className="pc-zoom relative max-h-full max-w-full object-contain drop-shadow-[0_14px_16px_rgba(0,0,0,0.6)]" />
        </div>
      ) : (
        <div className="flex aspect-square items-center justify-center overflow-hidden rounded bg-white p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={tile.image} alt="" loading="lazy" className="pc-zoom max-h-full max-w-full object-contain" />
        </div>
      )}
    </Link>
  );
}

/** Hero bento: banner utama (slide) + 2 tile samping. */
export function PrecisionHero({
  slides,
  tiles,
  phone,
  storeName,
}: {
  slides: HeroSlide[];
  tiles: SideTile[];
  phone: string | null;
  storeName: string;
}) {
  const [active, setActive] = React.useState(0);
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => {
    if (slides.length < 2 || paused) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setActive((i) => (i + 1) % slides.length), 6500);
    return () => window.clearInterval(t);
  }, [slides.length, paused]);

  if (slides.length === 0 && tiles.length === 0) return null;
  const go = (i: number) => setActive((i + slides.length) % slides.length);
  const current = slides[Math.min(active, slides.length - 1)];
  const dark = current ? current.style !== "product" : false;

  return (
    <div className={`grid grid-cols-1 gap-4 ${tiles.length ? "lg:grid-cols-[2fr_1fr]" : ""}`}>
      {slides.length > 0 && (
        <div
          className={`relative overflow-hidden rounded-md border transition-colors duration-500 md:min-h-[452px] ${paused ? "pc-paused" : ""} ${
            dark ? "border-[#0b0d0c] bg-[#0b0d0c]" : "border-[#e6e6e3] bg-[linear-gradient(120deg,#f6f6f4_0%,#ffffff_60%)]"
          }`}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          aria-roledescription="carousel"
        >
          <Slide key={current.id} slide={current} phone={phone} storeName={storeName} />
          {slides.length > 1 && (
            <div
              className={`${MONO} relative z-[3] flex items-center gap-4 px-5 pb-5 text-[12px] md:absolute md:bottom-5 md:left-10 md:right-7 md:p-0 ${
                dark ? "bg-[#0b0d0c] text-[#b9bbb7] md:bg-transparent" : "text-[#6b6f6c]"
              }`}
            >
              <span>
                {String(active + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
              </span>
              <span className="flex flex-1 gap-1.5">
                {slides.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    aria-label={`Slide ${i + 1}`}
                    aria-current={i === active}
                    onClick={() => go(i)}
                    className={`relative h-[2px] w-10 overflow-hidden border-0 p-0 ${dark ? "bg-white/20" : "bg-[#d9d9d5]"}`}
                  >
                    {i === active && <span key={active} className={`pc-progress absolute inset-0 ${dark ? "bg-white" : "bg-[#0b0d0c]"}`} />}
                    {i < active && <span className={`absolute inset-0 ${dark ? "bg-white/60" : "bg-[#0b0d0c]/50"}`} />}
                  </button>
                ))}
              </span>
              <button type="button" aria-label="Sebelumnya" onClick={() => go(active - 1)} className={`border-0 bg-transparent p-1 transition-transform hover:-translate-x-0.5 ${dark ? "text-white" : "text-[#0b0d0c]"}`}>
                <ChevronLeft size={16} />
              </button>
              <button type="button" aria-label="Berikutnya" onClick={() => go(active + 1)} className={`border-0 bg-transparent p-1 transition-transform hover:translate-x-0.5 ${dark ? "text-white" : "text-[#0b0d0c]"}`}>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
      {tiles.length > 0 && (
        <div className="grid gap-4 lg:grid-rows-2">
          {tiles.map((t) => (
            <Tile key={t.id} tile={t} />
          ))}
        </div>
      )}
    </div>
  );
}
