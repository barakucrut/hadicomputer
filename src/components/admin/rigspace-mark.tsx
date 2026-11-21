import * as React from "react";

/**
 * Logo mark Rigspace.id: kotak hitam, huruf "R" emas, titik putih (".id").
 * Warna platform tetap — tidak mengikuti warna tema toko.
 */
export function RigspaceMark({ size = 36, radius }: { size?: number; radius?: number }) {
  const id = React.useId().replace(/:/g, "");
  const r = radius ?? Math.round(size * 0.28);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label="Rigspace.id"
      style={{ display: "block", flexShrink: 0, borderRadius: r, boxShadow: "0 4px 12px rgba(17, 20, 19, 0.22)" }}
    >
      <defs>
        <linearGradient id={`rs-gold-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F6E3A1" />
          <stop offset="45%" stopColor="#D9B24C" />
          <stop offset="100%" stopColor="#A87C1F" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx={(r / size) * 48} fill="#111413" />
      {/* Huruf R geometris */}
      <path
        d="M14 11h12.2c5.6 0 9.3 3.4 9.3 8.6 0 3.9-2.1 6.7-5.5 7.9L36.6 37h-6.9l-5.8-8.9H20.3V37H14V11zm6.3 5.6v6.2h5.5c2 0 3.3-1.2 3.3-3.1s-1.3-3.1-3.3-3.1h-5.5z"
        fill={`url(#rs-gold-${id})`}
      />
      {/* Titik putih ".id" */}
      <circle cx="39.5" cy="35.2" r="2.6" fill="#FFFFFF" />
    </svg>
  );
}
