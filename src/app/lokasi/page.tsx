import type { Metadata } from "next";
import { MapPin, Clock3, MessageCircle, Info } from "lucide-react";
import { Container, Breadcrumbs } from "@/components/ui";
import { LocationPanel } from "@/components/location-panel";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { SocialLinks } from "@/components/social-links";
import { getLiveStoreSettings } from "@/lib/live-repository";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Lokasi Toko Fisik & Jam Operasional",
  description:
    "Kunjungi toko fisik Hadi Computer di Jl. Ahmad Yani No. 45, Lantai 1. Buka setiap hari 08.00 – 22.00 WIB. Konsultasi unit dan servis langsung dengan owner.",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/lokasi",
    siteName: "Hadi Computer",
    title: "Lokasi Toko Fisik & Jam Buka | Hadi Computer",
    description:
      "Kunjungi toko fisik Hadi Computer di Jl. Ahmad Yani No. 45, Lantai 1. Buka setiap hari 08.00 – 22.00 WIB.",
    images: [
      {
        url: "/images/banners/work.png",
        width: 1200,
        height: 630,
        alt: "Lokasi Toko Hadi Computer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lokasi Toko Fisik & Jam Buka | Hadi Computer",
    description:
      "Kunjungi toko fisik Hadi Computer di Jl. Ahmad Yani No. 45. Buka setiap hari 08.00 – 22.00 WIB.",
    images: ["/images/banners/work.png"],
  },
  alternates: {
    canonical: "/lokasi",
  },
};
export default async function LocationPage() {
  const store = await getLiveStoreSettings();
  return (
    <Container className="page-container">
      <Breadcrumbs items={[{ label: "Lokasi Toko" }]} />
      <div className="page-heading">
        <span className="eyebrow">SAMPAI KETEMU DI TOKO</span>
        <h1>Datang, lihat, dan kenali.</h1>
        <p>
          Diskusikan kebutuhanmu dan kenali perangkat pilihan secara langsung.
        </p>
      </div>
      <div className="location-layout">
        <LocationPanel store={store} />
        <div className="location-info">
          <span className="demo-pill">Toko Fisik & Konsultasi Langsung</span>
          <h2>{store.name}</h2>
          <div className="info-row">
            <MapPin size={22} />
            <div>
              <h3>Alamat toko</h3>
              <p>{store.address}</p>
            </div>
          </div>
          <div className="info-row">
            <Clock3 size={22} />
            <div>
              <h3>Jam operasional</h3>
              <p>{store.hours}</p>
            </div>
          </div>
          <div className="info-row">
            <MessageCircle size={22} />
            <div>
              <h3>Rencanakan kunjunganmu</h3>
              <p>Tanyakan ketersediaan produk dan jadwal konsultasi sebelum datang.</p>
            </div>
          </div>
          <WhatsAppButton
            label="Tanya lokasi & jadwal"
            phone={store.whatsapp}
            message={`Halo ${store.name}, saya ingin berkunjung ke toko di ${store.address}. Boleh konfirmasi ketersediaan jadwal hari ini?`}
          />
          <SocialLinks store={store} variant="contact" />
        </div>
      </div>
      <div className="info-notice">
        <Info size={19} />
        <p>
          Silakan hubungi kami via WhatsApp sebelum berkunjung untuk memastikan
          ketersediaan unit dan jadwal konsultasi teknisi.
        </p>
      </div>
    </Container>
  );
}
