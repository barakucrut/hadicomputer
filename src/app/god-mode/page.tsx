"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  Store,
  Sparkles,
  Plus,
  ExternalLink,
  Laptop,
  Cpu,
  ArrowRight,
  TrendingUp,
  Settings,
  Layers,
  CheckCircle2,
  AlertCircle,
  Copy,
  ChevronDown,
  ChevronRight,
  Eye,
  Trash2,
  RefreshCw,
  LogOut,
  Palette,
  Phone,
  Globe,
  Sliders,
  LayoutDashboard,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/admin/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/admin/ui/dialog";
import { useToast, ToastProvider } from "@/components/admin/ui/toast";
import "@/app/admin.css";

interface TenantData {
  id: string;
  name: string;
  slug: string;
  customDomain: string | null;
  plan: "STARTER" | "PRO" | "ENTERPRISE";
  status: "ACTIVE" | "TRIAL" | "SUSPENDED";
  features: {
    pcBuilder?: boolean;
    tradeIn?: boolean;
    instantCheckout?: boolean;
    [key: string]: boolean | undefined;
  };
  settings: {
    tagline: string | null;
    logoUrl: string | null;
    faviconUrl: string | null;
    primaryColor: string;
    secondaryColor: string;
    whatsappNumber: string;
    whatsappDefaultTemplate: string | null;
    address: string | null;
    openHours: string;
    mapsEmbedUrl: string | null;
    socialInstagram: string | null;
    socialTiktok: string | null;
    socialFacebook: string | null;
  } | null;
  _count?: {
    products: number;
    categories: number;
  };
  createdAt: string;
}

