"use client";

import * as React from "react";
import { BarChart3, Check, Globe, Package, Save, Search, UploadCloud, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import { Switch } from "@/components/admin/ui/switch";
import { useToast } from "@/components/admin/ui/toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Panel pengaturan lanjutan toko: "SEO & Analitik" dan "Katalog & Stok".
 * Dipisah dari halaman Pengaturan utama dan punya endpoint sendiri
 * (/api/admin/settings/advanced) supaya tiap panel mandiri & mudah dirawat.
 */

interface AdvancedSettings {
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  ogImageUrl: string | null;
  googleSiteVerification: string | null;
  searchIndexing: boolean;
  gaMeasurementId: string | null;
  gtmContainerId: string | null;
  stockDisplay: "hidden" | "exact" | "limited";
  lowStockThreshold: number;
  skuPrefix: string | null;
  foundedYear: number | null;
  quickSearches: string[];
}

interface StoreInfo {
  name: string;
  slug: string;
  domain: string | null;
  defaultSkuPrefix: string;
  platformAnalytics: boolean;
}

const EMPTY: AdvancedSettings = {
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  ogImageUrl: "",
  googleSiteVerification: "",
  searchIndexing: true,
  gaMeasurementId: "",
  gtmContainerId: "",
  stockDisplay: "hidden",
  lowStockThreshold: 3,
  skuPrefix: "",
  foundedYear: null,
  quickSearches: [],
};

function useAdvancedSettings() {
  const toast = useToast();
  const [settings, setSettings] = React.useState<AdvancedSettings>(EMPTY);
  const [store, setStore] = React.useState<StoreInfo | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/admin/settings/advanced")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings)
          setSettings({ ...EMPTY, ...data.settings, quickSearches: Array.isArray(data.settings.quickSearches) ? data.settings.quickSearches : [] });
        if (data.store) setStore(data.store);
      })
      .catch(() => toast.error("Gagal memuat pengaturan"))
      .finally(() => setLoading(false));
  }, [toast]);

  async function save(next: AdvancedSettings = settings) {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings/advanced", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan");
      setSettings({ ...EMPTY, ...data.settings, quickSearches: Array.isArray(data.settings.quickSearches) ? data.settings.quickSearches : [] });
      toast.success("Pengaturan berhasil disimpan!");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const set = <K extends keyof AdvancedSettings>(key: K, value: AdvancedSettings[K]) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  return { settings, set, store, loading, saving, save };
}

function Counter({ value, max }: { value: string | null; max: number }) {
  const n = (value || "").length;
  return <span className={`text-[11px] font-semibold ${n > max ? "text-red-600" : "text-[#818779]"}`}>{n}/{max}</span>;
}

function SaveBar({ saving, onSave }: { saving: boolean; onSave: () => void }) {
  return (
    <div className="flex justify-end">
      <Button type="button" onClick={onSave} disabled={saving} className="flex items-center gap-2 h-10 px-5 text-xs font-bold">
        <Save size={16} />
        <span>{saving ? "Menyimpan..." : "Simpan Pengaturan"}</span>
      </Button>
    </div>
  );
}

