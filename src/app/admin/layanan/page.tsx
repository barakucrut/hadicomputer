"use client";

import * as React from "react";
import { Wrench, Edit, Save, Plus } from "lucide-react";
import { Button } from "@/components/admin/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/admin/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/admin/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCan } from "@/components/admin/permissions";
import { useToast } from "@/components/admin/ui/toast";

export default function AdminServicesPage() {
  const canManage = useCan()("services:manage");
  const toast = useToast();
  const [services, setServices] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editingService, setEditingService] = React.useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const fetchServices = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/services");
      const data = await res.json();
      if (data.services) setServices(data.services);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  function handleOpenEdit(s: any) {
    setEditingService({ ...s });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!editingService) return;
    try {
      const res = await fetch("/api/admin/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingService),
      });
      if (res.ok) {
        setDialogOpen(false);
        fetchServices();
        toast.success(`Informasi layanan "${editingService.title}" berhasil diperbarui!`);
      } else {
        toast.error("Gagal menyimpan informasi layanan.");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat menyimpan layanan.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-[#111413] tracking-tight">Layanan & Jasa</h2>
        <p className="text-sm text-[#525854] mt-1">
          Kelola informasi servis perbaikan, perawatan laptop/PC, dan jasa rakit PC custom.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {services.map((s) => (
          <Card key={s.id} className="flex flex-col justify-between">
            <CardHeader className="p-6 pb-4 border-b border-[#f1f3ed]">
              <div className="flex items-center justify-between">
                <CardTitle
                  className="admin-service-title"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    margin: 0,
                  }}
                >
                  <div
                    className="admin-service-icon-box"
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "8px",
                      backgroundColor: "#fee2e2",
                      color: "#cc252b",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Wrench size={18} />
                  </div>
                  <span style={{ fontSize: "16px", fontWeight: 800, color: "#111413" }}>
                    {s.title}
                  </span>
                </CardTitle>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(s)}
                    className="admin-action-btn"
                    title="Edit Layanan"
                  >
                    <Edit size={16} />
                  </button>
                )}
              </div>
              <div style={{ marginTop: "10px" }}>
                <span className="admin-service-slug-badge" style={{ padding: "4px 10px", borderRadius: "6px" }}>
                  /{s.slug}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex flex-col justify-between">
              <p style={{ fontSize: "14px", color: "#525854", lineHeight: "1.6", margin: 0 }}>
                {s.summary}
              </p>
              <div className="admin-service-meta" style={{ marginTop: "24px", paddingTop: "18px", borderTop: "1px solid #f1f3ed" }}>
                <div className="admin-service-meta-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                  <span className="admin-service-meta-label" style={{ fontWeight: 700, color: "#111413", fontSize: "12.5px" }}>
                    Estimasi Waktu:
                  </span>
                  <span className="admin-service-badge-neutral" style={{ padding: "4px 12px", borderRadius: "6px" }}>
                    {s.estimatedTime || "1 - 3 Hari Kerja"}
                  </span>
                </div>
                <div className="admin-service-meta-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                  <span className="admin-service-meta-label" style={{ fontWeight: 700, color: "#111413", fontSize: "12.5px" }}>
                    Biaya / Tarif:
                  </span>
                  <span className="admin-service-badge-success" style={{ padding: "4px 12px", borderRadius: "6px" }}>
                    {s.priceInfo || "Konsultasi / Sesuai Kerusakan"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {editingService && (
          <>
            <DialogHeader>
              <DialogTitle>Edit Layanan: {editingService.title}</DialogTitle>
              <DialogDescription>Perbarui informasi layanan dan format chat WhatsApp.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="srv-title">Nama Layanan *</Label>
                <Input
                  id="srv-title"
                  type="text"
                  value={editingService.title}
                  onChange={(e) => setEditingService({ ...editingService, title: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="srv-summary">Ringkasan</Label>
                <textarea
                  id="srv-summary"
                  rows={2}
                  value={editingService.summary}
                  onChange={(e) => setEditingService({ ...editingService, summary: e.target.value })}
                  className="shadcn-input h-auto py-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="srv-time">Estimasi Waktu</Label>
                  <Input
                    id="srv-time"
                    type="text"
                    value={editingService.estimatedTime || ""}
                    onChange={(e) =>
                      setEditingService({ ...editingService, estimatedTime: e.target.value })
                    }
                    placeholder="e.g. 1 - 3 Hari Kerja"
                  />
                </div>
                <div>
                  <Label htmlFor="srv-price">Info Tarif</Label>
                  <Input
                    id="srv-price"
                    type="text"
                    value={editingService.priceInfo || ""}
                    onChange={(e) =>
                      setEditingService({ ...editingService, priceInfo: e.target.value })
                    }
                    placeholder="e.g. Mulai Rp 75.000"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="srv-wa">Template Chat WhatsApp</Label>
                <textarea
                  id="srv-wa"
                  rows={2}
                  value={editingService.ctaWhatsappText || ""}
                  onChange={(e) =>
                    setEditingService({ ...editingService, ctaWhatsappText: e.target.value })
                  }
                  className="shadcn-input h-auto py-2.5"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleSave}>Simpan Perubahan</Button>
            </DialogFooter>
          </>
        )}
      </Dialog>
    </div>
  );
}
