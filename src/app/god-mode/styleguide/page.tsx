"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Plus,
  Laptop,
  ArrowRight,
  Store,
  Palette,
  LayoutDashboard,
  LogOut,
  Receipt,
  Search,
  X,
  ArrowUpRight,
  ArrowDownLeft,
  Trash2,
  Pencil,
  Check,
  UploadCloud,
  Upload,
} from "lucide-react";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import { Card, CardContent } from "@/components/admin/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Switch } from "@/components/admin/ui/switch";
import { AdminPagination } from "@/components/admin/ui/pagination";
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
  const [emptySearch, setEmptySearch] = React.useState("");
  const [styleguideSearch, setStyleguideSearch] = React.useState("Lenovo Legion Pro 5");
  const [demoNavTab, setDemoNavTab] = React.useState<"ringkasan" | "mutasi" | "pengaturan">("ringkasan");
  const [demoTypeTab, setDemoTypeTab] = React.useState<"INCOME" | "EXPENSE">("INCOME");
  const [tablePage, setTablePage] = React.useState(1);
  const [tablePageSize, setTablePageSize] = React.useState(10);
  const [demoChoiceFont, setDemoChoiceFont] = React.useState("Plus Jakarta Sans");
  const [demoPresetColor, setDemoPresetColor] = React.useState("#cc252b");

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
              <span style={{ lineHeight: 1.2, fontWeight: 900, fontSize: "16px", letterSpacing: "-0.3px" }}>Rigspace</span>
              <span style={{ fontSize: "10px", color: "var(--red)", fontWeight: 800 }}>
                MASTER ENGINE
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
            <span>Dashboard Summary</span>
          </Link>
          <Link href="/god-mode/tenants" className="admin-nav-item">
            <Store size={19} />
            <span>Daftar Tenant Toko</span>
          </Link>
          <Link href="/god-mode/transactions" className="admin-nav-item">
            <Receipt size={19} />
            <span>Transaksi Keuangan</span>
          </Link>
          <Link href="/god-mode/styleguide" className="admin-nav-item active">
            <Palette size={19} />
            <span>Design Guide</span>
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
              Design Guide & UI Standards
            </span>
            <Badge variant="secondary" className="text-[11px] font-bold">
              PLATFORM STANDARD
            </Badge>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Link
              href="/god-mode"
              className="inline-flex items-center gap-1.5 px-4 h-10 text-xs font-bold rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 shadow-xs"
            >
              <span>Kembali ke Dashboard</span>
              <ArrowRight size={13} />
            </Link>

            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 h-10 px-4 text-xs font-bold"
              title="Keluar dari sesi God-Mode"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </header>

        {/* Content Body */}
        <main className="admin-main-content">
          <div className="w-full pb-28" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Header intro */}
            <div>
              <h1 className="text-2xl font-black text-[#111413] tracking-tight">
                Design Guide & UI Component Standards
              </h1>
              <p className="text-sm text-[#525854] mt-1.5">
                Standar utama dan acuan baku komponen visual, ukuran tombol, form controls, dialog modal, dan palet warna untuk seluruh pengembangan fitur di ekosistem CMS multi-tenant.
              </p>
            </div>

            {/* 1. Color Tokens */}
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-[#111413]">1. Design Tokens & Color Palette</h2>
                <p className="text-xs text-[#525854] mt-0.5">
                  Variabel tema warna utama yang bisa dikustomisasi secara dinamis per tenant / toko.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
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
                    className="bg-white border border-[#e5e5e2] rounded-2xl p-4 flex flex-col gap-3 shadow-sm"
                  >
                    <div
                      className="h-12 rounded-xl shadow-inner"
                      style={{
                        backgroundColor: c.hex,
                        border: c.hex === "#ffffff" ? "1px solid #e5e5e2" : "none",
                      }}
                    />
                    <div>
                      <div className="text-xs font-bold text-[#111413]">{c.name}</div>
                      <div className="text-[11px] font-mono text-[#525854] mt-0.5">{c.hex} ({c.var})</div>
                      <div className="text-[10px] text-[#818779] mt-1">{c.note}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <hr className="admin-section-divider" style={{ width: "100%", height: "1px", backgroundColor: "var(--border)", margin: "0", border: "none" }} />

            {/* 2. Button System */}
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-[#111413]">2. Buttons & Actions</h2>
                <p className="text-xs text-[#525854] mt-0.5">
                  Varian tombol composable berbasis arsitektur Shadcn UI dengan aturan ukuran standar baku.
                </p>
              </div>

              <Card className="shadow-sm border-[#e5e5e2] rounded-2xl overflow-hidden">
                <CardContent className="p-8">
                  {/* Variant Row */}
                  <div className="flex flex-wrap items-center gap-4">
                    <Button variant="default">Primary Button</Button>
                    <Button variant="secondary">Secondary Button</Button>
                    <Button variant="outline">Outline Button</Button>
                    <Button variant="destructive">Destructive Button</Button>
                    <Button variant="ghost">Ghost Button</Button>
                    <Button disabled>Disabled Button</Button>
                  </div>

                  {/* Inner Divider with clear vertical margins */}
                  <hr className="admin-inner-divider" style={{ width: "100%", height: "1px", backgroundColor: "var(--border)", margin: "28px 0", border: "none" }} />

                  {/* Size & Icon Row */}
                  <div className="flex flex-wrap items-center gap-4">
                    <Button size="sm" className="flex items-center gap-2">
                      <Plus size={14} />
                      <span>Small with Icon (h-8)</span>
                    </Button>
                    <Button size="default" className="flex items-center gap-2">
                      <Sparkles size={16} />
                      <span>Default with Icon (h-10)</span>
                    </Button>
                    <Button size="lg" className="flex items-center gap-2">
                      <Laptop size={18} />
                      <span>Large CTA Button (h-11)</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="default"
                      onClick={() => toast.success("Toast Berhasil Dipanggil!")}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle2 size={16} className="text-green-600" />
                      <span>Test Trigger Toast</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </section>

            <hr className="admin-section-divider" style={{ width: "100%", height: "1px", backgroundColor: "var(--border)", margin: "0", border: "none" }} />

            {/* 3. Tabs Navigation System (Active vs Inactive) */}
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-[#111413]">3. Tabs Navigation (Active & Inactive State)</h2>
                <p className="text-xs text-[#525854] mt-0.5">
                  Standar komponen tab navigasi dan tab segmented tombol aksi. Tab aktif wajib memiliki background solid kontras, border halus, dan bayangan elevasi.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Demo Tab 1: Platform Navigation Tabs */}
                <Card className="shadow-sm border-[#e5e5e2] rounded-2xl p-6 flex flex-col gap-4">
                  <div>
                    <h3 className="text-xs font-bold text-[#111413] uppercase tracking-wide">A. Platform Navigation Tabs</h3>
                    <p className="text-[11px] text-[#525854] mt-0.5">Tab navigasi antar halaman atau panel pengaturan CMS.</p>
                  </div>

                  <div className="admin-tabs-list" style={{ display: "inline-flex", backgroundColor: "#f1f3ed", padding: "4px", borderRadius: "10px", border: "1px solid var(--border)", gap: "4px" }}>
                    <button
                      type="button"
                      onClick={() => setDemoNavTab("ringkasan")}
                      className={`admin-tab-trigger ${demoNavTab === "ringkasan" ? "active" : ""}`}
                    >
                      <LayoutDashboard size={14} />
                      <span>Ringkasan {demoNavTab === "ringkasan" ? "(Active)" : ""}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDemoNavTab("mutasi")}
                      className={`admin-tab-trigger ${demoNavTab === "mutasi" ? "active" : ""}`}
                    >
                      <Receipt size={14} />
                      <span>Mutasi Kas {demoNavTab === "mutasi" ? "(Active)" : ""}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDemoNavTab("pengaturan")}
                      className={`admin-tab-trigger ${demoNavTab === "pengaturan" ? "active" : ""}`}
                    >
                      <Store size={14} />
                      <span>Pengaturan {demoNavTab === "pengaturan" ? "(Active)" : ""}</span>
                    </button>
                  </div>

                  <div className="text-[11px] text-[#818779] bg-[#fafafa] p-3 rounded-lg border border-[#e5e5e2] leading-relaxed">
                    <strong>Aturan Visual:</strong> Tab aktif berlatar belakang putih murni (<code className="font-mono text-red-600 font-bold">#ffffff</code>), teks merah/hitam tegas, dengan shadow elevasi halus. Tab inaktif berlatar transparan dengan teks muted (<code className="font-mono">#525854</code>).
                  </div>
                </Card>

                {/* Demo Tab 2: Segmented Action Choice Tabs */}
                <Card className="shadow-sm border-[#e5e5e2] rounded-2xl p-6 flex flex-col gap-4">
                  <div>
                    <h3 className="text-xs font-bold text-[#111413] uppercase tracking-wide">B. Segmented Choice Tabs (Full-Width)</h3>
                    <p className="text-[11px] text-[#525854] mt-0.5">Tab pilihan binary dalam modal popup form (misal: Pemasukan vs Pengeluaran).</p>
                  </div>

                  <div className="admin-tabs-list full-width" style={{ width: "100%", display: "flex", backgroundColor: "#f1f3ed", padding: "4px", borderRadius: "10px", border: "1px solid var(--border)", gap: "4px" }}>
                    <button
                      type="button"
                      onClick={() => setDemoTypeTab("INCOME")}
                      className={`admin-tab-trigger ${demoTypeTab === "INCOME" ? "active-income" : ""}`}
                      style={{ flex: 1, height: "38px", fontSize: "13px", fontWeight: 700 }}
                    >
                      <ArrowUpRight size={15} />
                      <span>Pemasukan (+) {demoTypeTab === "INCOME" ? "✓" : ""}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDemoTypeTab("EXPENSE")}
                      className={`admin-tab-trigger ${demoTypeTab === "EXPENSE" ? "active-expense" : ""}`}
                      style={{ flex: 1, height: "38px", fontSize: "13px", fontWeight: 700 }}
                    >
                      <ArrowDownLeft size={15} />
                      <span>Pengeluaran (-) {demoTypeTab === "EXPENSE" ? "✓" : ""}</span>
                    </button>
                  </div>

                  <div className="text-[11px] text-[#818779] bg-[#fafafa] p-3 rounded-lg border border-[#e5e5e2] leading-relaxed">
                    <strong>Aturan Visual:</strong> Tab tersegmentasi memiliki lebar seimbang (<code className="font-mono font-bold">flex: 1</code>), tinggi 38px, dan indikator warna tematik (Hijau untuk Pemasukan, Merah untuk Pengeluaran).
                  </div>
                </Card>
              </div>
            </section>

            <hr className="admin-section-divider" style={{ width: "100%", height: "1px", backgroundColor: "var(--border)", margin: "0", border: "none" }} />

            {/* 4. Status Badges */}
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-[#111413]">4. Status Badges</h2>
                <p className="text-xs text-[#525854] mt-0.5">
                  Label status inventaris, kondisi perangkat, dan paket langganan multi-tenant.
                </p>
              </div>

              <Card className="shadow-sm border-[#e5e5e2] rounded-2xl overflow-hidden">
                <CardContent className="p-8 flex flex-wrap gap-4 items-center">
                  <Badge variant="default" className="px-3 py-1 text-xs">Primary</Badge>
                  <Badge variant="secondary" className="px-3 py-1 text-xs">Secondary</Badge>
                  <Badge variant="success" className="px-3 py-1 text-xs">Success</Badge>
                  <Badge variant="warning" className="px-3 py-1 text-xs">Warning</Badge>
                  <Badge variant="destructive" className="px-3 py-1 text-xs">Danger / Habis</Badge>
                  <Badge variant="info" className="px-3 py-1 text-xs">Info</Badge>
                  <Badge variant="purple" className="px-3 py-1 text-xs">Purple</Badge>
                  <Badge variant="outline" className="px-3 py-1 text-xs">Outline</Badge>
                </CardContent>
              </Card>
            </section>

            <hr className="admin-section-divider" style={{ width: "100%", height: "1px", backgroundColor: "var(--border)", margin: "0", border: "none" }} />

            {/* 5. Form Inputs & Controls */}
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-[#111413]">5. Form Inputs & Controls</h2>
                <p className="text-xs text-[#525854] mt-0.5">
                  Field input form dengan margin dan padding proporsional. Seluruh input angka wajib terformat secara otomatis (Currency Input).
                </p>
              </div>

              <Card className="shadow-sm border-[#e5e5e2] rounded-2xl overflow-hidden">
                <CardContent className="p-8">
                  {/* Grid layout with explicit 24px gap across both rows and columns */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <Label htmlFor="demo-name" className="text-xs font-bold text-[#111413]">Nama Produk</Label>
                      <Input id="demo-name" placeholder="e.g. ASUS ROG Strix G16" defaultValue="ASUS ROG Strix G16 (2024)" />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="demo-price" className="text-xs font-bold text-[#111413]">Harga Produk (Auto Currency Formatter)</Label>
                        <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                          Auto-Formatted
                        </span>
                      </div>
                      <CurrencyInput
                        id="demo-price"
                        name="price"
                        value={currencyVal}
                        onValueChange={(val) => setCurrencyVal(val)}
                        placeholder="Rp 0"
                      />
                      <p className="text-[11px] text-[#818779]">
                        Mengetik angka otomatis diberi pemisah ribuan titik (<code className="font-mono">Rp 12.500.000</code>).
                      </p>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <Label htmlFor="demo-category" className="text-xs font-bold text-[#111413]">Kategori Perangkat</Label>
                      <Select id="demo-category" defaultValue="laptop">
                        <option value="laptop">Laptop & Notebook</option>
                        <option value="pc-rakitan">PC Desktop Rakitan</option>
                        <option value="gadget">Smartphone & Tablet</option>
                        <option value="aksesoris">Aksesoris & Peripheral</option>
                      </Select>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <Label className="text-xs font-bold text-[#111413]">Fitur Tambahan</Label>
                      <div className="flex items-center justify-between p-3.5 border border-[#e5e5e2] rounded-xl bg-[#fafafa]">
                        <div>
                          <div className="text-xs font-bold text-[#111413]">Aktifkan Modul PC Builder</div>
                          <div className="text-[11px] text-[#525854] mt-0.5">Tampilkan simulator rakit PC di toko ini</div>
                        </div>
                        <Switch checked={switchVal} onCheckedChange={setSwitchVal} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <hr className="admin-section-divider" style={{ width: "100%", height: "1px", backgroundColor: "var(--border)", margin: "0", border: "none" }} />

            {/* 6. Search Inputs & Filter Toolbars */}
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-[#111413]">6. Search Inputs & Filter Toolbars</h2>
                <p className="text-xs text-[#525854] mt-0.5">
                  Komponen input pencarian dengan icon magnifying glass presisi di tengah, tombol pembersih (clear X), dan layout toolbar filter.
                </p>
              </div>

              <Card className="shadow-sm border-[#e5e5e2] rounded-2xl overflow-hidden">
                <CardContent className="p-8 space-y-6">
                  {/* Standalone Search Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <Label className="text-xs font-bold text-[#111413]">Search Input (Kondisi Kosong / Default)</Label>
                      <div className="admin-input-wrapper">
                        <span className="admin-input-icon-left">
                          <Search size={16} />
                        </span>
                        <input
                          type="text"
                          placeholder="Cari perangkat, tenant, atau transaksi..."
                          value={emptySearch}
                          onChange={(e) => setEmptySearch(e.target.value)}
                          className={`admin-input-styled has-left-icon ${emptySearch ? "has-right-icon" : ""}`}
                          style={{ height: "40px", fontSize: "13px" }}
                        />
                        {emptySearch && (
                          <button
                            type="button"
                            onClick={() => setEmptySearch("")}
                            className="admin-password-toggle-btn"
                            title="Hapus pencarian"
                            style={{ right: "10px" }}
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-[#818779]">
                        Icon pencarian presisi vertikal 50% dan padding teks kiri 40px otomatis.
                      </p>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <Label className="text-xs font-bold text-[#111413]">Search Input (Kondisi Terisi dengan Tombol Clear)</Label>
                      <div className="admin-input-wrapper">
                        <span className="admin-input-icon-left">
                          <Search size={16} />
                        </span>
                        <input
                          type="text"
                          placeholder="Cari..."
                          value={styleguideSearch}
                          onChange={(e) => setStyleguideSearch(e.target.value)}
                          className={`admin-input-styled has-left-icon ${styleguideSearch ? "has-right-icon" : ""}`}
                          style={{ height: "40px", fontSize: "13px" }}
                        />
                        {styleguideSearch && (
                          <button
                            type="button"
                            onClick={() => setStyleguideSearch("")}
                            className="admin-password-toggle-btn"
                            title="Hapus pencarian"
                            style={{ right: "10px" }}
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-[#818779]">
                        Klik tombol silang di kanan untuk mereset query pencarian.
                      </p>
                    </div>
                  </div>

                  {/* Complete Toolbar Example */}
                  <hr className="admin-inner-divider" style={{ width: "100%", height: "1px", backgroundColor: "var(--border)", margin: "24px 0", border: "none" }} />

                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-[#111413]">Pola Lengkap: Filter Toolbar di Halaman Data</Label>
                    <div className="p-4 border border-[#e5e5e2] rounded-xl bg-[#fafafa] flex flex-col md:flex-row gap-3 items-center justify-between">
                      <div className="admin-input-wrapper w-full md:w-80">
                        <span className="admin-input-icon-left">
                          <Search size={16} />
                        </span>
                        <input
                          type="text"
                          placeholder="Cari toko, subdomain, atau ID..."
                          defaultValue=""
                          className="admin-input-styled has-left-icon"
                          style={{ height: "40px", fontSize: "12px", backgroundColor: "#ffffff" }}
                        />
                      </div>

                      <div className="flex items-center gap-2.5 w-full md:w-auto">
                        <Select defaultValue="ALL" className="text-xs h-10 w-36 bg-white">
                          <option value="ALL">Semua Paket</option>
                          <option value="STARTER">Starter</option>
                          <option value="PRO">Pro</option>
                          <option value="ENTERPRISE">Enterprise</option>
                        </Select>

                        <Button className="h-10 px-4 text-xs font-bold flex items-center gap-1.5">
                          <Plus size={15} />
                          <span>Aksi Cepat</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <hr className="admin-section-divider" style={{ width: "100%", height: "1px", backgroundColor: "var(--border)", margin: "0", border: "none" }} />

            {/* 7. Selectable Option Cards & Color Presets */}
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-[#111413]">7. Selectable Option Cards & Color Presets</h2>
                <p className="text-xs text-[#525854] mt-0.5">
                  Standar kartu pilihan opsi (Radio Choice Cards) dengan indikator centang besar dan tombol preset swatch warna tema.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 7.A Selectable Choice Cards */}
                <Card className="shadow-sm border-[#e5e5e2] rounded-2xl p-6 flex flex-col gap-4">
                  <div>
                    <h3 className="text-xs font-bold text-[#111413] uppercase tracking-wide">A. Selectable Choice Cards (.admin-choice-card)</h3>
                    <p className="text-[11px] text-[#525854] mt-0.5">Klik salah satu kartu untuk mengaktifkan opsi. Item aktif memiliki border merah dan centang putih menonjol.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { id: "Plus Jakarta Sans", name: "Plus Jakarta Sans", cat: "Modern & Clean", desc: "Sangat nyaman dibaca di mobile dan seimbang." },
                      { id: "Outfit", name: "Outfit", cat: "Tech-Forward", desc: "Karakter tajam cocok untuk PC gaming." },
                    ].map((f) => {
                      const isSelected = demoChoiceFont === f.id;
                      return (
                        <div
                          key={f.id}
                          onClick={() => setDemoChoiceFont(f.id)}
                          className={`admin-choice-card ${isSelected ? "is-active" : ""}`}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="flex flex-col gap-1 pr-7">
                            <span className="font-bold text-sm text-[#111413] leading-tight">{f.name}</span>
                            <span className="text-[10px] font-bold text-[#818779] leading-tight">{f.cat}</span>
                          </div>
                          <div className="admin-choice-indicator" title={isSelected ? "Item Aktif" : "Klik untuk Pilih"}>
                            {isSelected && <Check size={16} strokeWidth={3} className="text-white" />}
                          </div>
                          <p className="text-[11.5px] text-[#525854] mt-2.5 leading-relaxed">{f.desc}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="text-[11px] text-[#818779] bg-[#fafafa] p-3 rounded-lg border border-[#e5e5e2] leading-relaxed">
                    <strong>Aturan Visual:</strong> Wajib menggunakan class <code className="font-mono text-red-600 font-bold">.admin-choice-card</code> dan <code className="font-mono text-red-600 font-bold">.is-active</code>. Icon centang aktif berukuran besar (lingkaran 24px, icon 16px) dengan background solid merah platform.
                  </div>
                </Card>

                {/* 7.B Color Preset Chips */}
                <Card className="shadow-sm border-[#e5e5e2] rounded-2xl p-6 flex flex-col gap-4">
                  <div>
                    <h3 className="text-xs font-bold text-[#111413] uppercase tracking-wide">B. Color Preset Selector Chips (.admin-color-preset-btn)</h3>
                    <p className="text-[11px] text-[#525854] mt-0.5">Tombol chip preset warna tema dengan swatch kotak dan hex label terformat.</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      { name: "Hadi Crimson", hex: "#cc252b" },
                      { name: "Bitcom Cobalt", hex: "#0066cc" },
                      { name: "Emerald GeForce", hex: "#10b981" },
                      { name: "Cyber Violet", hex: "#8b5cf6" },
                      { name: "Deep Obsidian", hex: "#0f172a" },
                      { name: "Amber Gold", hex: "#f59e0b" },
                    ].map((p) => {
                      const isSelected = demoPresetColor === p.hex;
                      return (
                        <button
                          type="button"
                          key={p.hex}
                          onClick={() => setDemoPresetColor(p.hex)}
                          className={`admin-color-preset-btn ${isSelected ? "is-active" : ""}`}
                          title={`Pilih tema ${p.name}`}
                        >
                          <div
                            className="admin-color-preset-swatch"
                            style={{ backgroundColor: p.hex }}
                          >
                            {isSelected && <Check size={14} strokeWidth={3} className="text-white drop-shadow-xs" />}
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-xs font-bold text-[#111413] truncate">{p.name}</span>
                            <span className="text-[10px] font-mono text-[#525854] uppercase tracking-wider">{p.hex}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="text-[11px] text-[#818779] bg-[#fafafa] p-3 rounded-lg border border-[#e5e5e2] leading-relaxed">
                    <strong>Aturan Visual:</strong> Menggunakan class <code className="font-mono text-red-600 font-bold">.admin-color-preset-btn</code>. Preset aktif ditandai outline tebal (#111413), background abu netral halus, dan centang putih di dalam kotak swatch warna.
                  </div>
                </Card>
              </div>
            </section>

            <hr className="admin-section-divider" style={{ width: "100%", height: "1px", backgroundColor: "var(--border)", margin: "0", border: "none" }} />

            {/* 8. Drag & Drop File Upload Dropzone */}
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-[#111413]">8. Drag & Drop File Upload Dropzone</h2>
                <p className="text-xs text-[#525854] mt-0.5">
                  Standar area unggah gambar dan logo dengan dukungan drag-and-drop file, status dragover, serta preview transparansi bermotif catur.
                </p>
              </div>

              <Card className="shadow-sm border-[#e5e5e2] rounded-2xl p-6 flex flex-col gap-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  {/* Dropzone Idle */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-[#111413]">State 1: Dropzone Area (.admin-dropzone)</Label>
                    <div
                      className="admin-dropzone"
                      onClick={() => toast.success("Simulasi klik: Pemilih file sistem dibuka")}
                    >
                      <UploadCloud size={36} className="text-[#818779] mx-auto mb-2" />
                      <p className="text-sm font-bold text-[#111413]">Tarik & Lepas File ke Sini</p>
                      <p className="text-xs text-[#525854] mt-1">
                        atau <span className="text-red-600 font-bold underline">klik untuk memilih dari komputer</span>
                      </p>
                      <div className="mt-2">
                        <span className="text-[10.5px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                          Format: PNG transparan, JPEG, WebP, SVG (Maksimal 2MB)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Uploaded / Preview State */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-[#111413]">State 2: File Terunggah (Preview Card)</Label>
                    <div className="p-4 border border-[#e5e5e2] rounded-xl bg-[#fafafa] flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="admin-logo-preview-box w-28 h-16 flex-shrink-0">
                          <span className="text-xs font-black text-[#111413] tracking-tighter">HADICOMPUTER</span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#111413]">logo-official.png</span>
                            <Badge variant="success" className="text-[10px]">Aktif</Badge>
                          </div>
                          <p className="text-[10.5px] text-[#818779] mt-0.5">
                            Latar catur menampilkan transparansi asset.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs font-bold flex items-center gap-1.5"
                          onClick={() => toast.success("Simulasi: Ganti file logo")}
                        >
                          <Upload size={13} />
                          <span>Ganti</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1.5"
                          onClick={() => toast.error("Simulasi: Hapus logo")}
                        >
                          <Trash2 size={13} />
                          <span>Hapus</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-[#818779] bg-[#fafafa] p-3 rounded-lg border border-[#e5e5e2] leading-relaxed">
                  <strong>Aturan Dropzone:</strong> Area drag-and-drop wajib memiliki border putus-putus (<code className="font-mono text-red-600 font-bold">border: 2px dashed #d1d5c9</code>), bereaksi saat dragover (<code className="font-mono font-bold">.is-dragging</code>), dan menampilkan preview motif catur (<code className="font-mono">.admin-logo-preview-box</code>) saat logo terpasang.
                </div>
              </Card>
            </section>

            <hr className="admin-section-divider" style={{ width: "100%", height: "1px", backgroundColor: "var(--border)", margin: "0", border: "none" }} />

            {/* 9. Data Tables & Pagination */}
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-[#111413]">9. Data Tables & Pagination</h2>
                <p className="text-xs text-[#525854] mt-0.5">
                  Tabel data baku untuk inventaris produk, mutasi kas, dan data merchant. Seluruh tabel wajib menyertakan action button 32x32px dan komponen pagination standar.
                </p>
              </div>

              <Card className="shadow-sm border-[#e5e5e2] rounded-2xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#fcfcfc]">
                      <TableHead className="py-3.5 px-6">Nama Perangkat</TableHead>
                      <TableHead className="py-3.5 px-6">Kategori</TableHead>
                      <TableHead className="py-3.5 px-6">Harga</TableHead>
                      <TableHead className="py-3.5 px-6">Status Stok</TableHead>
                      <TableHead className="py-3.5 px-6 text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { name: "Lenovo Legion Pro 5", cat: "Laptop Gaming", price: "Rp 24.500.000", status: "Tersedia", variant: "success" as const },
                      { name: "PC Rakitan Core i5 RTX 4060", cat: "PC Desktop", price: "Rp 13.800.000", status: "Tersedia", variant: "success" as const },
                      { name: "MacBook Air M2 256GB (Second)", cat: "Laptop Bekas", price: "Rp 12.200.000", status: "Habis", variant: "destructive" as const },
                    ].map((row) => (
                      <TableRow key={row.name} className="hover:bg-[#fafafa]">
                        <TableCell className="py-4 px-6 font-bold text-[#111413]">{row.name}</TableCell>
                        <TableCell className="py-4 px-6 text-sm">{row.cat}</TableCell>
                        <TableCell className="py-4 px-6 font-black text-[#cc252b]">{row.price}</TableCell>
                        <TableCell className="py-4 px-6">
                          <Badge variant={row.variant}>
                            {row.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              className="admin-action-btn"
                              title="Edit Perangkat"
                              onClick={() => toast.success(`Edit ${row.name}`)}
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              className="admin-action-btn delete"
                              title="Hapus Perangkat"
                              onClick={() => toast.error(`Hapus ${row.name}`)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Standard Admin Pagination Component */}
                <AdminPagination
                  currentPage={tablePage}
                  totalPages={5}
                  totalItems={48}
                  pageSize={tablePageSize}
                  onPageChange={(p) => setTablePage(p)}
                  onPageSizeChange={(s) => {
                    setTablePageSize(s);
                    setTablePage(1);
                  }}
                  pageSizeOptions={[10, 20, 50]}
                />
              </Card>

              <div className="text-[11px] text-[#818779] bg-[#fafafa] p-3 rounded-lg border border-[#e5e5e2] leading-relaxed">
                <strong>Standar Pagination:</strong> Seluruh tabel data wajib menyertakan footer <code className="font-mono font-bold text-red-600">&lt;AdminPagination /&gt;</code> dari <code className="font-mono">@/components/admin/ui/pagination</code> yang menyediakan navigasi page, info jumlah item, dan selector ukuran baris (10, 20, 50).
              </div>
            </section>

            <hr className="admin-section-divider" style={{ width: "100%", height: "1px", backgroundColor: "var(--border)", margin: "0", border: "none" }} />

            {/* 10. Design Standards & Developer Guide */}
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-[#111413]">10. Aturan Baku Developer Guide & UI Standards</h2>
                <p className="text-xs text-[#525854] mt-0.5">
                  Standar wajib yang harus dipatuhi oleh siapapun pengembang / AI agent saat menambahkan fitur baru agar konsistensi desain tetap terjaga.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* 1. Button Standards */}
                <Card className="shadow-sm border-[#e5e5e2] rounded-2xl p-6 flex flex-col gap-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-[#111413]">
                    <span className="w-6 h-6 rounded-md bg-red-100 text-red-700 flex items-center justify-center text-xs">1</span>
                    <span>Standar Ukuran Tombol</span>
                  </div>
                  <ul className="text-xs text-[#525854] space-y-2 leading-relaxed">
                    <li>
                      <strong>Topbar & Toolbar:</strong> Wajib tinggi baku <code className="bg-gray-100 px-1 py-0.5 rounded font-mono font-bold">h-10 (40px)</code>, padding <code className="bg-gray-100 px-1 py-0.5 rounded font-mono font-bold">px-4</code>, font <code className="bg-gray-100 px-1 py-0.5 rounded font-mono font-bold">text-xs font-bold</code>, radius <code className="bg-gray-100 px-1 py-0.5 rounded font-mono font-bold">rounded-lg</code>.
                    </li>
                    <li>
                      <strong>Table Action:</strong> Kotak simetris <code className="bg-gray-100 px-1 py-0.5 rounded font-mono font-bold">.admin-action-btn</code> ukuran <code className="bg-gray-100 px-1 py-0.5 rounded font-mono font-bold">32x32px</code> dengan icon set terpadu (Edit, Delete, dll).
                    </li>
                  </ul>
                </Card>

                {/* 2. Number Formatting Standards */}
                <Card className="shadow-sm border-[#e5e5e2] rounded-2xl p-6 flex flex-col gap-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-[#111413]">
                    <span className="w-6 h-6 rounded-md bg-green-100 text-green-700 flex items-center justify-center text-xs">2</span>
                    <span>Format Angka (Currency)</span>
                  </div>
                  <ul className="text-xs text-[#525854] space-y-2 leading-relaxed">
                    <li>
                      <strong>Wajib Format Ribuan:</strong> Seluruh input angka atau nominal uang WAJIB menggunakan <code className="bg-gray-100 px-1 py-0.5 rounded font-mono font-bold">CurrencyInput</code> dari <code className="bg-gray-100 px-1 py-0.5 rounded font-mono font-bold">@/components/ui/currency-input</code>.
                    </li>
                    <li>
                      <strong>Real-Time Formatting:</strong> Otomatis menampilkan pemisah ribuan (<code className="bg-gray-100 px-1 py-0.5 rounded font-mono font-bold">Rp 250.000</code>), namun nilai state tersimpan bersih sebagai string digit numerik murni.
                    </li>
                  </ul>
                </Card>

                {/* 3. Tabs Navigation Standards */}
                <Card className="shadow-sm border-[#e5e5e2] rounded-2xl p-6 flex flex-col gap-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-[#111413]">
                    <span className="w-6 h-6 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center text-xs">3</span>
                    <span>Standar Tab Aktif & Inaktif</span>
                  </div>
                  <ul className="text-xs text-[#525854] space-y-2 leading-relaxed">
                    <li>
                      <strong>Tab Aktif:</strong> Latar putih <code className="bg-gray-100 px-1 py-0.5 rounded font-mono font-bold">#ffffff</code>, teks tegas/warna tematik, berbayang halus (<code className="bg-gray-100 px-1 py-0.5 rounded font-mono font-bold">box-shadow</code>) dan berborder tipis.
                    </li>
                    <li>
                      <strong>Tab Inaktif:</strong> Latar transparan, teks netral abu-abu (<code className="bg-gray-100 px-1 py-0.5 rounded font-mono font-bold">#525854</code>), bereaksi saat hover kursor.
                    </li>
                  </ul>
                </Card>

                {/* 4. Margin & Spacing Standards */}
                <Card className="shadow-sm border-[#e5e5e2] rounded-2xl p-6 flex flex-col gap-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-[#111413]">
                    <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center text-xs">4</span>
                    <span>Margin & Spacing Baku</span>
                  </div>
                  <ul className="text-xs text-[#525854] space-y-2 leading-relaxed">
                    <li>
                      <strong>Antar Section:</strong> Jarak vertikal maksimal <code className="bg-gray-100 px-1 py-0.5 rounded font-mono font-bold">32px</code> dengan divider pemisah <code className="bg-gray-100 px-1 py-0.5 rounded font-mono font-bold">.admin-section-divider</code>.
                    </li>
                    <li>
                      <strong>Dalam Card / Form:</strong> Jarak grid kolom & baris wajib <code className="bg-gray-100 px-1 py-0.5 rounded font-mono font-bold">24px</code>, jarak label ke field input <code className="bg-gray-100 px-1 py-0.5 rounded font-mono font-bold">8px</code>.
                    </li>
                  </ul>
                </Card>

                {/* 5. Choice Cards & Preset Swatches */}
                <Card className="shadow-sm border-[#e5e5e2] rounded-2xl p-6 flex flex-col gap-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-[#111413]">
                    <span className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center text-xs">5</span>
                    <span>Choice Cards & Swatches</span>
                  </div>
                  <ul className="text-xs text-[#525854] space-y-2 leading-relaxed">
                    <li>
                      <strong>Choice Card:</strong> Wajib <code className="bg-gray-100 px-1 py-0.5 rounded font-mono font-bold">.admin-choice-card</code> dengan icon centang aktif besar (<code className="bg-gray-100 px-1 py-0.5 rounded font-mono font-bold">size 16px</code>).
                    </li>
                    <li>
                      <strong>Color Presets:</strong> Wajib <code className="bg-gray-100 px-1 py-0.5 rounded font-mono font-bold">.admin-color-preset-btn</code> dengan kotak swatch dan outline tebal saat terpilih.
                    </li>
                  </ul>
                </Card>

                {/* 6. Drag & Drop File Upload */}
                <Card className="shadow-sm border-[#e5e5e2] rounded-2xl p-6 flex flex-col gap-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-[#111413]">
                    <span className="w-6 h-6 rounded-md bg-teal-100 text-teal-700 flex items-center justify-center text-xs">6</span>
                    <span>Drag & Drop File Upload</span>
                  </div>
                  <ul className="text-xs text-[#525854] space-y-2 leading-relaxed">
                    <li>
                      <strong>Area Dropzone:</strong> Wajib <code className="bg-gray-100 px-1 py-0.5 rounded font-mono font-bold">.admin-dropzone</code> bergaris putus-putus, responsif terhadap event drag-over.
                    </li>
                    <li>
                      <strong>Preview Logo:</strong> Wajib menampilkan motif kotak catur transparan (<code className="bg-gray-100 px-1 py-0.5 rounded font-mono font-bold">.admin-logo-preview-box</code>) dengan tombol ganti/hapus.
                    </li>
                  </ul>
                </Card>
              </div>
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
