import { ArrowUpRight, Quote, Star } from "lucide-react";
import { Container, SectionHeading } from "@/components/ui";
import { testimonialInitials, TESTIMONIAL_SOURCE_LABELS } from "@/lib/testimonials";
import type { Testimonial } from "@/lib/types";

function StarRating({ value }: { value: number }) {
  return (
    <div className="testimonial-stars" role="img" aria-label={`Rating ${value} dari 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={15} strokeWidth={1.8} className={n <= value ? "is-on" : undefined} aria-hidden />
      ))}
    </div>
  );
}

export function TestimonialCard({ testimonial: t }: { testimonial: Testimonial }) {
  return (
    <li className="testimonial-card">
      <div className="testimonial-card-top">
        {t.rating ? <StarRating value={t.rating} /> : <Quote size={22} className="testimonial-quote-icon" aria-hidden />}
        {t.label && <span className="testimonial-label">{t.label}</span>}
      </div>
      <blockquote className="testimonial-quote">
        <p>&ldquo;{t.quote}&rdquo;</p>
      </blockquote>
      <div className="testimonial-person">
        <div className="testimonial-avatar" aria-hidden>
          {t.photoUrl ? (
            <img src={t.photoUrl} alt="" width={40} height={40} loading="lazy" decoding="async" />
          ) : (
            testimonialInitials(t.name)
          )}
        </div>
        <div className="testimonial-person-text">
          <strong>{t.name}</strong>
          <span>
            {[t.descriptor, t.source === "GOOGLE" ? TESTIMONIAL_SOURCE_LABELS.GOOGLE : null]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </div>
      </div>
    </li>
  );
}

export function GoogleReviewsButton({ url }: { url?: string | null }) {
  if (!url) return null;
  return (
    <div className="testimonial-more">
      <a className="button white" href={url} target="_blank" rel="noopener noreferrer">
        Lihat semua ulasan di Google
        <ArrowUpRight size={16} />
      </a>
    </div>
  );
}

/**
 * Section testimoni beranda. Tidak dirender sama sekali bila belum ada
 * testimoni aktif (tidak ada data contoh di kode).
 */
export function TestimonialsSection({
  testimonials,
  googleReviewUrl,
}: {
  testimonials: Testimonial[];
  googleReviewUrl?: string | null;
}) {
  if (testimonials.length === 0) return null;

  return (
    <section className="section testimonials-section" aria-label="Testimoni pelanggan">
      <Container>
        <SectionHeading
          eyebrow="KATA MEREKA"
          title="Sudah dibuktikan pelanggan Hadi."
          description="Pengalaman asli pelanggan yang belanja, servis, dan rakit PC di Hadi Computer."
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
