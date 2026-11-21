"use client";

import * as React from "react";
import { tenantStorefrontHost } from "@/lib/platform-domain";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Receipt,
  Plus,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  CreditCard,
  Building,
  RefreshCw,
  LogOut,
  Palette,
  LayoutDashboard,
  Store,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  PieChart,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
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
import { useToast, ToastProvider } from "@/components/admin/ui/toast";
import { GodRoleBadge, GodSidebar } from "@/components/god-mode/god-shell";
import "@/app/admin.css";

interface TransactionItem {
  id: string;
  type: "INCOME" | "EXPENSE";
  category: string;
  title: string;
  amount: number;
  status: string;
  date: string;
  description: string | null;
  tenantId: string | null;
  tenantName: string | null;
  paymentMethod: string | null;
  createdAt: string;
}

interface TransactionStats {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  count: number;
}

interface TenantOption {
  id: string;
  name: string;
  slug: string;
  customDomain: string | null;
}

const CATEGORY_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" | "info" | "purple" }
> = {
  SUBSCRIPTION: { label: "Subscription", variant: "info" },
  JUAL_PUTUS: { label: "Jual Putus", variant: "purple" },
  SETUP_FEE: { label: "Biaya Setup", variant: "warning" },
  ADDON: { label: "Add-on Fitur", variant: "info" },
  SERVER_INFRA: { label: "Server & Hosting", variant: "destructive" },
  DOMAIN_REGISTRATION: { label: "Domain Registrar", variant: "info" },
  WHATSAPP_GATEWAY: { label: "WhatsApp Gateway", variant: "success" },
  MARKETING: { label: "Marketing & Iklan", variant: "warning" },
  OPERATIONAL: { label: "Operasional", variant: "secondary" },
  OTHER: { label: "Lainnya", variant: "secondary" },
};

