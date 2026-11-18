"use client";

import * as React from "react";
import { Plus, Layers, Tag, Sparkles } from "lucide-react";
import { HugeIconEdit, HugeIconTrash } from "@/components/admin/ui/huge-icons";
import { Button } from "@/components/admin/ui/button";
import { Card } from "@/components/admin/ui/card";
import { Badge } from "@/components/admin/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/admin/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/admin/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/admin/ui/tabs";
import { AdminPagination } from "@/components/admin/ui/pagination";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CategoryIcon } from "@/components/ui";
import { IconPicker } from "@/components/admin/ui/icon-picker";
import { useCan } from "@/components/admin/permissions";
import { useToast } from "@/components/admin/ui/toast";

export default function AdminCategoriesBrandsPage() {
  const can = useCan();
  const canMode = (mode: "cat" | "brand" | "need") =>
    can(mode === "brand" ? "brands:manage" : "categories:manage");
  const toast = useToast();
  const [categories, setCategories] = React.useState<any[]>([]);
  const [brands, setBrands] = React.useState<any[]>([]);
  const [needs, setNeeds] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Pagination states
  const [catPage, setCatPage] = React.useState(1);
  const [catPageSize, setCatPageSize] = React.useState(10);
  const [brandPage, setBrandPage] = React.useState(1);
  const [brandPageSize, setBrandPageSize] = React.useState(10);
  const [needPage, setNeedPage] = React.useState(1);
  const [needPageSize, setNeedPageSize] = React.useState(10);

  // Dialog state
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogMode, setDialogMode] = React.useState<"cat" | "brand" | "need">("cat");
  const [editingItem, setEditingItem] = React.useState<any | null>(null);
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [iconOrLogo, setIconOrLogo] = React.useState("");
  const [description, setDescription] = React.useState("");

  // Delete Dialog state
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; mode: "cat" | "brand" | "need"; name: string } | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, brandRes, needRes] = await Promise.all([
        fetch("/api/admin/categories").then((r) => r.json()),
        fetch("/api/admin/brands").then((r) => r.json()),
        fetch("/api/admin/needs").then((r) => r.json()),
      ]);
      setCategories(catRes.categories || []);
      setBrands(brandRes.brands || []);
      setNeeds(needRes.needs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  function openCreateDialog(mode: "cat" | "brand" | "need") {
    setDialogMode(mode);
    setEditingItem(null);
    setName("");
    setSlug("");
    setIconOrLogo(mode === "cat" ? "laptop" : "");
    setDescription("");
    setDialogOpen(true);
  }

  function openEditDialog(item: any, mode: "cat" | "brand" | "need") {
    if (!canMode(mode)) return;
    setDialogMode(mode);
    setEditingItem(item);
    setName(item.name);
    setSlug(item.slug);
    setIconOrLogo(mode === "cat" ? item.icon || "" : item.logoUrl || "");
    setDescription(item.description || "");
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!name) return;
    const autoSlug =
      slug ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const endpoint =
      dialogMode === "cat"
        ? "/api/admin/categories"
        : dialogMode === "brand"
        ? "/api/admin/brands"
        : "/api/admin/needs";
    const method = editingItem ? "PUT" : "POST";
    const body: any = {
      name,
      slug: autoSlug,
    };

    if (editingItem) body.id = editingItem.id;
    if (dialogMode === "cat") {
      body.icon = iconOrLogo;
      body.description = description;
    } else if (dialogMode === "brand") {
      body.logoUrl = iconOrLogo;
    } else {
      body.description = description;
    }

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setDialogOpen(false);
        fetchData();
        const modeLabel = dialogMode === "cat" ? "Kategori" : dialogMode === "brand" ? "Merek" : "Kebutuhan";
        toast.success(`${modeLabel} "${name}" berhasil disimpan!`);
      } else {
        const modeLabel = dialogMode === "cat" ? "kategori" : dialogMode === "brand" ? "merek" : "kebutuhan";
        toast.error(`Gagal menyimpan ${modeLabel}.`);
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat menyimpan data.");
    }
  }

  function handleDelete(id: string, mode: "cat" | "brand" | "need", itemName: string) {
    setDeleteTarget({ id, mode, name: itemName });
  }

  async function executeDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const endpoint =
      deleteTarget.mode === "cat"
        ? `/api/admin/categories?id=${deleteTarget.id}`
        : deleteTarget.mode === "brand"
        ? `/api/admin/brands?id=${deleteTarget.id}`
        : `/api/admin/needs?id=${deleteTarget.id}`;
    try {
      const res = await fetch(endpoint, { method: "DELETE" });
      if (res.ok) {
        fetchData();
        const modeLabel = deleteTarget.mode === "cat" ? "Kategori" : deleteTarget.mode === "brand" ? "Merek" : "Kebutuhan";
        toast.success(`${modeLabel} "${deleteTarget.name}" berhasil dihapus!`);
      } else {
        toast.error("Gagal menghapus data.");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat menghapus data.");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-[#111413] tracking-tight">Kategori, Merek & Kebutuhan</h2>
        <p className="text-sm text-[#525854] mt-1">
          Kelola struktur pengelompokan perangkat, daftar brand resmi, serta tag filter kebutuhan.
        </p>
      </div>

      <Tabs defaultValue="kategori">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="kategori" className="flex items-center gap-2">
              <Layers size={14} />
              <span>Kategori ({categories.length})</span>
            </TabsTrigger>
            <TabsTrigger value="merek" className="flex items-center gap-2">
              <Tag size={14} />
              <span>Merek / Brand ({brands.length})</span>
            </TabsTrigger>
            <TabsTrigger value="kebutuhan" className="flex items-center gap-2">
              <Sparkles size={14} />
              <span>Kebutuhan ({needs.length})</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Kategori */}
        <TabsContent value="kategori" className="space-y-4">
          <div className="flex justify-end">
            {canMode("cat") && (
            <Button onClick={() => openCreateDialog("cat")} className="flex items-center gap-1.5">
              <Plus size={16} />
              <span>Tambah Kategori</span>
            </Button>
            )}
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Kategori</TableHead>
                  <TableHead>Slug URL</TableHead>
                  <TableHead>Ikon</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Jumlah Unit</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : (
                  categories
                    .slice((catPage - 1) * catPageSize, catPage * catPageSize)
                    .map((c) => (
                    <TableRow
                      key={c.id}
                      className="admin-clickable-row"
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (target.closest("button") || target.closest("a")) return;
                        openEditDialog(c, "cat");
                      }}
                    >
                      <TableCell className="font-bold text-[#111413]">{c.name}</TableCell>
                      <TableCell className="font-mono text-xs text-[#525854]">{c.slug}</TableCell>
                      <TableCell>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "6px",
                              backgroundColor: "#f1f3ed",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "var(--ink)",
                              flexShrink: 0,
                            }}
                          >
                            <CategoryIcon name={c.icon || "package"} size={16} />
                          </div>
                          <span style={{ fontSize: "12px", color: "var(--muted)", fontFamily: "monospace" }}>
                            {c.icon || "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-[#525854] max-w-xs truncate">
                        {c.description || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{c._count?.products || 0} Produk</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {canMode("cat") && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditDialog(c, "cat")}
                            className="admin-action-btn"
                            title="Edit Kategori"
                          >
                            <HugeIconEdit size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(c.id, "cat", c.name)}
                            className="admin-action-btn delete"
                            title="Hapus Kategori"
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
              currentPage={catPage}
              totalPages={Math.ceil(categories.length / catPageSize) || 1}
              totalItems={categories.length}
              pageSize={catPageSize}
              onPageChange={(p) => setCatPage(p)}
              onPageSizeChange={(s) => {
                setCatPageSize(s);
                setCatPage(1);
              }}
              pageSizeOptions={[5, 10, 20]}
            />
          </Card>
        </TabsContent>

        {/* Tab 2: Merek */}
        <TabsContent value="merek" className="space-y-4">
          <div className="flex justify-end">
            {canMode("brand") && (
            <Button onClick={() => openCreateDialog("brand")} className="flex items-center gap-1.5">
              <Plus size={16} />
              <span>Tambah Merek</span>
            </Button>
            )}
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Merek</TableHead>
                  <TableHead>Slug URL</TableHead>
                  <TableHead>Jumlah Unit</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : (
                  brands
                    .slice((brandPage - 1) * brandPageSize, brandPage * brandPageSize)
                    .map((b) => (
                    <TableRow
                      key={b.id}
                      className="admin-clickable-row"
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (target.closest("button") || target.closest("a")) return;
                        openEditDialog(b, "brand");
                      }}
                    >
                      <TableCell className="font-bold text-[#111413]">{b.name}</TableCell>
                      <TableCell className="font-mono text-xs text-[#525854]">{b.slug}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{b._count?.products || 0} Produk</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {canMode("brand") && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditDialog(b, "brand")}
                            className="admin-action-btn"
                            title="Edit Merek"
                          >
                            <HugeIconEdit size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(b.id, "brand", b.name)}
                            className="admin-action-btn delete"
                            title="Hapus Merek"
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
              currentPage={brandPage}
              totalPages={Math.ceil(brands.length / brandPageSize) || 1}
              totalItems={brands.length}
              pageSize={brandPageSize}
              onPageChange={(p) => setBrandPage(p)}
              onPageSizeChange={(s) => {
                setBrandPageSize(s);
                setBrandPage(1);
              }}
              pageSizeOptions={[5, 10, 20]}
            />
          </Card>
        </TabsContent>

        {/* Tab 3: Kebutuhan */}
        <TabsContent value="kebutuhan" className="space-y-4">
          <div className="flex justify-end">
            {canMode("need") && (
            <Button onClick={() => openCreateDialog("need")} className="flex items-center gap-1.5">
              <Plus size={16} />
              <span>Tambah Kebutuhan Baru</span>
            </Button>
            )}
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Kebutuhan</TableHead>
                  <TableHead>Slug Filter</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {needs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-[#525854]">
                      Belum ada data kebutuhan. Klik tombol &quot;Tambah Kebutuhan Baru&quot;.
                    </TableCell>
                  </TableRow>
                ) : (
                  needs
                    .slice((needPage - 1) * needPageSize, needPage * needPageSize)
                    .map((n) => (
                      <TableRow key={n.id}>
                        <TableCell className="font-bold text-[#111413]">
                          <div className="flex items-center gap-2">
                            <Sparkles size={16} className="text-[#cc252b]" />
                            <span>{n.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs font-mono bg-[#f1f3ed] px-2 py-0.5 rounded text-[#111413]">
                            {n.slug}
                          </code>
                        </TableCell>
                        <TableCell className="text-[#525854] text-xs max-w-xs truncate">
                          {n.description || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {canMode("need") && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditDialog(n, "need")}
                              className="admin-action-btn"
                              title="Edit Kebutuhan"
                            >
                              <HugeIconEdit size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(n.id, "need", n.name)}
                              className="admin-action-btn delete"
                              title="Hapus Kebutuhan"
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
              currentPage={needPage}
              totalPages={Math.ceil(needs.length / needPageSize) || 1}
              totalItems={needs.length}
              pageSize={needPageSize}
              onPageChange={(p) => setNeedPage(p)}
              onPageSizeChange={(s) => {
                setNeedPageSize(s);
                setNeedPage(1);
              }}
              pageSizeOptions={[5, 10, 20]}
            />
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Form */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogHeader>
          <DialogTitle>
            {editingItem ? "Edit" : "Tambah"}{" "}
            {dialogMode === "cat" ? "Kategori" : dialogMode === "brand" ? "Merek" : "Kebutuhan"}
          </DialogTitle>
          <DialogDescription>
            Masukkan detail {dialogMode === "cat" ? "kategori produk" : dialogMode === "brand" ? "merek perangkat" : "tag filter kebutuhan perangkat"}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="cat-brand-name">Nama {dialogMode === "need" ? "Kebutuhan" : ""} *</Label>
            <Input
              id="cat-brand-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={dialogMode === "need" ? "e.g. Editing & Desain Grafis" : "e.g. Laptop Gaming / Apple"}
            />
          </div>

          <div>
            <Label htmlFor="cat-brand-slug">Slug URL / Filter Tag</Label>
            <Input
              id="cat-brand-slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="Otomatis dari nama jika kosong"
              className="font-mono"
            />
          </div>

          {(dialogMode === "cat" || dialogMode === "need") && (
            <div>
              <Label htmlFor="cat-desc">Deskripsi</Label>
              <Input
                id="cat-desc"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={dialogMode === "need" ? "e.g. Untuk render video, 3D modelling, dan animasi" : "e.g. Kerja, kuliah & kreasi"}
              />
            </div>
          )}

          {dialogMode === "cat" && (
            <div>
              <Label style={{ display: "block", marginBottom: "8px" }}>
                Ikon Kategori
              </Label>
              <IconPicker
                value={iconOrLogo}
                onChange={(val) => setIconOrLogo(val)}
              />
            </div>
          )}

          {dialogMode === "brand" && (
            <div>
              <Label htmlFor="brand-logo">Logo URL (Opsional)</Label>
              <Input
                id="brand-logo"
                type="text"
                value={iconOrLogo}
                onChange={(e) => setIconOrLogo(e.target.value)}
                placeholder="e.g. /images/brands/asus.png"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>
            Batal
          </Button>
          <Button onClick={handleSave}>Simpan</Button>
        </DialogFooter>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Hapus ${deleteTarget?.mode === "cat" ? "Kategori" : deleteTarget?.mode === "brand" ? "Merek" : "Kebutuhan"}?`}
        description={`Apakah Anda yakin ingin menghapus "${deleteTarget?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Ya, Hapus Data"
        onConfirm={executeDelete}
        loading={deleting}
      />
    </div>
  );
}
