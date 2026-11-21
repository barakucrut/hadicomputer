"use client";

import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { brandInk, DEFAULT_SECONDARY, safeHex } from "@/lib/brand-color";

/** Preset permukaan: warna gelap/netral yang nyaman untuk topbar & footer. */
export const SECONDARY_PRESETS = [
  { name: "Hitam", hex: DEFAULT_SECONDARY },
  { name: "Navy", hex: "#0f1e3d" },
  { name: "Hijau Tua", hex: "#0f2e22" },
  { name: "Marun", hex: "#3b0d12" },
  { name: "Cokelat", hex: "#2b1d14" },
  { name: "Abu Terang", hex: "#f1f1ef" },
];

/**
 * Isian Warna Sekunder (topbar info & footer template Precision) + pratinjau mini.
 * Warna teks/ikon tidak dipilih merchant: dihitung otomatis dari kontras (brandInk).
 */
export function SecondaryColorField({
  value,
  primary,
  onChange,
  disabled = false,
  idPrefix = "secondary",
}: {
  value: string;
  primary: string;
  onChange: (hex: string) => void;
  disabled?: boolean;
  idPrefix?: string;
}) {
  const surface = safeHex(value, DEFAULT_SECONDARY);
  const accent = safeHex(primary, "#dd2028");
  const surfaceInk = brandInk(surface);
  const isValid = /^#[0-9a-f]{6}$/i.test(value || "");

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs font-bold text-[#111413]">Warna Sekunder (Topbar Info & Footer)</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {SECONDARY_PRESETS.map((p) => {
            const active = surface === p.hex.toLowerCase();
            return (
              <button
                type="button"
                key={p.hex}
                disabled={disabled}
                onClick={() => onChange(p.hex)}
                className={`admin-color-preset-btn ${active ? "is-active" : ""}`}
                title={`Pilih ${p.name} (${p.hex})`}
              >
                <div className="admin-color-preset-swatch" style={{ backgroundColor: p.hex, border: "1px solid var(--border)" }}>
                  {active && <Check size={13} strokeWidth={2.5} style={{ color: brandInk(p.hex) }} />}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-bold text-[#111413] truncate">{p.name}</span>
                  <span className="text-[10px] font-mono text-[#525854] uppercase tracking-wider">{p.hex}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-color`} className="text-xs font-bold text-[#111413]">
          Custom Warna Sekunder (Hex Code)
        </Label>
        <div className="flex items-center gap-2.5 max-w-[260px]">
          <div className="relative h-9 w-9 shrink-0">
            <div className="h-9 w-9 rounded-lg" style={{ backgroundColor: surface, border: "1.5px solid var(--border)" }} />
            <input
              type="color"
              aria-label="Pilih warna sekunder"
              disabled={disabled}
              value={surface}
              onChange={(e) => onChange(e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </div>
          <Input
            id={`${idPrefix}-color`}
            type="text"
            disabled={disabled}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="font-mono uppercase font-bold text-xs"
            style={{ height: "36px" }}
          />
        </div>
        <span className="admin-form-hint">
          {isValid
            ? "Teks & ikon di atas warna ini otomatis putih/hitam agar tetap terbaca. Tombol tetap memakai warna primer."
            : "Format harus #RRGGBB, mis. #111413."}
        </span>
      </div>

      {/* Pratinjau mini: topbar sekunder, tombol primer, footer sekunder */}
      <div className="overflow-hidden rounded-xl border border-[#e5e5e2]" aria-hidden>
        <div className="px-3 py-1.5 font-mono text-[10px]" style={{ backgroundColor: surface, color: surfaceInk, opacity: 1 }}>
          Buka setiap hari: 08.00 – 22.00 WIB
        </div>
        <div className="flex items-center justify-between bg-white px-3 py-2.5">
          <span className="text-xs font-bold text-[#111413]">Header toko</span>
          <span className="rounded-full px-3 py-1 text-[11px] font-semibold" style={{ backgroundColor: accent, color: brandInk(accent) }}>
            Chat WhatsApp
          </span>
        </div>
        <div className="px-3 py-3 text-[11px]" style={{ backgroundColor: surface, color: surfaceInk }}>
          Footer toko · © {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
