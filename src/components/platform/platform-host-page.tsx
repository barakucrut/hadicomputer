import { platformRootDomain } from "@/lib/platform-domain";

/**
 * Halaman untuk host yang bukan etalase toko:
 * - "platform-root": rigspace.id (sementara, sampai landing page platform dibuat)
 * - "not-found": subdomain/domain yang tidak terdaftar — tidak pernah menampilkan toko lain.
 * - "demo-locked": toko masih Mode Demo dan pengunjung tidak membawa link demo sah.
 *   Sengaja TIDAK menyebut nama/brand toko (demo memakai brand calon klien, belum boleh publik).
 * Server component tanpa data toko apa pun.
 */
export function PlatformHostPage({ resolution }: { resolution: "platform-root" | "not-found" | "demo-locked" }) {
  const root = platformRootDomain();
  const isRoot = resolution === "platform-root";

  return (
    <main
      id="main"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 16px",
        background: "#f7f7f5",
        color: "#111413",
        fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
      }}
    >
      <div style={{ width: "100%", maxWidth: 520, textAlign: "center" }}>
        <svg width="56" height="56" viewBox="0 0 48 48" role="img" aria-label="Rigspace.id" style={{ display: "inline-block", borderRadius: 16 }}>
          <defs>
            <linearGradient id="rs-gold-host" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#F6E3A1" />
              <stop offset="45%" stopColor="#D9B24C" />
              <stop offset="100%" stopColor="#A87C1F" />
            </linearGradient>
          </defs>
          <rect width="48" height="48" rx="13.4" fill="#111413" />
          <path
            d="M14 11h12.2c5.6 0 9.3 3.4 9.3 8.6 0 3.9-2.1 6.7-5.5 7.9L36.6 37h-6.9l-5.8-8.9H20.3V37H14V11zm6.3 5.6v6.2h5.5c2 0 3.3-1.2 3.3-3.1s-1.3-3.1-3.3-3.1h-5.5z"
            fill="url(#rs-gold-host)"
          />
          <circle cx="39.5" cy="35.2" r="2.6" fill="#FFFFFF" />
        </svg>

        {isRoot ? (
          <>
            <h1 style={{ margin: "20px 0 8px", fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em" }}>Rigspace.id</h1>
            <p style={{ margin: 0, fontSize: 16, color: "#525854" }}>Website toko komputer, siap jualan.</p>
            <p style={{ margin: "16px 0 0", fontSize: 14, color: "#818779" }}>Halaman lengkap segera hadir.</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 28 }}>
              <a
                href="/admin/login"
                style={{ padding: "11px 18px", borderRadius: 8, background: "#111413", color: "#fff", fontSize: 14, fontWeight: 700, textDecoration: "none" }}
              >
                Masuk CMS Toko
              </a>
              <a
                href="/god-mode/login"
                style={{ padding: "11px 18px", borderRadius: 8, border: "1px solid #e5e5e2", background: "#fff", color: "#111413", fontSize: 14, fontWeight: 700, textDecoration: "none" }}
              >
                Tim Rigspace
              </a>
            </div>
          </>
        ) : resolution === "demo-locked" ? (
          <>
            <p style={{ margin: "20px 0 0", fontSize: 12, fontWeight: 800, letterSpacing: "0.12em", color: "#818779" }}>SEGERA HADIR</p>
            <h1 style={{ margin: "8px 0 8px", fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" }}>Website ini sedang disiapkan</h1>
            <p style={{ margin: 0, fontSize: 15, color: "#525854" }}>
              Halaman ini belum dibuka untuk umum. Jika Anda menerima link demo, link tersebut mungkin sudah kedaluwarsa — minta
              link baru ke tim yang mengirimkannya.
            </p>
          </>
        ) : (
          <>
            <p style={{ margin: "20px 0 0", fontSize: 12, fontWeight: 800, letterSpacing: "0.12em", color: "#818779" }}>404</p>
            <h1 style={{ margin: "8px 0 8px", fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" }}>Toko tidak ditemukan</h1>
            <p style={{ margin: 0, fontSize: 15, color: "#525854" }}>
              Alamat ini belum terdaftar sebagai toko di Rigspace.id. Periksa kembali ejaan alamatnya.
            </p>
            <a
              href={`https://${root}`}
              style={{ display: "inline-block", marginTop: 28, padding: "11px 18px", borderRadius: 8, background: "#111413", color: "#fff", fontSize: 14, fontWeight: 700, textDecoration: "none" }}
            >
              Ke {root}
            </a>
          </>
        )}
      </div>
    </main>
  );
}
