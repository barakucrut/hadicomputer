"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Circle, ExternalLink, LayoutDashboard, Link2, MessageCircle, Plus, Sparkles, Store, TrendingUp } from "lucide-react";
import { Badge } from "@/components/admin/ui/badge";
import { Button } from "@/components/admin/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
import { AdminPagination } from "@/components/admin/ui/pagination";
import { useToast } from "@/components/admin/ui/toast";
import type { TenantHealth } from "@/lib/platform-access";
import { GodPageFrame, useGodSession } from "./god-shell";
import { SiteStatusDialog, SiteStatusBadge, demoViewsLabel, type SiteStatusTenant } from "./site-status-dialog";

interface PortfolioTenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: "ACTIVE" | "TRIAL" | "SUSPENDED";
  createdAt: string;
  primaryColor: string;
  acquiredBy: { id: string; name: string } | null;
  siteStatus: "DEMO" | "LIVE";
  demo: { linkExpiresAt: string | null; views: number; views7d: number; lastViewAt: string | null };
  lastAdminLoginAt: string | null;
  products: number;
  banners: number;
  inquiries30d: number;
  health: TenantHealth;
}

interface PortfolioKpi {
  total: number;
  newThisMonth: number;
  active: number;
  trial: number;
  suspended: number;
  needsAttention: number;
  inquiries30d: number;
}

const STATUS_BADGE: Record<PortfolioTenant["status"], { label: string; variant: "success" | "warning" | "destructive" }> = {
  ACTIVE: { label: "Aktif", variant: "success" },
  TRIAL: { label: "Trial", variant: "warning" },
  SUSPENDED: { label: "Suspend", variant: "destructive" },
};

const STAGE_BADGE: Record<TenantHealth["stage"], { label: string; variant: "secondary" | "warning" | "info" | "success" }> = {
  baru: { label: "Baru daftar", variant: "secondary" },
  onboarding: { label: "Onboarding", variant: "warning" },
  siap: { label: "Siap jualan", variant: "info" },
  berjalan: { label: "Berjalan", variant: "success" },
};

function relativeDays(date: string | null) {
  if (!date) return "Belum pernah";
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
  if (days <= 0) return "Hari ini";
  if (days === 1) return "Kemarin";
  return `${days} hari lalu`;
}

function Kpi({ label, value, hint, icon: Icon }: { label: string; value: number; hint: string; icon: React.ComponentType<{ size?: number }> }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#525854]">{label}</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-[#cc252b]">
            <Icon size={16} />
          </span>
        </div>
        <div className="text-2xl font-black tracking-tight text-[#111413]">{value}</div>
        <div className="mt-1 text-xs text-[#525854]">{hint}</div>
      </CardContent>
    </Card>
  );
}

