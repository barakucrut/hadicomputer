"use client";

import * as React from "react";
import { tenantStorefrontHost } from "@/lib/platform-domain";
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
  UserRoundCog,
  Link2,
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
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { HugeIconTrash, HugeIconEdit } from "@/components/admin/ui/huge-icons";
import { AssignMarketingDialog } from "@/components/god-mode/assign-marketing-dialog";
import { SiteStatusDialog, SiteStatusBadge, demoViewsLabel } from "@/components/god-mode/site-status-dialog";
import { useToast, ToastProvider } from "@/components/admin/ui/toast";
import { GodRoleBadge, GodSidebar, useGodSession } from "@/components/god-mode/god-shell";
import { CURRENCY_OPTIONS, type CurrencyCode } from "@/lib/i18n/currency";
import type { Locale } from "@/lib/i18n";
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
  _count?: { products: number; categories: number; demoViews?: number };
  acquiredBy: { id: string; name: string; email: string } | null;
  siteStatus: "DEMO" | "LIVE";
  lastDemoViewAt: string | null;
  createdAt: string;
}

interface TeamOption {
  id: string;
  name: string;
  email?: string;
  role: "SUPERADMIN" | "CMO" | "MARKETING";
  isActive: boolean;
}

const SUPER_ONLY_HINT = "Paket, status, domain & fitur hanya bisa diubah Superadmin.";

