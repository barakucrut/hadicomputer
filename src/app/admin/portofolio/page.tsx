"use client";

import * as React from "react";
import { Camera, Plus } from "lucide-react";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import { Card } from "@/components/admin/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/admin/ui/dialog";
import { AdminPagination } from "@/components/admin/ui/pagination";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { HugeIconEdit, HugeIconTrash } from "@/components/admin/ui/huge-icons";
import { ImageDropzone } from "@/components/admin/ui/image-dropzone";
import { Switch } from "@/components/admin/ui/switch";
import { useToast } from "@/components/admin/ui/toast";
import { useCan } from "@/components/admin/permissions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

interface ServiceCase {
  id: string;
  title: string;
  device: string | null;
  summary: string;
  durationText: string | null;
  completedAt: string | null;
  images: string[];
  isPublished: boolean;
  serviceId: string | null;
  service: { id: string; title: string } | null;
}

type FormState = {
  id?: string;
  title: string;
  device: string;
  summary: string;
  durationText: string;
  completedAt: string;
  images: string[];
  isPublished: boolean;
  serviceId: string;
};

const EMPTY: FormState = {
  title: "",
  device: "",
  summary: "",
  durationText: "",
  completedAt: new Date().toISOString().slice(0, 10),
  images: [],
  isPublished: true,
  serviceId: "",
};

const MAX_IMAGES = 8;

function formatDate(d: string | null) {
  if (!d) return "-";
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));
}

