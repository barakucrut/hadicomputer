"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  SlidersHorizontal,
  X,
  MessageSquare,
  RotateCcw,
} from "lucide-react";
import {
  HugeIconEye,
  HugeIconEdit,
  HugeIconTrash,
} from "@/components/admin/ui/huge-icons";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import { Card } from "@/components/admin/ui/card";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DualRangeSlider } from "@/components/ui";
import { CurrencyInput } from "@/components/ui/currency-input";
import { AdminPagination } from "@/components/admin/ui/pagination";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { useToast } from "@/components/admin/ui/toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/admin/ui/table";
import { rupiah } from "@/lib/catalog";

const SLIDER_MIN = 0;
const SLIDER_MAX = 50000000;
const SLIDER_STEP = 500000;

export default function AdminProductsPage() {
  const router = useRouter();
  const toast = useToast();
  const [products, setProducts] = React.useState<any[]>([]);
  const [pagination, setPagination] = React.useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [loading, setLoading] = React.useState(true);

  // Active Applied Filters
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const [appliedFilters, setAppliedFilters] = React.useState({
    categoryId: "",
    brandId: "",
    condition: "",
    availability: "",
    minPrice: "",
    maxPrice: "",
    collection: "",
    need: "",
  });

  // Drawer Form Draft State
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = React.useState(false);
  const [draftFilters, setDraftFilters] = React.useState({ ...appliedFilters });
  const [sliderRange, setSliderRange] = React.useState<[number, number]>([
    SLIDER_MIN,
    SLIDER_MAX,
  ]);

  React.useEffect(() => {
    if (!isFilterDrawerOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsFilterDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFilterDrawerOpen]);

  // Options from DB
  const [categories, setCategories] = React.useState<any[]>([]);
  const [brands, setBrands] = React.useState<any[]>([]);

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  // Calculate active filter count
  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (appliedFilters.categoryId) count++;
    if (appliedFilters.brandId) count++;
    if (appliedFilters.condition) count++;
    if (appliedFilters.availability) count++;
    if (appliedFilters.minPrice || appliedFilters.maxPrice) count++;
    if (appliedFilters.collection) count++;
    if (appliedFilters.need) count++;
    return count;
  }, [appliedFilters]);

  // Fetch Options
  React.useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(console.error);

    fetch("/api/admin/brands")
      .then((r) => r.json())
      .then((d) => setBrands(d.brands || []))
      .catch(console.error);
  }, []);

  // Fetch Products
  const fetchProducts = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(pageSize));

      if (search) params.set("q", search);
      if (appliedFilters.categoryId) params.set("categoryId", appliedFilters.categoryId);
      if (appliedFilters.brandId) params.set("brandId", appliedFilters.brandId);
      if (appliedFilters.condition) params.set("condition", appliedFilters.condition);
      if (appliedFilters.availability) params.set("availability", appliedFilters.availability);
      if (appliedFilters.minPrice) params.set("minPrice", appliedFilters.minPrice);
      if (appliedFilters.maxPrice) params.set("maxPrice", appliedFilters.maxPrice);
      if (appliedFilters.collection) params.set("collection", appliedFilters.collection);
      if (appliedFilters.need) params.set("need", appliedFilters.need);

      const res = await fetch(`/api/admin/products?${params.toString()}`);
      const data = await res.json();
      if (data.products) {
        setProducts(data.products);
        if (data.pagination) setPagination(data.pagination);
      }
    } catch (err) {
      console.error("Fetch products failed:", err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, appliedFilters]);

  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Open drawer: initialize draft state with currently applied filters
  function openFilterDrawer() {
    setDraftFilters({ ...appliedFilters });
    const min = appliedFilters.minPrice ? Number(appliedFilters.minPrice) : SLIDER_MIN;
    const max = appliedFilters.maxPrice ? Number(appliedFilters.maxPrice) : SLIDER_MAX;
    setSliderRange([min, max]);
    setIsFilterDrawerOpen(true);
  }

  // Handle Dual Range Slider change in drawer
  function handleSliderChange(vals: [number, number]) {
    setSliderRange(vals);
    setDraftFilters((prev) => ({
      ...prev,
      minPrice: vals[0] > SLIDER_MIN ? String(vals[0]) : "",
      maxPrice: vals[1] < SLIDER_MAX ? String(vals[1]) : "",
    }));
  }

  // Handle direct currency inputs
  function handleMinPriceChange(val: string) {
    setDraftFilters((prev) => ({ ...prev, minPrice: val }));
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      setSliderRange(([_, curMax]) => [Math.min(Math.max(SLIDER_MIN, num), curMax), curMax]);
    } else {
      setSliderRange(([_, curMax]) => [SLIDER_MIN, curMax]);
    }
  }

  function handleMaxPriceChange(val: string) {
    setDraftFilters((prev) => ({ ...prev, maxPrice: val }));
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      setSliderRange(([curMin, _]) => [curMin, Math.max(Math.min(SLIDER_MAX, num), curMin)]);
    } else {
      setSliderRange(([curMin, _]) => [curMin, SLIDER_MAX]);
    }
  }

  // Apply filter from drawer
  function handleApplyFilters(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setAppliedFilters({ ...draftFilters });
    setPage(1);
    setIsFilterDrawerOpen(false);
  }

  // Reset filter in drawer
  function handleResetFilters() {
    const emptyFilters = {
      categoryId: "",
      brandId: "",
      condition: "",
      availability: "",
      minPrice: "",
      maxPrice: "",
      collection: "",
      need: "",
    };
    setDraftFilters(emptyFilters);
    setSliderRange([SLIDER_MIN, SLIDER_MAX]);
    setAppliedFilters(emptyFilters);
    setPage(1);
    setIsFilterDrawerOpen(false);
  }

  // Remove individual filter chip
  function removeFilterKey(key: keyof typeof appliedFilters) {
    setAppliedFilters((prev) => ({ ...prev, [key]: "" }));
    setPage(1);
  }

  function handleDelete(id: string, name: string) {
    setDeleteTarget({ id, name });
  }

  async function executeDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        fetchProducts();
        toast.success(`Produk "${deleteTarget.name}" berhasil dihapus!`);
      } else {
        toast.error("Gagal menghapus produk.");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat menghapus produk.");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  async function handleToggleAvailability(p: any) {
    const nextStatus =
      p.availability === "TERSEDIA"
        ? "HABIS"
        : p.availability === "HABIS"
        ? "PREORDER"
        : "TERSEDIA";

    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability: nextStatus }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((item) => (item.id === p.id ? { ...item, availability: nextStatus } : item))
        );
        toast.success(`Status ${p.name} diubah menjadi ${nextStatus}!`);
      } else {
        toast.error("Gagal mengubah status ketersediaan.");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat mengubah status.");
    }
  }

  return (
    <>
      <div className="space-y-6">
      {/* Page Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#111413] tracking-tight">Katalog Produk</h2>
          <p className="text-sm text-[#525854] mt-1">
            Kelola daftar perangkat, harga promo, ketersediaan unit, dan varian spesifikasi.
          </p>
        </div>

        {/* Action Buttons: Filter & Tambah Produk */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Button
            type="button"
            variant="outline"
            onClick={openFilterDrawer}
            className="flex items-center gap-2"
          >
            <SlidersHorizontal size={16} />
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <span className="admin-filter-badge-count">{activeFilterCount}</span>
            )}
          </Button>

          <Link href="/admin/produk/baru">
            <Button className="flex items-center gap-2">
              <Plus size={16} />
              <span>Tambah Produk Baru</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Search Toolbar & Active Filter Chips */}
      <Card className="p-4">
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div className="admin-input-wrapper" style={{ width: "100%" }}>
            <span className="admin-input-icon-left">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Cari nama perangkat, kode SKU, atau spesifikasi..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="admin-input-styled has-left-icon"
            />
          </div>

          {/* Active Filter Chips */}
          {activeFilterCount > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", paddingTop: "4px" }}>
              <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600 }}>Filter Aktif:</span>

              {appliedFilters.categoryId && (
                <span className="admin-filter-chip">
                  <span>Kategori: {categories.find((c) => c.id === appliedFilters.categoryId)?.name || appliedFilters.categoryId}</span>
                  <button type="button" onClick={() => removeFilterKey("categoryId")}>
                    <X size={13} />
                  </button>
                </span>
              )}

              {appliedFilters.brandId && (
                <span className="admin-filter-chip">
                  <span>Merek: {brands.find((b) => b.id === appliedFilters.brandId)?.name || appliedFilters.brandId}</span>
                  <button type="button" onClick={() => removeFilterKey("brandId")}>
                    <X size={13} />
                  </button>
                </span>
              )}

              {appliedFilters.condition && (
                <span className="admin-filter-chip">
                  <span>Kondisi: {appliedFilters.condition === "BARU" ? "Baru" : "Bekas"}</span>
                  <button type="button" onClick={() => removeFilterKey("condition")}>
                    <X size={13} />
                  </button>
                </span>
              )}

              {appliedFilters.availability && (
                <span className="admin-filter-chip">
                  <span>Status: {appliedFilters.availability}</span>
                  <button type="button" onClick={() => removeFilterKey("availability")}>
                    <X size={13} />
                  </button>
                </span>
              )}

              {(appliedFilters.minPrice || appliedFilters.maxPrice) && (
                <span className="admin-filter-chip">
                  <span>
                    Harga: {appliedFilters.minPrice ? rupiah(Number(appliedFilters.minPrice)) : "Rp 0"} –{" "}
                    {appliedFilters.maxPrice ? rupiah(Number(appliedFilters.maxPrice)) : "Rp 50jt"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedFilters((prev) => ({ ...prev, minPrice: "", maxPrice: "" }));
                      setPage(1);
                    }}
                  >
                    <X size={13} />
                  </button>
                </span>
              )}

              {appliedFilters.collection && (
                <span className="admin-filter-chip">
                  <span>Koleksi: {appliedFilters.collection}</span>
                  <button type="button" onClick={() => removeFilterKey("collection")}>
                    <X size={13} />
                  </button>
                </span>
              )}

              {appliedFilters.need && (
                <span className="admin-filter-chip">
                  <span>Kebutuhan: {appliedFilters.need}</span>
                  <button type="button" onClick={() => removeFilterKey("need")}>
                    <X size={13} />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={handleResetFilters}
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--red)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px 8px",
                }}
              >
                Reset Semua
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Products Data Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead style={{ width: "72px" }}>Foto</TableHead>
              <TableHead>Nama & Kode</TableHead>
              <TableHead>Kategori & Merek</TableHead>
              <TableHead>Harga Showcase</TableHead>
              <TableHead>Kondisi</TableHead>
              <TableHead>Ketersediaan</TableHead>
              <TableHead>Inquiry WA</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-[#525854]">
                  Memuat data produk...
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-[#525854]">
                  Tidak ada produk yang sesuai dengan kriteria pencarian / filter.
                </TableCell>
              </TableRow>
            ) : (
              products.map((p) => {
                const primaryImage =
                  p.images?.find((img: any) => img.isPrimary)?.url ||
                  p.images?.[0]?.url ||
                  "/images/banners/promo-bundle.png";

                const price = p.basePrice ? rupiah(p.basePrice) : "Hubungi Kami";

                return (
                  <TableRow
                    key={p.id}
                    className="admin-clickable-row"
                    onClick={(e) => {
                      const target = e.target as HTMLElement;
                      if (target.closest("button") || target.closest("a") || target.closest("input")) {
                        return;
                      }
                      router.push(`/admin/produk/${p.id}`);
                    }}
                  >
                    {/* Thumbnail Image */}
                    <TableCell>
                      <div className="admin-product-thumb">
                        <Image
                          src={primaryImage}
                          alt={p.name}
                          fill
                          unoptimized={typeof primaryImage === "string" && primaryImage.startsWith("/uploads/")}
                          sizes="52px"
                          className="object-cover"
                        />
                      </div>
                    </TableCell>

                    {/* Name & Code */}
                    <TableCell>
                      <div className="font-bold text-[#111413] line-clamp-1">{p.name}</div>
                      <div className="text-xs text-[#525854] flex items-center gap-2 mt-0.5">
                        <span className="font-mono bg-[#f1f3ed] px-1.5 py-0.5 rounded text-[11px]">
                          {p.code}
                        </span>
                        {p.bonus && (
                          <span className="text-[#cc252b] font-medium line-clamp-1">
                            🎁 {p.bonus}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Category & Brand */}
                    <TableCell>
                      <div className="text-xs font-semibold text-[#111413]">{p.category?.name || "-"}</div>
                      <div className="text-xs text-[#525854]">{p.brand?.name || "-"}</div>
                    </TableCell>

                    {/* Price */}
                    <TableCell>
                      <div className="font-bold text-sm text-[#16a34a]">{price}</div>
                      {p.originalPrice && p.originalPrice > p.basePrice && (
                        <div className="text-xs text-[#818779] line-through">
                          {rupiah(p.originalPrice)}
                        </div>
                      )}
                    </TableCell>

                    {/* Condition */}
                    <TableCell>
                      <Badge variant={p.condition === "BARU" ? "secondary" : "outline"}>
                        {p.condition === "BARU" ? "Baru" : "Bekas"}
                      </Badge>
                    </TableCell>

                    {/* Availability Toggle */}
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => handleToggleAvailability(p)}
                        title="Klik untuk mengubah status ketersediaan"
                        className="admin-badge-btn"
                      >
                        <Badge
                          variant={
                            p.availability === "TERSEDIA"
                              ? "success"
                              : p.availability === "PREORDER"
                              ? "warning"
                              : "destructive"
                          }
                        >
                          {p.availability}
                        </Badge>
                      </button>
                    </TableCell>

                    {/* Inquiry WA Count */}
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-[#525854]">
                        <MessageSquare size={14} className="text-[#15803d]" />
                        <span className="font-bold text-[#111413]">{p.inquiryCount || 0}</span>
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`/produk/${p.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Lihat halaman toko"
                          className="admin-action-btn"
                        >
                          <HugeIconEye size={16} />
                        </a>
                        <Link
                          href={`/admin/produk/${p.id}`}
                          title="Edit produk"
                          className="admin-action-btn"
                        >
                          <HugeIconEdit size={16} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id, p.name)}
                          title="Hapus produk"
                          className="admin-action-btn delete"
                        >
                          <HugeIconTrash size={16} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <AdminPagination
          currentPage={page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          pageSize={pageSize}
          onPageChange={(newPage) => setPage(newPage)}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
          pageSizeOptions={[10, 20, 50]}
        />
      </Card>
      </div>

      {/* ========================================================
          SLIDE-OVER FILTER DRAWER (FROM RIGHT SIDE)
          Identik dengan Filter Katalog Depan
          ======================================================== */}
      {isFilterDrawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="admin-drawer-backdrop"
            style={{ margin: 0, top: 0 }}
            onClick={() => setIsFilterDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <div
            className="admin-drawer-panel"
            style={{ margin: 0, top: 0, height: "100vh" }}
            role="dialog"
            aria-modal="true"
            aria-label="Filter Produk"
          >
            {/* Header */}
            <div className="admin-drawer-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    backgroundColor: "var(--surface)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--red)",
                  }}
                >
                  <SlidersHorizontal size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "var(--ink)" }}>
                    Filter Produk
                  </h3>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)" }}>
                    Sesuai dengan filter katalog etalase depan
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(false)}
                className="admin-action-btn"
                title="Tutup Filter"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleApplyFilters} className="admin-drawer-body">
              {/* Kategori */}
              <div>
                <Label htmlFor="drawer-kategori" style={{ fontWeight: 700, marginBottom: "6px", display: "block" }}>
                  Kategori
                </Label>
                <Select
                  id="drawer-kategori"
                  value={draftFilters.categoryId}
                  onChange={(e) => setDraftFilters((prev) => ({ ...prev, categoryId: e.target.value }))}
                >
                  <option value="">Semua kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Merek / Brand */}
              <div>
                <Label htmlFor="drawer-merek" style={{ fontWeight: 700, marginBottom: "6px", display: "block" }}>
                  Merek / Brand
                </Label>
                <Select
                  id="drawer-merek"
                  value={draftFilters.brandId}
                  onChange={(e) => setDraftFilters((prev) => ({ ...prev, brandId: e.target.value }))}
                >
                  <option value="">Semua merek</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Kondisi */}
              <div>
                <Label htmlFor="drawer-kondisi" style={{ fontWeight: 700, marginBottom: "6px", display: "block" }}>
                  Kondisi
                </Label>
                <Select
                  id="drawer-kondisi"
                  value={draftFilters.condition}
                  onChange={(e) => setDraftFilters((prev) => ({ ...prev, condition: e.target.value }))}
                >
                  <option value="">Baru & bekas</option>
                  <option value="BARU">Baru</option>
                  <option value="BEKAS">Bekas</option>
                </Select>
              </div>

              {/* Ketersediaan */}
              <div>
                <Label htmlFor="drawer-status" style={{ fontWeight: 700, marginBottom: "6px", display: "block" }}>
                  Ketersediaan
                </Label>
                <Select
                  id="drawer-status"
                  value={draftFilters.availability}
                  onChange={(e) => setDraftFilters((prev) => ({ ...prev, availability: e.target.value }))}
                >
                  <option value="">Semua status</option>
                  <option value="TERSEDIA">Tersedia</option>
                  <option value="PREORDER">Preorder</option>
                  <option value="HABIS">Stok habis</option>
                </Select>
              </div>

              {/* Rentang Harga (Dual Range Slider + Inputs) */}
              <fieldset
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  padding: "16px",
                  margin: 0,
                  backgroundColor: "#ffffff",
                }}
              >
                <legend style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink)", padding: "0 6px" }}>
                  Rentang Harga
                </legend>
                <div style={{ padding: "8px 4px 16px 4px" }}>
                  <DualRangeSlider
                    min={SLIDER_MIN}
                    max={SLIDER_MAX}
                    step={SLIDER_STEP}
                    value={sliderRange}
                    onChange={handleSliderChange}
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "var(--muted)",
                      marginTop: "8px",
                    }}
                  >
                    <span>{rupiah(sliderRange[0])}</span>
                    <span>{rupiah(sliderRange[1])}</span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "8px" }}>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: "4px" }}>
                      Min (Rp)
                    </label>
                    <CurrencyInput
                      id="drawer-min-price"
                      name="minPrice"
                      placeholder="0"
                      value={draftFilters.minPrice}
                      onValueChange={handleMinPriceChange}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: "4px" }}>
                      Maks (Rp)
                    </label>
                    <CurrencyInput
                      id="drawer-max-price"
                      name="maxPrice"
                      placeholder="50.000.000"
                      value={draftFilters.maxPrice}
                      onValueChange={handleMaxPriceChange}
                    />
                  </div>
                </div>
              </fieldset>

              {/* Koleksi */}
              <div>
                <Label htmlFor="drawer-koleksi" style={{ fontWeight: 700, marginBottom: "6px", display: "block" }}>
                  Koleksi
                </Label>
                <Select
                  id="drawer-koleksi"
                  value={draftFilters.collection}
                  onChange={(e) => setDraftFilters((prev) => ({ ...prev, collection: e.target.value }))}
                >
                  <option value="">Semua koleksi</option>
                  <option value="Pilihan Hadi">Pilihan Hadi</option>
                  <option value="Terbaru">Terbaru</option>
                  <option value="Terlaris">Terlaris</option>
                  <option value="Promo">Promo</option>
                </Select>
              </div>

              {/* Kebutuhan */}
              <div>
                <Label htmlFor="drawer-kebutuhan" style={{ fontWeight: 700, marginBottom: "6px", display: "block" }}>
                  Kebutuhan
                </Label>
                <Select
                  id="drawer-kebutuhan"
                  value={draftFilters.need}
                  onChange={(e) => setDraftFilters((prev) => ({ ...prev, need: e.target.value }))}
                >
                  <option value="">Semua kebutuhan</option>
                  <option value="kerja">Kerja</option>
                  <option value="kuliah">Kuliah</option>
                  <option value="kreatif">Kreatif</option>
                  <option value="gaming">Gaming</option>
                  <option value="harian">Harian</option>
                </Select>
              </div>
            </form>

            {/* Drawer Footer Actions */}
            <div className="admin-drawer-footer">
              <Button
                type="button"
                variant="outline"
                onClick={handleResetFilters}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <RotateCcw size={15} />
                <span>Reset Filter</span>
              </Button>

              <Button
                type="button"
                onClick={handleApplyFilters}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <SlidersHorizontal size={15} />
                <span>Terapkan Filter</span>
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus Produk dari Katalog?"
        description={`Apakah Anda yakin ingin menghapus "${deleteTarget?.name}"? Produk ini akan dihapus permanen dari etalase toko dan database.`}
        confirmLabel="Ya, Hapus Produk"
        onConfirm={executeDelete}
        loading={deleting}
      />
    </>
  );
}
