"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Store,
  Plus,
  ExternalLink,
  Laptop,
  Cpu,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Layers,
  CheckCircle2,
  ChevronDown,
  LogOut,
  Palette,
  LayoutDashboard,
  Receipt,
  Building,
  Zap,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  PieChart,
  ShieldCheck,
  Activity,
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
    primaryColor: string;
    whatsappNumber: string;
  } | null;
  _count?: {
    products: number;
    categories: number;
  };
  createdAt: string;
}

interface FinancialStats {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  count: number;
}

function GodModeExecutiveSummary() {
  const router = useRouter();
  const toast = useToast();

  const [tenants, setTenants] = React.useState<TenantData[]>([]);
  const [financeStats, setFinanceStats] = React.useState<FinancialStats>({
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0,
    count: 0,
  });
  const [loading, setLoading] = React.useState(true);

  // Topbar Dropdown
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const fetchSummary = React.useCallback(async () => {
    try {
      setLoading(true);
      const [resTenants, resFinance] = await Promise.all([
        fetch("/api/god-mode/tenants"),
        fetch("/api/god-mode/transactions"),
      ]);

      const dataTenants = await resTenants.json();
      if (dataTenants.tenants) setTenants(dataTenants.tenants);

      const dataFinance = await resFinance.json();
      if (dataFinance.stats) setFinanceStats(dataFinance.stats);
    } catch (err) {
      console.error("Failed to load executive summary:", err);
      toast.error("Gagal memuat ringkasan eksekutif.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  // Impersonate / Login as Tenant
  async function handleImpersonate(tenantId: string) {
    try {
      const res = await fetch("/api/god-mode/auth/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal beralih ke CMS merchant");

      toast.success(`Beralih ke CMS ${data.tenant?.name || "Merchant"}!`);
      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Gagal melakukan impersonasi");
    }
  }

  // Aggregated Metrics
  const totalTenants = tenants.length;
  const activeTenants = tenants.filter((t) => t.status === "ACTIVE").length;
  const proTenants = tenants.filter((t) => t.plan === "PRO").length;
  const starterTenants = tenants.filter((t) => t.plan === "STARTER").length;
  const enterpriseTenants = tenants.filter((t) => t.plan === "ENTERPRISE").length;
  const totalProducts = tenants.reduce((acc, t) => acc + (t._count?.products || 0), 0);
  const pcBuilderActive = tenants.filter((t) => !!t.features.pcBuilder).length;
  const tradeInActive = tenants.filter((t) => !!t.features.tradeIn).length;
  const estimatedMRR = tenants.reduce((sum, t) => {
    if (t.plan === "PRO") return sum + 232500;
    if (t.plan === "STARTER") return sum + 124000;
    if (t.plan === "ENTERPRISE") return sum + 408000;
    return sum;
  }, 0);

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
          <Link href="/god-mode" className="admin-nav-item active">
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
          <Link href="/god-mode/styleguide" className="admin-nav-item">
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
            Rigspace.id
            <br />
            <strong>The OS for PC Retailers</strong>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Topbar with Impersonation Dropdown */}
        <header className="admin-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--ink)" }}>
              Pusat Kendali Eksekutif Platform
            </span>
            <Badge variant="default" className="text-[11px] bg-red-600">
              SUPERADMIN
            </Badge>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            {/* Topbar Dropdown Switcher */}
            <div ref={dropdownRef} style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  height: "40px",
                  padding: "0 14px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  backgroundColor: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "var(--ink)",
                  cursor: "pointer",
                  boxShadow: "var(--shadow-xs)",
                  boxSizing: "border-box",
                }}
              >
                <Store size={16} className="text-[#cc252b]" />
                <span>Masuk CMS Merchant</span>
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
                    PILIH TOKO UNTUK DIKELOLA (CMS)
                  </div>

                  <div style={{ maxHeight: "240px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "2px" }}>
                    {tenants.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          handleImpersonate(t.id);
                        }}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 10px",
                          borderRadius: "8px",
                          backgroundColor: "transparent",
                          border: "none",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "background-color 0.15s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                          <span
                            style={{
                              width: "9px",
                              height: "9px",
                              borderRadius: "50%",
                              backgroundColor: t.settings?.primaryColor || "#cc252b",
                              flexShrink: 0,
                            }}
                          />
                          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {t.name}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 800,
                            backgroundColor: "#fee2e2",
                            color: "#b91c1c",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            flexShrink: 0,
                          }}
                        >
                          Buka CMS ↗
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

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
          <div className="space-y-8 w-full pb-20">
            {/* Header Title */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-[#111413] tracking-tight">
                  Executive Dashboard & SaaS Summary
                </h1>
                <p className="text-sm text-[#525854] mt-1">
                  Laporan performa makro platform multi-tenant: metrik langganan merchant, adopsi modul, dan ringkasan arus kas keuangan.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link href="/god-mode/transactions">
                  <Button variant="outline" className="flex items-center gap-1.5 text-xs font-semibold h-10 px-4">
                    <Receipt size={14} />
                    <span>Lihat Mutasi Keuangan</span>
                  </Button>
                </Link>
                <Link href="/god-mode/tenants">
                  <Button className="flex items-center gap-1.5 text-xs font-bold h-10 px-4">
                    <Store size={14} />
                    <span>Daftar Seluruh Merchant</span>
                    <ArrowRight size={13} />
                  </Button>
                </Link>
              </div>
            </div>

            {/* 1. Core KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Active Tenants */}
              <Card className="border-[#e5e5e2] shadow-sm rounded-2xl">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-[#818779]">Merchant / Toko Aktif</div>
                    <div className="text-2xl font-black text-[#111413] mt-1">
                      {activeTenants} Toko
                    </div>
                    <div className="text-[11px] text-green-700 font-bold flex items-center gap-1 mt-1">
                      <CheckCircle2 size={12} />
                      <span>100% Online & Terhubung</span>
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-red-50 text-red-700 flex items-center justify-center font-bold">
                    <Store size={22} />
                  </div>
                </CardContent>
              </Card>

              {/* Total Catalog Products */}
              <Card className="border-[#e5e5e2] shadow-sm rounded-2xl">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-[#818779]">Total Produk Ekosistem</div>
                    <div className="text-2xl font-black text-[#111413] mt-1">
                      {totalProducts} Unit
                    </div>
                    <div className="text-[11px] text-[#525854] mt-1">Di seluruh merchant platform</div>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                    <Laptop size={22} />
                  </div>
                </CardContent>
              </Card>

              {/* Estimated MRR */}
              <Card className="border-[#e5e5e2] shadow-sm rounded-2xl">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-[#818779]">Estimasi Nilai SaaS (MRR)</div>
                    <div className="text-2xl font-black text-[#111413] mt-1">
                      Rp {estimatedMRR.toLocaleString("id-ID")}
                    </div>
                    <div className="text-[11px] text-[#cc252b] font-bold mt-1">
                      Rp {(estimatedMRR * 12).toLocaleString("id-ID")} / thn (ARR)
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                    <TrendingUp size={22} />
                  </div>
                </CardContent>
              </Card>

              {/* Net Cashflow */}
              <Card className="border-[#e5e5e2] shadow-sm rounded-2xl">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-[#818779]">Saldo Bersih Platform</div>
                    <div className="text-2xl font-black text-green-700 mt-1">
                      Rp {financeStats.netProfit.toLocaleString("id-ID")}
                    </div>
                    <div className="text-[11px] text-green-600 font-bold mt-1">
                      {financeStats.count} transaksi tercatat
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-green-50 text-green-700 flex items-center justify-center font-bold">
                    <DollarSign size={22} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 2. Breakdown Section: Plan Distribution & Feature Adoption */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Plan Distribution */}
              <Card className="border-[#e5e5e2] shadow-sm rounded-2xl">
                <CardHeader className="p-6 pb-4 border-b border-[#e5e5e2]">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>Distribusi Paket Langganan</span>
                    <Badge variant="outline" className="text-xs font-bold">
                      {totalTenants} Total Tenant
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Komposisi tier lisensi merchant yang aktif di ekosistem platform.
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6 space-y-5">
                  {/* Pro Plan */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-2 text-red-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                        <span>Paket PRO (Rp 2,79 Jt / thn)</span>
                      </span>
                      <span>{proTenants} Toko ({totalTenants > 0 ? Math.round((proTenants / totalTenants) * 100) : 0}%)</span>
                    </div>
                    <div className="w-full bg-[#f0f0ee] h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-red-600 h-full rounded-full transition-all"
                        style={{ width: `${totalTenants > 0 ? (proTenants / totalTenants) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Starter Plan */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-2 text-gray-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-gray-500" />
                        <span>Paket STARTER (Rp 1,49 Jt / thn)</span>
                      </span>
                      <span>{starterTenants} Toko ({totalTenants > 0 ? Math.round((starterTenants / totalTenants) * 100) : 0}%)</span>
                    </div>
                    <div className="w-full bg-[#f0f0ee] h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gray-500 h-full rounded-full transition-all"
                        style={{ width: `${totalTenants > 0 ? (starterTenants / totalTenants) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Enterprise Plan */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-2 text-purple-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                        <span>Paket ENTERPRISE (Rp 4,9 Jt / thn)</span>
                      </span>
                      <span>{enterpriseTenants} Toko ({totalTenants > 0 ? Math.round((enterpriseTenants / totalTenants) * 100) : 0}%)</span>
                    </div>
                    <div className="w-full bg-[#f0f0ee] h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-purple-600 h-full rounded-full transition-all"
                        style={{ width: `${totalTenants > 0 ? (enterpriseTenants / totalTenants) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Killer Feature Adoption */}
              <Card className="border-[#e5e5e2] shadow-sm rounded-2xl">
                <CardHeader className="p-6 pb-4 border-b border-[#e5e5e2]">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>Adopsi Modul Unggulan (Killer Features)</span>
                    <Badge variant="outline" className="text-xs font-bold border-green-300 text-green-700 bg-green-50">
                      Real-time Modular
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Tingkat aktivasi fitur diferensiasi vertikal komputer pada seluruh merchant.
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between p-3.5 border border-[#e5e5e2] rounded-xl bg-[#fafafa]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold">
                        <Cpu size={18} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#111413]">PC Builder Simulator</div>
                        <div className="text-[11px] text-[#525854]">Simulator rakit PC interaktif</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-[#111413]">{pcBuilderActive} Toko</div>
                      <div className="text-[10px] text-green-700 font-bold">
                        {totalTenants > 0 ? Math.round((pcBuilderActive / totalTenants) * 100) : 0}% Aktif
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3.5 border border-[#e5e5e2] rounded-xl bg-[#fafafa]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                        <Layers size={18} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#111413]">Kalkulator Trade-In Laptop</div>
                        <div className="text-[11px] text-[#525854]">Estimasi tukar tambah perangkat bekas</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-[#111413]">{tradeInActive} Toko</div>
                      <div className="text-[10px] text-green-700 font-bold">
                        {totalTenants > 0 ? Math.round((tradeInActive / totalTenants) * 100) : 0}% Aktif
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 3. Financial Snapshot Banner */}
            <Card className="border-[#e5e5e2] shadow-sm rounded-2xl overflow-hidden bg-gradient-to-r from-[#111413] to-[#252827] text-white">
              <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-red-600 text-white uppercase tracking-wider">
                    Ringkasan Keuangan
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-white">
                    Pemasukan Rp {financeStats.totalIncome.toLocaleString("id-ID")} vs Pengeluaran Rp {financeStats.totalExpense.toLocaleString("id-ID")}
                  </h3>
                  <p className="text-xs text-gray-300 max-w-xl">
                    Arus kas platform dalam kondisi surplus positif dengan laba bersih operasional{" "}
                    <strong className="text-green-400">Rp {financeStats.netProfit.toLocaleString("id-ID")}</strong>.
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <Link href="/god-mode/transactions">
                    <Button className="bg-white text-[#111413] hover:bg-gray-100 font-bold text-xs h-9">
                      <span>Buka Pembukuan Transaksi</span>
                      <ArrowRight size={14} className="ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* 4. Quick Merchant Spotlight */}
            <Card className="border-[#e5e5e2] shadow-sm rounded-2xl">
              <CardHeader className="p-6 pb-4 border-b border-[#e5e5e2] flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Merchant Terdaftar Terbaru</CardTitle>
                  <CardDescription>
                    Akses instan untuk login ke mode CMS masing-masing merchant.
                  </CardDescription>
                </div>
                <Link href="/god-mode/tenants">
                  <Button variant="outline" size="sm" className="text-xs font-bold flex items-center gap-1">
                    <span>Lihat Semua Merchant</span>
                    <ArrowRight size={13} />
                  </Button>
                </Link>
              </CardHeader>

              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tenants.map((t) => (
                    <div
                      key={t.id}
                      className="border border-[#e5e5e2] rounded-xl p-4 flex flex-col justify-between gap-4 bg-white hover:border-gray-400 transition-all shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-xs flex-shrink-0"
                            style={{ backgroundColor: t.settings?.primaryColor || "#cc252b" }}
                          >
                            {t.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-[#111413] flex items-center gap-1.5">
                              <span>{t.name}</span>
                              {t.slug === "hadicomputer" && (
                                <span className="text-[9px] font-black uppercase bg-red-100 text-red-700 px-1 py-0.2 rounded">
                                  #1
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#818779] mt-0.5">
                              {t.customDomain || `${t.slug}.tokopc.id`}
                            </div>
                          </div>
                        </div>

                        <Badge
                          variant="outline"
                          className={
                            t.plan === "PRO"
                              ? "border-red-300 text-red-700 bg-red-50 text-[10px] font-black"
                              : "text-[10px]"
                          }
                        >
                          {t.plan}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-[#f0f0ee] text-xs">
                        <span className="text-[#818779]">
                          <strong>{t._count?.products || 0}</strong> Produk Katalog
                        </span>

                        <Button
                          size="sm"
                          onClick={() => handleImpersonate(t.id)}
                          className="h-7 px-2.5 text-xs font-bold bg-[#111413] hover:bg-black text-white flex items-center gap-1"
                        >
                          <Zap size={11} className="text-amber-400 fill-amber-400" />
                          <span>Masuk CMS</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function GodModeDashboardPage() {
  return (
    <ToastProvider>
      <GodModeExecutiveSummary />
    </ToastProvider>
  );
}
