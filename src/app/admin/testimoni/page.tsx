"use client";

import * as React from "react";
import { Plus, Quote, Star, ExternalLink } from "lucide-react";
import { Button } from "@/components/admin/ui/button";
import { Card } from "@/components/admin/ui/card";
import { Badge } from "@/components/admin/ui/badge";
import { AdminPagination } from "@/components/admin/ui/pagination";
import { HugeIconEdit, HugeIconTrash } from "@/components/admin/ui/huge-icons";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { Switch } from "@/components/admin/ui/switch";
import { ImageDropzone } from "@/components/admin/ui/image-dropzone";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/admin/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/admin/ui/table";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useCan } from "@/components/admin/permissions";
import { useToast } from "@/components/admin/ui/toast";
import {
  TESTIMONIAL_LIMITS,
  TESTIMONIAL_SOURCE_LABELS,
  TESTIMONIAL_SOURCES,
  testimonialInitials,
  type TestimonialSource,
} from "@/lib/testimonials";

type Testimonial = {
  id: string;
  name: string;
  descriptor: string | null;
  quote: string;
  rating: number | null;
  label: string | null;
  photoUrl: string | null;
  source: TestimonialSource;
  sourceUrl: string | null;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
};

type Draft = Omit<Testimonial, "id"> & { id?: string };

const EMPTY_DRAFT: Draft = {
  name: "",
  descriptor: "",
  quote: "",
  rating: null,
  label: "",
  photoUrl: null,
  source: "DIRECT",
  sourceUrl: "",
  isActive: true,
  isFeatured: false,
  sortOrder: 0,
};

const SOURCE_BADGE: Record<TestimonialSource, "info" | "success" | "secondary"> = {
  GOOGLE: "info",
  WHATSAPP: "success",
  DIRECT: "secondary",
};

function Stars({ value }: { value: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }} aria-label={`${value} dari 5 bintang`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={13}
          strokeWidth={1.8}
          fill={n <= value ? "#f59e0b" : "none"}
          color={n <= value ? "#f59e0b" : "#c9c6bd"}
        />
      ))}
    </span>
  );
}

function Avatar({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#fee2e2] text-xs font-extrabold text-[#cc252b]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {photoUrl ? <img src={photoUrl} alt="" className="h-full w-full object-cover" /> : testimonialInitials(name)}
    </div>
  );
}

