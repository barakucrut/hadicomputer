"use client";

import * as React from "react";
import { Save, CheckCircle, AlertCircle, Phone, MapPin, Clock, Globe } from "lucide-react";
import { Button } from "@/components/admin/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/admin/ui/card";
import { Switch } from "@/components/admin/ui/switch";
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
      alert("Gagal menyimpan pengaturan");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-[#525854]">Memuat pengaturan toko...</div>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-[#111413] tracking-tight">Pengaturan Toko</h2>
          <p className="text-sm text-[#525854] mt-1">
            Konfigurasi profil toko, nomor resmi WhatsApp, alamat fisik, dan link media sosial.
          </p>
        </div>
        <Button type="submit" disabled={saving} className="flex items-center gap-2">
          <Save size={16} />
          <span>{saving ? "Menyimpan..." : "Simpan Pengaturan"}</span>
        </Button>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-lg bg-[#dcfce7] border border-[#bbf7d0] text-[#15803d] text-sm flex items-center gap-2">
          <CheckCircle size={18} className="shrink-0" />
          <span>Pengaturan toko berhasil diperbarui!</span>
        </div>
      )}

      {/* 1. Kontak WhatsApp */}
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

      {/* 2. Informasi Fisik & Jam Buka */}
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

      {/* 3. Media Sosial */}
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
  );
}