function TransactionsContent() {
  const router = useRouter();
  const toast = useToast();

  const [transactions, setTransactions] = React.useState<TransactionItem[]>([]);
  const [tenants, setTenants] = React.useState<TenantOption[]>([]);
  const [selectedTenantId, setSelectedTenantId] = React.useState<string>("");
  const [stats, setStats] = React.useState<TransactionStats>({
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0,
    count: 0,
  });
  const [loading, setLoading] = React.useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<"ALL" | "INCOME" | "EXPENSE">("ALL");
  const [categoryFilter, setCategoryFilter] = React.useState("ALL");

  // Pagination
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  // Add Modal State
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [newType, setNewType] = React.useState<"INCOME" | "EXPENSE">("INCOME");
  const [newCategory, setNewCategory] = React.useState("SUBSCRIPTION");
  const [newTitle, setNewTitle] = React.useState("");
  const [newAmount, setNewAmount] = React.useState("");
  const [newPaymentMethod, setNewPaymentMethod] = React.useState("Transfer Bank");
  const [newDescription, setNewDescription] = React.useState("");

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [editingTransaction, setEditingTransaction] = React.useState<TransactionItem | null>(null);
  const [editTitle, setEditTitle] = React.useState("");
  const [editAmount, setEditAmount] = React.useState("");
  const [editType, setEditType] = React.useState<"INCOME" | "EXPENSE">("INCOME");
  const [editCategory, setEditCategory] = React.useState("SUBSCRIPTION");
  const [editPaymentMethod, setEditPaymentMethod] = React.useState("Transfer Bank");
  const [editTenantId, setEditTenantId] = React.useState("");
  const [editDescription, setEditDescription] = React.useState("");

  function handleOpenEdit(t: TransactionItem) {
    setEditingTransaction(t);
    setEditTitle(t.title);
    setEditAmount(String(t.amount));
    setEditType(t.type);
    setEditCategory(t.category);
    setEditPaymentMethod(t.paymentMethod || "Transfer Bank");
    setEditTenantId(t.tenantId || "");
    setEditDescription(t.description || "");
    setIsEditOpen(true);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTransaction) return;

    try {
      setSubmitting(true);
      const selectedTenant = tenants.find((item) => item.id === editTenantId);
      const res = await fetch(`/api/god-mode/transactions/${editingTransaction.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          amount: Number(editAmount),
          type: editType,
          category: editCategory,
          paymentMethod: editPaymentMethod,
          tenantId: editTenantId || null,
          tenantName: selectedTenant ? selectedTenant.name : null,
          description: editDescription.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui transaksi");

      toast.success("Catatan transaksi berhasil diperbarui!");
      setIsEditOpen(false);
      setEditingTransaction(null);
      fetchTransactions();
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan perubahan");
    } finally {
      setSubmitting(false);
    }
  }

  const fetchTransactions = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/god-mode/transactions");
      const data = await res.json();
      if (data.transactions) {
        setTransactions(data.transactions);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load transactions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchTransactions();

    // Fetch Tenants list for merchant selector
    fetch("/api/god-mode/tenants")
      .then((r) => r.json())
      .then((d) => {
        if (d.tenants) setTenants(d.tenants);
      })
      .catch(console.error);
  }, [fetchTransactions]);

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

  async function handleCreateTransaction(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newAmount || Number(newAmount) <= 0) {
      toast.error("Judul dan nominal transaksi yang valid wajib diisi.");
      return;
    }

    const selectedTenant = tenants.find((t) => t.id === selectedTenantId);

    try {
      setSubmitting(true);
      const res = await fetch("/api/god-mode/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: newType,
          category: newCategory,
          title: newTitle.trim(),
          amount: Number(newAmount),
          tenantId: selectedTenant ? selectedTenant.id : null,
          tenantName: selectedTenant ? selectedTenant.name : "Infrastruktur Platform",
          paymentMethod: newPaymentMethod,
          description: newDescription.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mencatat transaksi");

      toast.success("Transaksi berhasil dicatat ke pembukuan platform!");
      setIsAddOpen(false);
      setNewTitle("");
      setNewAmount("");
      setSelectedTenantId("");
      setNewDescription("");
      fetchTransactions();
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan transaksi");
    } finally {
      setSubmitting(false);
    }
  }

  const [deleteTarget, setDeleteTarget] = React.useState<TransactionItem | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  async function executeDeleteTransaction() {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/god-mode/transactions/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus transaksi");
      toast.success("Catatan transaksi telah dihapus.");
      fetchTransactions();
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus data");
    } finally {
      setDeleting(false);
    }
  }

  // Filter Transactions
  const filteredList = React.useMemo(() => {
    return transactions.filter((t) => {
      const matchesType = typeFilter === "ALL" || t.type === typeFilter;
      const matchesCategory = categoryFilter === "ALL" || t.category === categoryFilter;
      const matchesSearch =
        searchQuery === "" ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.tenantName && t.tenantName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesType && matchesCategory && matchesSearch;
    });
  }, [transactions, typeFilter, categoryFilter, searchQuery]);

  // Pagination Slice
  const totalItems = filteredList.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedList = filteredList.slice(startIndex, endIndex);

  return (
    <div className="admin-shell-root">
      {/* Sidebar for God Mode */}
      <GodSidebar active="/god-mode/transactions" />

      {/* Main Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Topbar */}
        <header className="admin-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--ink)" }}>
              Arus Kas & Transaksi Platform
            </span>
            <Badge variant="default" className="text-[11px] bg-red-600">
              FINANCE SAAS
            </Badge>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Button onClick={() => setIsAddOpen(true)} className="flex items-center gap-1.5 h-10 px-4 text-xs font-bold">
              <Plus size={16} />
              <span>Catat Transaksi</span>
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
            {/* Header Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-[#111413] tracking-tight">
                  Pembukuan Arus Kas Platform
                </h1>
                <p className="text-sm text-[#525854] mt-1">
                  Catat seluruh pemasukan subscription merchant, biaya setup, serta pengeluaran operasional server cloud dan domain.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={fetchTransactions}
                  className="flex items-center gap-1.5 text-xs font-semibold h-10 px-4"
                >
                  <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                  <span>Refresh Data</span>
                </Button>
              </div>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Income */}
              <Card className="border-[#e5e5e2] shadow-sm rounded-2xl">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-[#818779]">Total Pemasukan</div>
                    <div className="text-2xl font-black text-green-700 mt-1">
                      Rp {stats.totalIncome.toLocaleString("id-ID")}
                    </div>
                    <div className="text-[11px] text-green-600 font-bold flex items-center gap-1 mt-1">
                      <ArrowUpRight size={13} />
                      <span>Subscription & Setup</span>
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-green-50 text-green-700 flex items-center justify-center font-bold">
                    <TrendingUp size={22} />
                  </div>
                </CardContent>
              </Card>

              {/* Total Expense */}
              <Card className="border-[#e5e5e2] shadow-sm rounded-2xl">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-[#818779]">Total Pengeluaran</div>
                    <div className="text-2xl font-black text-red-600 mt-1">
                      Rp {stats.totalExpense.toLocaleString("id-ID")}
                    </div>
                    <div className="text-[11px] text-red-500 font-bold flex items-center gap-1 mt-1">
                      <ArrowDownLeft size={13} />
                      <span>Server, Domain, Gateway</span>
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-red-50 text-red-700 flex items-center justify-center font-bold">
                    <TrendingDown size={22} />
                  </div>
                </CardContent>
              </Card>

              {/* Net Cashflow */}
              <Card className="border-[#e5e5e2] shadow-sm rounded-2xl">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-[#818779]">Laba Bersih (Net Cashflow)</div>
                    <div className="text-2xl font-black text-[#111413] mt-1">
                      Rp {stats.netProfit.toLocaleString("id-ID")}
                    </div>
                    <div className="text-[11px] text-purple-700 font-bold flex items-center gap-1 mt-1">
                      <DollarSign size={13} />
                      <span>Saldo Kas Riil</span>
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                    <PieChart size={22} />
                  </div>
                </CardContent>
              </Card>

              {/* Margin Ratio */}
              <Card className="border-[#e5e5e2] shadow-sm rounded-2xl">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-[#818779]">Margin Keuntungan</div>
                    <div className="text-2xl font-black text-[#cc252b] mt-1">
                      {stats.totalIncome > 0
                        ? `${Math.round((stats.netProfit / stats.totalIncome) * 100)}%`
                        : "0%"}
                    </div>
                    <div className="text-[11px] text-[#525854] mt-1">Rasio efisiensi operasional</div>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-700 flex items-center justify-center font-bold">
                    <Building size={22} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filter Bar */}
            <Card className="border-[#e5e5e2] shadow-sm rounded-2xl">
              <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="admin-input-wrapper w-full md:w-84">
                  <span className="admin-input-icon-left">
                    <Search size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="Cari transaksi, merchant, keterangan..."
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

                <div className="flex items-center gap-2.5 w-full md:w-auto">
                  <Select
                    value={typeFilter}
                    onChange={(e) => {
                      setTypeFilter(e.target.value as any);
                      setCurrentPage(1);
                    }}
                    className="text-xs h-10 w-44 bg-white"
                  >
                    <option value="ALL">Semua Tipe Arus Kas</option>
                    <option value="INCOME">Pemasukan</option>
                    <option value="EXPENSE">Pengeluaran</option>
                  </Select>

                  <Select
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="text-xs h-10 w-48 bg-white"
                  >
                    <option value="ALL">Semua Kategori Transaksi</option>
                    <option value="SUBSCRIPTION">Subscription Paket</option>
                    <option value="JUAL_PUTUS">Jual Putus (Source Code / Lisensi)</option>
                    <option value="SETUP_FEE">Biaya Setup Domain</option>
                    <option value="ADDON">Add-on Fitur</option>
                    <option value="SERVER_INFRA">Server & Hosting</option>
                    <option value="DOMAIN_REGISTRATION">Domain Registrar</option>
                    <option value="WHATSAPP_GATEWAY">WhatsApp Gateway</option>
                    <option value="MARKETING">Marketing & Iklan</option>
                    <option value="OPERATIONAL">Operasional</option>
                    <option value="OTHER">Lainnya</option>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Transactions Table */}
            <Card className="border-[#e5e5e2] shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-[#e5e5e2] p-5">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Daftar Transaksi Arus Kas</span>
                  <span className="text-xs font-normal text-[#818779]">
                    Menampilkan {filteredList.length} transaksi
                  </span>
                </CardTitle>
                <CardDescription>
                  Pencatatan resmi mutasi keuangan multi-tenant platform.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#fcfcfc]">
                      <TableHead className="py-3.5 px-6">Tanggal</TableHead>
                      <TableHead className="py-3.5 px-6">Tipe Arus Kas</TableHead>
                      <TableHead className="py-3.5 px-6">Judul Transaksi & Kategori</TableHead>
                      <TableHead className="py-3.5 px-6">Entitas / Tenant</TableHead>
                      <TableHead className="py-3.5 px-6">Nominal (Rp)</TableHead>
                      <TableHead className="py-3.5 px-6 text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-sm text-[#818779]">
                          Memuat data mutasi keuangan...
                        </TableCell>
                      </TableRow>
                    ) : paginatedList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-sm text-[#818779]">
                          Belum ada transaksi pada kriteria filter ini.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedList.map((t) => (
                        <TableRow
                          key={t.id}
                          onClick={() => handleOpenEdit(t)}
                          className="hover:bg-[#fafafa] transition-colors cursor-pointer"
                        >
                          <TableCell className="py-4 px-6 text-xs text-[#525854] font-medium">
                            {new Date(t.date).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </TableCell>

                          <TableCell className="py-4 px-6">
                            <Badge variant={t.type === "INCOME" ? "success" : "destructive"}>
                              {t.type === "INCOME" ? (
                                <>
                                  <ArrowUpRight size={13} />
                                  <span>PEMASUKAN</span>
                                </>
                              ) : (
                                <>
                                  <ArrowDownLeft size={13} />
                                  <span>PENGELUARAN</span>
                                </>
                              )}
                            </Badge>
                          </TableCell>

                          <TableCell className="py-4 px-6">
                            <div>
                              <div className="font-bold text-[#111413] text-sm">{t.title}</div>
                              <div className="text-xs text-[#818779] flex items-center gap-2 mt-1">
                                <Badge variant={CATEGORY_CONFIG[t.category]?.variant || "secondary"}>
                                  {CATEGORY_CONFIG[t.category]?.label || t.category}
                                </Badge>
                                {t.paymentMethod && <span>• via {t.paymentMethod}</span>}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="py-4 px-6">
                            <span className="text-xs font-semibold text-[#111413]">
                              {t.tenantName || "Infrastruktur Platform"}
                            </span>
                          </TableCell>

                          <TableCell className="py-4 px-6">
                            <span
                              className={`font-black text-sm ${
                                t.type === "INCOME" ? "text-green-700" : "text-red-600"
                              }`}
                            >
                              {t.type === "INCOME" ? "+ " : "- "}
                              Rp {t.amount.toLocaleString("id-ID")}
                            </span>
                          </TableCell>

                          <TableCell className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEdit(t);
                                }}
                                className="admin-action-btn"
                                title="Edit Transaksi"
                              >
                                <HugeIconEdit size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteTarget(t);
                                }}
                                className="admin-action-btn delete"
                                title="Hapus Transaksi"
                              >
                                <HugeIconTrash size={16} />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>

              {/* Standard CMS Pagination */}
              <div className="border-t border-[#e5e5e2] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#fcfcfc]">
                <div className="text-xs text-[#525854] flex items-center gap-2">
                  <span>
                    Menampilkan <strong>{totalItems === 0 ? 0 : startIndex + 1}</strong> –{" "}
                    <strong>{endIndex}</strong> dari <strong>{totalItems}</strong> transaksi
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

      {/* Modal Catat Transaksi Baru */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Catat Mutasi Arus Kas</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateTransaction} className="space-y-4 pt-1">
            {/* Segmented Tab Styling for Tipe Arus Kas */}
            <div>
              <Label className="text-xs font-bold text-[#111413] mb-1.5 block">Tipe Arus Kas *</Label>
              <div className="admin-tabs-list full-width" style={{ width: "100%", display: "flex", backgroundColor: "#f1f3ed", padding: "4px", borderRadius: "10px", border: "1px solid var(--border)", gap: "4px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setNewType("INCOME");
                    setNewCategory("SUBSCRIPTION");
                  }}
                  className={`admin-tab-trigger ${newType === "INCOME" ? "active-income" : ""}`}
                  style={{
                    flex: 1,
                    height: "38px",
                    fontSize: "13px",
                    fontWeight: 700,
                  }}
                >
                  <ArrowUpRight size={15} />
                  <span>Pemasukan</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setNewType("EXPENSE");
                    setNewCategory("SERVER_INFRA");
                  }}
                  className={`admin-tab-trigger ${newType === "EXPENSE" ? "active-expense" : ""}`}
                  style={{
                    flex: 1,
                    height: "38px",
                    fontSize: "13px",
                    fontWeight: 700,
                  }}
                >
                  <ArrowDownLeft size={15} />
                  <span>Pengeluaran</span>
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="tx-title">Judul Transaksi *</Label>
              <Input
                id="tx-title"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={
                  newType === "INCOME"
                    ? "e.g. Pembayaran Subscription Paket PRO"
                    : "e.g. Tagihan Server Cloud VPS"
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="tx-category">Kategori Transaksi</Label>
                <Select
                  id="tx-category"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                >
                  {newType === "INCOME" ? (
                    <>
                      <option value="SUBSCRIPTION">Subscription Paket</option>
                      <option value="JUAL_PUTUS">Jual Putus (Source Code / Lisensi Penuh)</option>
                      <option value="SETUP_FEE">Biaya Setup Domain</option>
                      <option value="ADDON">Add-on Fitur</option>
                      <option value="OTHER">Lainnya</option>
                    </>
                  ) : (
                    <>
                      <option value="SERVER_INFRA">Server & Hosting</option>
                      <option value="DOMAIN_REGISTRATION">Domain Registrar</option>
                      <option value="WHATSAPP_GATEWAY">WhatsApp Gateway</option>
                      <option value="MARKETING">Marketing & Iklan</option>
                      <option value="OPERATIONAL">Operasional Kantor</option>
                      <option value="OTHER">Lainnya</option>
                    </>
                  )}
                </Select>
              </div>

              <div>
                <Label htmlFor="tx-amount">Nominal (Rp) *</Label>
                <CurrencyInput
                  id="tx-amount"
                  name="amount"
                  value={newAmount}
                  onValueChange={(val) => setNewAmount(val)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="tx-tenant">Merchant Terkait</Label>
                <Select
                  id="tx-tenant"
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                >
                  <option value="">-- Umum (Infrastruktur) --</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="tx-method">Metode Pembayaran</Label>
                <Select
                  id="tx-method"
                  value={newPaymentMethod}
                  onChange={(e) => setNewPaymentMethod(e.target.value)}
                >
                  <option value="Transfer Bank BCA">Transfer BCA</option>
                  <option value="Transfer Bank Mandiri">Transfer Mandiri</option>
                  <option value="Kartu Kredit">Kartu Kredit</option>
                  <option value="E-Wallet">E-Wallet (QRIS)</option>
                  <option value="Tunai / Kas Kecil">Tunai</option>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="tx-desc">Catatan / Keterangan Tambahan</Label>
              <Input
                id="tx-desc"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Catatan invoice atau nomor referensi"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Menyimpan..." : "Simpan Transaksi"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Transaction Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Catatan Mutasi</DialogTitle>
            <DialogDescription>
              Perbarui detail transaksi arus kas platform.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-bold text-[#111413] mb-1.5 block">Tipe Arus Kas *</Label>
              <div className="admin-tabs-list full-width" style={{ width: "100%", display: "flex", backgroundColor: "#f1f3ed", padding: "4px", borderRadius: "10px", border: "1px solid var(--border)", gap: "4px" }}>
                <button
                  type="button"
                  onClick={() => setEditType("INCOME")}
                  className={`admin-tab-trigger ${editType === "INCOME" ? "active-income" : ""}`}
                  style={{ flex: 1, height: "38px", fontSize: "13px", fontWeight: 700 }}
                >
                  <ArrowUpRight size={15} />
                  <span>Pemasukan</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditType("EXPENSE")}
                  className={`admin-tab-trigger ${editType === "EXPENSE" ? "active-expense" : ""}`}
                  style={{ flex: 1, height: "38px", fontSize: "13px", fontWeight: 700 }}
                >
                  <ArrowDownLeft size={15} />
                  <span>Pengeluaran</span>
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-tx-title">Judul Transaksi *</Label>
              <Input
                id="edit-tx-title"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Judul transaksi"
              />
            </div>

            <div>
              <Label htmlFor="edit-tx-category">Kategori Transaksi *</Label>
              <Select
                id="edit-tx-category"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
              >
                {editType === "INCOME" ? (
                  <>
                    <option value="SUBSCRIPTION">Subscription Paket Platform</option>
                    <option value="JUAL_PUTUS">Jual Putus (Source Code / Lisensi Penuh)</option>
                    <option value="SETUP_FEE">Biaya Setup Domain / Kustomisasi Toko</option>
                    <option value="ADDON">Add-on Fitur Khusus</option>
                    <option value="OTHER">Pemasukan Lainnya</option>
                  </>
                ) : (
                  <>
                    <option value="SERVER_INFRA">Server & Hosting Cloud VPS</option>
                    <option value="DOMAIN_REGISTRATION">Registrasi & Perpanjangan Domain</option>
                    <option value="WHATSAPP_GATEWAY">Biaya WhatsApp Gateway (Fonnte/Waba)</option>
                    <option value="MARKETING">Marketing & Iklan Platform</option>
                    <option value="OPERATIONAL">Operasional Platform</option>
                    <option value="OTHER">Pengeluaran Lainnya</option>
                  </>
                )}
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-tx-amount">Nominal (Rp) *</Label>
              <CurrencyInput
                id="edit-tx-amount"
                name="amount"
                value={editAmount}
                onValueChange={(val) => setEditAmount(val)}
                placeholder="Rp 0"
              />
            </div>

            <div>
              <Label htmlFor="edit-tx-tenant">Merchant Terkait (Opsional)</Label>
              <Select
                id="edit-tx-tenant"
                value={editTenantId}
                onChange={(e) => setEditTenantId(e.target.value)}
              >
                <option value="">-- Umum (Infrastruktur Platform) --</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({tenantStorefrontHost(t.slug)})
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-tx-method">Metode Pembayaran</Label>
              <Select
                id="edit-tx-method"
                value={editPaymentMethod}
                onChange={(e) => setEditPaymentMethod(e.target.value)}
              >
                <option value="Transfer BCA">Transfer BCA</option>
                <option value="Transfer Mandiri">Transfer Mandiri</option>
                <option value="Transfer BNI / BRI">Transfer BNI / BRI</option>
                <option value="Kartu Kredit / Debit">Kartu Kredit / Debit</option>
                <option value="QRIS Platform">QRIS Platform</option>
                <option value="Tunai">Tunai</option>
                <option value="Lainnya">Lainnya</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-tx-desc">Catatan / Keterangan Tambahan</Label>
              <Input
                id="edit-tx-desc"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Catatan invoice atau nomor referensi"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
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
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus Catatan Transaksi?"
        description={`Apakah Anda yakin ingin menghapus catatan transaksi "${deleteTarget?.title}" sebesar Rp ${deleteTarget?.amount.toLocaleString("id-ID")}? Data mutasi yang dihapus tidak dapat dipulihkan.`}
        confirmLabel="Ya, Hapus Transaksi"
        onConfirm={executeDeleteTransaction}
        loading={deleting}
      />
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <ToastProvider>
      <TransactionsContent />
    </ToastProvider>
  );
}
