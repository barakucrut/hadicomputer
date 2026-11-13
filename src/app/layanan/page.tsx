import type { Metadata } from "next";
import { CheckCheck, MessageCircle, Wrench } from "lucide-react";
import { Container, Breadcrumbs, SectionHeading } from "@/components/ui";
import { ServiceCard } from "@/components/service-card";
import { services } from "@/lib/repository";
import { getLiveServices } from "@/lib/live-repository";
import { WhatsAppButton } from "@/components/whatsapp-button";

export const metadata: Metadata = {
  title: "Layanan Servis Laptop & Jasa Rakit PC",
  description:
    "Konsultasikan kendala laptop, pembersihan, upgrade komponen, atau rakit PC impian sesuai anggaranmu. Pengerjaan rapi dan transparan di Hadi Computer.",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/layanan",
    siteName: "Hadi Computer",
    title: "Layanan Servis Laptop & Jasa Rakit PC | Hadi Computer",
    description:
      "Konsultasikan kendala laptop, pembersihan, upgrade komponen, atau rakit PC impian sesuai anggaranmu. Pengerjaan rapi dan transparan.",
    images: [
      {
        url: "/images/banners/gaming.png",
        width: 1200,
        height: 630,
        alt: "Layanan Servis & Rakit PC Hadi Computer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Layanan Servis Laptop & Jasa Rakit PC | Hadi Computer",
    description:
      "Konsultasikan kendala laptop, pembersihan, upgrade komponen, atau rakit PC impian sesuai anggaranmu.",
    images: ["/images/banners/gaming.png"],
  },
  alternates: {
    canonical: "/layanan",
  },
};
export default async function ServicesPage() {
  const serviceList = await getLiveServices();
  return (
    <Container className="page-container">
      <Breadcrumbs items={[{ label: "Layanan" }]} />
      <div className="editorial-hero">
        <span className="eyebrow">ADA HADI YANG BANTU</span>
        <h1>
          Solusi yang dimulai
          <br />
          dari mendengarkan.
        </h1>
        <p>
          Perangkat bermasalah atau punya rencana setup baru?
          <br className="desktop-break" /> Ceritakan kebutuhanmu. Kita cari
          langkah berikutnya bersama.
        </p>
        <div className="editorial-symbol">
          <Wrench size={130} strokeWidth={0.7} />
        </div>
      </div>
      <section className="section">
        <SectionHeading
          title="Apa yang bisa kami bantu?"
          description="Pilih layanan untuk mengenali proses dan cakupannya."
        />
        <div className="services-grid">
          {serviceList.map((service) => (
            <ServiceCard key={service.slug} service={service} />
          ))}
        </div>
        <p className="small-note section-note">
          Estimasi biaya dan waktu pengerjaan akan disesuaikan setelah pemeriksaan
          kondisi perangkatmu.
        </p>
      </section>
      <section className="consultation-panel">
        <div>
          <span className="eyebrow">TIDAK HARUS PAHAM TEKNIS DULU</span>
          <h2>Mulai dari cerita sederhana.</h2>
          <p>Cukup sampaikan perangkat, kendala, atau rencanamu.</p>
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
        <WhatsAppButton label="Mulai konsultasi" />
      </section>
    </Container>
  );
}
