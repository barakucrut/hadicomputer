import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
export default function NotFound() {
  return (
    <div className="container not-found">
      <Compass size={64} strokeWidth={1} />
      <span className="eyebrow">404 · HALAMAN TIDAK DITEMUKAN</span>
      <h1>Sepertinya kita salah jalan.</h1>
      <p>
        Halaman atau produk ini belum tersedia. Temukan pilihan lainnya di
        katalog.
      </p>
      <Link className="button primary" href="/katalog">
        Jelajahi katalog
        <ArrowRight size={17} />
      </Link>
    </div>
  );
}
