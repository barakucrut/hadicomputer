"use client";

import * as React from "react";
import { LayoutGrid, List } from "lucide-react";
import type { Product } from "@/lib/types";
import { SectionHead, SpecCard } from "./card";
import { MONO } from "./model";

/** Grid produk dengan toggle Grid / List. */
export function ProductShowcase({
  index,
  eyebrow,
  title,
  products,
}: {
  index: string;
  eyebrow: string;
  title: string;
  products: Product[];
}) {
  const [layout, setLayout] = React.useState<"grid" | "list">("grid");
  if (products.length === 0) return null;
  return (
    <div>
      <SectionHead
        index={index}
        eyebrow={eyebrow}
        title={title}
        action={
          <div className="flex overflow-hidden rounded border border-[#e6e6e3] text-[12px]" role="group" aria-label="Tampilan produk">
            {(["grid", "list"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLayout(l)}
                aria-pressed={layout === l}
                className={`flex items-center gap-1.5 border-0 px-3.5 py-2 ${layout === l ? "bg-[#0b0d0c] text-white" : "bg-white text-[#0b0d0c]"}`}
              >
                {l === "grid" ? <LayoutGrid size={13} /> : <List size={13} />}
                {l === "grid" ? "Grid" : "List"}
              </button>
            ))}
          </div>
        }
      />
      {layout === "grid" ? (
        <div className="grid grid-cols-2 border-l border-t border-[#e6e6e3] lg:grid-cols-4">
          {products.map((p) => (
            <SpecCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="border-t border-[#0b0d0c]">
          {products.map((p) => (
            <SpecCard key={p.id} product={p} layout="list" />
          ))}
        </div>
      )}
    </div>
  );
}

/** "Dipakai untuk apa?" — segmented control yang memfilter produk per kebutuhan. */
export function NeedsShowcase({
  index,
  needs,
  products,
}: {
  index: string;
  needs: Array<{ slug: string; name: string }>;
  products: Product[];
}) {
  const withProducts = needs.filter((n) => products.some((p) => p.needs.includes(n.slug)));
  const [active, setActive] = React.useState(withProducts[0]?.slug || "");
  if (withProducts.length === 0) return null;
  const items = products.filter((p) => p.needs.includes(active)).slice(0, 8);
  return (
    <div>
      <SectionHead index={index} eyebrow="SESUAI KEBUTUHAN" title="Dipakai untuk apa?" />
      <div className="mb-5 flex max-w-full overflow-x-auto rounded border border-[#0b0d0c]" role="tablist">
        {withProducts.map((n, i) => (
          <button
            key={n.slug}
            type="button"
            role="tab"
            aria-selected={active === n.slug}
            onClick={() => setActive(n.slug)}
            className={`shrink-0 whitespace-nowrap border-0 px-4 py-2.5 text-[13px] font-semibold sm:px-5 ${i > 0 ? "border-l border-[#0b0d0c]" : ""} ${
              active === n.slug ? "bg-[#0b0d0c] text-white" : "bg-white text-[#0b0d0c]"
            }`}
            style={i > 0 ? { borderLeft: "1px solid #0b0d0c" } : undefined}
          >
            {n.name}
          </button>
        ))}
      </div>
      {items.length > 0 ? (
        <div className="grid grid-cols-2 border-l border-t border-[#e6e6e3] lg:grid-cols-4">
          {items.map((p) => (
            <SpecCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <p className={`${MONO} text-[13px] text-[#6b6f6c]`}>Belum ada produk untuk kebutuhan ini.</p>
      )}
    </div>
  );
}

/**
 * Animasi muncul saat scroll untuk elemen [data-reveal].
 * Konten tetap terlihat tanpa JS: kelas penyembunyi baru dipasang setelah komponen aktif.
 */
export function PrecisionReveal() {
  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const body = document.body;
    const items = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    // Yang sudah terlihat di layar langsung tampil (tanpa kedip)
    items.forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) el.classList.add("is-visible");
    });
    body.classList.add("pc-reveal-ready");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    items.forEach((el) => !el.classList.contains("is-visible") && io.observe(el));
    return () => {
      io.disconnect();
      body.classList.remove("pc-reveal-ready");
    };
  }, []);
  return null;
}

/** Angka statistik menghitung naik saat pertama terlihat ("250+", "44", "Sejak 2009" tetap utuh). */
export function CountUp({ value }: { value: string }) {
  const match = /^(\d+)(.*)$/.exec(value);
  const target = match ? Number(match[1]) : 0;
  const ref = React.useRef<HTMLSpanElement>(null);
  const [shown, setShown] = React.useState(value);

  React.useEffect(() => {
    if (!match || target < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    let raf = 0;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (t: number) => {
        const k = Math.min(1, Math.max(0, (t - start) / 1100));
        const eased = 1 - Math.pow(1 - k, 3);
        setShown(`${Math.round(target * eased)}${match[2]}`);
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span ref={ref}>{shown}</span>;
}
