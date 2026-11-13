"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import type { Banner } from "@/lib/types";
import { SafeImage } from "./safe-image";

export function HeroSlider({ slides }: { slides: Banner[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const [reduced, setReduced] = useState(true);
  const touch = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (paused || hover || reduced || slides.length < 2) return;
    const timer = window.setInterval(
      () => setActive((index) => (index + 1) % slides.length),
      6000,
    );
    return () => window.clearInterval(timer);
  }, [paused, hover, reduced, slides.length]);
  function go(index: number) {
    setActive((index + slides.length) % slides.length);
    setPaused(true);
  }
  return (
    <section
      className={`hero hero-${slides[active].theme}`}
      aria-label="Kampanye Hadi Computer"
      aria-roledescription="carousel"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocusCapture={(event) => {
        if (event.target.matches(":focus-visible")) setPaused(true);
      }}
      onTouchStart={(e) => {
        touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }}
      onTouchEnd={(e) => {
        if (!touch.current) return;
        const dx = touch.current.x - e.changedTouches[0].clientX,
          dy = touch.current.y - e.changedTouches[0].clientY;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy))
          go(active + (dx > 0 ? 1 : -1));
        touch.current = null;
      }}
    >
      <div className="hero-slides">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`hero-slide ${index === active ? "is-active" : ""}`}
            aria-hidden={index !== active}
            inert={index !== active}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} dari ${slides.length}`}
          >
            <div className="hero-art">
              <SafeImage
                src={slide.image}
                alt={
                  index === 0
                    ? "Promo bundle laptop dan bonus kaos, mouse, keyboard"
                    : index === 1
                      ? "Ilustrasi setup gaming dengan PC dan monitor"
                      : "Ilustrasi laptop untuk aktivitas sehari-hari"
                }
                priority={index === 0}
                sizes="(max-width: 640px) 100vw, 65vw"
              />
            </div>
            {slide.hotspots && slide.hotspots.length > 0 && (
              <div className="hero-hotspots-wrap" aria-hidden="true">
                {slide.hotspots.map((h, hi) => (
                  <div
                    key={hi}
                    className="hero-hotspot"
                    style={{ left: `${h.x}%`, top: `${h.y}%` }}
                  >
                    <span className="hotspot-dot">
                      <span className="hotspot-ping" />
                    </span>
                    <span className="hotspot-label">{h.label}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="hero-copy">
              <span className="eyebrow">
                <span className="little-line" />
                {slide.eyebrow}
              </span>
              <h1>
                {slide.title.split("\n").map((line, i) => (
                  <span
                    className={
                      slide.mobileTitle ? "hero-desktop-copy" : undefined
                    }
                    key={i}
                  >
                    {line}
                  </span>
                ))}
                {slide.mobileTitle?.split("\n").map((line, i) => (
                  <span className="hero-mobile-copy" key={`mobile-${i}`}>
                    {line}
                  </span>
                ))}
              </h1>
              <p
                className={
                  slide.mobileDescription ? "hero-desktop-copy" : undefined
                }
              >
                {slide.description}
              </p>
              {slide.mobileDescription && (
                <p className="hero-mobile-copy">{slide.mobileDescription}</p>
              )}
              <Link
                className={`button ${slide.theme === "dark" ? "white" : "primary"}`}
                href={slide.href}
              >
                {slide.cta}
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        ))}
      </div>
      <div className="hero-controls">
        <div className="slide-progress" aria-label="Pilih banner">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              className={active === i ? "active" : ""}
              aria-label={`Banner ${i + 1}: ${slide.cta}`}
              aria-pressed={active === i}
              onClick={() => go(i)}
            >
              <span />
            </button>
          ))}
          <span className="slide-count">
            0{active + 1} / 0{slides.length}
          </span>
        </div>
        <div className="slide-arrows">
          <button
            className="icon-button"
            aria-label={
              paused || reduced
                ? "Putar banner otomatis"
                : "Jeda banner otomatis"
            }
            onClick={() => setPaused(!paused)}
            disabled={reduced}
          >
            {paused || reduced ? <Play size={14} /> : <Pause size={14} />}
          </button>
          <button
            className="icon-button"
            aria-label="Banner sebelumnya"
            onClick={() => go(active - 1)}
          >
            <ArrowLeft size={18} />
          </button>
          <button
            className="icon-button"
            aria-label="Banner berikutnya"
            onClick={() => go(active + 1)}
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}
