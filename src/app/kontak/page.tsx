import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  MessageCircle,
  Laptop,
  Wrench,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { Container, Breadcrumbs } from "@/components/ui";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { getLiveStoreSettings } from "@/lib/live-repository";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const store = await getLiveStoreSettings();
  const phoneText = store.whatsapp ? ` ${store.whatsapp}` : "";
  const description = `Hubungi Hadi Computer via WhatsApp resmi${phoneText}. Konsultasi pemilihan laptop, rakit PC, servis perangkat, atau cek ketersediaan unit setiap hari.`;

  return {
    title: "Kontak Kami & Konsultasi WhatsApp",
    description,
    openGraph: {
      type: "website",
      locale: "id_ID",
      url: "/kontak",
      siteName: "Hadi Computer",
      title: "Kontak Kami & Konsultasi WhatsApp | Hadi Computer",
      description,
      images: [
        {
          url: "/images/banners/promo-bundle.png",
          width: 1200,
          height: 630,
          alt: "Hubungi Hadi Computer",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Kontak Kami & Konsultasi WhatsApp | Hadi Computer",
      description,
      images: ["/images/banners/promo-bundle.png"],
    },
    alternates: {
      canonical: "/kontak",
    },
  };
}
export default async function ContactPage() {
  const store = await getLiveStoreSettings();
  return (
    <Container className="page-container">
      <Breadcrumbs items={[{ label: "Kontak Kami" }]} />
      <div className="contact-hero">
        <div>
          <span className="eyebrow">OBROLAN BAIK DIMULAI DI SINI</span>
          <h1>
            Halo, ada yang
            <br />
            bisa Hadi bantu?
          </h1>
          <p>
            Tanya produk, konsultasi perangkat, atau rencanakan kunjungan.
            Ceritakan kebutuhanmu langsung kepada owner.
          </p>
          <WhatsAppButton label="Mulai percakapan" phone={store.whatsapp} />
          <span className="small-note">
            WhatsApp resmi: {store.whatsapp} · {store.hours}
          </span>
        </div>
        <div className="contact-art">
          <MessageCircle size={115} strokeWidth={0.9} />
          <span>
            Let’s talk
            <br />
            <strong>tech.</strong>
          </span>
          <i>HADI COMPUTER</i>
        </div>
      </div>
      <div className="contact-grid">
        {[
          {
            Icon: Laptop,
            title: "Cari perangkat yang pas",
            text: "Jelajahi spesifikasi, kondisi, dan pilihan produk sebelum bertanya.",
            href: "/katalog",
            cta: "Jelajahi katalog",
          },
          {
            Icon: Wrench,
            title: "Butuh solusi perangkat?",
            text: "Kenali layanan servis, perawatan, dan konsultasi rakit PC.",
            href: "/layanan",
            cta: "Kenali layanan",
          },
          {
            Icon: MapPin,
            title: "Ingin datang langsung?",
            text: "Kenali informasi toko dan tanyakan jadwal kunjunganmu.",
            href: "/lokasi",
            cta: "Lihat lokasi toko",
          },
        ].map(({ Icon, title, text, href, cta }) => (
          <Link key={href} href={href} className="contact-card">
            <Icon size={27} strokeWidth={1.4} />
            <h2>{title}</h2>
            <p>{text}</p>
            <span className="text-link">
              {cta}
              <ArrowUpRight size={16} />
            </span>
          </Link>
        ))}
      </div>
      <div className="contact-footnote">
        <div>
          <h2>Lebih dekat dengan Hadi.</h2>
          <p>
            Email dan akun media sosial resmi akan ditampilkan setelah
            dikonfirmasi oleh owner.
          </p>
        </div>
        <Link href="/" className="text-link">
          Kembali ke beranda
          <ArrowRight size={17} />
        </Link>
      </div>
    </Container>
  );
}