function TenantsManagementContent() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useGodSession();
  // UI hanya menyembunyikan; API tetap menolak/mengabaikan aksi di luar hak peran
  const isSuper = user?.role === "SUPERADMIN";
  const [team, setTeam] = React.useState<TeamOption[]>([]);
  const [newAcquiredById, setNewAcquiredById] = React.useState("");
  const [editAcquiredById, setEditAcquiredById] = React.useState("");

  React.useEffect(() => {
    if (!isSuper) return;
    fetch("/api/god-mode/team")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data?.members && setTeam(data.members))
      .catch(() => undefined);
  }, [isSuper]);

  // Ditolak masuk CMS (toko sudah bukan milik marketing ini): /god-mode/tenants?cms=ditolak
  React.useEffect(() => {
    if (new URLSearchParams(window.location.search).get("cms") === "ditolak") {
      toast.error("Anda tidak punya akses ke CMS toko tersebut. Toko mungkin sudah dipindahkan ke marketing lain.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Link "Tenant Baru" dari dashboard marketing: /god-mode/tenants?new=1
  React.useEffect(() => {
    if (new URLSearchParams(window.location.search).get("new") === "1") setIsAddModalOpen(true);
  }, []);

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
  const [newLocale, setNewLocale] = React.useState<Locale>("id");
  const [newCurrency, setNewCurrency] = React.useState<CurrencyCode>("IDR");
  const [withStarterPack, setWithStarterPack] = React.useState(true);
  const [newFeatures, setNewFeatures] = React.useState({
    pcBuilder: true,
    tradeIn: true,
    instantCheckout: false,
  });

  // Edit Form State
  const [editName, setEditName] = React.useState("");
  const [editDomain, setEditDomain] = React.useState("");
  const [editPlan, setEditPlan] = React.useState<"STARTER" | "PRO" | "ENTERPRISE">("PRO");
  const [editStatus, setEditStatus] = React.useState<"ACTIVE" | "TRIAL" | "SUSPENDED">("ACTIVE");
  const [editPhone, setEditPhone] = React.useState("");
  const [editColor, setEditColor] = React.useState("#cc252b");
  const [editSecondary, setEditSecondary] = React.useState("#111413");
  const [editAddress, setEditAddress] = React.useState("");
  const [editOpenHours, setEditOpenHours] = React.useState("");
  const [editFeatures, setEditFeatures] = React.useState({
    pcBuilder: true,
    tradeIn: true,
  });

  function handleOpenEdit(t: TenantData) {
    setEditingTenant(t);
    setEditName(t.name);
    setEditDomain(t.customDomain || "");
    setEditPlan(t.plan);
    setEditStatus(t.status);
    setEditColor(t.settings?.primaryColor || "#cc252b");
    setEditSecondary(t.settings?.secondaryColor || "#111413");
    setEditPhone(t.settings?.whatsappNumber || "628");
    setEditAddress(t.settings?.address || "");
    setEditOpenHours(t.settings?.openHours || "Senin - Sabtu: 09:00 - 20:00");
    setEditAcquiredById(t.acquiredBy?.id || "");
    setEditFeatures({
      pcBuilder: !!t.features.pcBuilder,
      tradeIn: !!t.features.tradeIn,
    });
    setIsEditModalOpen(true);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTenant) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/god-mode/tenants/${editingTenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          primaryColor: editColor,
          secondaryColor: editSecondary,
          whatsappNumber: editPhone,
          address: editAddress,
          openHours: editOpenHours,
          ...(isSuper
            ? {
                customDomain: editDomain || null,
                plan: editPlan,
                status: editStatus,
                features: editFeatures,
                acquiredById: editAcquiredById || null,
              }
            : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui data tenant");

      toast.success(`Data tenant "${editName}" berhasil diperbarui!`);
      setIsEditModalOpen(false);
      setEditingTenant(null);
      fetchTenants();
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan perubahan");
    } finally {
      setSubmitting(false);
    }
  }

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
          primaryColor: newColor,
          whatsappNumber: newPhone.trim(),
          locale: newLocale,
          currency: newCurrency,
          withStarterPack,
          ...(isSuper
            ? { customDomain: newDomain.trim() || null, plan: newPlan, features: newFeatures, acquiredById: newAcquiredById || null }
            : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat tenant");

      const sample = data.starterPack?.products ? ` dengan ${data.starterPack.products} produk contoh` : "";
      toast.success(`Tenant toko "${data.tenant?.name}" berhasil ditambahkan${sample}!`);
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
  const [deleteTarget, setDeleteTarget] = React.useState<TenantData | null>(null);
  const [assignTarget, setAssignTarget] = React.useState<TenantData | null>(null);
  const [siteTarget, setSiteTarget] = React.useState<TenantData | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  async function executeDeleteTenant() {
    if (!deleteTarget) return;

    if (deleteTarget.slug === "hadicomputer") {
      toast.error("Tenant #1 (Hadi Computer) tidak dapat dihapus.");
      setDeleteTarget(null);
      return;
    }

    try {
      setDeleting(true);
      const res = await fetch(`/api/god-mode/tenants/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus tenant toko");

      toast.success(`Tenant "${deleteTarget.name}" berhasil dihapus.`);
      fetchTenants();
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus tenant");
    } finally {
      setDeleting(false);
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
      <GodSidebar active="/god-mode/tenants" />

      {/* Main Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Topbar with Impersonation Dropdown */}
        <header className="admin-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--ink)" }}>
              Manajemen Tenant Toko
            </span>
            <GodRoleBadge />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            {/* Topbar Dropdown Switcher: daftar sudah dibatasi lingkup peran (marketing = tokonya saja) */}
            {tenants.length > 0 && (
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
            )}

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
                    placeholder="Cari toko, subdomain, atau custom domain..."
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
                  Setiap tenant memiliki data terisolasi. Fitur modular diatur lewat tombol Edit.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#fcfcfc]">
                      <TableHead className="py-3.5 px-6">Toko & Identitas</TableHead>
                      <TableHead className="py-3.5 px-6">{isSuper ? "Paket & Marketing" : "Paket"}</TableHead>
                      <TableHead className="py-3.5 px-6">Status</TableHead>
                      <TableHead className="py-3.5 px-6 text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-12 text-sm text-[#818779]">
                          Memuat data merchant...
                        </TableCell>
                      </TableRow>
                    ) : paginatedTenants.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-12 text-sm text-[#818779]">
                          Tidak ada tenant toko yang sesuai dengan kriteria filter.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedTenants.map((t) => (
                        <TableRow
                          key={t.id}
                          onClick={() => handleOpenEdit(t)}
                          className="hover:bg-[#fafafa] transition-colors cursor-pointer"
                        >
                          {/* Nama & Domain */}
                          <TableCell className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-[10px] flex items-center justify-center text-white text-xs font-black shadow-sm flex-shrink-0"
                                style={{
                                  backgroundColor: t.settings?.primaryColor || "#cc252b",
                                  boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                                  border: "1px solid rgba(0, 0, 0, 0.08)",
                                }}
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
                                  <span>{tenantStorefrontHost(t.slug)}</span>
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

                          {/* Paket */}
                          <TableCell className="py-4 px-6">
                            <Badge
                              variant={
                                t.plan === "PRO"
                                  ? "default"
                                  : t.plan === "ENTERPRISE"
                                  ? "purple"
                                  : "secondary"
                              }
                            >
                              {t.plan}
                            </Badge>
                            {isSuper && (
                              <div className="mt-1.5 text-[11px] text-[#818779]">
                                {t.acquiredBy ? t.acquiredBy.name : "Tanpa marketing"}
                              </div>
                            )}
                          </TableCell>

                          {/* Status */}
                          <TableCell className="py-4 px-6">
                            <Badge
                              variant={
                                t.status === "ACTIVE"
                                  ? "success"
                                  : t.status === "TRIAL"
                                  ? "warning"
                                  : "destructive"
                              }
                            >
                              {t.status}
                            </Badge>
                            <div className="mt-1.5 flex flex-col items-start gap-1">
                              <SiteStatusBadge status={t.siteStatus} />
                              {t.siteStatus === "DEMO" && (
                                <span className="text-[11px] text-[#818779]">
                                  {demoViewsLabel(t._count?.demoViews ?? 0, t.lastDemoViewAt)}
                                </span>
                              )}
                            </div>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Status website & link demo (semua peran; aktivasi superadmin) */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSiteTarget(t);
                                }}
                                className="admin-action-btn"
                                title={t.siteStatus === "DEMO" ? `Link demo ${t.name}` : `Status website ${t.name}`}
                                aria-label={t.siteStatus === "DEMO" ? `Link demo ${t.name}` : `Status website ${t.name}`}
                              >
                                <Link2 size={16} />
                              </button>

                              {/* Lihat etalase publik (semua peran) */}
                              <a
                                href={`/?store=${encodeURIComponent(t.slug)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="admin-action-btn"
                                title={`Lihat etalase ${t.name}`}
                              >
                                <ExternalLink size={16} />
                              </a>

                              {/* Masuk CMS toko: superadmin semua toko, marketing/CMO hanya tokonya (dicek di server) */}
                              {(
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleImpersonate(t.id);
                                }}
                                className="admin-action-btn"
                                title={`Masuk CMS ${t.name}`}
                              >
                                <Zap size={16} className="text-amber-500 fill-amber-500" />
                              </button>
                              )}

                              {/* Pindahkan ke marketing lain - superadmin saja */}
                              {isSuper && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAssignTarget(t);
                                  }}
                                  className="admin-action-btn"
                                  title={`Pindahkan ${t.name} ke marketing`}
                                  aria-label={`Pindahkan ${t.name} ke marketing`}
                                >
                                  <UserRoundCog size={16} />
                                </button>
                              )}

                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEdit(t);
                                }}
                                className="admin-action-btn"
                                title="Edit Detail Tenant"
                              >
                                <HugeIconEdit size={16} />
                              </button>

                              {/* Delete button (except Hadi Computer) */}
                              {isSuper && t.slug !== "hadicomputer" && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteTarget(t);
                                  }}
                                  className="admin-action-btn delete"
                                  title="Hapus Toko"
                                >
                                  <HugeIconTrash size={16} />
                                </button>
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
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen} className="max-w-xl">
        <DialogContent className="max-w-xl">
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
                <p className="text-[11px] text-[#818779] mt-1">{tenantStorefrontHost(newSlug || "slug")}</p>
              </div>

              <div>
                <Label htmlFor="t-plan">Paket Langganan</Label>
                <Select
                  id="t-plan"
                  disabled={!isSuper}
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
                disabled={!isSuper}
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="t-locale">Bahasa Etalase</Label>
                <Select
                  id="t-locale"
                  value={newLocale}
                  onChange={(e) => {
                    const next = e.target.value as Locale;
                    setNewLocale(next);
                    if (next === "en" && newCurrency === "IDR") setNewCurrency("USD");
                    if (next === "id" && newCurrency === "USD") setNewCurrency("IDR");
                  }}
                >
                  <option value="id">Indonesia (ID)</option>
                  <option value="en">English (EN)</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="t-currency">Mata Uang Etalase</Label>
                <Select
                  id="t-currency"
                  value={newCurrency}
                  onChange={(e) => setNewCurrency(e.target.value as CurrencyCode)}
                >
                  {CURRENCY_OPTIONS.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="border border-[#e5e5e2] rounded-lg p-3 space-y-2 bg-[#fcfcfc]">
              <div className="text-xs font-bold text-[#111413]">Fitur Awal yang Diaktifkan:</div>
              {!isSuper && <p className="admin-form-hint">Tenant baru Anda otomatis berstatus TRIAL atas nama Anda. {SUPER_ONLY_HINT}</p>}
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <Switch
                  disabled={!isSuper}
                  checked={newFeatures.pcBuilder}
                  onCheckedChange={(c) => setNewFeatures({ ...newFeatures, pcBuilder: c })}
                />
                <span>Simulasi Racik PC (Interactive PC Builder)</span>
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <Switch
                  disabled={!isSuper}
                  checked={newFeatures.tradeIn}
                  onCheckedChange={(c) => setNewFeatures({ ...newFeatures, tradeIn: c })}
                />
                <span>Kalkulator Tukar Tambah Laptop (Trade-In)</span>
              </label>
            </div>

            {isSuper && (
              <div>
                <Label htmlFor="t-marketing">Marketing Penanggung Jawab</Label>
                <Select id="t-marketing" value={newAcquiredById} onChange={(e) => setNewAcquiredById(e.target.value)}>
                  <option value="">— Tanpa marketing (dikelola pusat) —</option>
                  {team.filter((m) => m.role !== "SUPERADMIN" && m.isActive).map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </Select>
              </div>
            )}

            <label className="flex items-start justify-between gap-3 border border-[#e5e5e2] rounded-lg p-3 cursor-pointer">
              <span>
                <span className="text-xs font-bold text-[#111413] block">Isi dengan data contoh (Starter Pack)</span>
                <span className="admin-form-hint block mt-0.5">
                  22 produk, banner & layanan contoh agar toko langsung siap didemokan. Bisa dihapus sekali klik dari dashboard toko. Toko tidak diindeks Google selama data contoh ada.
                </span>
              </span>
              <Switch checked={withStarterPack} onCheckedChange={setWithStarterPack} />
            </label>

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

      {/* Edit Tenant Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen} className="max-w-xl">
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store size={18} className="text-red-600" />
              <span>Edit Detail Tenant: {editingTenant?.name}</span>
            </DialogTitle>
            <DialogDescription>
              Perbarui konfigurasi domain, paket subscription, status, dan fitur modular merchant ini.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
            <div>
              <Label htmlFor="edit-name">Nama Toko Merchant *</Label>
              <Input
                id="edit-name"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g. Plaza Bitcom Jember"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Subdomain (Locked ID)</Label>
                <div className="mt-1 flex items-center h-10 px-3 rounded-lg border border-[#e5e5e2] bg-[#f9f9f8] text-xs font-mono text-[#525854]">
                  {tenantStorefrontHost(editingTenant?.slug || "slug")}
                </div>
              </div>

              <div>
                <Label htmlFor="edit-domain">Custom Domain (Opsional)</Label>
                <Input
                  id="edit-domain"
                  disabled={!isSuper}
                  value={editDomain}
                  onChange={(e) => setEditDomain(e.target.value)}
                  placeholder="e.g. plazabitcom.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-plan">Paket Subscription</Label>
                <Select
                  id="edit-plan"
                  disabled={!isSuper}
                  value={editPlan}
                  onChange={(e) => setEditPlan(e.target.value as any)}
                >
                  <option value="STARTER">STARTER (Katalog Standar)</option>
                  <option value="PRO">PRO (Racik PC + Trade-in)</option>
                  <option value="ENTERPRISE">ENTERPRISE (Full Custom Domain + Multi Cabang)</option>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-status">Status Operasional</Label>
                <Select
                  id="edit-status"
                  disabled={!isSuper}
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                >
                  <option value="ACTIVE">ACTIVE (Toko Buka & Aktif)</option>
                  <option value="TRIAL">TRIAL (Masa Uji Coba)</option>
                  <option value="SUSPENDED">SUSPENDED (Ditangguhkan)</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="edit-phone">Nomor WhatsApp Toko</Label>
                <Input
                  id="edit-phone"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="628xxxxxxxxxx"
                />
              </div>

              <div>
                <Label htmlFor="edit-color">Warna Primer (Tombol)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    id="edit-color"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border border-[#e5e5e2] p-1 bg-white"
                  />
                  <Input
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    placeholder="#cc252b"
                    className="font-mono text-xs uppercase"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-secondary">Warna Sekunder (Topbar & Footer)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    id="edit-secondary"
                    value={/^#[0-9a-f]{6}$/i.test(editSecondary) ? editSecondary : "#111413"}
                    onChange={(e) => setEditSecondary(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border border-[#e5e5e2] p-1 bg-white"
                  />
                  <Input
                    value={editSecondary}
                    onChange={(e) => setEditSecondary(e.target.value)}
                    placeholder="#111413"
                    className="font-mono text-xs uppercase"
                  />
                </div>
                <span className="admin-form-hint">Teks & ikon di atas warna ini otomatis putih/hitam.</span>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-address">Alamat Toko</Label>
              <Input
                id="edit-address"
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                placeholder="Jl. Jawa No. 12, Jember"
              />
            </div>

            <div>
              <Label htmlFor="edit-open-hours">Jam Operasional</Label>
              <Input
                id="edit-open-hours"
                value={editOpenHours}
                onChange={(e) => setEditOpenHours(e.target.value)}
                placeholder="Senin - Sabtu: 09:00 - 20:00"
              />
            </div>

            {isSuper && (
              <div>
                <Label htmlFor="edit-marketing">Marketing Penanggung Jawab</Label>
                <Select id="edit-marketing" value={editAcquiredById} onChange={(e) => setEditAcquiredById(e.target.value)}>
                  <option value="">— Tanpa marketing (dikelola pusat) —</option>
                  {team
                    .filter((m) => (m.role !== "SUPERADMIN" && m.isActive) || m.id === editAcquiredById)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                        {m.isActive ? "" : " (nonaktif)"}
                      </option>
                    ))}
                </Select>
                <p className="admin-form-hint mt-1">Marketing hanya melihat & mengelola tenant yang ditugaskan kepadanya.</p>
              </div>
            )}

            <div className="border border-[#e5e5e2] rounded-lg p-3 space-y-2 bg-[#fcfcfc]">
              <div className="text-xs font-bold text-[#111413]">Fitur Modular Toko:</div>
              {!isSuper && <p className="admin-form-hint">{SUPER_ONLY_HINT}</p>}
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <Switch
                  disabled={!isSuper}
                  checked={editFeatures.pcBuilder}
                  onCheckedChange={(c) => setEditFeatures({ ...editFeatures, pcBuilder: c })}
                />
                <span>Simulasi Racik PC (Interactive PC Builder)</span>
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <Switch
                  disabled={!isSuper}
                  checked={editFeatures.tradeIn}
                  onCheckedChange={(c) => setEditFeatures({ ...editFeatures, tradeIn: c })}
                />
                <span>Kalkulator Tukar Tambah Laptop (Trade-In)</span>
              </label>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal (Standard Shadcn ConfirmDialog) */}
      <SiteStatusDialog
        tenant={siteTarget}
        isSuper={isSuper}
        onOpenChange={(open) => !open && setSiteTarget(null)}
        onChanged={fetchTenants}
      />

      <AssignMarketingDialog
        tenant={assignTarget}
        team={team}
        onOpenChange={(open) => !open && setAssignTarget(null)}
        onSaved={fetchTenants}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus Tenant Toko?"
        description={`Apakah Anda yakin ingin menghapus tenant "${deleteTarget?.name}" (${deleteTarget?.slug})? Seluruh data produk, kategori, dan pengaturan toko akan dihapus permanen.`}
        confirmLabel="Ya, Hapus Tenant"
        onConfirm={executeDeleteTenant}
        loading={deleting}
      />
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