/* ================================================================== */
/* SEO & ANALITIK                                                      */
/* ================================================================== */
export function SeoAnalyticsPanel({ primaryColor }: { primaryColor?: string }) {
  const toast = useToast();
  const { settings, set, store, loading, saving, save } = useAdvancedSettings();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);

  async function uploadOgImage(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", "banners");
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengunggah gambar");
      set("ogImageUrl", data.url);
      toast.success("Gambar share berhasil diunggah — jangan lupa simpan.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  if (loading) return <div className="p-8 text-center text-sm text-[#525854]">Memuat pengaturan SEO...</div>;

  const host = store?.domain || `${store?.slug || "toko"}.rigspace.id`;
  const previewTitle = settings.seoTitle || `${store?.name || "Nama Toko"} — Perangkat tepat untuk kebutuhanmu`;
  const previewDesc =
    settings.seoDescription ||
    `${store?.name || "Toko"} — Laptop baru & bekas, PC rakitan, aksesori, dan servis. Konsultasi langsung via WhatsApp.`;

  return (
    <div className="space-y-6">
      {/* --- Tampilan di Google --- */}
      <Card className="border-[#e5e5e2] shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="p-6 border-b border-[#e5e5e2] bg-[#fcfcfc] mb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Search size={18} style={{ color: primaryColor }} />
            <span>Tampilan di Hasil Pencarian Google</span>
          </CardTitle>
          <CardDescription>Atur judul & deskripsi beranda toko. Kosongkan untuk memakai nama & tagline toko secara otomatis.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-2 space-y-4">
          <div className="rounded-xl border border-[#e5e3dd] bg-white p-4">
            <p className="text-[11px] text-[#525854] mb-1">Pratinjau Google</p>
            <p className="text-xs text-[#202124] truncate">{host}</p>
            <p className="text-base text-[#1a0dab] font-medium truncate">{previewTitle}</p>
            <p className="text-xs text-[#4d5156] line-clamp-2">{previewDesc}</p>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="seo-title" className="text-xs font-bold text-[#111413]">Judul SEO Beranda</Label>
              <Counter value={settings.seoTitle} max={60} />
            </div>
            <Input id="seo-title" value={settings.seoTitle || ""} maxLength={70} onChange={(e) => set("seoTitle", e.target.value)} placeholder={`${store?.name || "Nama Toko"} — Pusat Laptop & Komputer di Kotamu`} />
            <p className="admin-form-hint mt-1">Ideal 50–60 karakter. Sebutkan nama toko, produk utama, dan kota.</p>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="seo-desc" className="text-xs font-bold text-[#111413]">Deskripsi SEO</Label>
              <Counter value={settings.seoDescription} max={160} />
            </div>
            <textarea
              id="seo-desc"
              value={settings.seoDescription || ""}
              maxLength={170}
              rows={3}
              onChange={(e) => set("seoDescription", e.target.value)}
              placeholder="Toko laptop & komputer terlengkap di Jember. Laptop baru & bekas bergaransi, rakit PC, servis, dan aksesori."
              className="shadcn-input w-full"
              style={{ height: "auto", paddingTop: 8, paddingBottom: 8 }}
            />
            <p className="admin-form-hint mt-1">Ideal 120–160 karakter. Tampil di bawah judul pada hasil pencarian.</p>
          </div>

          <div>
            <Label htmlFor="seo-keywords" className="text-xs font-bold text-[#111413]">Kata Kunci Utama</Label>
            <Input id="seo-keywords" value={settings.seoKeywords || ""} maxLength={255} onChange={(e) => set("seoKeywords", e.target.value)} placeholder="toko laptop jember, laptop bekas jember, servis laptop jember" />
            <p className="admin-form-hint mt-1">Pisahkan dengan koma. Dipakai sebagai meta keywords & panduan konten.</p>
          </div>
        </CardContent>
      </Card>

      {/* --- Share & Search Console --- */}
      <Card className="border-[#e5e5e2] shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="p-6 border-b border-[#e5e5e2] bg-[#fcfcfc] mb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe size={18} style={{ color: primaryColor }} />
            <span>Gambar Share & Google Search Console</span>
          </CardTitle>
          <CardDescription>Gambar yang muncul saat link toko dibagikan ke WhatsApp/Facebook, dan verifikasi kepemilikan situs.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-2 space-y-4">
          <div>
            <Label className="text-xs font-bold text-[#111413]">Gambar Share (Open Graph)</Label>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) uploadOgImage(e.target.files[0]);
                e.target.value = "";
              }}
            />
            {settings.ogImageUrl ? (
              <div className="admin-dropzone flex flex-col items-center justify-center py-5 text-center" style={{ cursor: "default" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={settings.ogImageUrl} alt="Gambar share" className="max-h-32 rounded-lg border border-[#e5e3dd] object-contain mb-2" />
                <p className="text-xs font-bold text-[#111413] max-w-sm truncate">{settings.ogImageUrl.split("/").pop()}</p>
                <Button type="button" variant="outline" size="sm" onClick={() => set("ogImageUrl", "")} className="mt-3 flex items-center gap-1.5 h-8 px-3.5 text-xs font-bold">
                  <X size={13} />
                  <span>Remove file</span>
                </Button>
              </div>
            ) : (
              <div
                className={`admin-dropzone ${isDragging ? "is-dragging" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files?.[0]) uploadOgImage(e.dataTransfer.files[0]);
                }}
                onClick={() => fileRef.current?.click()}
              >
                <UploadCloud size={36} className="text-[#818779] mx-auto mb-2" />
                <p className="text-sm font-bold text-[#111413]">{uploading ? "Mengunggah..." : "Tarik & Lepas Gambar Share ke Sini"}</p>
                <p className="text-xs text-[#525854] mt-1">
                  atau <span className="text-red-600 font-bold underline">klik untuk memilih dari komputer</span>
                </p>
                <p className="admin-form-hint mt-2">Ukuran ideal 1200 × 630 px. Kosong = memakai logo toko. Otomatis dikompres.</p>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="seo-gsc" className="text-xs font-bold text-[#111413]">Kode Verifikasi Google Search Console</Label>
            <Input id="seo-gsc" value={settings.googleSiteVerification || ""} onChange={(e) => set("googleSiteVerification", e.target.value)} placeholder='<meta name="google-site-verification" content="..." />' className="font-mono" />
            <p className="admin-form-hint mt-1">Search Console → Tambah properti → Metode "Tag HTML". Tempel tag lengkap atau kodenya saja.</p>
          </div>

          <label className="flex items-start justify-between gap-3 rounded-xl border border-[#e5e3dd] p-4 cursor-pointer">
            <span>
              <span className="text-xs font-bold text-[#111413] block">Izinkan toko muncul di Google</span>
              <span className="admin-form-hint block mt-0.5">Matikan sementara bila toko belum siap dipublikasikan. Sitemap & robots.txt otomatis menyesuaikan.</span>
            </span>
            <Switch checked={settings.searchIndexing} onCheckedChange={(c) => set("searchIndexing", c)} />
          </label>
        </CardContent>
      </Card>

      {/* --- Analitik --- */}
      <Card className="border-[#e5e5e2] shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="p-6 border-b border-[#e5e5e2] bg-[#fcfcfc] mb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 size={18} style={{ color: primaryColor }} />
            <span>Google Analytics & Tag Manager</span>
            {store?.platformAnalytics && <Badge variant="success">Analitik RigSpace aktif</Badge>}
          </CardTitle>
          <CardDescription>
            Opsional. Isi bila toko memiliki akun Google Analytics sendiri — data kunjungan akan masuk ke akun Anda.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="seo-ga" className="text-xs font-bold text-[#111413]">Measurement ID GA4</Label>
              <Input id="seo-ga" value={settings.gaMeasurementId || ""} onChange={(e) => set("gaMeasurementId", e.target.value.toUpperCase())} placeholder="G-XXXXXXXXXX" className="font-mono" />
              <p className="admin-form-hint mt-1">Google Analytics → Admin → Data Streams → pilih stream web → Measurement ID.</p>
            </div>
            <div>
              <Label htmlFor="seo-gtm" className="text-xs font-bold text-[#111413]">Container ID Google Tag Manager</Label>
              <Input id="seo-gtm" value={settings.gtmContainerId || ""} onChange={(e) => set("gtmContainerId", e.target.value.toUpperCase())} placeholder="GTM-XXXXXXX" className="font-mono" />
              <p className="admin-form-hint mt-1">Opsional, untuk pixel iklan (Meta, TikTok) lewat Tag Manager.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <SaveBar saving={saving} onSave={() => save()} />
    </div>
  );
}

/* ================================================================== */
/* KATALOG & STOK                                                      */
/* ================================================================== */
const STOCK_MODES: { id: AdvancedSettings["stockDisplay"]; title: string; desc: string; example: string }[] = [
  { id: "hidden", title: "Sembunyikan Stok", desc: "Pembeli hanya melihat status Tersedia / Preorder / Habis.", example: "Tersedia" },
  { id: "limited", title: "Tampilkan Stok Terbatas", desc: "Label muncul hanya saat stok menipis — menciptakan urgensi tanpa membuka jumlah stok.", example: "Stok terbatas" },
  { id: "exact", title: "Tampilkan Jumlah Stok", desc: "Jumlah stok tampil di kartu & halaman produk.", example: "Sisa 4 unit" },
];

export function CatalogStockPanel({ primaryColor }: { primaryColor?: string }) {
  const { settings, set, store, loading, saving, save } = useAdvancedSettings();
  const [chip, setChip] = React.useState("");
  const addChip = () => {
    const t = chip.trim().slice(0, 40);
    if (!t || settings.quickSearches.length >= 8) return;
    if (settings.quickSearches.some((c) => c.toLowerCase() === t.toLowerCase())) return setChip("");
    set("quickSearches", [...settings.quickSearches, t]);
    setChip("");
  };
  if (loading) return <div className="p-8 text-center text-sm text-[#525854]">Memuat pengaturan katalog...</div>;
  const prefix = settings.skuPrefix || store?.defaultSkuPrefix || "SKU";

  return (
    <div className="space-y-6">
      <Card className="border-[#e5e5e2] shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="p-6 border-b border-[#e5e5e2] bg-[#fcfcfc] mb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Package size={18} style={{ color: primaryColor }} />
            <span>Tampilan Stok di Etalase</span>
          </CardTitle>
          <CardDescription>Stok diisi per produk (opsional). Produk dengan stok 0 otomatis berstatus Habis.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STOCK_MODES.map((m) => {
              const active = settings.stockDisplay === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => set("stockDisplay", m.id)}
                  className={`admin-choice-card ${active ? "is-active" : ""}`}
                  role="button"
                  tabIndex={0}
                  aria-pressed={active}
                >
                  <div className="flex flex-col gap-1.5 pr-8">
                    <span className="text-sm font-bold text-[#111413]">{m.title}</span>
                    <Badge variant={m.id === "hidden" ? "success" : "warning"} className="w-fit">{m.example}</Badge>
                  </div>
                  <div className="admin-choice-indicator">{active && <Check size={14} strokeWidth={2.5} className="text-white" />}</div>
                  <p className="text-xs text-[#525854] mt-3 leading-relaxed">{m.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="max-w-xs">
            <Label htmlFor="stock-threshold" className="text-xs font-bold text-[#111413]">Batas "Stok Terbatas"</Label>
            <Input id="stock-threshold" type="number" min={1} max={100} value={settings.lowStockThreshold} onChange={(e) => set("lowStockThreshold", Number(e.target.value))} />
            <p className="admin-form-hint mt-1">Label stok terbatas muncul bila stok ≤ angka ini.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#e5e5e2] shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="p-6 border-b border-[#e5e5e2] bg-[#fcfcfc] mb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Package size={18} style={{ color: primaryColor }} />
            <span>Kode SKU Otomatis</span>
          </CardTitle>
          <CardDescription>Awalan kode unit untuk produk baru. Produk lama tetap memakai SKU-nya.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-2 space-y-4">
          <div className="max-w-xs">
            <Label htmlFor="sku-prefix" className="text-xs font-bold text-[#111413]">Prefix SKU</Label>
            <Input id="sku-prefix" value={settings.skuPrefix || ""} maxLength={8} onChange={(e) => set("skuPrefix", e.target.value.toUpperCase())} placeholder={store?.defaultSkuPrefix || "HC"} className="font-mono" />
            <p className="admin-form-hint mt-1">
              Contoh SKU berikutnya: <span className="font-mono font-bold">{prefix}-0001</span>. Kosong = inisial nama toko ({store?.defaultSkuPrefix}).
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#e5e5e2] shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="p-6 border-b border-[#e5e5e2] bg-[#fcfcfc] mb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Search size={18} style={{ color: primaryColor }} />
            <span>Profil Toko & Pencarian Cepat</span>
          </CardTitle>
          <CardDescription>Dipakai template Precision: strip angka toko dan chip di bawah bar pencarian beranda.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-2 space-y-4">
          <div className="max-w-xs">
            <Label htmlFor="founded-year" className="text-xs font-bold text-[#111413]">Tahun Berdiri</Label>
            <Input
              id="founded-year"
              type="number"
              min={1900}
              max={new Date().getFullYear()}
              value={settings.foundedYear ?? ""}
              onChange={(e) => set("foundedYear", e.target.value ? Number(e.target.value) : null)}
              placeholder="Mis. 1998"
            />
            <p className="admin-form-hint mt-1">Tampil sebagai "Sejak 1998" — kekuatan utama toko legendaris.</p>
          </div>

          <div>
            <Label htmlFor="quick-chip" className="text-xs font-bold text-[#111413]">Chip Pencarian Cepat ({settings.quickSearches.length}/8)</Label>
            <div className="flex gap-2">
              <Input
                id="quick-chip"
                value={chip}
                maxLength={40}
                onChange={(e) => setChip(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addChip();
                  }
                }}
                placeholder="Mis. Laptop kuliah 5–8 jt"
              />
              <Button type="button" variant="outline" onClick={addChip} disabled={!chip.trim() || settings.quickSearches.length >= 8}>
                Tambah
              </Button>
            </div>
            <p className="admin-form-hint mt-1">Kosong = otomatis dari kategori terlaris. Klik chip di etalase membuka hasil pencarian.</p>
            {settings.quickSearches.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {settings.quickSearches.map((c) => (
                  <span key={c} className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e3dd] bg-[#f8f7f4] pl-3 pr-1.5 py-1 text-xs font-semibold text-[#111413]">
                    {c}
                    <button
                      type="button"
                      aria-label={`Hapus ${c}`}
                      onClick={() => set("quickSearches", settings.quickSearches.filter((x) => x !== c))}
                      className="flex h-5 w-5 items-center justify-center rounded-full text-[#818779] hover:bg-[#eceae4] hover:text-[#111413]"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <SaveBar saving={saving} onSave={() => save()} />
    </div>
  );
}
