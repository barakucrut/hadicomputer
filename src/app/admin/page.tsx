import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import { countSampleData } from "@/lib/starter-pack";
import { SampleDataNotice } from "@/components/admin/sample-data-notice";
import { notFound } from "next/navigation";
import { effectiveOffer, rupiah } from "@/lib/catalog";
import {
  Package,
  MessageSquare,
  Image as ImageIcon,
  Wrench,
  TrendingUp,
  Plus,
  ArrowRight,
  ExternalLink,
  Clock,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/admin/ui/card";
import { Badge } from "@/components/admin/ui/badge";
import { Button } from "@/components/admin/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await requireAdminSession();
  const tenantId = session?.tenantId;
  if (!tenantId) notFound();

  const sampleData = await countSampleData(tenantId);

  // Fetch overview stats (selalu dibatasi ke toko milik sesi)
  const [
    totalProducts,
    availableProducts,
    preorderProducts,
    outOfStockProducts,
    totalBanners,
    totalServices,
    totalInquiries,
    todayInquiries,
    topInquiredProducts,
    recentProducts,
  ] = await Promise.all([
    prisma.product.count({ where: { tenantId, deletedAt: null } }),
    prisma.product.count({ where: { availability: "TERSEDIA", deletedAt: null, tenantId } }),
    prisma.product.count({ where: { availability: "PREORDER", deletedAt: null, tenantId } }),
    prisma.product.count({ where: { availability: "HABIS", deletedAt: null, tenantId } }),
    prisma.banner.count({ where: { tenantId, isActive: true } }),
    prisma.service.count({ where: { tenantId, isActive: true } }),
    prisma.inquiryLog.count({ where: { tenantId } }),
    prisma.inquiryLog.count({
      where: {
        tenantId,
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    prisma.product.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        category: true,
        _count: { select: { inquiryLogs: true } },
      },
      orderBy: { inquiryLogs: { _count: "desc" } },
      take: 5,
    }),
    prisma.product.findMany({
      where: { tenantId, deletedAt: null },
      include: { category: true, brand: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#111413] tracking-tight">Dashboard Ringkasan</h2>
          <p className="text-sm text-[#525854] mt-1">
            Status katalog, performa inquiry WhatsApp, dan tindakan cepat toko.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/produk/baru">
            <Button className="flex items-center gap-2">
              <Plus size={16} />
              <span>Tambah Produk</span>
            </Button>
          </Link>
          <a href="/" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="flex items-center gap-2">
              <span>Buka Website</span>
              <ExternalLink size={14} />
            </Button>
          </a>
        </div>
      </div>

      <SampleDataNotice
        products={sampleData.products}
        banners={sampleData.banners}
        services={sampleData.services}
      />

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#525854] uppercase tracking-wider">
                Total Katalog
              </span>
              <div className="h-8 w-8 rounded-lg bg-[#f1f3ed] text-[#111413] flex items-center justify-center">
                <Package size={18} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-[#111413]">{totalProducts} Unit</div>
              <div className="text-xs text-[#525854] mt-1 flex items-center gap-2">
                <span className="text-[#15803d] font-semibold">{availableProducts} Tersedia</span>
                <span>•</span>
                <span className="text-[#b45309] font-semibold">{preorderProducts} PO</span>
                <span>•</span>
                <span className="text-[#b91c1c] font-semibold">{outOfStockProducts} Habis</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* WhatsApp Inquiries */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#525854] uppercase tracking-wider">
                Inquiry WhatsApp
              </span>
              <div className="h-8 w-8 rounded-lg bg-[#dcfce7] text-[#15803d] flex items-center justify-center">
                <MessageSquare size={18} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-[#111413]">{totalInquiries} Klik</div>
              <div className="text-xs text-[#15803d] font-semibold mt-1 flex items-center gap-1">
                <TrendingUp size={13} />
                <span>+{todayInquiries} hari ini</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Banners */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#525854] uppercase tracking-wider">
                Banner Promo Aktif
              </span>
              <div className="h-8 w-8 rounded-lg bg-[#fef3c7] text-[#b45309] flex items-center justify-center">
                <ImageIcon size={18} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-[#111413]">{totalBanners} Kampanye</div>
              <div className="text-xs text-[#525854] mt-1">Hero slider & interactive hotspots</div>
            </div>
          </CardContent>
        </Card>

        {/* Services */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#525854] uppercase tracking-wider">
                Layanan & Servis
              </span>
              <div className="h-8 w-8 rounded-lg bg-[#fee2e2] text-[#cc252b] flex items-center justify-center">
                <Wrench size={18} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-[#111413]">{totalServices} Layanan</div>
              <div className="text-xs text-[#525854] mt-1">Servis & Rakit PC custom</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Top Inquiries & Recent Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Inquired Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles size={16} className="text-[#cc252b]" />
                <span>Paling Banyak Ditanyakan di WA</span>
              </CardTitle>
              <CardDescription>Produk dengan minat calon pembeli tertinggi</CardDescription>
            </div>
            <Link href="/admin/inquiry-analytics" className="text-xs font-semibold text-[#cc252b] hover:underline flex items-center gap-1">
              <span>Semua Log</span>
              <ArrowRight size={13} />
            </Link>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-[#f1f3ed]">
            {topInquiredProducts.length === 0 ? (
              <div className="p-6 text-center text-sm text-[#525854]">
                Belum ada klik WhatsApp yang tercatat.
              </div>
            ) : (
              topInquiredProducts.map((p, idx) => (
                <div key={p.id} className="p-4 flex items-center justify-between hover:bg-[#f8f7f4]/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-full bg-[#f1f3ed] font-bold text-xs text-[#525854] flex items-center justify-center">
                      #{idx + 1}
                    </div>
                    <div>
                      <Link href={`/admin/produk/${p.id}`} className="text-sm font-bold text-[#111413] hover:text-[#cc252b] line-clamp-1">
                        {p.name}
                      </Link>
                      <div className="text-xs text-[#525854] flex items-center gap-2 mt-0.5">
                        <span>{p.category.name}</span>
                        <span>•</span>
                        <span>{p.code}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="success" className="text-xs">
                      {p._count.inquiryLogs} Tanya WA
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recently Added Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock size={16} className="text-[#525854]" />
                <span>Produk Terbaru di Katalog</span>
              </CardTitle>
              <CardDescription>Daftar unit yang baru diperbarui atau diunggah</CardDescription>
            </div>
            <Link href="/admin/produk" className="text-xs font-semibold text-[#cc252b] hover:underline flex items-center gap-1">
              <span>Kelola Semua</span>
              <ArrowRight size={13} />
            </Link>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-[#f1f3ed]">
            {recentProducts.map((p) => {
              const price = p.basePrice ? rupiah(Number(p.basePrice)) : "Hubungi Kami";
              return (
                <div key={p.id} className="p-4 flex items-center justify-between hover:bg-[#f8f7f4]/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <div>
                      <Link href={`/admin/produk/${p.id}`} className="text-sm font-bold text-[#111413] hover:text-[#cc252b] line-clamp-1">
                        {p.name}
                      </Link>
                      <div className="text-xs text-[#525854] flex items-center gap-2 mt-0.5">
                        <span className="font-semibold text-[#16a34a]">{price}</span>
                        <span>•</span>
                        <span>{p.condition === "BEKAS" ? "Bekas Pilihan" : "Baru"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Quick Tips / Shortcut Banner */}
      <div className="rounded-xl bg-[#cc252b] text-white p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold">Kelola Hotspot Interaktif pada Banner Hero</h3>
          <p className="text-xs md:text-sm text-white/80 mt-1 max-w-2xl">
            Tambahkan label bonus fisik seperti "FREE Gaming Mouse" atau "FREE Kaos Eksklusif" langsung di atas gambar banner hero Anda.
          </p>
        </div>
        <Link href="/admin/banner">
          <Button variant="secondary" className="bg-white text-[#cc252b] hover:bg-white/90 shrink-0">
            Kelola Banner Hero
          </Button>
        </Link>
      </div>
    </div>
  );
}
