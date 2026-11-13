"use client";

import * as React from "react";
import {
  Laptop,
  PcCase,
  Monitor,
  Smartphone,
  Tablet,
  Headphones,
  Speaker,
  Keyboard,
  Mouse,
  HardDrive,
  Cpu,
  Printer,
  Watch,
  Tv,
  Camera,
  Wifi,
  Package,
  ShoppingCart,
  Tag,
  Search,
  Check,
} from "lucide-react";
import { Input } from "@/components/ui/input";

export interface IconOption {
  value: string;
  label: string;
  category: string;
  Icon: React.ElementType;
}

export const CATEGORY_ICON_PRESETS: IconOption[] = [
  { value: "laptop", label: "Laptop", category: "Komputer", Icon: Laptop },
  { value: "pc", label: "PC Desktop", category: "Komputer", Icon: PcCase },
  { value: "monitor", label: "Monitor", category: "Display", Icon: Monitor },
  { value: "smartphone", label: "Smartphone", category: "Gadget", Icon: Smartphone },
  { value: "tablet", label: "Tablet / iPad", category: "Gadget", Icon: Tablet },
  { value: "headphones", label: "Headset / Audio", category: "Aksesori", Icon: Headphones },
  { value: "speaker", label: "Speaker", category: "Aksesori", Icon: Speaker },
  { value: "keyboard", label: "Keyboard", category: "Aksesori", Icon: Keyboard },
  { value: "mouse", label: "Mouse", category: "Aksesori", Icon: Mouse },
  { value: "hard-drive", label: "SSD / Storage", category: "Komponen", Icon: HardDrive },
  { value: "cpu", label: "Processor / CPU", category: "Komponen", Icon: Cpu },
  { value: "printer", label: "Printer & Scan", category: "Kantor", Icon: Printer },
  { value: "camera", label: "Kamera & Webcam", category: "Gadget", Icon: Camera },
  { value: "watch", label: "Smartwatch", category: "Wearable", Icon: Watch },
  { value: "tv", label: "Layar TV / Smart TV", category: "Display", Icon: Tv },
  { value: "wifi", label: "Router & Jaringan", category: "Network", Icon: Wifi },
  { value: "shopping-cart", label: "Sembako / Belanja", category: "Retail", Icon: ShoppingCart },
  { value: "package", label: "Paket & Aksesoris", category: "Umum", Icon: Package },
  { value: "tag", label: "Promo & Spesial", category: "Promo", Icon: Tag },
];

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [search, setSearch] = React.useState("");

  const filteredIcons = React.useMemo(() => {
    if (!search.trim()) return CATEGORY_ICON_PRESETS;
    const q = search.toLowerCase().trim();
    return CATEGORY_ICON_PRESETS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.value.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [search]);

  const selectedPreset = CATEGORY_ICON_PRESETS.find((p) => p.value === value);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Selected Indicator Banner */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          borderRadius: "var(--radius-sm)",
          backgroundColor: "#f9faf8",
          border: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              backgroundColor: value ? "var(--red)" : "#e5e3dd",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: value ? "0 2px 6px rgba(221, 32, 40, 0.25)" : "none",
            }}
          >
            {selectedPreset ? (
              <selectedPreset.Icon size={18} strokeWidth={1.8} />
            ) : (
              <Package size={18} />
            )}
          </div>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink)" }}>
              {selectedPreset ? selectedPreset.label : "Pilih Ikon Kategori"}
            </div>
            <div style={{ fontSize: "11px", color: "var(--muted)", fontFamily: "monospace" }}>
              {value ? `Ikon: ${value}` : "Belum ada ikon dipilih"}
            </div>
          </div>
        </div>
        {value && (
          <span
            style={{
              fontSize: "11px",
              color: "var(--muted)",
              cursor: "pointer",
              textDecoration: "underline",
            }}
            onClick={() => onChange("")}
          >
            Reset
          </span>
        )}
      </div>

      {/* Instant Search Bar */}
      <div style={{ position: "relative" }}>
        <Input
          type="text"
          placeholder="Cari ikon (misal: laptop, audio, belanja, sembako)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ height: "36px", fontSize: "12px", paddingLeft: "32px" }}
        />
        <Search
          size={14}
          style={{
            position: "absolute",
            left: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--muted)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Visual Icon Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(105px, 1fr))",
          gap: "8px",
          maxHeight: "190px",
          overflowY: "auto",
          padding: "4px",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--border-light)",
          backgroundColor: "#ffffff",
        }}
      >
        {filteredIcons.length === 0 ? (
          <div
            style={{
              gridColumn: "1 / -1",
              padding: "20px 8px",
              textAlign: "center",
              fontSize: "12px",
              color: "var(--muted)",
            }}
          >
            Tidak ada ikon yang cocok dengan "{search}".
          </div>
        ) : (
          filteredIcons.map((item) => {
            const isSelected = value === item.value;
            const ItemIcon = item.Icon;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => onChange(item.value)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "10px 6px",
                  borderRadius: "8px",
                  border: isSelected
                    ? "2px solid var(--red)"
                    : "1px solid var(--border-light)",
                  backgroundColor: isSelected ? "rgba(221, 32, 40, 0.05)" : "#ffffff",
                  color: isSelected ? "var(--red)" : "var(--ink)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  position: "relative",
                  outline: "none",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = "var(--surface)";
                    e.currentTarget.style.borderColor = "var(--border)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = "#ffffff";
                    e.currentTarget.style.borderColor = "var(--border-light)";
                  }
                }}
              >
                {isSelected && (
                  <div
                    style={{
                      position: "absolute",
                      top: "4px",
                      right: "4px",
                      width: "14px",
                      height: "14px",
                      borderRadius: "50%",
                      backgroundColor: "var(--red)",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Check size={9} strokeWidth={3} />
                  </div>
                )}
                <ItemIcon size={20} strokeWidth={isSelected ? 2 : 1.6} />
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: isSelected ? 700 : 500,
                    textAlign: "center",
                    lineHeight: 1.2,
                    wordBreak: "break-word",
                  }}
                >
                  {item.label}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
