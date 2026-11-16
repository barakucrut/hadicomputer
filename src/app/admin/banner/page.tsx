"use client";

import * as React from "react";
import Image from "next/image";
import {
  Plus,
  Trash2,
  Save,
  MousePointerClick,
  Sparkles,
  Layers,
  Upload,
  ArrowLeft,
  Edit,
  ExternalLink,
  Eye,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/admin/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/admin/ui/card";
import { Badge } from "@/components/admin/ui/badge";
import { AdminPagination } from "@/components/admin/ui/pagination";
import { HugeIconEdit, HugeIconTrash } from "@/components/admin/ui/huge-icons";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
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
import { useToast } from "@/components/admin/ui/toast";

export default function AdminBannersPage() {
  const toast = useToast();
  const [banners, setBanners] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [viewMode, setViewMode] = React.useState<"list" | "editor">("list");
  const [editingBanner, setEditingBanner] = React.useState<any | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [newHotspotLabel, setNewHotspotLabel] = React.useState("");
  const canvasRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);

  // Pagination State
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(5);

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const fetchBanners = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/banners");
      const data = await res.json();
      if (data.banners) {
        setBanners(data.banners);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  function handleCreateNewBanner() {
    setEditingBanner({
      id: undefined,
      title: "",
      subtitle: "",
      badgeText: "PROMO SPESIAL MINGGU INI",
      ctaLabel: "Lihat Promo",
      ctaUrl: "#promo-minggu-ini",
      imageUrl: "/images/banners/promo-bundle.png",
      imageAlt: "Promo Hadi Computer",
      bgTheme: "dark",
      isActive: true,
      hotspots: [],
    });
    setViewMode("editor");
  }

  function handleEditBanner(banner: any) {
    setEditingBanner({
      ...banner,
      hotspots: banner.hotspots ? [...banner.hotspots] : [],
    });
    setViewMode("editor");
  }

  function handleDeleteBanner(id: string, title: string) {
    setDeleteTarget({ id, title });
  }

  async function executeDeleteBanner() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/banners?id=${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setBanners((prev) => prev.filter((b) => b.id !== deleteTarget.id));
        toast.success(`Banner "${deleteTarget.title}" berhasil dihapus!`);
      } else {
        toast.error("Gagal menghapus banner.");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat menghapus banner.");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  async function handleToggleStatus(banner: any) {
    const nextStatus = !banner.isActive;
    try {
      const res = await fetch("/api/admin/banners", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...banner, isActive: nextStatus }),
      });
      if (res.ok) {
        setBanners((prev) =>
          prev.map((b) => (b.id === banner.id ? { ...b, isActive: nextStatus } : b))
        );
      }
    } catch (err) {
      console.error(err);
    }
  }

  function handleCanvasClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!canvasRef.current || !editingBanner) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const label =
      newHotspotLabel.trim() ||
      `🎁 Bonus #${(editingBanner.hotspots?.length || 0) + 1}`;

    const newHotspot = {
      label,
      xPercent: Math.round(x * 10) / 10,
      yPercent: Math.round(y * 10) / 10,
    };

    setEditingBanner((prev: any) => ({
      ...prev,
      hotspots: [...(prev.hotspots || []), newHotspot],
    }));

    setNewHotspotLabel("");
  }

  function handleRemoveHotspot(index: number) {
    setEditingBanner((prev: any) => ({
      ...prev,
      hotspots: prev.hotspots.filter((_: any, idx: number) => idx !== index),
    }));
  }

  async function uploadImageFile(file: File) {
    if (!file) return;
    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "banners");

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setEditingBanner((prev: any) => ({ ...prev, imageUrl: data.url }));
      }
    } catch (err) {
      console.error("Upload visual banner failed:", err);
    } finally {
      setUploadingImage(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadImageFile(files[0]);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      uploadImageFile(files[0]);
    }
  }

  async function handleSaveBanner() {
    if (!editingBanner || !editingBanner.title) {
      toast.error("Judul banner wajib diisi.");
      return;
    }

    setSaving(true);
    try {
      const isNew = !editingBanner.id;
      const url = "/api/admin/banners";
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingBanner),
      });

      if (res.ok) {
        toast.success(isNew ? "Banner baru berhasil dibuat!" : "Banner berhasil diperbarui!");
        await fetchBanners();
        setViewMode("list");
      } else {
        toast.error("Gagal menyimpan banner.");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat menyimpan banner.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* ========================================================
          VIEW 1: DAFTAR BANNER HERO (LIST TABLE)
          ======================================================== */}
      {viewMode === "list" && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-[#111413] tracking-tight">Banner Hero</h2>
              <p className="text-sm text-[#525854] mt-1">
                Kelola daftar banner promosi utama beranda toko dan titik hotspot bonus interaktif.
              </p>
            </div>
            <Button onClick={handleCreateNewBanner} className="flex items-center gap-2">
              <Plus size={16} />
              <span>Tambah Banner Baru</span>
            </Button>
          </div>

          {/* Table Card */}
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">Visual</TableHead>
                  <TableHead>Judul & Eyebrow</TableHead>
                  <TableHead>Tombol CTA</TableHead>
                  <TableHead>Tema Latar</TableHead>
                  <TableHead>Hotspot Interaktif</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-[#525854]">
                      Memuat daftar banner...
                    </TableCell>
                  </TableRow>
                ) : banners.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-[#525854]">
                      Belum ada banner yang dibuat. Klik tombol "Tambah Banner Baru" di atas.
                    </TableCell>
                  </TableRow>
                ) : (
                  banners
                    .slice((page - 1) * pageSize, page * pageSize)
                    .map((b) => (
                    <TableRow
                      key={b.id}
                      className="admin-clickable-row"
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (target.closest("button") || target.closest("a")) return;
                        handleEditBanner(b);
                      }}
                    >
                      {/* Visual Thumbnail */}
                      <TableCell>
                        <div className="admin-banner-thumb">
                          <Image
                            src={b.imageUrl || "/images/banners/promo-bundle.png"}
                            alt={b.title}
                            fill
                            unoptimized={typeof b.imageUrl === "string" && b.imageUrl.startsWith("/uploads/")}
                            className="object-cover"
                            sizes="96px"
                          />
                        </div>
                      </TableCell>

                      {/* Title & Eyebrow */}
                      <TableCell>
                        <div className="font-bold text-[#111413] text-sm line-clamp-1">{b.title}</div>
                        {b.badgeText && (
                          <div className="text-[11px] font-semibold text-[#cc252b] mt-0.5">
                            {b.badgeText}
                          </div>
                        )}
                        {b.subtitle && (
                          <div className="text-xs text-[#525854] line-clamp-1 mt-0.5">
                            {b.subtitle}
                          </div>
                        )}
                      </TableCell>

                      {/* CTA */}
                      <TableCell>
                        {b.ctaLabel ? (
                          <div>
                            <div className="text-xs font-bold text-[#111413]">{b.ctaLabel}</div>
                            <div className="text-[11px] font-mono text-[#818779] truncate max-w-xs">
                              {b.ctaUrl || "-"}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-[#818779]">-</span>
                        )}
                      </TableCell>

                      {/* Theme */}
                      <TableCell>
                        <Badge variant="secondary">
                          {b.bgTheme === "dark" ? "Dark (Charcoal)" : b.bgTheme === "sage" ? "Sage Green" : "Light"}
                        </Badge>
                      </TableCell>

                      {/* Hotspots Count */}
                      <TableCell>
                        <Badge variant={b.hotspots?.length > 0 ? "success" : "secondary"}>
                          {b.hotspots?.length || 0} Hotspot
                        </Badge>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(b)}
                          className="admin-badge-btn"
                          title="Klik untuk mengubah status aktif/nonaktif"
                        >
                          <Badge variant={b.isActive ? "success" : "destructive"}>
                            {b.isActive ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </button>
                      </TableCell>

                      {/* Actions (Hugeicons style) */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEditBanner(b)}
                            title="Edit & Kelola Hotspot"
                            className="admin-action-btn"
                          >
                            <HugeIconEdit size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBanner(b.id, b.title)}
                            title="Hapus Banner"
                            className="admin-action-btn delete"
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

            <AdminPagination
              currentPage={page}
              totalPages={Math.ceil(banners.length / pageSize) || 1}
              totalItems={banners.length}
              pageSize={pageSize}
              onPageChange={(p) => setPage(p)}
              onPageSizeChange={(s) => {
                setPageSize(s);
                setPage(1);
              }}
              pageSizeOptions={[5, 10, 20]}
            />
          </Card>
        </div>
      )}

      {/* ========================================================
          VIEW 2: EDITOR BANNER & KANVAS HOTSPOT INTERAKTIF
          ======================================================== */}
      {viewMode === "editor" && editingBanner && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className="admin-action-btn"
                title="Kembali ke Daftar Banner"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <h2 className="text-2xl font-black text-[#111413] tracking-tight">
                  {editingBanner.id ? `Edit: ${editingBanner.title}` : "Tambah Banner Hero Baru"}
                </h2>
                <p className="text-xs text-[#525854] mt-0.5">
                  Atur visual banner, teks promosi, dan klik langsung pada gambar untuk meletakkan titik hotspot.
                </p>
              </div>
            </div>

            <Button
              onClick={handleSaveBanner}
              disabled={saving}
              className="flex items-center gap-2"
            >
              <Save size={16} />
              <span>{saving ? "Menyimpan..." : "Simpan Banner & Hotspot"}</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column (2 Cols): Interactive Canvas & Hotspots List */}
            <div className="lg:col-span-2 space-y-6">
              {/* Canvas Card */}
              <Card className="overflow-hidden">
                <CardHeader className="py-3 bg-[#fdfdfc] border-b border-[#e5e3dd]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#cc252b]">
                      <MousePointerClick size={16} />
                      <span>Klik pada area gambar di bawah untuk meletakkan titik hotspot bonus</span>
                    </div>
                    <Badge variant="secondary">
                      {editingBanner.hotspots?.length || 0} Titik Terpasang
                    </Badge>
                  </div>
                </CardHeader>

                {/* The Canvas */}
                <div className="admin-banner-canvas-wrapper">
                  <div
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    className="admin-banner-canvas"
                  >
                    <img
                      src={editingBanner.imageUrl || "/images/banners/promo-bundle.png"}
                      alt={editingBanner.title || "Banner preview"}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        pointerEvents: "none",
                      }}
                    />

                    {/* Hotspot Dots */}
                    {editingBanner.hotspots?.map((h: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          left: `${h.xPercent}%`,
                          top: `${h.yPercent}%`,
                        }}
                        className="admin-hotspot-pin"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="admin-hotspot-pin-pulse" />
                        <div className="admin-hotspot-pin-dot" />
                        <div className="admin-hotspot-tooltip">
                          {h.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Input label before click */}
                <CardContent style={{ padding: "16px 20px", background: "#ffffff", borderTop: "1px solid var(--border)" }}>
                  <Label htmlFor="new-hotspot-label" style={{ marginBottom: "8px" }}>
                    Nama Label Bonus (Ketik sebelum mengklik gambar):
                  </Label>
                  <Input
                    id="new-hotspot-label"
                    type="text"
                    placeholder="e.g. 🎁 FREE Gaming Mouse / 🎁 FREE Kaos Hadi..."
                    value={newHotspotLabel}
                    onChange={(e) => setNewHotspotLabel(e.target.value)}
                  />
                </CardContent>
              </Card>

              {/* Hotspots Items List */}
              <Card>
                <CardHeader style={{ padding: "14px 20px" }}>
                  <CardTitle className="text-sm">Daftar Titik Hotspot pada Banner Ini</CardTitle>
                </CardHeader>
                <CardContent style={{ padding: 0 }}>
                  {(!editingBanner.hotspots || editingBanner.hotspots.length === 0) ? (
                    <p style={{ padding: "16px 20px", fontSize: "12px", color: "var(--muted)" }}>
                      Belum ada hotspot. Ketik label di atas lalu klik gambar untuk menambahkan.
                    </p>
                  ) : (
                    editingBanner.hotspots.map((h: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          padding: "12px 20px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "14px",
                          borderBottom: "1px solid var(--border-light)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                          <span
                            style={{
                              fontFamily: "monospace",
                              backgroundColor: "#f1f3ed",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: 700,
                              color: "var(--muted)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            X: {h.xPercent}% | Y: {h.yPercent}%
                          </span>
                          <Input
                            type="text"
                            value={h.label}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditingBanner((prev: any) => ({
                                ...prev,
                                hotspots: prev.hotspots.map((item: any, i: number) =>
                                  i === idx ? { ...item, label: val } : item
                                ),
                              }));
                            }}
                            placeholder="Nama label bonus..."
                            style={{ flex: 1, fontWeight: 600, height: "36px" }}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveHotspot(idx)}
                          style={{
                            height: "36px",
                            width: "36px",
                            padding: 0,
                            color: "var(--red)",
                            borderRadius: "var(--radius-sm)",
                          }}
                          title="Hapus Titik Hotspot"
                        >
                          <HugeIconTrash size={16} />
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column (1 Col): Banner Content & Image Upload */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Konten & Gambar Banner</CardTitle>
                  <CardDescription>
                    Pengaturan judul, link tujuan tombol, dan visual gambar banner.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Visual Banner Thumbnail & Drag & Drop Area */}
                  <div>
                    <Label style={{ display: "block", marginBottom: "8px" }}>
                      Visual Banner *
                    </Label>

                    {/* Hidden Native File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/jpg"
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                    />

                    {/* Drag & Drop Upload Zone */}
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        position: "relative",
                        border: isDragging ? "2px dashed var(--red)" : "1.5px dashed var(--border)",
                        backgroundColor: isDragging
                          ? "rgba(221, 32, 40, 0.04)"
                          : "var(--surface)",
                        borderRadius: "var(--radius-sm)",
                        padding: "16px",
                        textAlign: "center",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {editingBanner.imageUrl ? (
                        <div>
                          {/* Thumbnail Preview */}
                          <div
                            style={{
                              position: "relative",
                              width: "100%",
                              aspectRatio: "16 / 9",
                              borderRadius: "8px",
                              overflow: "hidden",
                              border: "1px solid var(--border)",
                              backgroundColor: "#0d100f",
                              marginBottom: "12px",
                              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                            }}
                          >
                            <img
                              src={editingBanner.imageUrl}
                              alt="Thumbnail Visual Banner"
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                              }}
                            />
                            <div
                              style={{
                                position: "absolute",
                                top: "8px",
                                right: "8px",
                              }}
                            >
                              <Badge
                                variant="secondary"
                                style={{
                                  backgroundColor: "rgba(17, 20, 19, 0.8)",
                                  color: "#ffffff",
                                  backdropFilter: "blur(4px)",
                                  border: "none",
                                  fontSize: "10px",
                                  padding: "2px 8px",
                                }}
                              >
                                Visual Banner Aktif
                              </Badge>
                            </div>
                          </div>

                          {/* Action prompt */}
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "12px",
                                fontWeight: 700,
                                color: "var(--ink)",
                              }}
                            >
                              <Upload size={14} style={{ color: "var(--red)" }} />
                              <span>
                                {uploadingImage
                                  ? "Sedang mengunggah gambar..."
                                  : "Tarik & lepas gambar baru di sini"}
                              </span>
                            </div>
                            <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                              atau klik untuk mengganti gambar banner (PNG, JPG, WebP)
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{
                            padding: "28px 16px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <div
                            style={{
                              width: "44px",
                              height: "44px",
                              borderRadius: "50%",
                              backgroundColor: "#ffffff",
                              border: "1px solid var(--border)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "var(--red)",
                              boxShadow: "var(--shadow-xs)",
                            }}
                          >
                            <Upload size={20} />
                          </div>
                          <p
                            style={{
                              margin: 0,
                              fontSize: "13px",
                              fontWeight: 700,
                              color: "var(--ink)",
                            }}
                          >
                            {uploadingImage
                              ? "Sedang mengunggah gambar..."
                              : "Tarik & lepas gambar banner ke sini"}
                          </p>
                          <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                            atau klik untuk memilih file dari komputer (PNG, JPG, WebP)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="banner-badge">Badge Eyebrow (Teks Kecil di Atas)</Label>
                    <Input
                      id="banner-badge"
                      type="text"
                      value={editingBanner.badgeText || ""}
                      onChange={(e) =>
                        setEditingBanner({ ...editingBanner, badgeText: e.target.value })
                      }
                      placeholder="e.g. PROMO SPESIAL MINGGU INI"
                    />
                  </div>

                  <div>
                    <Label htmlFor="banner-title">Judul Utama Banner *</Label>
                    <textarea
                      id="banner-title"
                      rows={2}
                      value={editingBanner.title || ""}
                      onChange={(e) =>
                        setEditingBanner({ ...editingBanner, title: e.target.value })
                      }
                      placeholder="e.g. Beli Perangkat Idaman.\nBawa Pulang Bonus Lengkap."
                      className="shadcn-input h-auto py-2.5 font-bold"
                    />
                  </div>

                  <div>
                    <Label htmlFor="banner-sub">Deskripsi / Subtitle</Label>
                    <textarea
                      id="banner-sub"
                      rows={3}
                      value={editingBanner.subtitle || ""}
                      onChange={(e) =>
                        setEditingBanner({ ...editingBanner, subtitle: e.target.value })
                      }
                      placeholder="Deskripsi singkat promo yang ditampilkan di banner..."
                      className="shadcn-input h-auto py-2.5"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="banner-cta-label">Label Tombol CTA</Label>
                      <Input
                        id="banner-cta-label"
                        type="text"
                        value={editingBanner.ctaLabel || ""}
                        onChange={(e) =>
                          setEditingBanner({ ...editingBanner, ctaLabel: e.target.value })
                        }
                        placeholder="e.g. Lihat Promo"
                      />
                    </div>
                    <div>
                      <Label htmlFor="banner-cta-url">Link Tujuan CTA</Label>
                      <Input
                        id="banner-cta-url"
                        type="text"
                        value={editingBanner.ctaUrl || ""}
                        onChange={(e) =>
                          setEditingBanner({ ...editingBanner, ctaUrl: e.target.value })
                        }
                        placeholder="e.g. /katalog"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="banner-theme">Tema Warna Latar</Label>
                    <Select
                      id="banner-theme"
                      value={editingBanner.bgTheme || "dark"}
                      onChange={(e) =>
                        setEditingBanner({ ...editingBanner, bgTheme: e.target.value })
                      }
                    >
                      <option value="dark">Dark (Charcoal / Gaming Black)</option>
                      <option value="sage">Sage Green (Bekas Pilihan)</option>
                      <option value="light">Terang / Netral</option>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="banner-status">Status Tampil di Beranda</Label>
                    <Select
                      id="banner-status"
                      value={editingBanner.isActive ? "true" : "false"}
                      onChange={(e) =>
                        setEditingBanner({
                          ...editingBanner,
                          isActive: e.target.value === "true",
                        })
                      }
                    >
                      <option value="true">Aktif (Tampil di Hero Slider)</option>
                      <option value="false">Nonaktif (Disembunyikan)</option>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: "20px",
              borderTop: "1px solid var(--border)",
              marginTop: "8px",
            }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => setViewMode("list")}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              <span>Kembali ke Daftar Banner</span>
            </Button>

            <Button
              onClick={handleSaveBanner}
              disabled={saving}
              className="flex items-center gap-2"
              style={{ minWidth: "210px", height: "42px", fontWeight: 700 }}
            >
              <Save size={16} />
              <span>{saving ? "Menyimpan..." : "Simpan Banner & Hotspot"}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus Banner Hero?"
        description={`Apakah Anda yakin ingin menghapus "${deleteTarget?.title}"? Banner beserta seluruh hotspot interaktifnya akan dihapus.`}
        confirmLabel="Ya, Hapus Banner"
        onConfirm={executeDeleteBanner}
        loading={deleting}
      />
    </div>
  );
}
