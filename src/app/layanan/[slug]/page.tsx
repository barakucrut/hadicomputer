import type { Metadata } from "next";
import { getStoreBrand } from "@/lib/store-brand";
import { notFound } from "next/navigation";
import { Check, ArrowRight } from "lucide-react";
import { getService, services } from "@/lib/repository";
import { getLiveService, getLiveStoreSettings } from "@/lib/live-repository";
import { Container, Breadcrumbs, SectionHeading } from "@/components/ui";
import { SafeImage } from "@/components/safe-image";
import { WhatsAppButton } from "@/components/whatsapp-button";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { brand } = await getStoreBrand();
  const { slug } = await params,
    service = await getLiveService(slug);
  if (!service) {
    return { title: `Layanan Tidak Ditemukan | ${brand}` };
  }

  const title = `${service.name} — Layanan Spesialis`;
  const description = `${service.summary}. ${service.description}`;

  return {
    title,
    description,
    openGraph: {
      type: "article",
      locale: "id_ID",
      url: `/layanan/${service.slug}`,
      siteName: `${brand}`,
      title: `${title} | ${brand}`,
      description,
      images: [
        {
          url: service.image,
          width: 1200,
          height: 630,
          alt: service.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${brand}`,
      description,
      images: [service.image],
    },
    alternates: {
      canonical: `/layanan/${service.slug}`,
    },
  };
}
export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [service, store] = await Promise.all([
    getLiveService(slug),
    getLiveStoreSettings(),
  ]);
  if (!service) notFound();
  const message = `Halo ${store.name || "kak"}, saya ingin konsultasi layanan ${service.name}.\n\nTautan: {origin}/layanan/${service.slug}\n\nKebutuhan atau kendala saya: `;
  return (
    <Container className="page-container">
      <Breadcrumbs
        items={[
          { label: "Layanan", href: "/layanan" },
          { label: service.name },
        ]}
      />
      <div className="service-detail-hero">
        <div>
          <span className="eyebrow">{service.eyebrow}</span>
          <h1>{service.name}</h1>
          <p>{service.summary}</p>
          <WhatsAppButton
            label="Konsultasikan kebutuhanmu"
            message={message}
            phone={store.whatsapp}
          />
          <span className="small-note">
            Hubungi untuk estimasi biaya dan konsultasi gratis
          </span>
        </div>
        <div className="service-detail-image">
          <SafeImage
            src={service.image}
            alt={`Ilustrasi ${service.name}`}
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      </div>
      <div className="service-description">
        <h2>Kenali layanannya.</h2>
        <p>{service.description}</p>
      </div>
      <section className="section">
        <SectionHeading title="Cakupan layanan" />
        <div className="inclusion-grid">
          {service.inclusions.map((item, i) => (
            <div key={item}>
              <span>0{i + 1}</span>
              <h3>{item}</h3>
              <Check size={18} />
            </div>
          ))}
        </div>
      </section>
      <section className="section section-top-border">
        <SectionHeading
          eyebrow="SEDERHANA, LANGKAH DEMI LANGKAH"
          title="Bagaimana prosesnya?"
        />
        <ol className="steps-grid">
          {service.steps.map((step, i) => (
            <li key={step}>
              <span>0{i + 1}</span>
              <h3>{step}</h3>
              {i < service.steps.length - 1 && <ArrowRight size={18} />}
            </li>
          ))}
        </ol>
      </section>
      <section className="consultation-panel">
        <div>
          <h2>Siap cerita ke {store.name || "kami"}?</h2>
          <p>
            Kita mulai dengan kebutuhanmu, lalu diskusikan pilihan solusinya.
          </p>
        </div>
        <WhatsAppButton
          message={message}
          label="Tanya lewat WhatsApp"
          phone={store.whatsapp}
        />
      </section>
    </Container>
  );
}
