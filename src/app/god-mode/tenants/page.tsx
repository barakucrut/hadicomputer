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
  Search,
  ChevronLeft,
  Zap,
  Receipt,
  X,
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
import { Switch } from "@/components/admin/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
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

function TenantsManagementContent() {
  const router = useRouter();
  const toast = useToast();

  const [tenants, setTenants] = React.useState<TenantData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [planFilter, setPlanFilter] = React.useState("ALL");
  const [statusFilter, setStatusFilter] = React.useState("ALL");

  // Pagination State
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [editingTenant, setEditingTenant] = React.useState<TenantData | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  // Topbar Dropdown
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Form State
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

  // Feature Toggle
  async function handleToggleFeature(
    tenantId: string,
    featureKey: "pcBuilder" | "tradeIn" | "instantCheckout",
    currentVal: boolean
  ) {
    const tenant = tenants.find((t) => t.id === tenantId);
    if (!tenant) return;

    const updatedFeatures = {
      ...tenant.features,
      [featureKey]: !currentVal,
    };

    setTenants((prev) =>
      prev.map((t) =>
        t.id === tenantId ? { ...t, features: updatedFeatures } : t
      )
    );

    try {
      const res = await fetch(`/api/god-mode/tenants/${tenantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features: updatedFeatures }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan perubahan fitur");
      toast.success(`Fitur ${featureKey} untuk ${tenant.name} berhasil diperbarui.`);
    } catch (err) {
      console.error("Toggle feature error:", err);
      toast.error("Gagal memperbarui fitur. Silakan coba lagi.");
      fetchTenants();
    }
  }

  // Create Tenant
  async function handleCreateTenant(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !newSlug.trim()) {
      toast.error("Nama toko dan subdomain wajib diisi.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/god-mode/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          slug: newSlug.trim().toLowerCase(),
          customDomain: newDomain.trim() || null,
          plan: newPlan,
          primaryColor: newColor,
          whatsappNumber: newPhone.trim(),
          features: newFeatures,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat tenant");

      toast.success(`Tenant toko "${data.tenant?.name}" berhasil ditambahkan!`);
      setIsAddModalOpen(false);
      setNewName("");
      setNewSlug("");
      setNewDomain("");
      fetchTenants();
    } catch (err: any) {
      toast.error(err.message || "Gagal membuat toko baru");
    } finally {
      setSubmitting(false);
    }
  }

  // Delete Tenant
  async function handleDeleteTenant(tenant: TenantData) {
    if (tenant.slug === "hadicomputer") {
      toast.error("Tenant #1 (Hadi Computer) tidak dapat dihapus.");
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus tenant "${tenant.name}"? Seluruh data produk dan pengaturan akan dihapus permanen.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/god-mode/tenants/${tenant.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus tenant toko");

      toast.success(`Tenant "${tenant.name}" berhasil dihapus.`);
      fetchTenants();
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus tenant");
    }
  }

  // Filter Tenants
  const filteredTenants = React.useMemo(() => {
    return tenants.filter((t) => {
      const matchesSearch =
        searchQuery === "" ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.customDomain && t.customDomain.toLowerCase().includes(searchQuery.toLowerCase())) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPlan = planFilter === "ALL" || t.plan === planFilter;
      const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;

      return matchesSearch && matchesPlan && matchesStatus;
    });
  }, [tenants, searchQuery, planFilter, statusFilter]);

  // Paginated Slices
  const totalItems = filteredTenants.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedTenants = filteredTenants.slice(startIndex, endIndex);

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
            <span>Dashboard Summary</span>
          </Link>
          <Link href="/god-mode/tenants" className="admin-nav-item active">
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
            Multi-Tenant Platform SaaS
            <br />
            <strong>Version 2.0 (Live)</strong>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Topbar with Impersonation Dropdown */}
        <header className="admin-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--ink)" }}>
              Manajemen Tenant Toko
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

            <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-1.5 h-10 px-4 text-xs font-bold">
              <Plus size={16} />
              <span>Tambah Toko</span>
            </Button>

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
          <div className="space-y-6 w-full pb-20">
            {/* Page Header Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-[#111413] tracking-tight">
                  Daftar Tenant Toko (Merchants)
                </h1>
                <p className="text-sm text-[#525854] mt-1">
                  Kelola database seluruh retailer, paket subscription, konfigurasi domain, dan kontrol akses CMS tenant.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={fetchTenants}
                  className="flex items-center gap-1.5 text-xs font-semibold h-10 px-4"
                >
                  <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                  <span>Refresh Data</span>
                </Button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <Card className="border-[#e5e5e2] shadow-sm rounded-2xl">
              <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
                {/* Search with perfectly centered icon & clear button */}
                <div className="admin-input-wrapper w-full md:w-84">
                  <span className="admin-input-icon-left">
                    <Search size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="Cari toko, slug, domain, atau ID..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className={`admin-input-styled has-left-icon ${searchQuery ? "has-right-icon" : ""}`}
                    style={{ height: "40px", fontSize: "12px" }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setCurrentPage(1);
                      }}
                      className="admin-password-toggle-btn"
                      title="Hapus pencarian"
                      style={{ right: "10px" }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2.5 w-full md:w-auto">
                  <Select
                    value={planFilter}
                    onChange={(e) => {
                      setPlanFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="text-xs h-10 w-36 bg-white"
                  >
                    <option value="ALL">Semua Paket</option>
                    <option value="STARTER">Paket Starter</option>
                    <option value="PRO">Paket Pro</option>
                    <option value="ENTERPRISE">Paket Enterprise</option>
                  </Select>

                  <Select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="text-xs h-10 w-36 bg-white"
                  >
                    <option value="ALL">Semua Status</option>
                    <option value="ACTIVE">Status Active</option>
                    <option value="TRIAL">Status Trial</option>
                    <option value="SUSPENDED">Status Suspended</option>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tenants Data Table */}
            <Card className="border-[#e5e5e2] shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-[#e5e5e2] p-5">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Daftar Merchant Terdaftar</span>
                  <span className="text-xs font-normal text-[#818779]">
                    Total {filteredTenants.length} toko terfilter
                  </span>
                </CardTitle>
                <CardDescription>
                  Setiap tenant memiliki database terisolasi dengan ID SHA-1 unik dan fitur modular yang bisa di-toggle secara langsung.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#fcfcfc]">
                      <TableHead className="py-3.5 px-6">Toko & Identitas</TableHead>
                      <TableHead className="py-3.5 px-6">ID SHA-1 (Hex)</TableHead>
                      <TableHead className="py-3.5 px-6">Paket</TableHead>
                      <TableHead className="py-3.5 px-6">Fitur Modular (Real-time Toggle)</TableHead>
                      <TableHead className="py-3.5 px-6">Status</TableHead>
                      <TableHead className="py-3.5 px-6 text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-sm text-[#818779]">
                          Memuat data merchant...
                        </TableCell>
                      </TableRow>
                    ) : paginatedTenants.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-sm text-[#818779]">
                          Tidak ada tenant toko yang sesuai dengan kriteria filter.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedTenants.map((t) => (
                        <TableRow key={t.id} className="hover:bg-[#fafafa] transition-colors">
                          {/* Nama & Domain */}
                          <TableCell className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-sm flex-shrink-0"
                                style={{ backgroundColor: t.settings?.primaryColor || "#cc252b" }}
                              >
                                {t.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-[#111413] text-sm flex items-center gap-2">
                                  <span>{t.name}</span>
                                  {t.slug === "hadicomputer" && (
                                    <span className="text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                                      Tenant #1
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-[#818779] flex items-center gap-1.5 mt-0.5">
                                  <span>{t.slug}.tokopc.id</span>
                                  {t.customDomain && (
                                    <>
                                      <span>•</span>
                                      <span className="text-blue-600 font-medium">{t.customDomain}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          {/* ID SHA-1 */}
                          <TableCell className="py-4 px-6">
                            <div className="flex items-center gap-1.5">
                              <code className="text-xs bg-[#f6f6f4] px-2 py-1 rounded font-mono text-[#111413] border border-[#e5e5e2]">
                                {t.id.slice(0, 8)}...{t.id.slice(-6)}
                              </code>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(t.id);
                                  toast.success("ID SHA-1 disalin ke clipboard!");
                                }}
                                className="p-1 text-[#818779] hover:text-[#111413] transition-colors"
                                title="Salin Full SHA-1 ID"
                              >
                                <Copy size={13} />
                              </button>
                            </div>
                          </TableCell>

                          {/* Paket */}
                          <TableCell className="py-4 px-6">
                            <Badge
                              variant="outline"
                              className={
                                t.plan === "PRO"
                                  ? "border-red-300 text-red-700 bg-red-50 font-black text-xs"
                                  : t.plan === "ENTERPRISE"
                                  ? "border-purple-300 text-purple-700 bg-purple-50 font-black text-xs"
                                  : "border-gray-300 text-gray-700 bg-gray-50 text-xs"
                              }
                            >
                              {t.plan}
                            </Badge>
                          </TableCell>

                          {/* Modular Switches */}
                          <TableCell className="py-4 px-6">
                            <div className="flex flex-col gap-2">
                              <label className="flex items-center gap-2 cursor-pointer text-xs">
                                <Switch
                                  checked={!!t.features.pcBuilder}
                                  onCheckedChange={() =>
                                    handleToggleFeature(t.id, "pcBuilder", !!t.features.pcBuilder)
                                  }
                                />
                                <span className={t.features.pcBuilder ? "font-bold text-[#111413]" : "text-[#818779]"}>
                                  PC Builder Simulator
                                </span>
                              </label>

                              <label className="flex items-center gap-2 cursor-pointer text-xs">
                                <Switch
                                  checked={!!t.features.tradeIn}
                                  onCheckedChange={() =>
                                    handleToggleFeature(t.id, "tradeIn", !!t.features.tradeIn)
                                  }
                                />
                                <span className={t.features.tradeIn ? "font-bold text-[#111413]" : "text-[#818779]"}>
                                  Kalkulator Trade-In
                                </span>
                              </label>
                            </div>
                          </TableCell>

                          {/* Status */}
                          <TableCell className="py-4 px-6">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                t.status === "ACTIVE"
                                  ? "bg-green-100 text-green-800"
                                  : t.status === "TRIAL"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              <span>{t.status}</span>
                            </span>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Impersonate Button */}
                              <Button
                                size="sm"
                                onClick={() => handleImpersonate(t.id)}
                                className="bg-[#111413] hover:bg-black text-white text-xs h-8 px-3 font-bold flex items-center gap-1.5 shadow-sm"
                                title={`Login ke mode CMS ${t.name}`}
                              >
                                <Zap size={13} className="text-amber-400 fill-amber-400" />
                                <span>Masuk CMS</span>
                              </Button>

                              {/* Delete button (except Hadi Computer) */}
                              {t.slug !== "hadicomputer" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteTenant(t)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                                  title="Hapus Toko"
                                >
                                  <Trash2 size={14} />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>

              {/* Standard CMS Pagination Bar */}
              <div className="border-t border-[#e5e5e2] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#fcfcfc]">
                <div className="text-xs text-[#525854] flex items-center gap-2">
                  <span>
                    Menampilkan <strong>{totalItems === 0 ? 0 : startIndex + 1}</strong> –{" "}
                    <strong>{endIndex}</strong> dari <strong>{totalItems}</strong> tenant
                  </span>
                  <span className="text-gray-300">|</span>
                  <div className="flex items-center gap-1.5">
                    <span>Baris:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="border border-[#e5e5e2] rounded px-1.5 py-0.5 text-xs bg-white"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safePage <= 1}
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    className="h-8 px-2.5 text-xs font-semibold"
                  >
                    <ChevronLeft size={14} />
                    <span className="hidden sm:inline ml-1">Sebelumnya</span>
                  </Button>

                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === safePage ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`h-8 w-8 p-0 text-xs font-bold ${
                          pageNum === safePage ? "bg-[#cc252b] text-white" : ""
                        }`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safePage >= totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    className="h-8 px-2.5 text-xs font-semibold"
                  >
                    <span className="hidden sm:inline mr-1">Selanjutnya</span>
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>

      {/* Modal Tambah Toko Baru */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tambah Tenant Toko Baru</DialogTitle>
            <DialogDescription>
              Buat toko retailer baru. Sistem akan menggenerasikan ID SHA-1 unik secara otomatis dan mengisolasi database katalog.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTenant} className="space-y-4 pt-2">
            <div>
              <Label htmlFor="t-name">Nama Toko *</Label>
              <Input
                id="t-name"
                required
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  if (!newSlug || newSlug === newName.toLowerCase().replace(/\s+/g, "-").slice(0, -1)) {
                    setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""));
                  }
                }}
                placeholder="e.g. Berkah Jaya Komputer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="t-slug">Subdomain Slug *</Label>
                <div className="flex items-center">
                  <Input
                    id="t-slug"
                    required
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
                    placeholder="berkahjaya"
                  />
                </div>
                <p className="text-[11px] text-[#818779] mt-1">{newSlug || "slug"}.tokopc.id</p>
              </div>

              <div>
                <Label htmlFor="t-plan">Paket Langganan</Label>
                <Select
                  id="t-plan"
                  value={newPlan}
                  onChange={(e) => setNewPlan(e.target.value as any)}
                >
                  <option value="STARTER">STARTER (Katalog WA)</option>
                  <option value="PRO">PRO (PC Builder & Trade-in)</option>
                  <option value="ENTERPRISE">ENTERPRISE (Omnichannel)</option>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="t-domain">Custom Domain (Opsional)</Label>
              <Input
                id="t-domain"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value.toLowerCase())}
                placeholder="e.g. berkahjayakomputer.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="t-phone">Nomor WhatsApp Toko</Label>
                <Input
                  id="t-phone"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="628123456789"
                />
              </div>

              <div>
                <Label htmlFor="t-color">Warna Brand Toko</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="t-color"
                    type="color"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="w-10 h-10 p-1 border rounded cursor-pointer"
                  />
                  <Input
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    placeholder="#cc252b"
                  />
                </div>
              </div>
            </div>

            <div className="border border-[#e5e5e2] rounded-lg p-3 space-y-2 bg-[#fcfcfc]">
              <div className="text-xs font-bold text-[#111413]">Fitur Awal yang Diaktifkan:</div>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <Switch
                  checked={newFeatures.pcBuilder}
                  onCheckedChange={(c) => setNewFeatures({ ...newFeatures, pcBuilder: c })}
                />
                <span>Simulasi Racik PC (Interactive PC Builder)</span>
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <Switch
                  checked={newFeatures.tradeIn}
                  onCheckedChange={(c) => setNewFeatures({ ...newFeatures, tradeIn: c })}
                />
                <span>Kalkulator Tukar Tambah Laptop (Trade-In)</span>
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
                {submitting ? "Membuat Tenant..." : "Daftarkan Tenant"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function TenantsPage() {
  return (
    <ToastProvider>
      <TenantsManagementContent />
    </ToastProvider>
  );
}
