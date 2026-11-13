"use client";

import * as React from "react";
import {
  Save,
  CheckCircle,
  AlertCircle,
  Phone,
  MapPin,
  Globe,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/admin/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminSettingsPage() {
  const [settings, setSettings] = React.useState<any>({
    storeName: "Hadi Computer",
    tagline: "Pusat Laptop & Komputer Terpercaya",
    whatsappNumber: "6285769000007",
    whatsappDefaultTemplate:
      "Halo Hadi Computer, saya ingin berkonsultasi mengenai perangkat laptop/komputer.",
    address: "Jl. Ahmad Yani No. 45, Lantai 1",
    openHours: "Buka setiap hari: 08.00 – 22.00 WIB",
    mapsEmbedUrl: "",
    socialInstagram: "",
    socialTiktok: "",
    socialFacebook: "",
    announcementText: "",
    isAnnouncementActive: false,
  });

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [savedSuccess, setSavedSuccess] = React.useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [passwordSaving, setPasswordSaving] = React.useState(false);
  const [passwordSuccess, setPasswordSuccess] = React.useState<string | null>(null);
  const [passwordError, setPasswordError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) setSettings(d.settings);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Semua kolom password wajib diisi.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Password baru minimal 6 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Konfirmasi password baru tidak sesuai.");
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await fetch("/api/admin/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengubah password.");
      }

      setPasswordSuccess("Password berhasil diperbarui!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(null), 5000);
    } catch (err: any) {
      setPasswordError(err.message || "Terjadi kesalahan saat mengubah password.");
    } finally {
      setPasswordSaving(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-[#525854]">Memuat pengaturan toko...</div>;
  }

  return (
    <div className="space-y-10 max-w-4xl pb-16">
      {/* 1. Pengaturan Toko */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-[#111413] tracking-tight">Pengaturan Toko</h2>
            <p className="text-sm text-[#525854] mt-1">
              Konfigurasi profil toko, nomor resmi WhatsApp, alamat fisik, dan link media sosial.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {savedSuccess && (
              <Badge
                variant="success"
                style={{
                  padding: "6px 12px",
                  fontSize: "12px",
                  textTransform: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  animation: "adminAlertSlideIn 0.2s ease-out",
                }}
              >
                <CheckCircle size={14} style={{ color: "#15803d" }} />
                <span>Pengaturan berhasil disimpan!</span>
              </Badge>
            )}
            <Button type="submit" disabled={saving} className="flex items-center gap-2">
              <Save size={16} />
              <span>{saving ? "Menyimpan..." : "Simpan Pengaturan"}</span>
            </Button>
          </div>
        </div>

        {/* 1.1 Kontak WhatsApp */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Phone size={18} className="text-[#15803d]" />
              <span>Kontak WhatsApp Toko</span>
            </CardTitle>
            <CardDescription>
              Nomor ini akan digunakan di seluruh tombol WhatsApp website publik.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="set-wa">
                Nomor WhatsApp (Gunakan Format Internasional Tanpa +, e.g. 6285769000007) *
              </Label>
              <Input
                id="set-wa"
                type="text"
                required
                value={settings.whatsappNumber}
                onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                className="font-mono font-bold"
              />
            </div>

            <div>
              <Label htmlFor="set-wa-tpl">
                Template Pesan WhatsApp Default
              </Label>
              <textarea
                id="set-wa-tpl"
                rows={2}
                value={settings.whatsappDefaultTemplate}
                onChange={(e) =>
                  setSettings({ ...settings, whatsappDefaultTemplate: e.target.value })
                }
                className="shadcn-input h-auto py-2.5"
              />
            </div>
          </CardContent>
        </Card>

        {/* 1.2 Informasi Fisik & Jam Buka */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin size={18} className="text-[#cc252b]" />
              <span>Lokasi Toko & Jam Operasional</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="set-name">Nama Toko</Label>
              <Input
                id="set-name"
                type="text"
                value={settings.storeName}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="set-address">Alamat Toko</Label>
              <textarea
                id="set-address"
                rows={2}
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="shadcn-input h-auto py-2.5"
              />
            </div>

            <div>
              <Label htmlFor="set-hours">Jam Operasional</Label>
              <Input
                id="set-hours"
                type="text"
                value={settings.openHours}
                onChange={(e) => setSettings({ ...settings, openHours: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* 1.3 Media Sosial */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe size={18} className="text-[#525854]" />
              <span>Akun Media Sosial Resmi</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="set-ig">Instagram (@)</Label>
                <Input
                  id="set-ig"
                  type="text"
                  placeholder="hadicomputer.official"
                  value={settings.socialInstagram || ""}
                  onChange={(e) => setSettings({ ...settings, socialInstagram: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="set-tiktok">TikTok (@)</Label>
                <Input
                  id="set-tiktok"
                  type="text"
                  placeholder="hadicomputer"
                  value={settings.socialTiktok || ""}
                  onChange={(e) => setSettings({ ...settings, socialTiktok: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="set-fb">Facebook</Label>
                <Input
                  id="set-fb"
                  type="text"
                  placeholder="hadicomputer"
                  value={settings.socialFacebook || ""}
                  onChange={(e) => setSettings({ ...settings, socialFacebook: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* 2. Keamanan Akun & Ganti Password */}
      <div className="pt-6 border-t border-[#e5e7eb] space-y-6">
        <div>
          <h2 className="text-2xl font-black text-[#111413] tracking-tight">Keamanan Akun</h2>
          <p className="text-sm text-[#525854] mt-1">
            Ganti password login akun administrator CMS Hadi Computer.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <KeyRound size={18} className="text-[#cc252b]" />
              <span>Ganti Password Admin</span>
            </CardTitle>
            <CardDescription>
              Pastikan gunakan kombinasi password yang kuat dan aman.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
              {passwordSuccess && (
                <div className="admin-alert admin-alert-success" role="status">
                  <CheckCircle size={16} />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {passwordError && (
                <div className="admin-alert admin-alert-error" role="alert">
                  <AlertCircle size={16} />
                  <span>{passwordError}</span>
                </div>
              )}

              <div>
                <Label htmlFor="curr-pass">Password Saat Ini (Lama) *</Label>
                <div style={{ position: "relative" }}>
                  <Input
                    id="curr-pass"
                    type={showCurrentPassword ? "text" : "password"}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Masukkan password saat ini (default: admin123)"
                    autoComplete="current-password"
                    style={{ paddingRight: "40px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--muted)",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                    }}
                    tabIndex={-1}
                    aria-label={showCurrentPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new-pass">Password Baru *</Label>
                  <div style={{ position: "relative" }}>
                    <Input
                      id="new-pass"
                      type={showNewPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      autoComplete="new-password"
                      style={{ paddingRight: "40px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--muted)",
                        padding: "4px",
                        display: "flex",
                        alignItems: "center",
                      }}
                      tabIndex={-1}
                      aria-label={showNewPassword ? "Sembunyikan password" : "Tampilkan password"}
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirm-pass">Konfirmasi Password Baru *</Label>
                  <Input
                    id="confirm-pass"
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password baru"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit" disabled={passwordSaving} className="flex items-center gap-2">
                  <Lock size={15} />
                  <span>{passwordSaving ? "Memperbarui..." : "Perbarui Password"}</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Floating Success Toasts */}
      {savedSuccess && (
        <div className="admin-toast-fixed" role="status">
          <CheckCircle size={18} style={{ color: "#10b981", flexShrink: 0 }} />
          <span>Pengaturan toko berhasil diperbarui!</span>
        </div>
      )}

      {passwordSuccess && (
        <div className="admin-toast-fixed" role="status">
          <CheckCircle size={18} style={{ color: "#10b981", flexShrink: 0 }} />
          <span>Password berhasil diperbarui!</span>
        </div>
      )}
    </div>
  );
}
