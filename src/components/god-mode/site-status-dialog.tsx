"use client";

import * as React from "react";
import { Copy, Globe, Link2, RefreshCw, Rocket } from "lucide-react";
import { Badge } from "@/components/admin/ui/badge";
import { Button } from "@/components/admin/ui/button";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/admin/ui/dialog";
import { useToast } from "@/components/admin/ui/toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface SiteStatusTenant {
  id: string;
  name: string;
  slug: string;
  siteStatus: "DEMO" | "LIVE";
}

interface LinkState {
  active: boolean;
  url: string | null;
  expiresAt: string | null;
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export function SiteStatusBadge({ status }: { status: "DEMO" | "LIVE" }) {
  return status === "DEMO" ? <Badge variant="warning">Demo</Badge> : <Badge variant="success">Live</Badge>;
}

/** "Dibuka 3x · terakhir 2 jam lalu" untuk catatan link demo. */
export function demoViewsLabel(views: number, lastViewAt: string | null): string {
  if (!views || !lastViewAt) return "Link demo belum dibuka";
  const diff = Date.now() - new Date(lastViewAt).getTime();
  const mins = Math.max(1, Math.round(diff / 60_000));
  const ago = mins < 60 ? `${mins} menit lalu` : mins < 1440 ? `${Math.round(mins / 60)} jam lalu` : `${Math.round(mins / 1440)} hari lalu`;
  return `Demo dibuka ${views}x · terakhir ${ago}`;
}

/**
 * Status website toko: link demo berkunci (semua peran, toko dalam lingkupnya)
 * dan aktivasi/kembali ke demo (superadmin). Penegakan ada di API.
 */
export function SiteStatusDialog({
  tenant,
  isSuper,
  onOpenChange,
  onChanged,
}: {
  tenant: SiteStatusTenant | null;
  isSuper: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged?: () => void;
}) {
  const toast = useToast();
  const [link, setLink] = React.useState<LinkState | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [confirm, setConfirm] = React.useState<null | "regenerate" | "live" | "demo">(null);

  React.useEffect(() => {
    if (!tenant) {
      setLink(null);
      return;
    }
    if (tenant.siteStatus !== "DEMO") return;
    setLoading(true);
    fetch(`/api/god-mode/tenants/${tenant.id}/demo-link`, { cache: "no-store" })
      .then(async (res) => (res.ok ? res.json() : Promise.reject(await res.json().catch(() => ({})))))
      .then((data) => setLink({ active: data.active, url: data.url, expiresAt: data.expiresAt }))
      .catch(() => toast.error("Gagal memuat link demo."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant?.id, tenant?.siteStatus]);

  async function createLink() {
    if (!tenant) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/god-mode/tenants/${tenant.id}/demo-link`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Gagal membuat link demo.");
      setLink({ active: data.active, url: data.url, expiresAt: data.expiresAt });
      await copy(data.url, "Link demo baru dibuat & disalin.");
      onChanged?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat link demo.");
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  }

  async function copy(url: string | null, message = "Link demo disalin.") {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(message);
    } catch {
      toast.error("Tidak bisa menyalin otomatis. Salin manual dari kotak link.");
    }
  }

  async function setStatus(status: "LIVE" | "DEMO") {
    if (!tenant) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/god-mode/tenants/${tenant.id}/site-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Gagal mengubah status website.");
      toast.success(status === "LIVE" ? `Website ${tenant.name} sekarang LIVE.` : `${tenant.name} dikembalikan ke mode Demo.`);
      onChanged?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengubah status website.");
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  }

  const isDemo = tenant?.siteStatus === "DEMO";

  return (
    <>
      <Dialog open={Boolean(tenant) && !confirm} onOpenChange={onOpenChange} dismissible={!busy} style={{ maxWidth: 520, width: "100%" }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Status Website</span>
            {tenant && <SiteStatusBadge status={tenant.siteStatus} />}
          </DialogTitle>
          <DialogDescription>
            {isDemo
              ? `${tenant?.name} masih Mode Demo: hanya bisa dibuka lewat link demo berkunci. Tidak muncul di Google.`
              : `${tenant?.name} sudah live dan bisa dibuka siapa pun.`}
          </DialogDescription>
        </DialogHeader>

        {isDemo ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="demo-link" className="text-xs font-bold text-[#111413]">
                Link Demo untuk Calon Klien
              </Label>
              {loading ? (
                <p className="mt-1 text-xs text-[#818779]">Memuat data...</p>
              ) : link?.active && link.url ? (
                <>
                  <div className="mt-1 flex items-center gap-2">
                    <Input id="demo-link" readOnly value={link.url} className="font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
                    <Button type="button" onClick={() => copy(link.url)} className="flex shrink-0 items-center gap-1.5">
                      <Copy size={14} />
                      <span>Salin</span>
                    </Button>
                  </div>
                  <p className="admin-form-hint mt-1">
                    Berlaku sampai {formatDate(link.expiresAt)}. Kirim lewat chat pribadi ke pemilik toko, jangan diposting publik.
                  </p>
                </>
              ) : (
                <div className="mt-1 space-y-2">
                  <p className="text-xs text-[#525854]">Belum ada link demo aktif.</p>
                  <Button type="button" onClick={createLink} disabled={busy} className="flex items-center gap-1.5">
                    <Link2 size={14} />
                    <span>{busy ? "Membuat..." : "Buat & Salin Link Demo"}</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : null}

        <DialogFooter>
          {isDemo && link?.active && (
            <Button type="button" variant="outline" onClick={() => setConfirm("regenerate")} disabled={busy} className="flex items-center gap-1.5">
              <RefreshCw size={14} />
              <span>Buat Link Baru</span>
            </Button>
          )}
          {isSuper && isDemo && (
            <Button type="button" onClick={() => setConfirm("live")} disabled={busy} className="flex items-center gap-1.5">
              <Rocket size={14} />
              <span>Aktifkan Website</span>
            </Button>
          )}
          {isSuper && !isDemo && (
            <Button type="button" variant="outline" onClick={() => setConfirm("demo")} disabled={busy} className="flex items-center gap-1.5">
              <Globe size={14} />
              <span>Kembalikan ke Demo</span>
            </Button>
          )}
          {!isSuper && isDemo && <p className="admin-form-hint">Aktivasi website dilakukan Superadmin setelah closing.</p>}
        </DialogFooter>
      </Dialog>

      <ConfirmDialog
        open={confirm === "regenerate"}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="Buat Link Demo Baru?"
        description="Link lama langsung tidak berlaku, termasuk untuk orang yang sudah membukanya. Kirim ulang link baru ke calon klien."
        confirmLabel="Ya, Buat Link Baru"
        variant="default"
        onConfirm={createLink}
        loading={busy}
      />
      <ConfirmDialog
        open={confirm === "live"}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="Aktifkan Website?"
        description={`Website ${tenant?.name ?? ""} akan terbuka untuk umum di alamatnya dan link demo dimatikan. Pastikan toko sudah closing & data contoh sudah dihapus.`}
        confirmLabel="Ya, Aktifkan"
        variant="default"
        onConfirm={() => setStatus("LIVE")}
        loading={busy}
      />
      <ConfirmDialog
        open={confirm === "demo"}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="Kembalikan ke Mode Demo?"
        description={`Website ${tenant?.name ?? ""} akan langsung terkunci untuk umum dan hanya bisa dibuka lewat link demo.`}
        confirmLabel="Ya, Kunci Website"
        onConfirm={() => setStatus("DEMO")}
        loading={busy}
      />
    </>
  );
}
