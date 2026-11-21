import { SectionHeading } from "@/components/ui";
import type { ServiceCaseItem } from "@/lib/types";
import { ServiceCaseGallery } from "./service-case-gallery";

/**
 * Portofolio servis di halaman detail layanan (semua template). Klik kartu = popup detail.
 * Tidak dirender bila belum ada portofolio yang tertaut ke layanan ini.
 */
export function ServiceCasesSection({
  cases,
  storeName,
  phone,
}: {
  cases: ServiceCaseItem[];
  storeName: string;
  phone: string | null;
}) {
  if (cases.length === 0) return null;
  return (
    <section className="section service-cases" aria-label="Portofolio servis">
      <SectionHeading
        eyebrow="PORTOFOLIO SERVIS"
        title="Hasil kerja yang sudah selesai."
        description={`Contoh perangkat pelanggan yang sudah ditangani ${storeName}. Klik untuk melihat detailnya.`}
      />
      <ServiceCaseGallery cases={cases} phone={phone} storeName={storeName} />
    </section>
  );
}
