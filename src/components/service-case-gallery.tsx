"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Images, X } from "lucide-react";
import type { ServiceCaseItem } from "@/lib/types";
import { WhatsAppButton } from "./whatsapp-button";

const DATE_FMT = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" });

function caseMeta(c: ServiceCaseItem): string {
  return [c.device, c.completedAt && DATE_FMT.format(new Date(c.completedAt))].filter(Boolean).join(" · ");
}

/** Kartu portofolio + popup detail (galeri foto, cerita lengkap, tombol WhatsApp). */
export function ServiceCaseGallery({
  cases,
  phone,
  storeName,
}: {
  cases: ServiceCaseItem[];
  phone: string | null;
  storeName: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState<ServiceCaseItem | null>(null);
  const [photo, setPhoto] = useState(0);
  // Isi popup tidak dikosongkan saat ditutup: event "close" datang belakangan dan bisa
  // menimpa kartu yang baru dibuka (popup jadi kosong). Cukup tandai terbuka/tertutup.
  const [isOpen, setIsOpen] = useState(false);

  const open = (c: ServiceCaseItem) => {
    setActive(c);
    setPhoto(0);
    setIsOpen(true);
    if (!dialog.current?.open) dialog.current?.showModal();
  };
  const close = () => dialog.current?.close();

  const count = active?.images.length ?? 0;
  const step = useCallback((delta: number) => setPhoto((p) => (count ? (p + delta + count) % count : 0)), [count]);

  // Panah kiri/kanan untuk berpindah foto saat popup terbuka
  useEffect(() => {
    if (!isOpen || count < 2) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, count, step]);

  return (
    <>
      <ul className="service-case-grid">
        {cases.map((c) => (
          <li key={c.id}>
            <button type="button" className="service-case-card" onClick={() => open(c)} aria-haspopup="dialog">
              <div className="service-case-media">
                {c.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.images[0]} alt="" loading="lazy" decoding="async" />
                )}
                {c.durationText && (
                  <span className="service-case-badge">
                    <Clock size={12} aria-hidden />
                    Selesai {c.durationText}
                  </span>
                )}
                {c.images.length > 1 && (
                  <span className="service-case-count">
                    <Images size={12} aria-hidden />
                    {c.images.length} foto
                  </span>
                )}
              </div>
              <div className="service-case-body">
                {caseMeta(c) && <span className="service-case-meta">{caseMeta(c)}</span>}
                <h3>{c.title}</h3>
                <p>{c.summary}</p>
                <span className="service-case-more">Lihat detail</span>
              </div>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        className="service-case-dialog"
        aria-label={active ? `Detail portofolio: ${active.title}` : "Detail portofolio"}
        onClose={() => setIsOpen(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        {active && (
          <div className="service-case-dialog-inner">
            <button type="button" className="service-case-close" onClick={close} aria-label="Tutup">
              <X size={18} />
            </button>
            <div className="service-case-visual">
            <div className="service-case-viewer">
              {count > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={active.images[photo]} src={active.images[photo]} alt={`${active.title} — foto ${photo + 1}`} />
              ) : (
                <Images size={40} aria-hidden />
              )}
              {count > 1 && (
                <>
                  <button type="button" className="service-case-nav prev" onClick={() => step(-1)} aria-label="Foto sebelumnya">
                    <ChevronLeft size={20} />
                  </button>
                  <button type="button" className="service-case-nav next" onClick={() => step(1)} aria-label="Foto berikutnya">
                    <ChevronRight size={20} />
                  </button>
                  <span className="service-case-counter">
                    {photo + 1} / {count}
                  </span>
                </>
              )}
            </div>
            {count > 1 && (
              <div className="service-case-thumbs">
                {active.images.map((src, i) => (
                  <button
                    key={src + i}
                    type="button"
                    className={i === photo ? "is-active" : ""}
                    onClick={() => setPhoto(i)}
                    aria-label={`Lihat foto ${i + 1}`}
                    aria-current={i === photo ? "true" : undefined}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
            </div>
            <div className="service-case-info">
              <div className="service-case-tags">
                {active.serviceName && <span>{active.serviceName}</span>}
                {active.durationText && (
                  <span>
                    <Clock size={12} aria-hidden /> Selesai {active.durationText}
                  </span>
                )}
              </div>
              {caseMeta(active) && <span className="service-case-meta">{caseMeta(active)}</span>}
              <h3>{active.title}</h3>
              <p>{active.summary}</p>
              <div className="service-case-cta">
              <WhatsAppButton
                phone={phone}
                label="Tanya servis serupa"
                message={`Halo ${storeName}, saya lihat portofolio "${active.title}". Perangkat saya juga butuh penanganan serupa.\n\nKendala saya: `}
                trackingData={{ inquiryType: "SERVICE" }}
              />
              </div>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
