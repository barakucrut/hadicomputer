"use client";

import * as React from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Store,
  Sparkles,
  Users,
  CheckCircle2,
  ExternalLink,
  Laptop,
  Cpu,
  ArrowRight,
  Plus,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/admin/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/admin/ui/table";
import "@/app/admin.css";

export default function GodModePage() {
  const tenants = [
    {
      id: "tenant-hadi",
      name: "Hadi Computer",
      slug: "hadicomputer",
      domain: "hadicomputer.com",
      plan: "PRO (Custom PC Builder)",
      status: "ACTIVE",
      productsCount: 75,
      features: {
        catalog: true,
        pcBuilder: true,
        tradeIn: false,
        instantCheckout: false,
      },
      createdAt: "Nov 2026",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0b0e0c", color: "#f1f3ee", fontFamily: "var(--font)", paddingBottom: "60px" }}>
      {/* Top God-Mode Bar */}
      <header
        style={{
          height: "64px",
          background: "rgba(17, 20, 19, 0.8)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          padding: "0 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              height: "36px",
              width: "36px",
              borderRadius: "10px",
              backgroundColor: "#cc252b",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: "14px",
              boxShadow: "0 0 15px rgba(204, 37, 43, 0.6)",
            }}
          >
            ⚡
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "15px", fontWeight: 900, letterSpacing: "0.5px", color: "#ffffff" }}>
                GOD MODE
              </span>
              <span style={{ fontSize: "10px", fontWeight: 800, padding: "2px 7px", borderRadius: "999px", backgroundColor: "#cc252b", color: "#ffffff" }}>
                SUPERADMIN
              </span>
            </div>
            <div style={{ fontSize: "11px", color: "#8a918a" }}>
              Pusat Kendali Ekosistem SaaS Retailer Komputer
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link
            href="/docs/styleguide"
            style={{
              fontSize: "12px",
              color: "#a3aca3",
              textDecoration: "none",
              padding: "6px 12px",
              borderRadius: "6px",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
            }}
          >
            Styleguide
          </Link>
          <Link
            href="/admin"
            style={{
              fontSize: "12px",
              color: "#ffffff",
              textDecoration: "none",
              padding: "6px 12px",
              borderRadius: "6px",
              backgroundColor: "#cc252b",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>Masuk ke CMS Toko #1</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: "32px", maxWidth: "1280px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "28px" }}>
        {/* Metric Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
          {[
            { label: "Total Tenant / Toko", value: "1 Toko", note: "Hadi Computer (Active)", icon: Store, color: "#38bdf8" },
            { label: "Total Produk Dikelola", value: "75 Unit", note: "Laptop, PC, & Aksesoris", icon: Laptop, color: "#a855f7" },
            { label: "Estimasi MRR", value: "Rp 232.500", note: "Paket PRO Tahunan (Rp 2.79jt/th)", icon: TrendingUp, color: "#22c55e" },
            { label: "Status Server", value: "Optimal", note: "Next.js 16 Multi-Tenant Ready", icon: Cpu, color: "#f59e0b" },
          ].map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.label}
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "12px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#8a918a" }}>{m.label}</span>
                  <Icon size={18} style={{ color: m.color }} />
                </div>
                <div style={{ fontSize: "24px", fontWeight: 900, color: "#ffffff" }}>{m.value}</div>
                <div style={{ fontSize: "11px", color: "#6b726a" }}>{m.note}</div>
              </div>
            );
          })}
        </div>

        {/* Tenant Table */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: 800, color: "#ffffff", margin: 0 }}>
                Daftar Tenant Toko Elektronik & Komputer
              </h2>
              <p style={{ fontSize: "12px", color: "#8a918a", margin: "4px 0 0" }}>
                Kelola hak akses, paket langganan, dan aktifkan fitur modular per toko.
              </p>
            </div>
            <button
              style={{
                backgroundColor: "#cc252b",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "8px 16px",
                fontSize: "12px",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
              }}
              onClick={() => alert("Fitur pembuatan tenant otomatis segera hadir pada Milestone SaaS berikutnya!")}
            >
              <Plus size={15} />
              <span>Tambah Toko Baru</span>
            </button>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", textAlign: "left", color: "#8a918a", fontSize: "11px", textTransform: "uppercase" }}>
                <th style={{ padding: "14px 24px" }}>Nama Toko</th>
                <th style={{ padding: "14px 16px" }}>Domain / Slug</th>
                <th style={{ padding: "14px 16px" }}>Paket Langganan</th>
                <th style={{ padding: "14px 16px" }}>Fitur Aktif</th>
                <th style={{ padding: "14px 16px" }}>Status</th>
                <th style={{ padding: "14px 24px", textAlign: "right" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                  <td style={{ padding: "16px 24px" }}>
                    <div style={{ fontWeight: 800, color: "#ffffff", fontSize: "14px" }}>{t.name}</div>
                    <div style={{ fontSize: "11px", color: "#8a918a" }}>{t.productsCount} Produk Aktif</div>
                  </td>
                  <td style={{ padding: "16px 16px" }}>
                    <code style={{ fontSize: "12px", padding: "3px 7px", borderRadius: "4px", backgroundColor: "rgba(255, 255, 255, 0.08)", color: "#e2e8e2" }}>
                      {t.domain}
                    </code>
                  </td>
                  <td style={{ padding: "16px 16px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#38bdf8" }}>{t.plan}</span>
                  </td>
                  <td style={{ padding: "16px 16px" }}>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", backgroundColor: "rgba(34, 197, 94, 0.2)", color: "#4ade80", fontWeight: 700 }}>
                        ✓ Katalog WA
                      </span>
                      <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", backgroundColor: "rgba(168, 85, 247, 0.2)", color: "#c084fc", fontWeight: 700 }}>
                        ✓ PC Builder
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "16px 16px" }}>
                    <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "999px", backgroundColor: "rgba(34, 197, 94, 0.2)", color: "#4ade80", fontWeight: 800 }}>
                      ACTIVE
                    </span>
                  </td>
                  <td style={{ padding: "16px 24px", textAlign: "right" }}>
                    <Link
                      href="/admin"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#ffffff",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        textDecoration: "none",
                      }}
                    >
                      <span>Masuk CMS</span>
                      <ExternalLink size={12} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
