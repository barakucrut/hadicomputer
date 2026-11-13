"use client";

import * as React from "react";
import { Download, MessageSquare, Filter, RefreshCw } from "lucide-react";
import { Button } from "@/components/admin/ui/button";
import { Card } from "@/components/admin/ui/card";
import { Badge } from "@/components/admin/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/admin/ui/table";
import { rupiah } from "@/lib/catalog";
import { AdminPagination } from "@/components/admin/ui/pagination";
import { Select } from "@/components/ui/select";

export default function AdminInquiryAnalyticsPage() {
  const [logs, setLogs] = React.useState<any[]>([]);
  const [typeFilter, setTypeFilter] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(15);

  const fetchLogs = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set("type", typeFilter);
      params.set("limit", "100");

      const res = await fetch(`/api/admin/inquiries?${params.toString()}`);
      const data = await res.json();
      if (data.logs) setLogs(data.logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  React.useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  function handleExportCsv() {
    const url = `/api/admin/inquiries?format=csv${typeFilter ? `&type=${typeFilter}` : ""}`;
    window.open(url, "_blank");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#111413] tracking-tight">
            Log Inquiry WhatsApp
          </h2>
          <p className="text-sm text-[#525854] mt-1">
            Riwayat klik tombol konsultasi WhatsApp per produk dan layanan untuk analisis minat calon pembeli.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchLogs} className="flex items-center gap-1.5">
            <RefreshCw size={14} />
            <span>Segarkan</span>
          </Button>
          <Button onClick={handleExportCsv} className="flex items-center gap-2">
            <Download size={16} />
            <span>Unduh CSV</span>
          </Button>
        </div>
      </div>

      {/* Filter toolbar */}
      <Card className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[#525854]">Filter Jenis:</span>
          <div style={{ width: "200px" }}>
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">Semua Interaksi</option>
              <option value="PRODUCT">Produk Katalog</option>
              <option value="SERVICE">Layanan & Jasa</option>
              <option value="GENERAL">Konsultasi Umum</option>
            </Select>
          </div>
        </div>
        <div className="text-xs font-semibold text-[#525854]">
          Menampilkan <span className="text-[#111413] font-bold">{logs.length}</span> log terbaru
        </div>
      </Card>

      {/* Logs Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Waktu (WIB)</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead>Item / Produk Terkait</TableHead>
              <TableHead>Varian</TableHead>
              <TableHead>Harga Saat Tanya</TableHead>
              <TableHead>Alamat IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Memuat log inquiry...
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-[#525854]">
                  Belum ada log inquiry WhatsApp yang tercatat.
                </TableCell>
              </TableRow>
            ) : (
              logs
                .slice((page - 1) * pageSize, page * pageSize)
                .map((log) => {
                const date = new Date(log.createdAt).toLocaleString("id-ID", {
                  dateStyle: "medium",
                  timeStyle: "short",
                });
                const itemName = log.product?.name || log.service?.title || "Konsultasi Umum";
                const price = log.priceAtInquiry ? rupiah(log.priceAtInquiry) : "-";

                return (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs text-[#525854] whitespace-nowrap">
                      {date}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          log.inquiryType === "PRODUCT"
                            ? "default"
                            : log.inquiryType === "SERVICE"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {log.inquiryType}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-[#111413]">
                      <div>{itemName}</div>
                      {log.product?.code && (
                        <span className="text-[11px] font-mono text-[#818779]">
                          {log.product.code}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-[#525854]">
                      {log.variantName || "-"}
                    </TableCell>
                    <TableCell className="font-bold text-xs text-[#16a34a]">
                      {price}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-[#818779]">
                      {log.visitorIp || "-"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        <AdminPagination
          currentPage={page}
          totalPages={Math.ceil(logs.length / pageSize) || 1}
          totalItems={logs.length}
          pageSize={pageSize}
          onPageChange={(p) => setPage(p)}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setPage(1);
          }}
          pageSizeOptions={[10, 15, 25, 50]}
        />
      </Card>
    </div>
  );
}
