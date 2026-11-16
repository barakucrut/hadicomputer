"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  LayoutGrid,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ExternalLink,
  Laptop,
  Cpu,
  Search,
  ShoppingCart,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Store,
  Palette,
  LayoutDashboard,
  LogOut,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Switch } from "@/components/admin/ui/switch";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/admin/ui/table";
import { useToast, ToastProvider } from "@/components/admin/ui/toast";
import "@/app/admin.css";

function GodModeStyleguideContent() {
  const router = useRouter();
  const toast = useToast();
  const [currencyVal, setCurrencyVal] = React.useState<string>("12500000");
  const [switchVal, setSwitchVal] = React.useState(true);

  async function handleLogout() {
    try {
      await fetch("/api/god-mode/auth/logout", { method: "POST" });
      router.push("/god-mode/login");
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
      router.push("/god-mode/login");
    }
  }

  return (
    <div className="admin-shell-root">
      {/* Sidebar for God Mode */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <Link
            href="/god-mode"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontWeight: 800,
              fontSize: "17px",
              color: "var(--ink)",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                height: "36px",
                width: "36px",
                borderRadius: "10px",
                backgroundColor: "var(--red)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: "15px",
                boxShadow: "0 4px 10px rgba(221, 32, 40, 0.25)",
              }}
            >
              ⚡
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ lineHeight: 1.2 }}>Platform CMS</span>
              <span style={{ fontSize: "10px", color: "var(--red)", fontWeight: 800 }}>
                GOD-MODE CONTROL
              </span>
            </div>
          </Link>
        </div>

        <nav
          style={{
            flex: 1,
            padding: "16px 12px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <Link href="/god-mode" className="admin-nav-item">
            <LayoutDashboard size={19} />
            <span>Dashboard Platform</span>
          </Link>
          <Link href="/god-mode#daftar-toko" className="admin-nav-item">
            <Store size={19} />
            <span>Daftar Tenant Toko</span>
          </Link>
          <Link href="/god-mode/styleguide" className="admin-nav-item active">
            <Palette size={19} />
            <span>Living Styleguide</span>
          </Link>
          <Link href="/admin" className="admin-nav-item">
            <ExternalLink size={19} />
            <span>Buka CMS Hadicomputer</span>
          </Link>
        </nav>

        <div className="admin-sidebar-footer" style={{ padding: "14px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "12px" }}>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 10px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              backgroundColor: "transparent",
              color: "var(--red)",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <LogOut size={15} />
            <span>Keluar God-Mode</span>
          </button>

          <div style={{ fontSize: "11px", color: "var(--muted)", lineHeight: 1.4 }}>
            Multi-Tenant Platform SaaS
            <br />
            <strong>Version 2.0 (Live)</strong>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Topbar */}
        <header className="admin-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--ink)" }}>
              Living Styleguide & Design System
            </span>
            <Badge variant="secondary" className="text-[11px] font-bold">
              SHADCN UI
            </Badge>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Link
              href="/god-mode"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
            >
              <span>Kembali ke Manajemen Tenant</span>
              <ArrowRight size={13} />
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              title="Keluar dari sesi God-Mode"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </header>

        {/* Content Body */}
        <main className="admin-main-content">
          <div className="space-y-8 w-full pb-16">
            <div>
              <h1 className="text-2xl font-black text-[#111413] tracking-tight">
                Living Styleguide & Component Showcase
              </h1>
              <p className="text-sm text-[#525854] mt-1">
                Panduan baku token warna, komponen Shadcn UI, form controls, dan status badge untuk seluruh ekosistem CMS multi-tenant.
              </p>
            </div>

            {/* 1. Color Tokens */}
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-[#111413]">1. Design Tokens & Color Palette</h2>
                <p className="text-xs text-[#525854]">
                  Variabel tema warna utama yang bisa dikustomisasi secara dinamis per tenant / toko.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { name: "Brand Red (Primary)", var: "--red", hex: "#cc252b", note: "Aksen utama toko / tombol CTA" },
                  { name: "Deep Ink", var: "--ink", hex: "#111413", note: "Warna judul & teks utama" },
                  { name: "Muted Text", var: "--muted", hex: "#525854", note: "Teks sekunder & deskripsi" },
                  { name: "Surface Background", var: "--surface", hex: "#f6f6f4", note: "Background canvas dashboard" },
                  { name: "Border Neutral", var: "--border", hex: "#e5e5e2", note: "Garis batas card & table" },
                  { name: "Success Green", var: "--green", hex: "#15803d", note: "Status aktif / WhatsApp" },
                ].map((c) => (
                  <div
                    key={c.name}
                    className="bg-white border border-[#e5e5e2] rounded-xl p-3 flex flex-col gap-2.5 shadow-sm"
                  >
                    <div
                      className="h-10 rounded-lg shadow-inner"
                      style={{
                        backgroundColor: c.hex,
                        border: c.hex === "#ffffff" ? "1px solid #e5e5e2" : "none",
                      }}
                    />
                    <div>
                      <div className="text-xs font-bold text-[#111413]">{c.name}</div>
                      <div className="text-[11px] font-mono text-[#525854]">{c.hex} ({c.var})</div>
                      <div className="text-[10px] text-[#818779] mt-1">{c.note}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 2. Button System */}
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-[#111413]">2. Buttons & Actions</h2>
                <p className="text-xs text-[#525854]">
                  Varian tombol composable berbasis arsitektur Shadcn UI.
                </p>
              </div>

              <Card>
                <CardContent className="p-6 space-y-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="default">Primary Button</Button>
                    <Button variant="secondary">Secondary Button</Button>
                    <Button variant="outline">Outline Button</Button>
                    <Button variant="destructive">Destructive Button</Button>
                    <Button variant="ghost">Ghost Button</Button>
                    <Button disabled>Disabled Button</Button>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 border-t border-[#e5e5e2] pt-4">
                    <Button size="sm" className="flex items-center gap-1.5">
                      <Plus size={14} />
                      <span>Small with Icon</span>
                    </Button>
                    <Button size="default" className="flex items-center gap-2">
                      <Sparkles size={16} />
                      <span>Default with Icon</span>
                    </Button>
                    <Button size="lg" className="flex items-center gap-2">
                      <Laptop size={18} />
                      <span>Large CTA Button</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toast.success("Toast Berhasil Dipanggil!")}
                      className="flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={14} className="text-green-600" />
                      <span>Test Trigger Toast</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* 3. Badge System */}
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-[#111413]">3. Status Badges</h2>
                <p className="text-xs text-[#525854]">
                  Label status inventaris, kondisi perangkat, dan paket langganan.
                </p>
              </div>

              <Card>
                <CardContent className="p-5 flex flex-wrap gap-2.5 items-center">
                  <Badge variant="default">Primary Badge</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="destructive">Habis / Inactive</Badge>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">
                    <CheckCircle2 size={12} />
                    <span>Tersedia (Ready)</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                    <AlertCircle size={12} />
                    <span>Preorder (PO)</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                    <Sparkles size={12} />
                    <span>Paket PRO Active</span>
                  </span>
                </CardContent>
              </Card>
            </section>

            {/* 4. Form Controls */}
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-[#111413]">4. Form Inputs & Controls</h2>
                <p className="text-xs text-[#525854]">
                  Field input form terstandarisasi untuk inventaris komputer.
                </p>
              </div>

              <Card>
                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <Label htmlFor="demo-name">Nama Produk</Label>
                    <Input id="demo-name" placeholder="e.g. ASUS ROG Strix G16" defaultValue="ASUS ROG Strix G16 (2024)" />
                  </div>

                  <div>
                    <Label htmlFor="demo-price">Harga Produk (Currency Formatter)</Label>
                    <CurrencyInput
                      id="demo-price"
                      name="price"
                      value={currencyVal}
                      onValueChange={(val) => setCurrencyVal(val)}
                      placeholder="Rp 0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="demo-category">Kategori Perangkat</Label>
                    <Select id="demo-category" defaultValue="laptop">
                      <option value="laptop">Laptop & Notebook</option>
                      <option value="pc-rakitan">PC Desktop Rakitan</option>
                      <option value="gadget">Smartphone & Tablet</option>
                      <option value="aksesoris">Aksesoris & Peripheral</option>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between p-3.5 border border-[#e5e5e2] rounded-lg">
                    <div>
                      <div className="text-xs font-bold text-[#111413]">Aktifkan Modul PC Builder</div>
                      <div className="text-[11px] text-[#525854]">Tampilkan simulator rakit PC di toko ini</div>
                    </div>
                    <Switch checked={switchVal} onCheckedChange={setSwitchVal} />
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* 5. Data Table Sample */}
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-[#111413]">5. Data Tables</h2>
                <p className="text-xs text-[#525854]">
                  Tabel data untuk manajemen produk, inventaris, dan tenant toko.
                </p>
              </div>

              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Perangkat</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Harga</TableHead>
                      <TableHead>Status Stok</TableHead>
                      <TableHead style={{ textAlign: "right" }}>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { name: "Lenovo Legion Pro 5", cat: "Laptop Gaming", price: "Rp 24.500.000", status: "Tersedia", badge: "bg-green-100 text-green-800" },
                      { name: "PC Rakitan Core i5 RTX 4060", cat: "PC Desktop", price: "Rp 13.800.000", status: "Tersedia", badge: "bg-green-100 text-green-800" },
                      { name: "MacBook Air M2 256GB (Second)", cat: "Laptop Bekas", price: "Rp 12.200.000", status: "Habis", badge: "bg-red-100 text-red-800" },
                    ].map((row) => (
                      <TableRow key={row.name}>
                        <TableCell className="font-bold text-[#111413]">{row.name}</TableCell>
                        <TableCell>{row.cat}</TableCell>
                        <TableCell className="font-black text-[#cc252b]">{row.price}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${row.badge}`}>
                            {row.status}
                          </span>
                        </TableCell>
                        <TableCell style={{ textAlign: "right" }}>
                          <Button variant="outline" size="sm">Edit</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function GodModeStyleguidePage() {
  return (
    <ToastProvider>
      <GodModeStyleguideContent />
    </ToastProvider>
  );
}
