"use client";

import * as React from "react";
import {
  Save,
  Phone,
  MapPin,
  Globe,
  Palette,
  Layout,
  Lock,
  Eye,
  EyeOff,
  Check,
  Type,
  Sparkles,
  Sliders,
  ExternalLink,
  UploadCloud,
  Upload,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import { Switch } from "@/components/admin/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/admin/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/admin/ui/toast";

const FONT_OPTIONS = [
  {
    id: "Plus Jakarta Sans",
    name: "Plus Jakarta Sans",
    category: "Modern & Clean (Default)",
    description: "Sangat nyaman dibaca di mobile, rapi, dan seimbang.",
    sample: "ASUS ROG Strix G16 (2024) — Rp 24.500.000",
  },
  {
    id: "Inter",
    name: "Inter",
    category: "Minimalist & Professional",
    description: "Standar SaaS global, proporsional dan netral.",
    sample: "MSI Cubi N ADL Mini PC — Rp 4.299.000",
  },
  {
    id: "Poppins",
    name: "Poppins",
    category: "Geometric & Friendly",
    description: "Bentuk membulat modern yang bersahabat dan santai.",
    sample: "Lenovo Legion Pro 5i — Rp 28.999.000",
  },
  {
    id: "Outfit",
    name: "Outfit",
    category: "Futuristic & Tech-Forward",
    description: "Karakter tegas dan tajam, sangat cocok untuk toko gaming & custom PC.",
    sample: "GeForce RTX 4070 Ti Super 16GB OC Edition",
  },
  {
    id: "Space Grotesk",
    name: "Space Grotesk",
    category: "Cyberpunk & Distinctive",
    description: "Gaya monospaced-inspired yang kuat khas hardware enthusiasts.",
    sample: "Custom Liquid Cooling Watercooled Rig",
  },
];

const COLOR_PRESETS = [
  { name: "Hadi Crimson", hex: "#dd2028", label: "Merah Sporty (Hadi Computer)" },
  { name: "Bitcom Cobalt", hex: "#0066cc", label: "Biru Elektrik (Plaza Bitcom)" },
  { name: "Emerald GeForce", hex: "#059669", label: "Hijau Tech & Hardware" },
  { name: "Cyber Violet", hex: "#7c3aed", label: "Ungu Kreator & Gaming" },
  { name: "Deep Obsidian", hex: "#0f172a", label: "Hitam Pekat Minimalis" },
  { name: "Amber Gold", hex: "#d97706", label: "Emas Mewah & Prestisius" },
];

export default function AdminSettingsPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = React.useState<"appearance" | "homepage" | "contact" | "security">("appearance");

  const [settings, setSettings] = React.useState<any>({
    storeName: "Hadi Computer",
    tagline: "Teknologi untuk keseharianmu.",
    logoUrl: "",
    faviconUrl: "",
    primaryColor: "#dd2028",
    secondaryColor: "#111413",
    fontFamily: "Plus Jakarta Sans",
    whatsappNumber: "6285769000007",
    whatsappDefaultTemplate: "Halo, saya ingin berkonsultasi mengenai perangkat laptop/komputer.",
    address: "Jl. Ahmad Yani No. 45, Lantai 1",
    openHours: "Buka setiap hari: 08.00 – 22.00 WIB",
    mapsEmbedUrl: "",
    socialInstagram: "",
    socialTiktok: "",
    socialFacebook: "",
    announcementText: "",
    isAnnouncementActive: false,
    homepageConfig: {
      featuredTitle: "",
      featuredEyebrow: "DIPILIH UNTUKMU",
      featuredDescription: "",
      bestSellerTitle: "",
      bestSellerEyebrow: "KURASI OWNER",
      bestSellerDescription: "",
      waConsultLabel: "",
      waFloatingLabel: "",
      storeSectionTitle: "",
      storeSectionEyebrow: "SAMPAI KETEMU DI TOKO",
      storeSectionDescription: "",
      sections: {
        heroSlider: true,
        valueStrip: true,
        categories: true,
        promoWeek: true,
        featured: true,
        needs: true,
        latest: true,
        pcGaming: true,
        services: true,
        storeLocation: true,
      },
    },
  });

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [passwordSaving, setPasswordSaving] = React.useState(false);

  // Logo upload state
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [uploadingLogo, setUploadingLogo] = React.useState(false);
  const [logoFileName, setLogoFileName] = React.useState<string>("");
  const [logoFileSize, setLogoFileSize] = React.useState<string>("");

  async function handleLogoUpload(file: File) {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp", "image/svg+xml"].includes(file.type)) {
      toast.error("Format file harus PNG, JPG, WebP, atau SVG!");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 2MB!");
      return;
    }

    setLogoFileName(file.name);
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
    setLogoFileSize(`${sizeInMb} MB`);

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "logos");

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal mengunggah logo");
      }

      setSettings((prev: any) => ({ ...prev, logoUrl: data.url }));
      toast.success("Logo toko berhasil diunggah!");
    } catch (err: any) {
      console.error("Upload logo error:", err);
      toast.error(err.message || "Gagal mengunggah logo");
    } finally {
      setUploadingLogo(false);
    }
  }

  React.useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          const s = d.settings;
          const mergedConfig = {
            featuredTitle: s.homepageConfig?.featuredTitle || `Pilihan ${s.storeName || "Toko"}, untuk harimu.`,
            featuredEyebrow: s.homepageConfig?.featuredEyebrow || "DIPILIH UNTUKMU",
            featuredDescription: s.homepageConfig?.featuredDescription || "Kenali perangkat yang bisa jadi teman aktivitasmu berikutnya.",
            bestSellerTitle: s.homepageConfig?.bestSellerTitle || `Favorit di ${s.storeName || "Toko"}`,
            bestSellerEyebrow: s.homepageConfig?.bestSellerEyebrow || "KURASI OWNER",
            bestSellerDescription: s.homepageConfig?.bestSellerDescription || "Koleksi produk paling diminati yang siap menemani produktivitas harianmu.",
            waConsultLabel: s.homepageConfig?.waConsultLabel || `Tanya ${s.storeName || "Toko"}`,
            waFloatingLabel: s.homepageConfig?.waFloatingLabel || `Tanya ${s.storeName || "Toko"} via WhatsApp`,
            storeSectionTitle: s.homepageConfig?.storeSectionTitle || "Lihat langsung. Ngobrol lebih nyaman.",
            storeSectionEyebrow: s.homepageConfig?.storeSectionEyebrow || "SAMPAI KETEMU DI TOKO",
            storeSectionDescription: s.homepageConfig?.storeSectionDescription || `Kenali pilihan perangkatmu dan diskusikan kebutuhan langsung dengan ${s.storeName || "kami"}.`,
            sections: {
              heroSlider: s.homepageConfig?.sections?.heroSlider !== false,
              valueStrip: s.homepageConfig?.sections?.valueStrip !== false,
              categories: s.homepageConfig?.sections?.categories !== false,
              promoWeek: s.homepageConfig?.sections?.promoWeek !== false,
              featured: s.homepageConfig?.sections?.featured !== false,
              needs: s.homepageConfig?.sections?.needs !== false,
              latest: s.homepageConfig?.sections?.latest !== false,
              pcGaming: s.homepageConfig?.sections?.pcGaming !== false,
              services: s.homepageConfig?.sections?.services !== false,
              storeLocation: s.homepageConfig?.sections?.storeLocation !== false,
            },
          };

          setSettings({
            ...s,
            homepageConfig: mergedConfig,
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        toast.success("Pengaturan toko & tema berhasil disimpan!");
      } else {
        toast.error("Gagal menyimpan pengaturan toko.");
      }
    } catch {
      toast.error("Terjadi kesalahan saat menyimpan pengaturan toko.");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Semua kolom password wajib diisi.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password baru minimal 6 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi password baru tidak sesuai.");
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await fetch("/api/admin/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengubah password.");

      toast.success("Password admin berhasil diperbarui!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat mengubah password.");
    } finally {
      setPasswordSaving(false);
    }
  }

  const toggleSection = (sectionKey: string) => {
    setSettings((prev: any) => ({
      ...prev,
      homepageConfig: {
        ...prev.homepageConfig,
        sections: {
          ...prev.homepageConfig?.sections,
          [sectionKey]: !prev.homepageConfig?.sections?.[sectionKey],
        },
      },
    }));
  };

  if (loading) {
    return <div className="p-8 text-center text-[#525854]">Memuat pengaturan toko...</div>;
  }

  const currentFont = FONT_OPTIONS.find((f) => f.id === settings.fontFamily) || FONT_OPTIONS[0];

  return (
    <div className="space-y-8 w-full pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-[#111413] tracking-tight">Pengaturan Toko & Tampilan</h1>
            <Badge variant="secondary" className="font-bold text-xs">
              {settings.storeName}
            </Badge>
          </div>
          <p className="text-sm text-[#525854] mt-1">
            Kustomisasi branding, tipografi font, warna tema, serta tata letak etalase publik toko.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 h-10 px-5 text-xs font-bold"
          >
            <Save size={16} />
            <span>{saving ? "Menyimpan..." : "Simpan Perubahan"}</span>
          </Button>
        </div>
      </div>

      {/* Tabs Navigation (Design Guide Standard: .admin-tabs-list & .admin-tab-trigger) */}
      <div className="admin-tabs-list" style={{ display: "inline-flex", backgroundColor: "#f1f3ed", padding: "4px", borderRadius: "10px", border: "1px solid var(--border)", gap: "4px" }}>
        <button
          type="button"
          onClick={() => setActiveTab("appearance")}
          className={`admin-tab-trigger ${activeTab === "appearance" ? "active" : ""}`}
        >
          <Palette size={15} />
          <span>Appearance & Tipografi</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("homepage")}
          className={`admin-tab-trigger ${activeTab === "homepage" ? "active" : ""}`}
        >
          <Layout size={15} />
          <span>Beranda & Section Builder</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("contact")}
          className={`admin-tab-trigger ${activeTab === "contact" ? "active" : ""}`}
        >
          <Phone size={15} />
          <span>Kontak & Lokasi Toko</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`admin-tab-trigger ${activeTab === "security" ? "active" : ""}`}
        >
          <Lock size={15} />
          <span>Keamanan & Password</span>
        </button>
      </div>

      {/* TAB 1: APPEARANCE & TYPOGRAPHY */}
      {activeTab === "appearance" && (
        <div className="space-y-6">
          {/* 1.1 Font Family Selection (Selectable Choice Cards with Prominent Checkmark) */}
          <Card className="border-[#e5e5e2] shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="p-6 border-b border-[#e5e5e2] bg-[#fcfcfc]">
              <CardTitle className="text-base flex items-center gap-2">
                <Type size={18} style={{ color: settings.primaryColor }} />
                <span>Tipografi & Font Family</span>
              </CardTitle>
              <CardDescription>
                Pilih font utama yang akan digunakan di seluruh teks etalase, tombol, dan judul website toko.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {FONT_OPTIONS.map((f) => {
                  const isSelected = settings.fontFamily === f.id;
                  return (
                    <div
                      key={f.id}
                      onClick={() => setSettings({ ...settings, fontFamily: f.id })}
                      className={`admin-choice-card ${isSelected ? "is-active" : ""}`}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isSelected}
                    >
                      <div className="flex flex-col gap-1 pr-8">
                        <div
                          data-preview-font="true"
                          style={{ fontFamily: `'${f.id}', sans-serif` }}
                          className="font-bold text-sm text-[#111413] leading-tight"
                        >
                          {f.name}
                        </div>
                        <div className="text-[11px] font-semibold text-[#818779] leading-tight">
                          {f.category}
                        </div>
                      </div>

                      {/* Large Prominent Checkmark Indicator */}
                      <div
                        className="admin-choice-indicator"
                        title={isSelected ? "Font Sedang Aktif" : "Pilih Font Ini"}
                      >
                        {isSelected && <Check size={14} strokeWidth={2.5} className="text-white" />}
                      </div>

                      <p className="text-xs text-[#525854] mt-2.5 leading-relaxed">
                        {f.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Live Font Preview Box */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 mt-4">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Live Preview Tipografi ({currentFont.name}):
                </span>
                <div
                  data-preview-font="true"
                  style={{ fontFamily: `'${settings.fontFamily}', sans-serif` }}
                  className="space-y-1.5"
                >
                  <h3 data-preview-font="true" className="text-lg font-black text-[#111413]">
                    {settings.storeName} — Perangkat Tepat untuk Kebutuhanmu
                  </h3>
                  <p data-preview-font="true" className="text-sm text-gray-700">
                    {currentFont.sample}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 1.2 Warna Identitas Toko (Theme Accent & Color Preset Selector) */}
          <Card className="border-[#e5e5e2] shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="p-6 border-b border-[#e5e5e2] bg-[#fcfcfc]">
              <CardTitle className="text-base flex items-center gap-2">
                <Palette size={18} style={{ color: settings.primaryColor }} />
                <span>Warna Tema & Identitas Toko</span>
              </CardTitle>
              <CardDescription>
                Warna primer menentukan warna tombol aksi utama (CTA), badge diskon, hover links, dan aksen navigasi.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-xs font-bold text-[#111413]">Pilihan Cepat Warna Preset:</Label>
                  <span className="text-[11px] text-[#818779]">Klik kotak warna untuk memilih tema</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {COLOR_PRESETS.map((p) => {
                    const isSelected = settings.primaryColor?.toLowerCase() === p.hex.toLowerCase();
                    return (
                      <button
                        type="button"
                        key={p.hex}
                        onClick={() => setSettings({ ...settings, primaryColor: p.hex })}
                        className={`admin-color-preset-btn ${isSelected ? "is-active" : ""}`}
                        title={`Pilih tema ${p.name} (${p.hex})`}
                      >
                        <div
                          className="admin-color-preset-swatch"
                          style={{ backgroundColor: p.hex }}
                        >
                          {isSelected && <Check size={13} strokeWidth={2.5} className="text-white drop-shadow-xs" />}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-xs font-bold text-[#111413] truncate">{p.name}</span>
                          <span className="text-[10px] font-mono text-[#525854] uppercase tracking-wider">{p.hex}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Divider with strictly guaranteed 16px spacing above and below */}
              <hr
                style={{
                  width: "100%",
                  height: "1px",
                  backgroundColor: "var(--border)",
                  border: "none",
                  margin: "16px 0",
                  display: "block",
                }}
              />

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <Label htmlFor="set-primary-color" className="text-xs font-bold text-[#111413]">
                  Custom Warna Primer (Hex Code)
                </Label>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  {/* Square color swatch button identical to presets */}
                  <div
                    style={{
                      position: "relative",
                      width: "36px",
                      height: "36px",
                      flexShrink: 0,
                    }}
                    title="Klik kotak warna untuk memilih warna custom"
                  >
                    <div
                      className="admin-color-preset-swatch"
                      style={{
                        backgroundColor: settings.primaryColor,
                        width: "36px",
                        height: "36px",
                        borderRadius: "8px",
                        border: "1.5px solid var(--border)",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.08), inset 0 1px 2px rgba(0,0,0,0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >
                      <Palette size={16} className="text-white drop-shadow-xs" />
                    </div>
                    <input
                      type="color"
                      id="set-primary-color-picker"
                      value={settings.primaryColor}
                      onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        opacity: 0,
                        cursor: "pointer",
                      }}
                    />
                  </div>

                  <Input
                    id="set-primary-color"
                    type="text"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                    className="font-mono uppercase font-bold text-xs h-9 max-w-[140px]"
                  />

                  <span className="admin-form-hint">
                    Format: #RRGGBB (misal: #0066CC untuk Plaza Bitcom)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 1.3 Branding & Logo (Drag & Drop Dropzone) */}
          <Card className="border-[#e5e5e2] shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="p-6 border-b border-[#e5e5e2] bg-[#fcfcfc]">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe size={18} style={{ color: settings.primaryColor }} />
                <span>Identitas Toko & Logo</span>
              </CardTitle>
              <CardDescription>
                Nama resmi dan gambar logo yang akan muncul di header atas dan footer etalase toko.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="set-name" className="text-xs font-bold text-[#111413]">Nama Toko *</Label>
                  <Input
                    id="set-name"
                    type="text"
                    required
                    value={settings.storeName}
                    onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                    className="text-xs font-bold h-10 mt-1"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="set-tagline" className="text-xs font-bold text-[#111413]">Tagline Singkat Toko</Label>
                  <Input
                    id="set-tagline"
                    type="text"
                    value={settings.tagline}
                    onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                    className="text-xs h-10 mt-1"
                    placeholder="e.g. Solusi Lengkap Komputer & Laptop Terpercaya"
                  />
                </div>
              </div>

              {/* Drag & Drop Logo Upload Area with 16px vertical distance */}
              <div className="space-y-3 pt-2">
                <div>
                  <Label className="text-xs font-bold text-[#111413]">Logo Toko (Header & Footer)</Label>
                </div>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleLogoUpload(e.target.files[0]);
                  }}
                  className="hidden"
                />

                {settings.logoUrl ? (
                  <div
                    className="admin-dropzone flex flex-col items-center justify-center py-5 text-center"
                    style={{ cursor: "default" }}
                  >
                    {/* Centered Thumbnail Image Preview (Compact 50%) */}
                    <div className="admin-logo-preview-box mb-2 shadow-xs">
                      <img
                        src={settings.logoUrl}
                        alt="Logo Toko"
                        className="object-contain"
                      />
                    </div>

                    {/* Centered File Name */}
                    <p className="text-xs font-bold text-[#111413] max-w-sm truncate">
                      {logoFileName || settings.logoUrl.split("/").pop() || "Logo Toko"}
                    </p>

                    {/* Centered File Size / Meta */}
                    <p className="text-[11px] text-[#525854] mt-0.5 font-medium">
                      {logoFileSize || "Logo Toko Aktif"}
                    </p>

                    {/* Standard Remove File Button */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSettings((prev: any) => ({ ...prev, logoUrl: "" }));
                        setLogoFileName("");
                        setLogoFileSize("");
                      }}
                      className="mt-3 flex items-center gap-1.5 h-8 px-3.5 text-xs font-bold"
                    >
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
                      if (e.dataTransfer.files?.[0]) {
                        handleLogoUpload(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadCloud size={36} className="text-[#818779] mx-auto mb-2" />
                    <p className="text-sm font-bold text-[#111413]">
                      {uploadingLogo ? "Mengunggah Logo..." : "Tarik & Lepas File Logo ke Sini"}
                    </p>
                    <p className="text-xs text-[#525854] mt-1">
                      atau <span className="text-red-600 font-bold underline">klik untuk memilih dari komputer</span>
                    </p>
                    <p className="admin-form-hint mt-2">
                      Format yang didukung: PNG transparan, JPEG, WebP, SVG (Maksimal 2MB)
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: HOMEPAGE & SECTION BUILDER */}
      {activeTab === "homepage" && (
        <div className="space-y-6">
          {/* 2.1 Custom Wording */}
          <Card className="border-[#e5e5e2] shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="p-6 border-b border-[#e5e5e2] bg-[#fcfcfc]">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles size={18} style={{ color: settings.primaryColor }} />
                <span>Kustomisasi Teks & Sapaan Toko</span>
              </CardTitle>
              <CardDescription>
                Ubah judul dan teks khas toko Anda agar etalase terasa sangat personal dan berkarakter.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="set-featured-title" className="text-xs font-bold text-[#111413]">
                    Judul Section Pilihan Toko
                  </Label>
                  <Input
                    id="set-featured-title"
                    type="text"
                    value={settings.homepageConfig?.featuredTitle || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        homepageConfig: {
                          ...settings.homepageConfig,
                          featuredTitle: e.target.value,
                        },
                      })
                    }
                    placeholder={`Pilihan ${settings.storeName}, untuk harimu.`}
                    className="text-xs h-10 mt-1 font-bold"
                  />
                  <span className="admin-form-hint">
                    Muncul di atas daftar produk rekomendasi utama.
                  </span>
                </div>

                <div>
                  <Label htmlFor="set-bestseller-title" className="text-xs font-bold text-[#111413]">
                    Judul Section Produk Terpopuler
                  </Label>
                  <Input
                    id="set-bestseller-title"
                    type="text"
                    value={settings.homepageConfig?.bestSellerTitle || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        homepageConfig: {
                          ...settings.homepageConfig,
                          bestSellerTitle: e.target.value,
                        },
                      })
                    }
                    placeholder={`Favorit di ${settings.storeName}.`}
                    className="text-xs h-10 mt-1 font-bold"
                  />
                  <span className="admin-form-hint">
                    Muncul di atas daftar produk terlaris / kurasi owner.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="set-wa-header" className="text-xs font-bold text-[#111413]">
                    Label Tombol WhatsApp Header
                  </Label>
                  <Input
                    id="set-wa-header"
                    type="text"
                    value={settings.homepageConfig?.waConsultLabel || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        homepageConfig: {
                          ...settings.homepageConfig,
                          waConsultLabel: e.target.value,
                        },
                      })
                    }
                    placeholder={`Tanya ${settings.storeName}`}
                    className="text-xs h-10 mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="set-wa-floating" className="text-xs font-bold text-[#111413]">
                    Label Tombol WA Melayang Mobile
                  </Label>
                  <Input
                    id="set-wa-floating"
                    type="text"
                    value={settings.homepageConfig?.waFloatingLabel || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        homepageConfig: {
                          ...settings.homepageConfig,
                          waFloatingLabel: e.target.value,
                        },
                      })
                    }
                    placeholder={`Tanya ${settings.storeName} via WhatsApp`}
                    className="text-xs h-10 mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2.2 Show / Hide Section Toggles */}
          <Card className="border-[#e5e5e2] shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="p-6 border-b border-[#e5e5e2] bg-[#fcfcfc]">
              <CardTitle className="text-base flex items-center gap-2">
                <Sliders size={18} style={{ color: settings.primaryColor }} />
                <span>Saklar Tampilan Section Beranda (Show / Hide)</span>
              </CardTitle>
              <CardDescription>
                Aktifkan atau sembunyikan section yang ingin ditampilkan di etalase depan toko Anda. Klik pada kartu atau tombol saklar untuk mengubah status tampil.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    key: "heroSlider",
                    label: "Banner Hero Promo Slider",
                    desc: "Carousel gambar promosi besar di bagian paling atas beranda.",
                  },
                  {
                    key: "valueStrip",
                    label: "Value Strip (4 Keunggulan Toko)",
                    desc: "Pita 4 kartu benefit belanja & konsultasi di toko Anda.",
                  },
                  {
                    key: "categories",
                    label: "Katalog Kategori Populer",
                    desc: "Grid ikon kategori perangkat (Laptop, PC, Komponen, Aksesoris).",
                  },
                  {
                    key: "promoWeek",
                    label: "Promo Minggu Ini (Special Deals)",
                    desc: "Koleksi produk yang sedang promo potongan harga & diskon.",
                  },
                  {
                    key: "featured",
                    label: "Produk Pilihan Rekomendasi (Featured)",
                    desc: "Katalog kurasi produk terbaik pilihan toko.",
                  },
                  {
                    key: "needs",
                    label: "Berdasarkan Kebutuhan (Kuliah, Kerja, Gaming)",
                    desc: "Pilihan belanja berdasarkan gaya hidup & skenario penggunaan.",
                  },
                  {
                    key: "latest",
                    label: "Produk Terbaru (New Arrivals)",
                    desc: "Daftar unit inventaris yang baru saja masuk katalog.",
                  },
                  {
                    key: "pcGaming",
                    label: "PC Desktop & Setup Impian (Rakit PC)",
                    desc: "Section khusus PC rakitan dan banner ajakan merakit PC.",
                  },
                  {
                    key: "services",
                    label: "Layanan & Servis Perangkat",
                    desc: "Kartu jasa servis, perawatan, dan reparasi perangkat.",
                  },
                  {
                    key: "storeLocation",
                    label: "Peta Lokasi Toko & Google Maps",
                    desc: "Embed interaktif peta fisik toko beserta alamat dan jam buka.",
                  },
                ].map((s) => {
                  const isActive = settings.homepageConfig?.sections?.[s.key] !== false;
                  return (
                    <div
                      key={s.key}
                      onClick={() => toggleSection(s.key)}
                      className={`p-4 rounded-xl border flex items-center justify-between gap-4 cursor-pointer transition-all select-none ${
                        isActive
                          ? "border-[#d8d8d4] bg-white shadow-xs hover:border-[#b0b0a8]"
                          : "border-[#e5e5e2] bg-[#f9f9f8] opacity-70 hover:opacity-90"
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-bold text-xs text-[#111413]">{s.label}</span>
                          <Badge
                            variant={isActive ? "success" : "secondary"}
                            className="text-[10px] px-2 py-0.5"
                          >
                            {isActive ? "Tampil" : "Nonaktif"}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-[#525854] leading-snug">{s.desc}</p>
                      </div>
                      <div onClick={(e) => e.stopPropagation()} className="shrink-0 flex items-center">
                        <Switch
                          checked={isActive}
                          onCheckedChange={() => toggleSection(s.key)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: KONTAK & LOKASI TOKO */}
      {activeTab === "contact" && (
        <div className="space-y-6">
          <Card className="border-[#e5e5e2] shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="p-6 border-b border-[#e5e5e2] bg-[#fcfcfc]">
              <CardTitle className="text-base flex items-center gap-2">
                <Phone size={18} style={{ color: settings.primaryColor }} />
                <span>Kontak Resmi WhatsApp</span>
              </CardTitle>
              <CardDescription>
                Nomor ini digunakan di seluruh tombol WhatsApp toko untuk mengarahkan pembeli langsung ke customer service Anda.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label htmlFor="set-wa" className="text-xs font-bold text-[#111413]">
                  Nomor WhatsApp Toko (Format Internasional: 628...) *
                </Label>
                <Input
                  id="set-wa"
                  type="text"
                  required
                  value={settings.whatsappNumber}
                  onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                  className="font-mono font-bold text-xs h-10 mt-1"
                />
              </div>

              <div>
                <Label htmlFor="set-wa-tpl" className="text-xs font-bold text-[#111413]">
                  Template Pesan WhatsApp Default
                </Label>
                <textarea
                  id="set-wa-tpl"
                  rows={2}
                  value={settings.whatsappDefaultTemplate}
                  onChange={(e) =>
                    setSettings({ ...settings, whatsappDefaultTemplate: e.target.value })
                  }
                  className="shadcn-input text-xs h-auto py-2.5 mt-1"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#e5e5e2] shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="p-6 border-b border-[#e5e5e2] bg-[#fcfcfc]">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin size={18} style={{ color: settings.primaryColor }} />
                <span>Alamat Fisik & Jam Buka</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label htmlFor="set-address" className="text-xs font-bold text-[#111413]">
                  Alamat Lengkap Toko
                </Label>
                <textarea
                  id="set-address"
                  rows={2}
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="shadcn-input text-xs h-auto py-2.5 mt-1"
                  placeholder="e.g. Jl. PB Sudirman No. 12, Jember"
                />
              </div>

              <div>
                <Label htmlFor="set-hours" className="text-xs font-bold text-[#111413]">
                  Jam Operasional / Buka Toko
                </Label>
                <Input
                  id="set-hours"
                  type="text"
                  value={settings.openHours}
                  onChange={(e) => setSettings({ ...settings, openHours: e.target.value })}
                  className="text-xs h-10 mt-1"
                  placeholder="e.g. Buka setiap hari: 08.00 – 21.00 WIB"
                />
              </div>

              <div>
                <Label htmlFor="set-maps" className="text-xs font-bold text-[#111413]">
                  Google Maps Embed URL
                </Label>
                <Input
                  id="set-maps"
                  type="text"
                  value={settings.mapsEmbedUrl || ""}
                  onChange={(e) => setSettings({ ...settings, mapsEmbedUrl: e.target.value })}
                  placeholder="https://www.google.com/maps/embed?..."
                  className="font-mono text-xs h-10 mt-1"
                />
                <span className="admin-form-hint">
                  Buka Google Maps → Bagikan → Sematkan peta → Salin link src iframe.
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#e5e5e2] shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="p-6 border-b border-[#e5e5e2] bg-[#fcfcfc]">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe size={18} style={{ color: settings.primaryColor }} />
                <span>Media Sosial Resmi</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="set-ig" className="text-xs font-bold text-[#111413]">
                    Akun Instagram
                  </Label>
                  <Input
                    id="set-ig"
                    type="text"
                    value={settings.socialInstagram || ""}
                    onChange={(e) => setSettings({ ...settings, socialInstagram: e.target.value })}
                    placeholder="@plazabitcom"
                    className="text-xs h-10 mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="set-tiktok" className="text-xs font-bold text-[#111413]">
                    Akun TikTok
                  </Label>
                  <Input
                    id="set-tiktok"
                    type="text"
                    value={settings.socialTiktok || ""}
                    onChange={(e) => setSettings({ ...settings, socialTiktok: e.target.value })}
                    placeholder="@plazabitcom"
                    className="text-xs h-10 mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="set-fb" className="text-xs font-bold text-[#111413]">
                    Halaman Facebook
                  </Label>
                  <Input
                    id="set-fb"
                    type="text"
                    value={settings.socialFacebook || ""}
                    onChange={(e) => setSettings({ ...settings, socialFacebook: e.target.value })}
                    placeholder="Plaza Bitcom Jember"
                    className="text-xs h-10 mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: KEAMANAN & PASSWORD */}
      {activeTab === "security" && (
        <form onSubmit={handleChangePassword}>
          <Card className="border-[#e5e5e2] shadow-sm rounded-2xl overflow-hidden max-w-2xl">
            <CardHeader className="p-6 border-b border-[#e5e5e2] bg-[#fcfcfc]">
              <CardTitle className="text-base flex items-center gap-2">
                <Lock size={18} style={{ color: settings.primaryColor }} />
                <span>Ubah Password Akun Pengelola</span>
              </CardTitle>
              <CardDescription>
                Perbarui kata sandi akun untuk menjaga keamanan akses ke CMS toko ini.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label htmlFor="curr-pass" className="text-xs font-bold text-[#111413]">
                  Password Saat Ini *
                </Label>
                <div className="admin-password-wrapper mt-1">
                  <Input
                    id="curr-pass"
                    type={showCurrentPassword ? "text" : "password"}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="text-xs h-10 pr-10 w-full"
                    placeholder="Masukkan password saat ini"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="admin-password-toggle-btn"
                    title={showCurrentPassword ? "Sembunyikan password" : "Lihat password"}
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="new-pass" className="text-xs font-bold text-[#111413]">
                  Password Baru (Minimal 6 Karakter) *
                </Label>
                <div className="admin-password-wrapper mt-1">
                  <Input
                    id="new-pass"
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="text-xs h-10 pr-10 w-full"
                    placeholder="Masukkan password baru"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="admin-password-toggle-btn"
                    title={showNewPassword ? "Sembunyikan password" : "Lihat password"}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirm-pass" className="text-xs font-bold text-[#111413]">
                  Konfirmasi Password Baru *
                </Label>
                <div className="admin-password-wrapper mt-1">
                  <Input
                    id="confirm-pass"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="text-xs h-10 pr-10 w-full"
                    placeholder="Ulangi password baru"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="admin-password-toggle-btn"
                    title={showConfirmPassword ? "Sembunyikan password" : "Lihat password"}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={passwordSaving}
                  className="h-10 px-5 text-xs font-bold flex items-center gap-2"
                >
                  <Lock size={15} />
                  <span>{passwordSaving ? "Memperbarui Password..." : "Update Password"}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}
