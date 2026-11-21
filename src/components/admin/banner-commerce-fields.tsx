"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/admin/ui/badge";
import { Button } from "@/components/admin/ui/button";
import { useToast } from "@/components/admin/ui/toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { rupiah } from "@/lib/catalog";

interface ProductOption {
  id: string;
  name: string;
  code: string;
  basePrice: number | null;
  originalPrice: number | null;
}

/**
 * Field banner untuk template Precision: posisi (banner utama / tile samping),
 * tautan produk (harga, harga coret, spek & link otomatis), atau harga manual.
 */
export function BannerCommerceFields({
  value,
  onChange,
}: {
  value: Record<string, any>;
  onChange: (patch: Record<string, any>) => void;
}) {
  const [products, setProducts] = React.useState<ProductOption[]>([]);
  const [query, setQuery] = React.useState("");
  const [cutting, setCutting] = React.useState(false);
  const toast = useToast();
  const isStudio = value.bgTheme === "studio";

  async function generateStudioPhoto() {
    if (!value.productId) return;
    setCutting(true);
    try {
      const res = await fetch("/api/admin/banners/cutout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: value.productId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Gagal membuat foto studio.");
      onChange({ imageUrl: data.url });
      toast.success("Foto studio siap — produk dipisahkan dari latarnya.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat foto studio.");
    } finally {
      setCutting(false);
    }
  }

  React.useEffect(() => {
    fetch("/api/admin/products?limit=all&status=PUBLISHED")
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((d) => setProducts(d.products || []))
      .catch(() => setProducts([]));
  }, []);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? products.filter((p) => `${p.name} ${p.code}`.toLowerCase().includes(q)) : products;
    return list.slice(0, 200);
  }, [products, query]);

  const linked = products.find((p) => p.id === value.productId) || value.product || null;
  const hasDiscount = (o?: number | null, p?: number | null) => Boolean(o && p && o > p);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="banner-placement">Posisi Banner</Label>
        <Select id="banner-placement" value={value.placement || "hero"} onChange={(e) => onChange({ placement: e.target.value })}>
          <option value="hero">Banner Utama (slide besar)</option>
          <option value="tile">Tile Samping (kartu kecil di kanan)</option>
        </Select>
        <p className="admin-form-hint mt-1">Dipakai template Precision. Template lain menampilkan semua banner sebagai slider.</p>
      </div>

      <div>
        <Label htmlFor="banner-product-search">Tautkan ke Produk (Opsional)</Label>
        <Input
          id="banner-product-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari nama produk atau SKU…"
        />
        <div className="mt-2">
          <Select
            id="banner-product"
            value={value.productId || ""}
            onChange={(e) => {
              const p = products.find((x) => x.id === e.target.value) || null;
              // Studio Banner: foto studio lama milik produk sebelumnya tidak dipakai lagi
              onChange({ productId: e.target.value || null, product: p, ...(isStudio ? { imageUrl: "" } : {}) });
            }}
          >
            <option value="">— Tanpa produk (isi harga manual) —</option>
            {linked && !filtered.some((p) => p.id === linked.id) && (
              <option value={linked.id}>{linked.code} · {linked.name}</option>
            )}
            {filtered.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} · {p.name.slice(0, 70)}
              </option>
            ))}
          </Select>
        </div>
        <p className="admin-form-hint mt-1">
          Harga, harga coret, spek, foto & link otomatis diambil dari produk — selalu sinkron dengan katalog.
        </p>
        {linked && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-[#111413]">{linked.basePrice ? rupiah(linked.basePrice) : "Hubungi"}</span>
            {hasDiscount(linked.originalPrice, linked.basePrice) ? (
              <>
                <span className="text-[#818779] line-through">{rupiah(linked.originalPrice!)}</span>
                <Badge variant="success">Hemat {rupiah(linked.originalPrice! - linked.basePrice!)}</Badge>
              </>
            ) : (
              <Badge variant="warning">Harga coret belum ada</Badge>
            )}
          </div>
        )}
        {linked && !hasDiscount(linked.originalPrice, linked.basePrice) && (
          <p className="admin-form-hint mt-1">
            Banner tampil tanpa harga coret. Bila produk ini memang sedang diskon, isi <b>Harga Normal</b> di Katalog Produk — harga coret &
            “Kamu hemat Rp …” otomatis muncul di banner. Jangan isi harga normal yang tidak pernah berlaku.
          </p>
        )}
      </div>

      {isStudio && (
        <div className="space-y-2">
          <Label>Foto Studio</Label>
          <div className="flex min-h-[150px] items-center justify-center overflow-hidden rounded-lg bg-[radial-gradient(circle_at_60%_45%,#3a1416_0%,#0b0d0c_62%)] p-4">
            {value.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value.imageUrl} alt="Pratinjau foto studio" className="max-h-[140px] max-w-full object-contain drop-shadow-[0_18px_24px_rgba(0,0,0,0.55)]" />
            ) : (
              <span className="text-xs text-[#b9bbb7]">Belum ada foto studio — dibuat otomatis dari foto produk.</span>
            )}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={generateStudioPhoto} disabled={!value.productId || cutting}>
            <Sparkles size={14} /> {cutting ? "Memproses foto..." : value.imageUrl ? "Buat Ulang dari Foto Produk" : "Buat Foto Studio dari Produk"}
          </Button>
          <p className="admin-form-hint">
            Latar putih foto produk dibuang otomatis lalu produk ditaruh di panggung gelap. Foto poster/latar ramai akan ditolak.
          </p>
        </div>
      )}

      {!value.productId && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="banner-price">Harga Promo (Opsional)</Label>
            <CurrencyInput
              id="banner-price"
              name="bannerPrice"
              value={value.price ? String(value.price) : ""}
              onValueChange={(v) => onChange({ price: v ? Number(v) : null })}
              placeholder="Mis. 24.000.000"
            />
          </div>
          <div>
            <Label htmlFor="banner-original">Harga Coret (Opsional)</Label>
            <CurrencyInput
              id="banner-original"
              name="bannerOriginalPrice"
              value={value.originalPrice ? String(value.originalPrice) : ""}
              onValueChange={(v) => onChange({ originalPrice: v ? Number(v) : null })}
              placeholder="Mis. 26.499.000"
            />
            <p className="admin-form-hint mt-1">Isi dengan harga normal sebelum diskon (harga asli, bukan karangan).</p>
          </div>
        </div>
      )}
    </div>
  );
}
