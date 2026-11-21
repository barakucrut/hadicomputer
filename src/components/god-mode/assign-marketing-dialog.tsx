"use client";

import * as React from "react";
import { UserRoundCog } from "lucide-react";
import { Button } from "@/components/admin/ui/button";
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/admin/ui/dialog";
import { useToast } from "@/components/admin/ui/toast";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export interface MarketingOption {
  id: string;
  name: string;
  email?: string;
  role: "SUPERADMIN" | "CMO" | "MARKETING";
  isActive: boolean;
}

/**
 * Superadmin memindahkan tenant ke marketing lain (atau melepasnya ke pusat).
 * Penegakan ada di PATCH /api/god-mode/tenants/[id] (acquiredById hanya diterima dari superadmin,
 * target wajib akun MARKETING aktif).
 */
export function AssignMarketingDialog({
  tenant,
  team,
  onOpenChange,
  onSaved,
}: {
  tenant: { id: string; name: string; acquiredBy: { id: string; name: string } | null } | null;
  team: MarketingOption[];
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [target, setTarget] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setTarget(tenant?.acquiredBy?.id || "");
  }, [tenant]);

  const marketing = team.filter((m) => (m.role === "MARKETING" || m.role === "CMO") && m.isActive);
  const current = tenant?.acquiredBy?.id || "";
  const unchanged = target === current;

  async function handleSave() {
    if (!tenant || unchanged) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/god-mode/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acquiredById: target || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Gagal memindahkan tenant.");
      const name = marketing.find((m) => m.id === target)?.name;
      toast.success(name ? `${tenant.name} sekarang dipegang ${name}.` : `${tenant.name} sekarang dikelola pusat.`);
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memindahkan tenant.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={Boolean(tenant)} onOpenChange={onOpenChange} dismissible={!saving} style={{ maxWidth: 460, width: "100%" }}>
      <DialogHeader>
        <DialogTitle>Pindahkan ke Marketing</DialogTitle>
        <DialogDescription>
          {tenant?.name} saat ini dipegang <strong>{tenant?.acquiredBy?.name || "pusat (tanpa marketing)"}</strong>.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div>
          <Label htmlFor="assign-marketing" className="text-xs font-bold text-[#111413]">
            Marketing Penanggung Jawab
          </Label>
          <Select id="assign-marketing" value={target} onChange={(e) => setTarget(e.target.value)} disabled={saving}>
            <option value="">— Tanpa marketing (dikelola pusat) —</option>
            {/* Marketing lama yang sudah nonaktif tetap terlihat sebagai nilai saat ini */}
            {tenant?.acquiredBy && !marketing.some((m) => m.id === tenant.acquiredBy!.id) && (
              <option value={tenant.acquiredBy.id} disabled>
                {tenant.acquiredBy.name} (nonaktif)
              </option>
            )}
            {marketing.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
                {m.role === "CMO" ? " (CMO)" : ""}
                {m.email ? ` · ${m.email}` : ""}
              </option>
            ))}
          </Select>
          <p className="admin-form-hint mt-1">
            {marketing.length === 0
              ? "Belum ada akun marketing/CMO aktif. Tambahkan dulu di menu Tim Platform."
              : "Marketing lama langsung kehilangan akses ke tenant ini; marketing baru langsung bisa melihat & mengelolanya."}
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
          Batal
        </Button>
        <Button type="button" onClick={handleSave} disabled={saving || unchanged} className="flex items-center gap-2">
          <UserRoundCog size={15} />
          <span>{saving ? "Memindahkan..." : "Pindahkan"}</span>
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
