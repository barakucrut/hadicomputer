"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="container not-found">
      <h1>Halaman belum bisa ditampilkan.</h1>
      <p>Silakan coba lagi untuk melanjutkan menjelajah.</p>
      <button className="button primary" onClick={reset}>
        Coba lagi
      </button>
    </div>
  );
}
