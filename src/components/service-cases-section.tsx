import { Clock, Images } from "lucide-react";
import { SectionHeading } from "@/components/ui";
import type { ServiceCaseItem } from "@/lib/types";

const DATE_FMT = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" });

/**
 * Portofolio servis di halaman detail layanan (semua template).
 * Tidak dirender bila belum ada portofolio yang tertaut ke layanan ini.
 */
export function ServiceCasesSection({ cases, storeName }: { cases: ServiceCaseItem[]; storeName: string }) {
  if (cases.length === 0) return null;
  return (
    <section className="section service-cases" aria-label="Portofolio servis">
      <SectionHeading
        eyebrow="PORTOFOLIO SERVIS"
        title="Hasil kerja yang sudah selesai."
        description={`Contoh perangkat pelanggan yang sudah ditangani ${storeName}.`}
      />
      <ul className="service-case-grid">
        {cases.map((c) => (
          <li key={c.id} className="service-case-card">
            <div className="service-case-media">
              {c.images[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.images[0]} alt={c.title} loading="lazy" decoding="async" />
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
              {(c.device || c.completedAt) && (
                <span className="service-case-meta">
                  {[c.device, c.completedAt && DATE_FMT.format(new Date(c.completedAt))].filter(Boolean).join(" · ")}
                </span>
              )}
              <h3>{c.title}</h3>
              <p>{c.summary}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