/** Dashboard peran MARKETING: portofolio tenant bawaan sendiri + checklist onboarding. Tanpa data keuangan. */
export function MarketingDashboard() {
  const toast = useToast();
  const [openingCms, setOpeningCms] = React.useState<string | null>(null);
  const [siteTarget, setSiteTarget] = React.useState<SiteStatusTenant | null>(null);

  // Masuk CMS toko milik sendiri (server menolak toko di luar lingkup dengan 404)
  async function openCms(t: { id: string; name: string }) {
    setOpeningCms(t.id);
    try {
      const res = await fetch("/api/god-mode/auth/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: t.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Gagal membuka CMS toko.");
      window.location.href = "/admin";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membuka CMS toko.");
      setOpeningCms(null);
    }
  }
  const { user } = useGodSession();
  const [kpi, setKpi] = React.useState<PortfolioKpi | null>(null);
  const [tenants, setTenants] = React.useState<PortfolioTenant[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [reloadKey, setReloadKey] = React.useState(0);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/god-mode/portfolio", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal memuat portofolio.");
        if (!alive) return;
        setKpi(data.kpi);
        setTenants(data.tenants);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Gagal memuat portofolio.";
        if (alive) setError(message);
        toast.error(message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [toast, reloadKey]);

  // Yang paling butuh perhatian di atas: skor terendah dulu
  const sorted = React.useMemo(() => [...tenants].sort((a, b) => a.health.score - b.health.score), [tenants]);
  const visible = sorted.slice((page - 1) * pageSize, page * pageSize);

  return (
    <GodPageFrame
      active="/god-mode"
      title="Portofolio Tenant Saya"
      actions={
        <Link href="/god-mode/tenants?new=1">
          <Button className="flex h-10 items-center gap-1.5 px-4 text-xs font-bold">
            <Plus size={14} />
            <span className="max-sm:hidden">Tenant Baru</span>
          </Button>
        </Link>
      }
    >
      <div className="w-full space-y-8 pb-20">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#111413]">Halo{user ? `, ${user.name.split(" ")[0]}` : ""} 👋</h1>
            <p className="text-sm text-[#525854]">Pantau toko yang Anda bawa dan selesaikan onboarding mereka sampai siap jualan.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi label="Total Tenant" value={kpi?.total ?? 0} hint={`${kpi?.newThisMonth ?? 0} baru bulan ini`} icon={Store} />
          <Kpi label="Aktif Berbayar" value={kpi?.active ?? 0} hint={`${kpi?.trial ?? 0} masih trial · ${kpi?.suspended ?? 0} suspend`} icon={TrendingUp} />
          <Kpi label="Perlu Follow-up" value={kpi?.needsAttention ?? 0} hint="Belum selesai onboarding" icon={AlertCircle} />
          <Kpi label="Inquiry 30 Hari" value={kpi?.inquiries30d ?? 0} hint="Klik WhatsApp dari semua toko Anda" icon={MessageCircle} />
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="border-b border-[#e5e5e2] p-5">
            <CardTitle className="text-base">Checklist Onboarding</CardTitle>
            <CardDescription>Diurutkan dari toko yang paling butuh bantuan. Hijau = sudah beres.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#fcfcfc]">
                    <TableHead className="px-6 py-3.5">Toko</TableHead>
                    <TableHead className="px-6 py-3.5">Tahap</TableHead>
                    <TableHead className="px-6 py-3.5">Kesiapan</TableHead>
                    <TableHead className="px-6 py-3.5">Langkah Berikutnya</TableHead>
                    <TableHead className="px-6 py-3.5 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-12 text-center text-sm text-[#818779]">
                        Memuat data...
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-12 text-center text-sm text-red-600">
                        {error}
                      </TableCell>
                    </TableRow>
                  ) : visible.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-12 text-center text-sm text-[#818779]">
                        <div className="flex flex-col items-center gap-3">
                          <Sparkles size={22} className="text-[#cc252b]" />
                          <span>Belum ada tenant atas nama Anda. Daftarkan toko pertama Anda.</span>
                          <Link href="/god-mode/tenants?new=1">
                            <Button size="sm">Tambah Tenant</Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    visible.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: t.primaryColor }} />
                            <div className="min-w-0">
                              <div className="truncate text-sm font-bold text-[#111413]">{t.name}</div>
                              <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#818779]">
                                <span>{t.slug}</span>
                                <Badge variant={STATUS_BADGE[t.status].variant}>{STATUS_BADGE[t.status].label}</Badge>
                                <SiteStatusBadge status={t.siteStatus} />
                              </div>
                              {t.siteStatus === "DEMO" && (
                                <div className={`text-xs ${t.demo.views7d > 0 ? "font-semibold text-green-700" : "text-[#818779]"}`}>
                                  {demoViewsLabel(t.demo.views, t.demo.lastViewAt)}
                                </div>
                              )}
                              {/* CMO memantau tenant timnya: tampilkan siapa pemegangnya */}
                              {user?.role === "CMO" && (
                                <div className="text-xs text-[#525854]">
                                  Pemegang:{" "}
                                  <strong>{t.acquiredBy?.id === user.userId ? "Anda" : t.acquiredBy?.name || "-"}</strong>
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Badge variant={STAGE_BADGE[t.health.stage].variant}>{STAGE_BADGE[t.health.stage].label}</Badge>
                          <div className="mt-1.5 text-[11px] text-[#818779]">Login admin: {relativeDays(t.lastAdminLoginAt)}</div>
                        </TableCell>
                        <TableCell className="min-w-[220px] px-6 py-4">
                          <div className="mb-2 flex items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#ecece9]">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${t.health.score}%`, backgroundColor: t.health.score >= 80 ? "#16a34a" : t.health.score >= 50 ? "#d97706" : "#cc252b" }}
                              />
                            </div>
                            <span className="text-xs font-bold text-[#111413]">{t.health.score}%</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {t.health.checks.map((c) => (
                              <span
                                key={c.key}
                                title={c.label}
                                className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                                  c.ok ? "bg-green-50 text-green-700" : "bg-[#f4f4f2] text-[#818779]"
                                }`}
                              >
                                {c.ok ? <CheckCircle2 size={11} /> : <Circle size={11} />}
                                {c.label}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-xs text-[#111413]">
                          {t.health.nextAction ? (
                            <span className="font-semibold">{t.health.nextAction}</span>
                          ) : (
                            <span className="font-semibold text-green-700">Semua beres 🎉</span>
                          )}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              className="admin-action-btn"
                              title={t.siteStatus === "DEMO" ? "Link demo" : "Status website"}
                              aria-label={`${t.siteStatus === "DEMO" ? "Link demo" : "Status website"} ${t.name}`}
                              onClick={() => setSiteTarget({ id: t.id, name: t.name, slug: t.slug, siteStatus: t.siteStatus })}
                            >
                              <Link2 size={16} />
                            </button>
                            <button
                              type="button"
                              className="admin-action-btn"
                              title="Kelola CMS toko"
                              aria-label={`Kelola CMS ${t.name}`}
                              disabled={openingCms === t.id}
                              onClick={() => openCms(t)}
                            >
                              <LayoutDashboard size={16} />
                            </button>
                            <a
                              href={`/?store=${encodeURIComponent(t.slug)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="admin-action-btn"
                              title="Lihat etalase"
                              aria-label={`Lihat etalase ${t.name}`}
                            >
                              <ExternalLink size={16} />
                            </a>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <AdminPagination
              currentPage={page}
              totalPages={Math.ceil(sorted.length / pageSize) || 1}
              totalItems={sorted.length}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </CardContent>
        </Card>
      </div>
      <SiteStatusDialog
        tenant={siteTarget}
        isSuper={user?.role === "SUPERADMIN"}
        onOpenChange={(open) => !open && setSiteTarget(null)}
        onChanged={() => setReloadKey((k) => k + 1)}
      />
    </GodPageFrame>
  );
}
