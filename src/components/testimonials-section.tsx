import { ArrowUpRight, Quote, Star } from "lucide-react";
import { Container, SectionHeading } from "@/components/ui";
import { testimonialInitials, TESTIMONIAL_SOURCE_LABELS } from "@/lib/testimonials";
import type { Testimonial } from "@/lib/types";

/** Baris kecil di bawah nama: keterangan + penanda "Ulasan Google". */
export function testimonialMeta(t: Pick<Testimonial, "descriptor" | "source">): string {
  return [t.descriptor, t.source === "GOOGLE" ? TESTIMONIAL_SOURCE_LABELS.GOOGLE : null].filter(Boolean).join(" · ");
}

/** Bintang rating 1–5 (warna amber tetap, agar terbaca di semua template). */
export function TestimonialStars({ value, size = 15, className = "" }: { value: number; size?: number; className?: string }) {
  return (
    <div className={`inline-flex gap-0.5 ${className}`.trim()} role="img" aria-label={`Rating ${value} dari 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          strokeWidth={1.8}
          color={n <= value ? "#f59e0b" : "#c9ccc4"}
          fill={n <= value ? "#f59e0b" : "none"}
          aria-hidden
        />
      ))}
    </div>
  );
}

/** Foto pelanggan, atau inisial nama bila tanpa foto. Ukuran & warna diatur lewat className. */
export function TestimonialAvatar({ name, photoUrl, className }: { name: string; photoUrl: string | null; className: string }) {
  return (
    <div className={className} aria-hidden>
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt="" width={40} height={40} loading="lazy" decoding="async" />
      ) : (
        testimonialInitials(name)
      )}
    </div>
  );
}

/** Kartu testimoni gaya Classic (dipakai template Classic & halaman /testimoni). */
export function TestimonialCard({ testimonial: t }: { testimonial: Testimonial }) {
  return (
    <li className="testimonial-card">
      <div className="testimonial-card-top">
        {t.rating ? <TestimonialStars value={t.rating} /> : <Quote size={22} className="testimonial-quote-icon" aria-hidden />}
        {t.label && <span className="testimonial-label">{t.label}</span>}
      </div>
      <blockquote className="testimonial-quote">
        <p>&ldquo;{t.quote}&rdquo;</p>
      </blockquote>
      <div className="testimonial-person">
        <TestimonialAvatar name={t.name} photoUrl={t.photoUrl} className="testimonial-avatar" />
        <div className="testimonial-person-text">
          <strong>{t.name}</strong>
          <span>{testimonialMeta(t)}</span>
        </div>
      </div>
    </li>
  );
}

export function GoogleReviewsButton({ url, className = "testimonial-more" }: { url?: string | null; className?: string }) {
  if (!url) return null;
  return (
    <div className={className}>
      <a className="button white" href={url} target="_blank" rel="noopener noreferrer">
        Lihat semua ulasan di Google
        <ArrowUpRight size={16} />
      </a>
    </div>
  );
}

/**
 * Section testimoni gaya Classic. Tidak dirender sama sekali bila belum ada
 * testimoni aktif (tanpa data contoh).
 */
export function TestimonialsSection({
  testimonials,
  googleReviewUrl,
  storeName,
}: {
  testimonials: Testimonial[];
  googleReviewUrl?: string | null;
  storeName: string;
}) {
  if (testimonials.length === 0) return null;

  return (
    <section className="section testimonials-section" aria-label="Testimoni pelanggan">
      <Container>
        <SectionHeading
          eyebrow="KATA MEREKA"
          title={`Sudah dibuktikan pelanggan ${storeName}.`}
          description={`Pengalaman pelanggan yang belanja, servis, dan rakit PC di ${storeName}.`}
          href="/testimoni"
          linkText="Semua testimoni"
        />
        <ul className="testimonial-track">
          {testimonials.map((t) => (
            <TestimonialCard key={t.id} testimonial={t} />
          ))}
        </ul>
        <GoogleReviewsButton url={googleReviewUrl} />
      </Container>
    </section>
  );
}
