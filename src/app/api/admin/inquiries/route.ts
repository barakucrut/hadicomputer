import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authorizeAdmin } from "@/lib/auth";

export async function GET(request: Request) {
  const auth = await authorizeAdmin(["inquiries:view", "dashboard:view"]);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const limit = Math.min(Number(searchParams.get("limit")) || 100, 5000);
  const format = searchParams.get("format");

  const whereClause: any = { tenantId: auth.tenantId };
  if (type) whereClause.inquiryType = type;

  const logs = await prisma.inquiryLog.findMany({
    where: whereClause,
    include: {
      product: { select: { id: true, name: true, code: true, slug: true } },
      service: { select: { id: true, title: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const serialized = logs.map((l) => ({
    ...l,
    priceAtInquiry: l.priceAtInquiry !== null ? Number(l.priceAtInquiry) : null,
  }));

  if (format === "csv") {
    const headers = ["ID,Waktu,Tipe,Item,Kode,Varian,Estimasi Harga,IP Pengunjung,User Agent"];
    const rows = serialized.map((l) => {
      const item = l.product?.name || l.service?.title || "Umum";
      const code = l.product?.code || "-";
      const variant = l.variantName || "-";
      const price = l.priceAtInquiry ? `Rp ${l.priceAtInquiry.toLocaleString("id-ID")}` : "-";
      const date = new Date(l.createdAt).toLocaleString("id-ID");
      return `"${l.id}","${date}","${l.inquiryType}","${item.replace(/"/g, '""')}","${code}","${variant.replace(/"/g, '""')}","${price}","${l.visitorIp || "-"}","${(l.userAgent || "-").replace(/"/g, '""')}"`;
    });

    const csvContent = [headers, ...rows].join("\n");
    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="inquiry-logs-${Date.now()}.csv"`,
      },
    });
  }

  return NextResponse.json({ logs: serialized });
}
