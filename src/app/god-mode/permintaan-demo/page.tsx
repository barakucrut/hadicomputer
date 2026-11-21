"use client";

import * as React from "react";
import { ExternalLink, MessageCircle } from "lucide-react";
import { Badge } from "@/components/admin/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
import { AdminPagination } from "@/components/admin/ui/pagination";
import { ToastProvider, useToast } from "@/components/admin/ui/toast";
import { Select } from "@/components/ui/select";
import { GodPageFrame, useGodSession } from "@/components/god-mode/god-shell";
import { DEMO_REQUEST_STATUSES, DEMO_REQUEST_STATUS_LABEL, type DemoRequestStatus } from "@/lib/demo-request";
import "@/app/admin.css";

interface DemoRequestRow {
  id: string;
  storeName: string;
  city: string;
  whatsapp: string;
  storeLink: string | null;
  status: DemoRequestStatus;
  note: string | null;
  createdAt: string;
  assignedTo: { id: string; name: string } | null;
}

const STATUS_VARIANT: Record<DemoRequestStatus, "info" | "warning" | "success" | "secondary"> = {
  NEW: "info",
  CONTACTED: "warning",
  CONVERTED: "success",
  REJECTED: "secondary",
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function DemoRequestsContent() {
  const toast = useToast();
  const { user } = useGodSession();
  const [rows, setRows] = React.useState<DemoRequestRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [savingId, setSavingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch("/api/god-mode/demo-requests", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Gagal memuat permintaan demo.");
        setRows(data.requests);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Gagal memuat permintaan demo."))
      .finally(() => setLoading(false));
  }, []);

  async function changeStatus(row: DemoRequestRow, status: DemoRequestStatus) {
    setSavingId(row.id);
    try {
      const res = await fetch(`/api/god-mode/demo-requests/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui status.");
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status } : r)));
      toast.success(`${row.storeName}: ${DEMO_REQUEST_STATUS_LABEL[status]}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui status.");
    } finally {
      setSavingId(null);
    }
  }

  const visible = rows.slice((page - 1) * pageSize, page * pageSize);
  const newCount = rows.filter((r) => r.status === "NEW").length;

  return (
    <GodPageFrame active="/god-mode/permintaan-demo" title="Permintaan Demo">
      <div className="w-full space-y-8 pb-20">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#111413]">Permintaan Demo</h1>
          <p className="mt-1 text-sm text-[#525854]">
            Calon toko yang mengisi form &quot;Minta Demo&quot; di rigspace.id.
            {user?.role === "CMO" ? " Ditugaskan ke Anda." : " Otomatis ditugaskan ke CMO aktif."}
          </p>
        </div>

        <Card className="overflow-hidden rounded-2xl border-[#e5e5e2] shadow-sm">
          <CardHeader className="border-b border-[#e5e5e2] bg-[#fcfcfc] p-6">
            <CardTitle className="text-base">Kotak Masuk</CardTitle>
            <CardDescription>
              {newCount} permintaan baru belum dihubungi. Hubungi lewat WhatsApp, lalu buatkan tenant demo dari menu Daftar Tenant Toko.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-6 py-3.5">Toko</TableHead>
                    <TableHead className="px-6 py-3.5">Kontak</TableHead>
                    <TableHead className="px-6 py-3.5">Masuk</TableHead>
                    {user?.role === "SUPERADMIN" && <TableHead className="px-6 py-3.5">Ditugaskan</TableHead>}
                    <TableHead className="px-6 py-3.5">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-12 text-center text-sm text-[#818779]">
                        Memuat data...
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-12 text-center text-sm text-red-600">
                        {error}
                      </TableCell>
                    </TableRow>
                  ) : visible.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-12 text-center text-sm text-[#818779]">
                        Belum ada permintaan demo. Bagikan rigspace.id ke calon toko.
                      </TableCell>
                    </TableRow>
                  ) : (
                    visible.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="px-6 py-4">
                          <div className="text-sm font-bold text-[#111413]">{r.storeName}</div>
                          <div className="text-xs text-[#818779]">{r.city}</div>
                          {r.storeLink && (
                            <a
                              href={r.storeLink}
                              target="_blank"
                              rel="noopener noreferrer nofollow"
                              className="mt-1 inline-flex max-w-[260px] items-center gap-1 truncate text-xs font-semibold text-[#2563eb] no-underline"
                            >
                              <ExternalLink size={12} />
                              <span className="truncate">{r.storeLink.replace(/^https?:\/\//, "")}</span>
                            </a>
                          )}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <a
                            href={`https://wa.me/${r.whatsapp}?text=${encodeURIComponent(`Halo ${r.storeName}, terima kasih sudah minta demo website di Rigspace.id. `)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] px-2.5 py-1.5 text-xs font-bold text-[#15803d] no-underline"
                          >
                            <MessageCircle size={13} />
                            {r.whatsapp}
                          </a>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-xs text-[#525854]">{formatDate(r.createdAt)}</TableCell>
                        {user?.role === "SUPERADMIN" && (
                          <TableCell className="px-6 py-4 text-xs text-[#525854]">{r.assignedTo?.name || "Belum ada CMO"}</TableCell>
                        )}
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Badge variant={STATUS_VARIANT[r.status]}>{DEMO_REQUEST_STATUS_LABEL[r.status]}</Badge>
                            <Select
                              aria-label={`Ubah status ${r.storeName}`}
                              value={r.status}
                              disabled={savingId === r.id}
                              onChange={(e) => changeStatus(r, e.target.value as DemoRequestStatus)}
                              className="h-8 w-[150px] text-xs"
                            >
                              {DEMO_REQUEST_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {DEMO_REQUEST_STATUS_LABEL[s]}
                                </option>
                              ))}
                            </Select>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <AdminPagination
              currentPage={page}
              totalPages={Math.max(1, Math.ceil(rows.length / pageSize))}
              totalItems={rows.length}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </CardContent>
        </Card>
      </div>
    </GodPageFrame>
  );
}

export default function DemoRequestsPage() {
  return (
    <ToastProvider>
      <DemoRequestsContent />
    </ToastProvider>
  );
}