export default function AdminTestimonialsPage() {
  const canManage = useCan()("testimonials:manage");
  const toast = useToast();
  const [items, setItems] = React.useState<Testimonial[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<Draft>(EMPTY_DRAFT);
  const [saving, setSaving] = React.useState(false);


  const [deleteTarget, setDeleteTarget] = React.useState<Testimonial | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  // Pilihan massal (per halaman, seperti CMS produk)
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false);
  const [bulkBusy, setBulkBusy] = React.useState(false);

  // useToast() returns a new object each render; keep it out of the deps.
  const toastRef = React.useRef(toast);
  toastRef.current = toast;

  const fetchItems = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/testimonials");
      const data = await res.json();
      if (Array.isArray(data.testimonials)) setItems(data.testimonials);
    } catch (err) {
      console.error(err);
      toastRef.current.error("Gagal memuat daftar testimoni.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const activeCount = items.filter((t) => t.isActive).length;
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const pageItems = items.slice((page - 1) * pageSize, page * pageSize);

  React.useEffect(() => {
    setSelectedIds([]);
  }, [page, pageSize]);

  const isAllSelected = pageItems.length > 0 && pageItems.every((t) => selectedIds.includes(t.id));
  const isIndeterminate = pageItems.some((t) => selectedIds.includes(t.id)) && !isAllSelected;
  const colCount = canManage ? 8 : 7;

  function handleSelectAll() {
    setSelectedIds(isAllSelected ? [] : pageItems.map((t) => t.id));
  }

  function handleToggleSelect(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function executeBulkDelete() {
    if (selectedIds.length === 0) return;
    setBulkBusy(true);
    try {
      const res = await fetch("/api/admin/testimonials", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      const remaining = items.filter((x) => !selectedIds.includes(x.id));
      setItems(remaining);
      toast.success(`${data.count} testimoni berhasil dihapus.`);
      setSelectedIds([]);
      setBulkDeleteOpen(false);
      const lastPage = Math.max(1, Math.ceil(remaining.length / pageSize));
      if (page > lastPage) setPage(lastPage);
    } catch (err: any) {
      toast.error(err?.message || "Gagal menghapus testimoni terpilih.");
    } finally {
      setBulkBusy(false);
    }
  }

  function openCreate() {
    setDraft({ ...EMPTY_DRAFT });
    setDialogOpen(true);
  }

  function openEdit(t: Testimonial) {
    setDraft({ ...t, descriptor: t.descriptor ?? "", label: t.label ?? "", sourceUrl: t.sourceUrl ?? "" });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!draft.name.trim()) return toast.error("Nama pelanggan wajib diisi.");
    if (!draft.quote.trim()) return toast.error("Isi testimoni wajib diisi.");

    setSaving(true);
    try {
      const isNew = !draft.id;
      const res = await fetch(isNew ? "/api/admin/testimonials" : `/api/admin/testimonials/${draft.id}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Gagal menyimpan testimoni.");
        return;
      }
      toast.success(isNew ? "Testimoni baru berhasil ditambahkan!" : "Testimoni berhasil diperbarui!");
      setDialogOpen(false);
      await fetchItems();
    } catch {
      toast.error("Terjadi kesalahan saat menyimpan testimoni.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleField(t: Testimonial, field: "isActive" | "isFeatured") {
    const next = !t[field];
    setItems((prev) => prev.map((x) => (x.id === t.id ? { ...x, [field]: next } : x)));
    try {
      const res = await fetch(`/api/admin/testimonials/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setItems((prev) => prev.map((x) => (x.id === t.id ? { ...x, [field]: !next } : x)));
      toast.error("Gagal mengubah status testimoni.");
    }
  }

  async function executeDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/testimonials/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      toast.success(`Testimoni dari "${deleteTarget.name}" berhasil dihapus.`);
      if (page > 1 && pageItems.length === 1) setPage(page - 1);
    } catch {
      toast.error("Gagal menghapus testimoni.");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#111413] tracking-tight">Testimoni Pelanggan</h2>
          <p className="text-sm text-[#525854] mt-1">
            Kutipan pengalaman pelanggan yang tampil di beranda etalase (maks. 6, unggulan lebih dulu) dan halaman Testimoni.
          </p>
        </div>
        {canManage && (
          <Button onClick={openCreate} className="flex items-center gap-2">
            <Plus size={16} />
            <span>Tambah Testimoni</span>
          </Button>
        )}
      </div>

      {canManage && selectedIds.length > 0 && (
        <div className="admin-bulk-bar">
          <div className="flex items-center gap-3">
            <Badge variant="destructive">{selectedIds.length} Testimoni Dipilih</Badge>
            <span className="text-xs text-[#525854] hidden sm:inline">dari {pageItems.length} testimoni di halaman ini</span>
          </div>
          <div className="flex items-center gap-2" style={{ flexWrap: "wrap" }}>
            <Button type="button" variant="outline" size="sm" onClick={() => setSelectedIds([])} disabled={bulkBusy}>
              Batalkan Pilihan
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteOpen(true)}
              disabled={bulkBusy}
              className="flex items-center gap-1.5"
            >
              <HugeIconTrash size={15} />
              <span>Hapus {selectedIds.length} Testimoni</span>
            </Button>
          </div>
        </div>
      )}

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {canManage && (
                <TableHead style={{ width: "44px", paddingRight: "0", paddingLeft: "16px" }}>
                  <input
                    type="checkbox"
                    aria-label="Pilih semua testimoni di halaman ini"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate;
                    }}
                    onChange={handleSelectAll}
                    className="admin-checkbox"
                  />
                </TableHead>
              )}
              <TableHead style={{ minWidth: 190 }}>Pelanggan</TableHead>
              <TableHead style={{ minWidth: 240 }}>Testimoni</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Sumber</TableHead>
              <TableHead>Unggulan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={colCount} className="text-center py-8 text-[#525854]">
                  Memuat daftar testimoni...
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colCount} className="text-center py-8 text-[#525854]">
                  <div className="flex flex-col items-center justify-center gap-2 text-center">
                    <Quote size={28} className="text-[#818779]" />
                    <span>Belum ada testimoni. Section testimoni di etalase otomatis tersembunyi sampai ada testimoni aktif.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              pageItems.map((t) => (
                <TableRow
                  key={t.id}
                  className={`${canManage ? "admin-clickable-row" : ""} ${selectedIds.includes(t.id) ? "admin-row-selected" : ""}`.trim()}
                  onClick={(e) => {
                    if (!canManage) return;
                    const target = e.target as HTMLElement;
                    if (target.closest("button") || target.closest("a") || target.closest("input")) return;
                    openEdit(t);
                  }}
                >
                  {canManage && (
                    <TableCell
                      style={{ width: "44px", paddingRight: "0", paddingLeft: "16px" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        aria-label={`Pilih testimoni ${t.name}`}
                        checked={selectedIds.includes(t.id)}
                        onChange={() => handleToggleSelect(t.id)}
                        className="admin-checkbox"
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar name={t.name} photoUrl={t.photoUrl} />
                      <div className="min-w-0">
                        <div className="font-bold text-[#111413] text-sm" style={{ display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{t.name}</div>
                        {t.descriptor && <div className="text-xs text-[#525854]" style={{ display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{t.descriptor}</div>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-[#525854]" style={{ maxWidth: 340, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      &ldquo;{t.quote}&rdquo;
                    </div>
                    {t.label && (
                      <div style={{ marginTop: 4, fontSize: 11, fontWeight: 600, color: "#65765a" }}>
                        {t.label}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {t.rating ? <Stars value={t.rating} /> : <span className="text-xs" style={{ color: "var(--muted)" }}>-</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Badge variant={SOURCE_BADGE[t.source]}>{TESTIMONIAL_SOURCE_LABELS[t.source]}</Badge>
                      {t.sourceUrl && (
                        <a
                          href={t.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Buka ulasan asli"
                          style={{ color: "var(--muted)", display: "inline-flex" }}
                        >
                          <ExternalLink size={13} />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => canManage && toggleField(t, "isFeatured")}
                      disabled={!canManage}
                      className="admin-badge-btn"
                      title="Klik untuk menandai / melepas unggulan"
                    >
                      <Badge variant={t.isFeatured ? "warning" : "secondary"}>
                        {t.isFeatured ? "Unggulan" : "Biasa"}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => canManage && toggleField(t, "isActive")}
                      disabled={!canManage}
                      className="admin-badge-btn"
                      title="Klik untuk menampilkan / menyembunyikan"
                    >
                      <Badge variant={t.isActive ? "success" : "destructive"}>
                        {t.isActive ? "Tampil" : "Disembunyikan"}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    {canManage && (
                      <div className="flex items-center justify-end gap-1.5">
                        <button type="button" onClick={() => openEdit(t)} title="Edit Testimoni" className="admin-action-btn">
                          <HugeIconEdit size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(t)}
                          title="Hapus Testimoni"
                          className="admin-action-btn delete"
                        >
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
          totalPages={totalPages}
          totalItems={items.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setPage(1);
          }}
          pageSizeOptions={[5, 10, 20]}
        />
      </Card>

      {items.length > 0 && (
        <p className="text-xs text-[#525854]">
          {activeCount} testimoni tampil{activeCount > 6 ? " — hanya 6 teratas (unggulan, lalu urutan) yang muncul di beranda." : "."}
        </p>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen} dismissible={!saving} style={{ maxWidth: 640 }}>
        <DialogHeader>
          <DialogTitle>{draft.id ? `Edit Testimoni: ${draft.name}` : "Tambah Testimoni"}</DialogTitle>
          <DialogDescription>
            Salin kutipan apa adanya dari pelanggan. Jangan menambah atau mengubah isi dan rating.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2" style={{ maxHeight: "62vh", overflowY: "auto", paddingRight: 10 }}>
          <div>
            <Label style={{ display: "block", marginBottom: 8 }}>Foto Pelanggan</Label>
            <ImageDropzone
              value={draft.photoUrl}
              onChange={(url) => setDraft((prev) => ({ ...prev, photoUrl: url }))}
              folder="testimonials"
              label="Unggah Foto Pelanggan"
              hint="Opsional. JPG / PNG / WebP — otomatis dikompres. Tanpa foto tampil inisial nama."
              previewHeight={96}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="testi-name">Nama Pelanggan *</Label>
              <Input
                id="testi-name"
                value={draft.name}
                maxLength={TESTIMONIAL_LIMITS.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="e.g. Rina A."
              />
            </div>
            <div>
              <Label htmlFor="testi-desc">Keterangan</Label>
              <Input
                id="testi-desc"
                value={draft.descriptor ?? ""}
                maxLength={TESTIMONIAL_LIMITS.descriptor}
                onChange={(e) => setDraft({ ...draft, descriptor: e.target.value })}
                placeholder="e.g. Mahasiswa, Jember"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="testi-quote">Isi Testimoni *</Label>
            <textarea
              id="testi-quote"
              rows={4}
              value={draft.quote}
              maxLength={TESTIMONIAL_LIMITS.quote}
              onChange={(e) => setDraft({ ...draft, quote: e.target.value })}
              className="shadcn-input h-auto py-2.5"
              placeholder="Tulis persis seperti yang disampaikan pelanggan."
            />
            <span className="admin-form-hint">
              {draft.quote.length}/{TESTIMONIAL_LIMITS.quote} karakter. Kutipan pendek 1–3 kalimat paling enak dibaca.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="testi-rating">Rating</Label>
              <Select
                id="testi-rating"
                value={draft.rating ? String(draft.rating) : ""}
                onChange={(e) => setDraft({ ...draft, rating: e.target.value ? Number(e.target.value) : null })}
              >
                <option value="">Tanpa rating</option>
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {"★".repeat(n)} ({n})
                  </option>
                ))}
              </Select>
              <span className="admin-form-hint">Isi hanya jika pelanggan memberi bintang (mis. di Google).</span>
            </div>
            <div>
              <Label htmlFor="testi-label">Label Layanan / Produk</Label>
              <Input
                id="testi-label"
                value={draft.label ?? ""}
                maxLength={TESTIMONIAL_LIMITS.label}
                onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                placeholder="e.g. Servis laptop"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="testi-source">Sumber</Label>
              <Select
                id="testi-source"
                value={draft.source}
                onChange={(e) => setDraft({ ...draft, source: e.target.value as TestimonialSource })}
              >
                {TESTIMONIAL_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {TESTIMONIAL_SOURCE_LABELS[s]}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="testi-order">Urutan</Label>
              <Input
                id="testi-order"
                type="number"
                value={draft.sortOrder}
                onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) || 0 })}
              />
              <span className="admin-form-hint">Angka kecil tampil lebih dulu.</span>
            </div>
          </div>

          <div>
            <Label htmlFor="testi-url">Link Ulasan Asli</Label>
            <Input
              id="testi-url"
              type="url"
              value={draft.sourceUrl ?? ""}
              maxLength={TESTIMONIAL_LIMITS.sourceUrl}
              onChange={(e) => setDraft({ ...draft, sourceUrl: e.target.value })}
              placeholder="https://maps.app.goo.gl/..."
            />
            <span className="admin-form-hint">Opsional. Hanya untuk arsip admin, tidak ditampilkan ke pengunjung.</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center justify-between gap-3 text-xs font-semibold text-[#111413]">
              <span>Tampilkan di beranda</span>
              <Switch
                checked={draft.isActive}
                onCheckedChange={(v) => setDraft({ ...draft, isActive: v })}
                aria-label="Tampilkan di beranda"
              />
            </label>
            <label className="flex items-center justify-between gap-3 text-xs font-semibold text-[#111413]">
              <span>Jadikan unggulan</span>
              <Switch
                checked={draft.isFeatured}
                onCheckedChange={(v) => setDraft({ ...draft, isFeatured: v })}
                aria-label="Jadikan unggulan"
              />
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
            Batal
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan Testimoni"}
          </Button>
        </DialogFooter>
      </Dialog>

      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={(open) => !bulkBusy && setBulkDeleteOpen(open)}
        title={`Hapus ${selectedIds.length} Testimoni Terpilih?`}
        description={`${selectedIds.length} testimoni yang dipilih akan dihapus permanen dan hilang dari beranda serta halaman Testimoni.`}
        confirmLabel={`Ya, Hapus ${selectedIds.length} Testimoni`}
        onConfirm={executeBulkDelete}
        loading={bulkBusy}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus Testimoni?"
        description={`Testimoni dari "${deleteTarget?.name}" akan dihapus permanen dan hilang dari beranda.`}
        confirmLabel="Ya, Hapus Testimoni"
        onConfirm={executeDelete}
        loading={deleting}
      />
    </div>
  );
}
