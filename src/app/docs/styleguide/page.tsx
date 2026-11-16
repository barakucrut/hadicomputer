"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sparkles,
  LayoutGrid,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ExternalLink,
  Laptop,
  Cpu,
  Search,
  ShoppingCart,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/admin/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Switch } from "@/components/admin/ui/switch";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/admin/ui/table";
import { useToast, ToastProvider } from "@/components/admin/ui/toast";
import "@/app/admin.css";

function StyleguideContent() {
  const toast = useToast();
  const [currencyVal, setCurrencyVal] = React.useState<string>("12500000");
  const [switchVal, setSwitchVal] = React.useState(true);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--surface)", fontFamily: "var(--font)", paddingBottom: "80px" }}>
      {/* Header Bar */}
      <header
        style={{
          height: "64px",
          background: "#ffffff",
          borderBottom: "1px solid var(--border)",
          padding: "0 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 30,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              height: "36px",
              width: "36px",
              borderRadius: "10px",
              backgroundColor: "var(--red)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: "15px",
            }}
          >
            DS
          </div>
          <div>
            <h1 style={{ fontSize: "15px", fontWeight: 800, color: "var(--ink)", margin: 0 }}>
              Design System & Component Showcase
            </h1>
            <p style={{ fontSize: "11px", color: "var(--muted)", margin: 0 }}>
              Living Styleguide untuk Platform Multi-Tenant SaaS Toko Komputer
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Link
            href="/admin"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--muted)",
              textDecoration: "none",
              padding: "6px 12px",
              borderRadius: "6px",
              border: "1px solid var(--border)",
              backgroundColor: "#ffffff",
            }}
          >
            <span>Ke Admin CMS</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ padding: "32px", maxWidth: "1280px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "36px" }}>
        {/* 1. Color Tokens */}
        <section style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--ink)" }}>1. Design Tokens & Color Palette</h2>
            <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "2px" }}>
              Variabel tema warna utama yang bisa dikustomisasi secara dinamis per tenant / toko.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "14px" }}>
            {[
              { name: "Brand Red (Primary)", var: "--red", hex: "#cc252b", note: "Aksen utama toko / tombol CTA" },
              { name: "Deep Ink", var: "--ink", hex: "#111413", note: "Warna judul & teks utama" },
              { name: "Muted Text", var: "--muted", hex: "#525854", note: "Teks sekunder & deskripsi" },
              { name: "Surface Background", var: "--surface", hex: "#f6f6f4", note: "Background canvas dashboard" },
              { name: "Border Neutral", var: "--border", hex: "#e5e5e2", note: "Garis batas card & table" },
              { name: "Success Green", var: "--green", hex: "#15803d", note: "Status aktif / WhatsApp" },
            ].map((c) => (
              <div
                key={c.name}
                style={{
                  background: "#ffffff",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  padding: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    height: "44px",
                    borderRadius: "8px",
                    backgroundColor: c.hex,
                    border: c.hex === "#ffffff" ? "1px solid var(--border)" : "none",
                  }}
                />
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)" }}>{c.name}</div>
                  <div style={{ fontSize: "11px", fontFamily: "monospace", color: "var(--muted)" }}>{c.hex} ({c.var})</div>
                  <div style={{ fontSize: "11px", color: "#8a908a", marginTop: "4px" }}>{c.note}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Button System */}
        <section style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--ink)" }}>2. Buttons & Actions</h2>
            <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "2px" }}>
              Varian tombol composable berbasis arsitektur Shadcn UI.
            </p>
          </div>

          <Card>
            <CardContent style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Variants */}
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px" }}>
                <Button variant="default">Primary Button</Button>
                <Button variant="secondary">Secondary Button</Button>
                <Button variant="outline">Outline Button</Button>
                <Button variant="destructive">Destructive Button</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button disabled>Disabled Button</Button>
              </div>

              {/* Sizes & Icons */}
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px", borderTop: "1px solid var(--border)", paddingTop: "18px" }}>
                <Button size="sm" className="flex items-center gap-1.5">
                  <Plus size={14} />
                  <span>Small with Icon</span>
                </Button>
                <Button size="default" className="flex items-center gap-2">
                  <Sparkles size={16} />
                  <span>Default with Icon</span>
                </Button>
                <Button size="lg" className="flex items-center gap-2">
                  <Laptop size={18} />
                  <span>Large CTA Button</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.success("Toast Berhasil Dipanggil!")}
                  className="flex items-center gap-1.5"
                >
                  <CheckCircle2 size={14} className="text-green-600" />
                  <span>Test Trigger Toast</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 3. Badge System */}
        <section style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--ink)" }}>3. Status Badges</h2>
            <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "2px" }}>
              Label status inventaris, kondisi perangkat, dan paket langganan.
            </p>
          </div>

          <Card>
            <CardContent style={{ padding: "20px", display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
              <Badge variant="default">Primary Badge</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Habis / Inactive</Badge>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">
                <CheckCircle2 size={12} />
                <span>Tersedia (Ready)</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                <AlertCircle size={12} />
                <span>Preorder (PO)</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                <Sparkles size={12} />
                <span>Paket PRO Active</span>
              </span>
            </CardContent>
          </Card>
        </section>

        {/* 4. Form Controls */}
        <section style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--ink)" }}>4. Form Inputs & Controls</h2>
            <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "2px" }}>
              Field input form terstandarisasi untuk inventaris komputer.
            </p>
          </div>

          <Card>
            <CardContent style={{ padding: "24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
              <div>
                <Label htmlFor="demo-name">Nama Produk</Label>
                <Input id="demo-name" placeholder="e.g. ASUS ROG Strix G16" defaultValue="ASUS ROG Strix G16 (2024)" />
              </div>

              <div>
                <Label htmlFor="demo-price">Harga Produk (Currency Formatter)</Label>
                <CurrencyInput
                  id="demo-price"
                  name="price"
                  value={currencyVal}
                  onValueChange={(val) => setCurrencyVal(val)}
                  placeholder="Rp 0"
                />
              </div>

              <div>
                <Label htmlFor="demo-category">Kategori Perangkat</Label>
                <Select id="demo-category" defaultValue="laptop">
                  <option value="laptop">Laptop & Notebook</option>
                  <option value="pc-rakitan">PC Desktop Rakitan</option>
                  <option value="gadget">Smartphone & Tablet</option>
                  <option value="aksesoris">Aksesoris & Peripheral</option>
                </Select>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px", border: "1px solid var(--border)", borderRadius: "8px" }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)" }}>Aktifkan Modul PC Builder</div>
                  <div style={{ fontSize: "11px", color: "var(--muted)" }}>Tampilkan simulator rakit PC di toko ini</div>
                </div>
                <Switch checked={switchVal} onCheckedChange={setSwitchVal} />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 5. Data Table Sample */}
        <section style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--ink)" }}>5. Data Tables</h2>
            <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "2px" }}>
              Tabel data untuk manajemen produk, inventaris, dan tenant toko.
            </p>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Perangkat</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>Status Stok</TableHead>
                  <TableHead style={{ textAlign: "right" }}>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { name: "Lenovo Legion Pro 5", cat: "Laptop Gaming", price: "Rp 24.500.000", status: "Tersedia", badge: "bg-green-100 text-green-800" },
                  { name: "PC Rakitan Core i5 RTX 4060", cat: "PC Desktop", price: "Rp 13.800.000", status: "Tersedia", badge: "bg-green-100 text-green-800" },
                  { name: "MacBook Air M2 256GB (Second)", cat: "Laptop Bekas", price: "Rp 12.200.000", status: "Habis", badge: "bg-red-100 text-red-800" },
                ].map((row) => (
                  <TableRow key={row.name}>
                    <TableCell style={{ fontWeight: 700, color: "var(--ink)" }}>{row.name}</TableCell>
                    <TableCell>{row.cat}</TableCell>
                    <TableCell style={{ fontWeight: 800, color: "var(--red)" }}>{row.price}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${row.badge}`}>
                        {row.status}
                      </span>
                    </TableCell>
                    <TableCell style={{ textAlign: "right" }}>
                      <Button variant="outline" size="sm">Edit</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </section>
      </main>
    </div>
  );
}

export default function StyleguidePage() {
  return (
    <ToastProvider>
      <StyleguideContent />
    </ToastProvider>
  );
}
