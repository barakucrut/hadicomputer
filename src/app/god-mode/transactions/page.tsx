"use client";

import * as React from "react";
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

function TransactionsContent() {
  const router = useRouter();
  const toast = useToast();

  const [transactions, setTransactions] = React.useState<TransactionItem[]>([]);
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
  const [newTenantName, setNewTenantName] = React.useState("");
  const [newPaymentMethod, setNewPaymentMethod] = React.useState("Transfer Bank");
  const [newDescription, setNewDescription] = React.useState("");

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
      toast.error("Gagal memuat daftar transaksi keuangan");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchTransactions();
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
          tenantName: newTenantName.trim() || null,
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
      setNewTenantName("");
      setNewDescription("");
      fetchTransactions();
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan transaksi");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteTransaction(id: string) {
    if (!confirm("Hapus catatan transaksi ini?")) return;

    try {
      const res = await fetch(`/api/god-mode/transactions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus transaksi");
      toast.success("Catatan transaksi telah dihapus.");
      fetchTransactions();
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus data");
    }
  }

  // Filter Transactions
  const filteredList = React.useMemo(() => {
    return transactions.filter((t) => {
      const matchesType = typeFilter === "ALL" || t.type === typeFilter;
      const matchesSearch =
        searchQuery === "" ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.tenantName && t.tenantName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesType && matchesSearch;
    });
  }, [transactions, typeFilter, searchQuery]);

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
          <Link href="/god-mode/tenants" className="admin-nav-item">
            <Store size={19} />
            <span>Daftar Tenant Toko</span>
          </Link>
          <Link href="/god-mode/transactions" className="admin-nav-item active">
            <Receipt size={19} />
            <span>Transaksi Keuangan</span>
          </Link>
          <Link href="/god-mode/styleguide" className="admin-nav-item">
            <Palette size={19} />
            <span>Living Styleguide</span>
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
              Arus Kas & Transaksi Platform
            </span>
            <Badge variant="default" className="text-[11px] bg-red-600">
              FINANCE SAAS
            </Badge>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Button onClick={() => setIsAddOpen(true)} className="flex items-center gap-1.5">
              <Plus size={16} />
              <span>Catat Transaksi</span>
            </Button>

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
                  size="sm"
                  onClick={fetchTransactions}
                  className="flex items-center gap-1.5 text-xs font-semibold"
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
                  <div className="flex bg-[#f6f6f4] p-1 rounded-lg border border-[#e5e5e2]">
                    <button
                      type="button"
                      onClick={() => {
                        setTypeFilter("ALL");
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                        typeFilter === "ALL" ? "bg-white text-[#111413] shadow-xs" : "text-[#525854]"
                      }`}
                    >
                      Semua
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTypeFilter("INCOME");
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                        typeFilter === "INCOME" ? "bg-white text-green-700 shadow-xs" : "text-[#525854]"
                      }`}
                    >
                      Pemasukan
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTypeFilter("EXPENSE");
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                        typeFilter === "EXPENSE" ? "bg-white text-red-600 shadow-xs" : "text-[#525854]"
                      }`}
                    >
                      Pengeluaran
                    </button>
                  </div>
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
                        <TableRow key={t.id} className="hover:bg-[#fafafa] transition-colors">
                          <TableCell className="py-4 px-6 text-xs text-[#525854] font-medium">
                            {new Date(t.date).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </TableCell>

                          <TableCell className="py-4 px-6">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black ${
                                t.type === "INCOME"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
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
                            </span>
                          </TableCell>

                          <TableCell className="py-4 px-6">
                            <div>
                              <div className="font-bold text-[#111413] text-sm">{t.title}</div>
                              <div className="text-xs text-[#818779] flex items-center gap-2 mt-0.5">
                                <span className="bg-[#f0f0ee] px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                                  {t.category}
                                </span>
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

                          <TableCell className="py-4 px-6 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTransaction(t.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                              title="Hapus Transaksi"
                            >
                              <Trash2 size={14} />
                            </Button>
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
            <DialogDescription>
              Catat transaksi pemasukan atau pengeluaran operasional platform.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTransaction} className="space-y-4 pt-2">
            <div>
              <Label>Tipe Arus Kas *</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setNewType("INCOME");
                    setNewCategory("SUBSCRIPTION");
                  }}
                  className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    newType === "INCOME"
                      ? "border-green-600 bg-green-50 text-green-800 shadow-xs"
                      : "border-[#e5e5e2] text-[#525854]"
                  }`}
                >
                  <ArrowUpRight size={14} />
                  <span>Pemasukan (+)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setNewType("EXPENSE");
                    setNewCategory("SERVER_INFRA");
                  }}
                  className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    newType === "EXPENSE"
                      ? "border-red-600 bg-red-50 text-red-700 shadow-xs"
                      : "border-[#e5e5e2] text-[#525854]"
                  }`}
                >
                  <ArrowDownLeft size={14} />
                  <span>Pengeluaran (-)</span>
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
                <Input
                  id="tx-amount"
                  type="number"
                  required
                  min="1"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="e.g. 250000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="tx-tenant">Merchant Terkait (Opsional)</Label>
                <Input
                  id="tx-tenant"
                  value={newTenantName}
                  onChange={(e) => setNewTenantName(e.target.value)}
                  placeholder="e.g. Hadi Computer"
                />
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
