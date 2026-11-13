"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Upload,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Check,
  AlertCircle,
  Star,
} from "lucide-react";
import { Button } from "@/components/admin/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/admin/ui/card";
import { Badge } from "@/components/admin/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { HugeIconTrash } from "@/components/admin/ui/huge-icons";
import Link from "next/link";

interface ProductFormProps {
  initialData?: any;
  isEdit?: boolean;
}

export function ProductForm({ initialData, isEdit = false }: ProductFormProps) {
  const router = useRouter();
  const [categories, setCategories] = React.useState<any[]>([]);
  const [brands, setBrands] = React.useState<any[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Form states
  const [name, setName] = React.useState(initialData?.name || "");
  const [code, setCode] = React.useState(initialData?.code || "");
  const [slug, setSlug] = React.useState(initialData?.slug || "");
  const [summary, setSummary] = React.useState(initialData?.summary || "");
  const [description, setDescription] = React.useState(initialData?.description || "");
  const [condition, setCondition] = React.useState(initialData?.condition || "BARU");
  const [basePrice, setBasePrice] = React.useState<string>(
    initialData?.basePrice ? String(initialData.basePrice) : ""
  );
  const [originalPrice, setOriginalPrice] = React.useState<string>(
    initialData?.originalPrice ? String(initialData.originalPrice) : ""
  );
  const [availability, setAvailability] = React.useState(initialData?.availability || "TERSEDIA");
  const [warranty, setWarranty] = React.useState(initialData?.warranty || "Garansi Toko 1 Bulan");
  const [bonus, setBonus] = React.useState(initialData?.bonus || "");
  const [categoryId, setCategoryId] = React.useState(initialData?.categoryId || "");
  const [brandId, setBrandId] = React.useState(initialData?.brandId || "");

  // Toggles
  const [isFeatured, setIsFeatured] = React.useState(Boolean(initialData?.isFeatured));
  const [isBestSeller, setIsBestSeller] = React.useState(Boolean(initialData?.isBestSeller));
  const [isPromo, setIsPromo] = React.useState(Boolean(initialData?.isPromo));
  const [isNewArrival, setIsNewArrival] = React.useState(Boolean(initialData?.isNewArrival));

  // Dynamic Lists
  const [images, setImages] = React.useState<any[]>(
    initialData?.images?.map((img: any, idx: number) => ({
      url: img.url,
      altText: img.altText || "",
      isPrimary: img.isPrimary ?? idx === 0,
    })) || []
  );

  const [specs, setSpecs] = React.useState<any[]>(
    initialData?.specs?.map((s: any) => ({
      key: s.key || s.name,
      value: s.value,
    })) || [
      { key: "Processor", value: "" },
      { key: "RAM", value: "" },
      { key: "Penyimpanan", value: "" },
      { key: "Layar", value: "" },
    ]
  );

  const [variants, setVariants] = React.useState<any[]>(
    initialData?.variants?.map((v: any, idx: number) => ({
      name: v.name,
      price: v.price ? String(v.price) : "",
      originalPrice: v.originalPrice ? String(v.originalPrice) : "",
      availability: v.availability || "TERSEDIA",
      isDefault: v.isDefault ?? idx === 0,
    })) || []
  );

  // Fetch categories and brands
  React.useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => {
        setCategories(d.categories || []);
        if (!categoryId && d.categories?.length > 0) {
          setCategoryId(d.categories[0].id);
        }
      });

    fetch("/api/admin/brands")
      .then((r) => r.json())
      .then((d) => {
        setBrands(d.brands || []);
        if (!brandId && d.brands?.length > 0) {
          setBrandId(d.brands[0].id);
        }
      });
  }, [categoryId, brandId]);

  // Handle local image upload
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "products");

      try {
        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.url) {
          setImages((prev) => [
            ...prev,
            { url: data.url, altText: name, isPrimary: prev.length === 0 },
          ]);
        }
      } catch (err) {
        console.error("Upload failed:", err);
      }
    }
  }

  function handleSetPrimaryImage(index: number) {
    setImages((prev) =>
      prev.map((img, idx) => ({ ...img, isPrimary: idx === index }))
    );
  }

  function handleRemoveImage(index: number) {
    setImages((prev) => {
      const filtered = prev.filter((_, idx) => idx !== index);
      if (filtered.length > 0 && !filtered.some((img) => img.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  }

  function handleAddSpec() {
    setSpecs((prev) => [...prev, { key: "", value: "" }]);
  }

  function handleRemoveSpec(index: number) {
    setSpecs((prev) => prev.filter((_, idx) => idx !== index));
  }

  function handleAddVariant() {
    setVariants((prev) => [
      ...prev,
      {
        name: "",
        price: basePrice,
        originalPrice: originalPrice,
        availability: "TERSEDIA",
        isDefault: prev.length === 0,
      },
    ]);
  }

  function handleRemoveVariant(index: number) {
    setVariants((prev) => prev.filter((_, idx) => idx !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !code || !categoryId || !brandId) {
      setError("Nama, kode unit, kategori, dan merek wajib diisi.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      name,
      code,
      slug: slug || undefined,
      summary,
      description,
      condition,
      basePrice: basePrice ? Number(basePrice) : null,
      originalPrice: originalPrice ? Number(originalPrice) : null,
      availability,
      warranty,
      bonus: bonus || null,
      isFeatured,
      isBestSeller,
      isPromo,
      isNewArrival,
      categoryId,
      brandId,
      images,
      specs: specs.filter((s) => s.key && s.value),
      variants: variants.filter((v) => v.name),
    };

    try {
      const url = isEdit ? `/api/admin/products/${initialData.id}` : "/api/admin/products";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan produk");
      }

      router.push("/admin/produk");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan produk");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-16">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/produk">
            <Button variant="outline" size="icon" type="button">
              <ArrowLeft size={16} />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-black text-[#111413] tracking-tight">
              {isEdit ? "Edit Perangkat Katalog" : "Tambah Perangkat Baru"}
            </h2>
            <p className="text-xs text-[#525854] mt-0.5">
              {isEdit ? `ID: ${initialData?.id}` : "Isi rincian informasi unit untuk dipajang di website"}
            </p>
          </div>
        </div>

        <Button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2"
          style={{ minWidth: "190px", height: "40px", fontWeight: 700 }}
        >
          <Save size={16} />
          <span>
            {saving
              ? "Menyimpan..."
              : isEdit
              ? "Simpan Perubahan"
              : "Simpan & Tambahkan Perangkat"}
          </span>
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-[#fee2e2] border border-[#fecaca] text-[#b91c1c] text-sm flex items-center gap-2">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Core Info, Specs, Variants */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Informasi Utama */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Utama</CardTitle>
              <CardDescription>Nama perangkat, kode identifikasi unik, dan ringkasan.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="prod-name">Nama Perangkat *</Label>
                <Input
                  id="prod-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Asus Zenbook Pro Dual Screen Laptop"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="prod-code">Kode Unit (SKU) *</Label>
                  <Input
                    id="prod-code"
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. HC-0025"
                    className="font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="prod-cond">Kondisi Perangkat</Label>
                  <Select
                    id="prod-cond"
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                  >
                    <option value="BARU">Baru (Segel / Box Resmi)</option>
                    <option value="BEKAS">Bekas Pilihan (Lolos Uji Fungsi)</option>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="prod-summary">Ringkasan Cepat (Summary Tagline)</Label>
                <Input
                  id="prod-summary"
                  type="text"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="e.g. Intel Core i7 · 16 GB RAM · 1 TB SSD"
                />
              </div>

              <div>
                <Label htmlFor="prod-desc">Deskripsi Lengkap</Label>
                <textarea
                  id="prod-desc"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Jelaskan keunggulan unit, kondisi fisik, dan kelengkapan bawaan..."
                  className="shadcn-input h-auto py-2.5"
                />
              </div>
            </CardContent>
          </Card>

          {/* 2. Galeri Foto */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Galeri Foto (Penyimpanan Lokal)</CardTitle>
                <CardDescription>
                  Unggah gambar perangkat. Foto bertanda bintang akan menjadi preview utama.
                </CardDescription>
              </div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f1f3ed] hover:bg-[#e8ebe2] text-xs font-bold text-[#111413] transition-colors">
                  <Upload size={14} />
                  <span>Unggah Foto</span>
                </div>
              </label>
            </CardHeader>
            <CardContent>
              {images.length === 0 ? (
                <div className="border-2 border-dashed border-[#e5e3dd] rounded-xl p-8 text-center">
                  <Upload className="mx-auto h-8 w-8 text-[#818779] mb-2" />
                  <p className="text-sm font-semibold text-[#111413]">Belum ada foto yang diunggah</p>
                  <p className="text-xs text-[#525854] mt-1">
                    Gunakan tombol "Unggah Foto" di atas untuk menambahkan foto JPEG atau PNG.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className={`admin-gallery-card ${img.isPrimary ? "is-primary" : ""}`}
                    >
                      <div className="admin-gallery-preview">
                        <Image
                          src={img.url}
                          alt="product preview"
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                        {img.isPrimary && (
                          <span
                            style={{
                              position: "absolute",
                              top: "6px",
                              left: "6px",
                              backgroundColor: "var(--red)",
                              color: "#ffffff",
                              fontSize: "10px",
                              fontWeight: 800,
                              padding: "2px 7px",
                              borderRadius: "5px",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                              zIndex: 2,
                            }}
                          >
                            ★ Utama
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 4px 4px 4px" }}>
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryImage(idx)}
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            color: img.isPrimary ? "var(--red)" : "var(--muted)",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            padding: 0,
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <Star size={12} style={{ fill: img.isPrimary ? "var(--red)" : "none" }} />
                          <span>{img.isPrimary ? "Foto Utama" : "Jadikan Utama"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="admin-action-btn delete"
                          style={{ width: "26px", height: "26px" }}
                          title="Hapus Foto"
                        >
                          <HugeIconTrash size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 3. Spesifikasi Teknis */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Spesifikasi Teknis</CardTitle>
                <CardDescription>Rincian teknis berupa komponen dan nilai perangkat.</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleAddSpec} className="flex items-center gap-1.5">
                <Plus size={14} />
                <span>Tambah Baris</span>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {specs.map((s, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Nama Komponen (e.g. Processor)"
                    value={s.key}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSpecs((prev) => prev.map((item, i) => (i === idx ? { ...item, key: val } : item)));
                    }}
                    className="w-1/3 rounded-lg border border-[#e5e3dd] bg-white px-3 py-2 text-sm text-[#111413] focus:outline-none focus:ring-2 focus:ring-[#cc252b]/20"
                  />
                  <input
                    type="text"
                    placeholder="Nilai / Model (e.g. Intel Core i7-13700H)"
                    value={s.value}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSpecs((prev) => prev.map((item, i) => (i === idx ? { ...item, value: val } : item)));
                    }}
                    className="flex-1 rounded-lg border border-[#e5e3dd] bg-white px-3 py-2 text-sm text-[#111413] focus:outline-none focus:ring-2 focus:ring-[#cc252b]/20"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSpec(idx)}
                    className="p-2 text-[#818779] hover:text-[#dc2626] cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 4. Varian Produk */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Varian Konfigurasi (Opsional)</CardTitle>
                <CardDescription>Pilihan spesifikasi alternatif (misal perbedaan RAM atau SSD).</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleAddVariant} className="flex items-center gap-1.5">
                <Plus size={14} />
                <span>Tambah Varian</span>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {variants.length === 0 ? (
                <div style={{ padding: "16px", borderRadius: "8px", backgroundColor: "#fbfbfa", border: "1px dashed var(--border)", textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: "12.5px", color: "var(--muted)" }}>
                    Belum ada varian spesifikasi alternatif. Klik tombol <strong>"+ Tambah Varian"</strong> di atas jika produk memiliki beberapa pilihan konfigurasi (misal: perbedaan kapasitas RAM atau SSD).
                  </p>
                </div>
              ) : (
                variants.map((v, idx) => (
                  <div key={idx} className="admin-variant-card">
                    {/* Variant Header */}
                    <div className="admin-variant-header">
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                        <span className="admin-variant-badge">Varian #{idx + 1}</span>
                        <div style={{ flex: 1 }}>
                          <Input
                            type="text"
                            placeholder="Nama Varian (contoh: 16 GB RAM · 512 GB SSD Space Grey)"
                            value={v.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setVariants((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, name: val } : item))
                              );
                            }}
                            className="font-bold text-sm"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(idx)}
                        className="admin-action-btn delete"
                        title="Hapus Varian"
                      >
                        <HugeIconTrash size={15} />
                      </button>
                    </div>

                    {/* Variant Inputs Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
                      <div>
                        <Label style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: "5px" }}>
                          Harga Varian
                        </Label>
                        <CurrencyInput
                          id={`variant-price-${idx}`}
                          name={`variant-price-${idx}`}
                          placeholder="0"
                          value={v.price}
                          onValueChange={(val) => {
                            setVariants((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, price: val } : item))
                            );
                          }}
                        />
                      </div>

                      <div>
                        <Label style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: "5px" }}>
                          Harga Normal (Coret)
                        </Label>
                        <CurrencyInput
                          id={`variant-orig-price-${idx}`}
                          name={`variant-orig-price-${idx}`}
                          placeholder="0"
                          value={v.originalPrice}
                          onValueChange={(val) => {
                            setVariants((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, originalPrice: val } : item))
                            );
                          }}
                        />
                      </div>

                      <div>
                        <Label style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: "5px" }}>
                          Status Varian
                        </Label>
                        <Select
                          value={v.availability}
                          onChange={(e) => {
                            const val = e.target.value;
                            setVariants((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, availability: val } : item))
                            );
                          }}
                        >
                          <option value="TERSEDIA">Tersedia (Ready Stock)</option>
                          <option value="PREORDER">Preorder</option>
                          <option value="HABIS">Habis (Stok Kosong)</option>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 Col): Pricing, Availability, Categorization, Badges */}
        <div className="space-y-6">
          {/* 1. Harga & Penawaran */}
          <Card>
            <CardHeader>
              <CardTitle>Harga & Penawaran</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="base-price">Harga Promo Showcase</Label>
                <CurrencyInput
                  id="base-price"
                  name="basePrice"
                  value={basePrice}
                  onValueChange={(val) => setBasePrice(val)}
                  placeholder="Kosongkan jika Hubungi Kami"
                />
              </div>

              <div>
                <Label htmlFor="orig-price">Harga Normal / Coret</Label>
                <CurrencyInput
                  id="orig-price"
                  name="originalPrice"
                  value={originalPrice}
                  onValueChange={(val) => setOriginalPrice(val)}
                  placeholder="Untuk kalkulasi diskon [-XX%]"
                />
              </div>

              <div>
                <Label htmlFor="prod-avail">Ketersediaan Showcase</Label>
                <Select
                  id="prod-avail"
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                >
                  <option value="TERSEDIA">Tersedia (Siap Kirim / Diambil)</option>
                  <option value="PREORDER">Preorder (Estimasi Pengadaan)</option>
                  <option value="HABIS">Habis (Stok Kosong)</option>
                </Select>
              </div>

              <div>
                <Label htmlFor="prod-bonus">Bonus Hadiah Tambahan</Label>
                <Input
                  id="prod-bonus"
                  type="text"
                  value={bonus}
                  onChange={(e) => setBonus(e.target.value)}
                  placeholder="e.g. Free Sleeve Case + USB-C Hub"
                />
              </div>

              <div>
                <Label htmlFor="prod-warranty">Informasi Garansi</Label>
                <Input
                  id="prod-warranty"
                  type="text"
                  value={warranty}
                  onChange={(e) => setWarranty(e.target.value)}
                  placeholder="e.g. Garansi Toko 1 Bulan"
                />
              </div>
            </CardContent>
          </Card>

          {/* 2. Kategori & Merek */}
          <Card>
            <CardHeader>
              <CardTitle>Klasifikasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="prod-cat">Kategori Perangkat *</Label>
                <Select
                  id="prod-cat"
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="prod-brand">Merek / Brand *</Label>
                <Select
                  id="prod-brand"
                  required
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                >
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 3. Badge Kurasi Beranda */}
          <Card>
            <CardHeader>
              <CardTitle>Kurasi Tampilan Beranda</CardTitle>
              <CardDescription>Tampilkan unit ini di bagian khusus beranda.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPromo}
                  onChange={(e) => setIsPromo(e.target.checked)}
                  className="rounded text-[#cc252b] focus:ring-[#cc252b]"
                />
                <span className="font-semibold text-[#111413]">🔥 Promo Spesial Minggu Ini</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded text-[#cc252b] focus:ring-[#cc252b]"
                />
                <span className="font-semibold text-[#111413]">⭐ Pilihan Hadi (Featured)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBestSeller}
                  onChange={(e) => setIsBestSeller(e.target.checked)}
                  className="rounded text-[#cc252b] focus:ring-[#cc252b]"
                />
                <span className="font-semibold text-[#111413]">🏆 Terlaris Toko</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isNewArrival}
                  onChange={(e) => setIsNewArrival(e.target.checked)}
                  className="rounded text-[#cc252b] focus:ring-[#cc252b]"
                />
                <span className="font-semibold text-[#111413]">✨ Koleksi Baru Tiba</span>
              </label>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Form Actions */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: "24px",
          borderTop: "1px solid var(--border)",
          marginTop: "16px",
        }}
      >
        <Link href="/admin/produk">
          <Button variant="outline" type="button" className="flex items-center gap-2">
            <ArrowLeft size={16} />
            <span>Kembali ke Daftar</span>
          </Button>
        </Link>

        <Button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2"
          style={{ minWidth: "210px", height: "42px", fontWeight: 700 }}
        >
          <Save size={16} />
          <span>
            {saving
              ? "Menyimpan..."
              : isEdit
              ? "Simpan Perubahan"
              : "Simpan & Tambahkan Perangkat"}
          </span>
        </Button>
      </div>
    </form>
  );
}