export default function AdminServicePortfolioPage() {
  const toast = useToast();
  const canManage = useCan()("services:manage");
  const [cases, setCases] = React.useState<ServiceCase[]>([]);
  const [services, setServices] = React.useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(EMPTY);
  const [saving, setSaving] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<ServiceCase | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [c, s] = await Promise.all([
        fetch("/api/admin/service-cases").then((r) => r.json()),
        fetch("/api/admin/services").then((r) => r.json()),
      ]);
      setCases(c.cases || []);
      setServices((s.services || []).map((x: { id: string; title: string }) => ({ id: x.id, title: x.title })));
    } catch {
      toast.error("Gagal memuat portofolio servis");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setForm({ ...EMPTY, serviceId: services[0]?.id || "" });
    setDialogOpen(true);
  }

  function openEdit(c: ServiceCase) {
    setForm({
      id: c.id,
      title: c.title,
      device: c.device || "",
      summary: c.summary,
      durationText: c.durationText || "",
      completedAt: c.completedAt ? c.completedAt.slice(0, 10) : "",
      images: Array.isArray(c.images) ? c.images : [],
      isPublished: c.isPublished,
      serviceId: c.serviceId || "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/service-cases", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan dokumentasi");
      toast.success(form.id ? "Dokumentasi diperbarui!" : "Dokumentasi servis ditambahkan!");
      setDialogOpen(false);
      load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/service-cases?id=${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus");
      toast.success("Dokumentasi dihapus");
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setDeleting(false);
    }
  }

  const paged = cases.slice((page - 1) * pageSize, page * pageSize);
  const setImage = (idx: number, url: string | null) =>
    setForm((prev) => {
      const next = [...prev.images];
      if (url) next[idx] = url;
      else next.splice(idx, 1);
      return { ...prev, images: next };
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#111413] tracking-tight">Portofolio Servis</h2>
          <p className="text-sm text-[#525854] mt-1">
            Dokumentasikan hasil servis yang selesai — tampil di etalase sebagai bukti kerja nyata toko.
          </p>
        </div>
        {canManage && (
          <Button onClick={openCreate} className="flex items-center gap-1.5">
            <Plus size={16} />
            <span>Tambah Dokumentasi</span>
          </Button>
        )}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead style={{ width: 88 }}>Foto</TableHead>
              <TableHead>Pekerjaan</TableHead>
              <TableHead>Layanan</TableHead>
              <TableHead>Lama Pengerjaan</TableHead>
              <TableHead>Selesai</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">Memuat data...</TableCell>
              </TableRow>
            ) : cases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-[#525854]">
                  <Camera size={28} className="mx-auto mb-2 text-[#818779]" />
                  Belum ada dokumentasi. Foto hasil servis yang rapi adalah bukti terbaik untuk calon pelanggan.
                </TableCell>
              </TableRow>
            ) : (
              paged.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="h-12 w-16 overflow-hidden rounded-md border border-[#e5e3dd] bg-white">
                      {c.images?.[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.images[0]} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-[#111413] line-clamp-1">{c.title}</div>
                    <div className="text-xs text-[#525854]">{c.device || "-"} · {c.images?.length || 0} foto</div>
                  </TableCell>
                  <TableCell className="text-xs">{c.service?.title || "-"}</TableCell>
                  <TableCell className="text-xs">{c.durationText || "-"}</TableCell>
                  <TableCell className="text-xs">{formatDate(c.completedAt)}</TableCell>
                  <TableCell>
                    <Badge variant={c.isPublished ? "success" : "secondary"}>{c.isPublished ? "Tampil" : "Draft"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {canManage && (
                      <div className="flex items-center justify-end gap-1.5">
                        <button type="button" className="admin-action-btn" title="Edit" onClick={() => openEdit(c)}>
                          <HugeIconEdit size={16} />
                        </button>
                        <button type="button" className="admin-action-btn delete" title="Hapus" onClick={() => setDeleteTarget(c)}>
                          <HugeIconTrash size={16} />
                        </button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <AdminPagination
          currentPage={page}
          totalPages={Math.ceil(cases.length / pageSize) || 1}
          totalItems={cases.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setPage(1);
          }}
          pageSizeOptions={[10, 20, 50]}
        />
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        dismissible={!saving}
        className="flex flex-col"
        style={{ maxWidth: "760px", maxHeight: "90vh" }}
      >
        <DialogHeader>
          <DialogTitle>{form.id ? "Edit Dokumentasi Servis" : "Tambah Dokumentasi Servis"}</DialogTitle>
          <DialogDescription>Foto sebelum & sesudah, perangkat, dan ringkasan pekerjaan yang dilakukan.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4" style={{ minHeight: 0, margin: "0 -24px", padding: "4px 24px 8px" }}>
          <div>
            <Label htmlFor="case-title">Judul *</Label>
            <Input id="case-title" value={form.title} maxLength={150} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Mis. Lenovo LOQ 15 — overheat & fan berisik" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="case-device">Perangkat</Label>
              <Input id="case-device" value={form.device} maxLength={150} onChange={(e) => setForm({ ...form, device: e.target.value })} placeholder="Mis. Lenovo LOQ 15IRX9" />
            </div>
            <div>
              <Label htmlFor="case-service">Layanan Terkait</Label>
              <Select id="case-service" value={form.serviceId} onChange={(e) => setForm({ ...form, serviceId: e.target.value })}>
                <option value="">— Tidak dikaitkan —</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="case-duration">Lama Pengerjaan</Label>
              <Input id="case-duration" value={form.durationText} maxLength={60} onChange={(e) => setForm({ ...form, durationText: e.target.value })} placeholder="Mis. 2 hari / 3 jam" />
            </div>
            <div>
              <Label htmlFor="case-date">Tanggal Selesai</Label>
              <Input id="case-date" type="date" value={form.completedAt} onChange={(e) => setForm({ ...form, completedAt: e.target.value })} />
            </div>
          </div>
          <div>
            <Label htmlFor="case-summary">Ringkasan Pekerjaan *</Label>
            <textarea
              id="case-summary"
              rows={4}
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              placeholder="Keluhan pelanggan, apa yang dikerjakan, dan hasil akhirnya. Mis. pembersihan total, ganti thermal paste — suhu turun 18°C."
              className="shadcn-input w-full"
              style={{ height: "auto", paddingTop: 8, paddingBottom: 8 }}
            />
          </div>

          <div>
            <Label>Foto Dokumentasi * (maks. {MAX_IMAGES})</Label>
            <p className="admin-form-hint mb-2">Foto pertama tampil sebagai foto utama. Urutkan: sebelum → proses → sesudah.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {form.images.map((url, idx) => (
                <ImageDropzone key={`${url}-${idx}`} value={url} onChange={(u) => setImage(idx, u)} folder="services" previewHeight={96} />
              ))}
              {form.images.length < MAX_IMAGES && (
                <ImageDropzone
                  value={null}
                  onChange={(u) => u && setForm((prev) => ({ ...prev, images: [...prev.images, u] }))}
                  folder="services"
                  label={form.images.length === 0 ? "Unggah Foto Pertama" : "Tambah Foto"}
                  hint="JPG / PNG / WebP — otomatis dikompres maks. 1900px."
                />
              )}
            </div>
          </div>

          <label className="flex items-start justify-between gap-3 rounded-xl border border-[#e5e3dd] p-4 cursor-pointer">
            <span>
              <span className="text-xs font-bold text-[#111413] block">Tampilkan di etalase</span>
              <span className="admin-form-hint block mt-0.5">Matikan untuk menyimpan sebagai draft.</span>
            </span>
            <Switch checked={form.isPublished} onCheckedChange={(c) => setForm({ ...form, isPublished: c })} />
          </label>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
            Batal
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan Dokumentasi"}
          </Button>
        </DialogFooter>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus dokumentasi ini?"
        description={`"${deleteTarget?.title}" akan dihapus dari portofolio servis.`}
        confirmLabel="Ya, Hapus"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