function GodModeDashboard() {
  const router = useRouter();
  const toast = useToast();
  const [tenants, setTenants] = React.useState<TenantData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedTenantId, setSelectedTenantId] = React.useState<string>("all");
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  // Form New Tenant State
  const [newName, setNewName] = React.useState("");
  const [newSlug, setNewSlug] = React.useState("");
  const [newDomain, setNewDomain] = React.useState("");
  const [newPlan, setNewPlan] = React.useState<"STARTER" | "PRO" | "ENTERPRISE">("PRO");
  const [newPhone, setNewPhone] = React.useState("628");
  const [newColor, setNewColor] = React.useState("#cc252b");
  const [newFeatures, setNewFeatures] = React.useState({
    pcBuilder: true,
    tradeIn: true,
    instantCheckout: false,
  });

  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Load Tenants
  const fetchTenants = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/god-mode/tenants");
      const data = await res.json();
      if (data.tenants) {
        setTenants(data.tenants);
      }
    } catch (err) {
      console.error("Failed to load tenants:", err);
      toast.error("Gagal memuat daftar tenant toko.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

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

  // Close dropdown when click outside
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-generate slug from name
  function handleNameChange(val: string) {
    setNewName(val);
    const slug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setNewSlug(slug);
  }

  // Handle Add Tenant
  async function handleAddTenant(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !newSlug.trim()) {
      toast.error("Nama toko dan slug subdomain wajib diisi!");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/god-mode/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          slug: newSlug,
          customDomain: newDomain || undefined,
          plan: newPlan,
          primaryColor: newColor,
          whatsappNumber: newPhone,
          features: newFeatures,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat tenant");

      toast.success(`Toko ${newName} berhasil dibuat!`);
      setIsAddModalOpen(false);
      // Reset form
      setNewName("");
      setNewSlug("");
      setNewDomain("");
      setNewPhone("628");
      setNewColor("#cc252b");
      fetchTenants();
    } catch (err: any) {
      toast.error(err.message || "Gagal membuat toko baru.");
    } finally {
      setSubmitting(false);
    }
  }

  // Toggle Feature Flag
  async function handleToggleFeature(tenantId: string, featureKey: string, currentVal: boolean) {
    const tenant = tenants.find((t) => t.id === tenantId);
    if (!tenant) return;

    const updatedFeatures = {
      ...tenant.features,
      [featureKey]: !currentVal,
    };

    // Optimistic update
    setTenants((prev) =>
      prev.map((t) => (t.id === tenantId ? { ...t, features: updatedFeatures } : t))
    );

    try {
      const res = await fetch(`/api/god-mode/tenants/${tenantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features: updatedFeatures }),
      });
      if (!res.ok) throw new Error("Gagal update fitur");
      toast.success(`Fitur ${featureKey} ${!currentVal ? "diaktifkan" : "dinonaktifkan"}`);
    } catch {
      toast.error("Gagal memperbarui fitur toggle");
      fetchTenants();
    }
  }

  const selectedTenant = tenants.find((t) => t.id === selectedTenantId);

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
          <Link href="/god-mode" className="admin-nav-item active">
            <LayoutDashboard size={19} />
            <span>Dashboard Platform</span>
          </Link>
          <a
            href="#daftar-toko"
            className="admin-nav-item"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("daftar-toko")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <Store size={19} />
            <span>Daftar Tenant Toko</span>
          </a>
          <Link href="/god-mode/styleguide" className="admin-nav-item">
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
        {/* Topbar with Tenant Switcher */}
        <header className="admin-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--ink)" }}>
              Pusat Kendali God-Mode
            </span>
            <Badge variant="default" className="text-[11px] bg-red-600">
              SUPERADMIN
            </Badge>
          </div>

          {/* Right Controls: Switcher & Add Store */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            {/* Tenant Switcher Dropdown */}
            <div ref={dropdownRef} style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "7px 14px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  backgroundColor: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "var(--ink)",
                  cursor: "pointer",
                  boxShadow: "var(--shadow-xs)",
                }}
              >
                <Store size={16} className="text-[#cc252b]" />
                <span>
                  {selectedTenantId === "all"
                    ? "Semua Tenant Toko"
                    : selectedTenant?.name || "Pilih Tenant"}
                </span>
                <ChevronDown size={14} className="text-[#818779]" />
              </button>

              {isDropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    width: "300px",
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.12), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                    zIndex: 100,
                    overflow: "hidden",
                    padding: "8px",
                  }}
                >
                  <div
                    style={{
                      padding: "6px 10px 8px 10px",
                      fontSize: "11px",
                      fontWeight: 800,
                      color: "#64748b",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}
                  >
                    Beralih Tampilan / Tenant
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTenantId("all");
                      setIsDropdownOpen(false);
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: selectedTenantId === "all" ? 800 : 600,
                      backgroundColor: selectedTenantId === "all" ? "#f1f5f9" : "transparent",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      color: "var(--ink)",
                      transition: "background-color 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (selectedTenantId !== "all") e.currentTarget.style.backgroundColor = "#f8fafc";
                    }}
                    onMouseLeave={(e) => {
                      if (selectedTenantId !== "all") e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>👑</span>
                      <span>Overview Semua Toko</span>
                    </span>
                    {selectedTenantId === "all" && <CheckCircle2 size={15} className="text-red-600" />}
                  </button>

                  <div style={{ height: "1px", backgroundColor: "#f1f5f9", margin: "6px 0" }} />

                  {tenants.length === 0 ? (
                    <div style={{ padding: "10px", textAlign: "center", fontSize: "12px", color: "var(--muted)" }}>
                      Belum ada tenant toko
                    </div>
                  ) : (
                    <div style={{ maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "2px" }}>
                      {tenants.map((t) => (
                        <div
                          key={t.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "6px 8px",
                            borderRadius: "8px",
                            backgroundColor: selectedTenantId === t.id ? "#f1f5f9" : "transparent",
                            transition: "background-color 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            if (selectedTenantId !== t.id) e.currentTarget.style.backgroundColor = "#f8fafc";
                          }}
                          onMouseLeave={(e) => {
                            if (selectedTenantId !== t.id) e.currentTarget.style.backgroundColor = "transparent";
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTenantId(t.id);
                              setIsDropdownOpen(false);
                            }}
                            style={{
                              background: "transparent",
                              border: "none",
                              fontSize: "13px",
                              fontWeight: selectedTenantId === t.id ? 800 : 600,
                              color: "var(--ink)",
                              textAlign: "left",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              flex: 1,
                              minWidth: 0,
                            }}
                          >
                            <span
                              style={{
                                width: "9px",
                                height: "9px",
                                borderRadius: "50%",
                                backgroundColor: t.settings?.primaryColor || "#cc252b",
                                flexShrink: 0,
                              }}
                            />
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {t.name}
                            </span>
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 800,
                                backgroundColor: "#e2e8f0",
                                color: "#475569",
                                padding: "1px 6px",
                                borderRadius: "4px",
                                marginLeft: "auto",
                                marginRight: "6px",
                              }}
                            >
                              {t.plan}
                            </span>
                          </button>

                          <Link
                            href="/admin"
                            title="Masuk ke Panel CMS Toko"
                            style={{
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: 700,
                              backgroundColor: "#fee2e2",
                              color: "#b91c1c",
                              textDecoration: "none",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              flexShrink: 0,
                            }}
                          >
                            <span>CMS</span>
                            <ExternalLink size={10} />
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ height: "1px", backgroundColor: "#f1f5f9", margin: "6px 0" }} />

                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsAddModalOpen(true);
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "var(--red)",
                      backgroundColor: "transparent",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background-color 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(221, 32, 40, 0.05)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <Plus size={15} />
                    <span>Tambah Toko Baru</span>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Button Add Store */}
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Plus size={16} />
              <span>Tambah Toko</span>
            </Button>

            {/* Logout Button */}
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
            {/* Header Title & Metrics */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-[#111413] tracking-tight">
                  Manajemen Tenant Toko Komputer
                </h1>
                <p className="text-sm text-[#525854] mt-1">
                  Kelola seluruh toko retailer, konfigurasi domain, paket langganan, dan aktifkan fitur modular.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchTenants}
                className="flex items-center gap-1.5 self-start"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                <span>Refresh Data</span>
              </Button>
            </div>

            {/* Metric Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-[#818779]">Total Toko Aktif</div>
                    <div className="text-2xl font-black text-[#111413] mt-1">{tenants.length} Toko</div>
                    <div className="text-[11px] text-green-700 font-bold mt-1">100% Online & Terkoneksi</div>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                    <Store size={22} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-[#818779]">Total Katalog Produk</div>
                    <div className="text-2xl font-black text-[#111413] mt-1">
                      {tenants.reduce((acc, t) => acc + (t._count?.products || 0), 0)} Unit
                    </div>
                    <div className="text-[11px] text-[#525854] mt-1">Di seluruh ekosistem tenant</div>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                    <Laptop size={22} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-[#818779]">Paket PRO / Custom PC</div>
                    <div className="text-2xl font-black text-[#111413] mt-1">
                      {tenants.filter((t) => t.plan === "PRO").length} Toko
                    </div>
                    <div className="text-[11px] text-[#cc252b] font-bold mt-1">Fitur PC Builder Aktif</div>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-red-50 text-red-700 flex items-center justify-center font-bold">
                    <Cpu size={22} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-[#818779]">Estimasi Nilai SaaS (MRR)</div>
                    <div className="text-2xl font-black text-[#111413] mt-1">
                      Rp {(tenants.length * 232500).toLocaleString("id-ID")}
                    </div>
                    <div className="text-[11px] text-green-700 font-bold mt-1">Berdasarkan paket tahunan</div>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-green-50 text-green-700 flex items-center justify-center font-bold">
                    <TrendingUp size={22} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tenants Data Table */}
            <Card id="daftar-toko">
              <CardHeader className="border-b border-[#e5e5e2] pb-4">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Daftar Tenant Toko Terdaftar</span>
                  <span className="text-xs font-normal text-[#818779]">
                    Menampilkan {tenants.length} toko
                  </span>
                </CardTitle>
                <CardDescription>
                  Setiap tenant memiliki ID SHA-1 unik, database terisolasi, dan fitur yang bisa di-toggle secara real-time.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Toko & Identitas</TableHead>
                      <TableHead>ID SHA-1 (Hex)</TableHead>
                      <TableHead>Paket</TableHead>
                      <TableHead>Fitur Modular (Real-time Toggle)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead style={{ textAlign: "right" }}>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-sm text-[#818779]">
                          Memuat data tenant...
                        </TableCell>
                      </TableRow>
                    ) : tenants.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-sm text-[#818779]">
                          Belum ada tenant toko. Klik tombol &quot;+ Tambah Toko&quot; di atas.
                        </TableCell>
                      </TableRow>
                    ) : (
                      tenants.map((t) => (
                        <TableRow key={t.id}>
                          {/* Nama & Domain */}
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div
                                style={{
                                  width: "36px",
                                  height: "36px",
                                  borderRadius: "8px",
                                  backgroundColor: t.settings?.primaryColor || "#cc252b",
                                  color: "#ffffff",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontWeight: 800,
                                  fontSize: "14px",
                                  flexShrink: 0,
                                }}
                              >
                                {t.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-[#111413] text-sm flex items-center gap-2">
                                  <span>{t.name}</span>
                                  {t.slug === "hadicomputer" && (
                                    <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700 border-red-200">
                                      Tenant #1
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-[#818779] flex items-center gap-1.5 mt-0.5">
                                  <Globe size={11} />
                                  <span>{t.customDomain || `${t.slug}.tokopc.id`}</span>
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          {/* SHA-1 ID */}
                          <TableCell>
                            <div
                              className="font-mono text-xs text-[#525854] bg-[#f6f6f4] px-2 py-1 rounded inline-flex items-center gap-1.5 max-w-[160px] truncate cursor-pointer hover:bg-gray-200 transition"
                              title={`Klik untuk salin SHA-1: ${t.id}`}
                              onClick={() => {
                                navigator.clipboard.writeText(t.id);
                                toast.success("ID SHA-1 disalin ke clipboard!");
                              }}
                            >
                              <span className="truncate">{t.id}</span>
                              <Copy size={11} className="flex-shrink-0 text-gray-500" />
                            </div>
                          </TableCell>

                          {/* Plan */}
                          <TableCell>
                            <span
                              className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                t.plan === "PRO"
                                  ? "bg-purple-100 text-purple-800"
                                  : t.plan === "ENTERPRISE"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {t.plan}
                            </span>
                          </TableCell>

                          {/* Features Toggle Switches */}
                          <TableCell>
                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-1.5 cursor-pointer text-xs" title="Modul Simulasi Racik PC">
                                <Switch
                                  checked={!!t.features?.pcBuilder}
                                  onCheckedChange={() =>
                                    handleToggleFeature(t.id, "pcBuilder", !!t.features?.pcBuilder)
                                  }
                                />
                                <span className={t.features?.pcBuilder ? "font-bold text-ink" : "text-gray-400"}>
                                  PC Builder
                                </span>
                              </label>

                              <label className="flex items-center gap-1.5 cursor-pointer text-xs" title="Modul Kalkulator Tukar Tambah Laptop">
                                <Switch
                                  checked={!!t.features?.tradeIn}
                                  onCheckedChange={() =>
                                    handleToggleFeature(t.id, "tradeIn", !!t.features?.tradeIn)
                                  }
                                />
                                <span className={t.features?.tradeIn ? "font-bold text-ink" : "text-gray-400"}>
                                  Trade-in
                                </span>
                              </label>
                            </div>
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700">
                              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                              <span>{t.status}</span>
                            </span>
                          </TableCell>

                          {/* Actions */}
                          <TableCell style={{ textAlign: "right" }}>
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href="/admin"
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold bg-[#f6f6f4] hover:bg-[#e8e8e4] text-[#111413] transition"
                              >
                                <Eye size={13} />
                                <span>Masuk CMS</span>
                              </Link>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Modal Add New Tenant */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Tenant Toko Baru</DialogTitle>
            <DialogDescription>
              Platform akan otomatis meng-generate ID SHA-1 unik 40-karakter dan mengisolasi database toko ini.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddTenant} className="space-y-4 pt-2">
            <div>
              <Label htmlFor="t-name">Nama Toko *</Label>
              <Input
                id="t-name"
                placeholder="e.g. Raja PC Surabaya"
                required
                value={newName}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="t-slug">Subdomain Identifier (Slug) *</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="t-slug"
                  placeholder="rajapc"
                  required
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                />
                <span className="text-xs text-[#818779] whitespace-nowrap">.tokopc.id</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="t-phone">Nomor WhatsApp</Label>
                <Input
                  id="t-phone"
                  placeholder="628123456789"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="t-color">Warna Brand</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="t-color"
                    type="color"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="w-10 h-9 p-0.5 rounded border border-gray-300 cursor-pointer"
                  />
                  <Input
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="font-mono text-xs uppercase"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="t-plan">Paket Langganan</Label>
              <Select
                id="t-plan"
                value={newPlan}
                onChange={(e) => setNewPlan(e.target.value as any)}
              >
                <option value="STARTER">Starter — Rp 1.49jt/th (Katalog & WA)</option>
                <option value="PRO">PRO — Rp 2.79jt/th (PC Builder & Trade-in)</option>
                <option value="ENTERPRISE">Enterprise — Rp 4.9jt/th (Custom Domain & Instant Checkout)</option>
              </Select>
            </div>

            {/* Checklist Features */}
            <div className="p-3 bg-[#f6f6f4] rounded-lg space-y-2 border border-[#e5e5e2]">
              <div className="text-xs font-bold text-[#111413]">Fitur Aktif Toko Ini:</div>
              <label className="flex items-center justify-between text-xs cursor-pointer">
                <span>Modul Simulasi Rakit PC</span>
                <Switch
                  checked={newFeatures.pcBuilder}
                  onCheckedChange={(val) => setNewFeatures({ ...newFeatures, pcBuilder: val })}
                />
              </label>
              <label className="flex items-center justify-between text-xs cursor-pointer">
                <span>Modul Kalkulator Trade-in Laptop</span>
                <Switch
                  checked={newFeatures.tradeIn}
                  onCheckedChange={(val) => setNewFeatures({ ...newFeatures, tradeIn: val })}
                />
              </label>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Membuat..." : "Buat Toko Baru"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function GodModePage() {
  return (
    <ToastProvider>
      <GodModeDashboard />
    </ToastProvider>
  );
}
