import type { Metadata } from "next";
import { CheckCheck, MessageCircle, Quote } from "lucide-react";
import { Container, Breadcrumbs } from "@/components/ui";
import { getLiveStoreSettings, getLiveTestimonials } from "@/lib/live-repository";
import { GoogleReviewsButton, TestimonialCard } from "@/components/testimonials-section";
import { WhatsAppButton } from "@/components/whatsapp-button";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const description =
  "Cerita pelanggan yang membeli laptop, servis perangkat, dan rakit PC di Hadi Computer.";

export const metadata: Metadata = {
  title: "Testimoni Pelanggan",
  description,
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/testimoni",
    siteName: "Hadi Computer",
    title: "Testimoni Pelanggan | Hadi Computer",
    description,
  },
  alternates: {
    canonical: "/testimoni",
  },
};

export default async function TestimonialsPage() {
  const [testimonials, store] = await Promise.all([
    getLiveTestimonials({ limit: null }),
    getLiveStoreSettings(),
  ]);

  return (
    <Container className="page-container">
      <Breadcrumbs items={[{ label: "Testimoni" }]} />
      <div className="editorial-hero">
        <span className="eyebrow">KATA MEREKA</span>
        <h1>
          Sudah dibuktikan
          <br />
          pelanggan Hadi.
        </h1>
        <p>
          Pengalaman pelanggan yang belanja, servis,
          <br className="desktop-break" /> dan rakit PC di Hadi Computer.
        </p>
        <div className="editorial-symbol">
          <Quote size={130} strokeWidth={0.7} />
        </div>
      </div>

      <section className="section">
        {testimonials.length > 0 ? (
          <ul className="testimonial-track is-grid">
            {testimonials.map((t) => (
              <TestimonialCard key={t.id} testimonial={t} />
            ))}
          </ul>
        ) : (
          <p className="small-note section-note">Belum ada testimoni yang ditampilkan.</p>
        )}
        <GoogleReviewsButton url={store.googleReviewUrl} />
      </section>

      <section className="consultation-panel">
        <div>
          <span className="eyebrow">GILIRAN KAMU</span>
          <h2>Ceritakan kebutuhanmu ke Hadi.</h2>
          <p>Mau beli, servis, atau rakit PC, mulai dari obrolan singkat.</p>
          <div className="consultation-points">
            <span>
              <CheckCheck size={17} />
              Diskusi kebutuhan
            </span>
            <span>
              <MessageCircle size={17} />
              Langsung dengan owner
            </span>
          </div>
        </div>
        <WhatsAppButton label="Mulai konsultasi" phone={store.whatsapp} />
      </section>
    </Container>
  );
}
