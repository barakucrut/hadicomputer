"use client";

import * as React from "react";
import { Download, FileSpreadsheet, Globe, UploadCloud, X, CheckCircle2, AlertTriangle } from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/admin/ui/dialog";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import { Switch } from "@/components/admin/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/admin/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
import { AdminPagination } from "@/components/admin/ui/pagination";
import { useToast } from "@/components/admin/ui/toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { rupiah } from "@/lib/catalog";
import type { ImportPreview, RowResult } from "@/lib/catalog-import/types";

const BATCH_SIZE = 20;
type Step = "pick" | "preview" | "importing" | "done";

const ACTION_BADGE: Record<string, { label: string; variant: "success" | "info" | "secondary" }> = {
  create: { label: "Baru", variant: "success" },
  update: { label: "Update", variant: "info" },
  skip: { label: "Dilewati", variant: "secondary" },
};

function formatBytes(n: number) {
  return n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;
}

export function ProductImportDialog({
  open,
  onOpenChange,
  onImported,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}) {
  const toast = useToast();
  const fileRef = React.useRef<HTMLInputElement>(null);

  const [step, setStep] = React.useState<Step>("pick");
  const [source, setSource] = React.useState<"file" | "website">("file");
  const [file, setFile] = React.useState<File | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [siteUrl, setSiteUrl] = React.useState("");
  const [createMissing, setCreateMissing] = React.useState(true);
  const [updateExisting, setUpdateExisting] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [preview, setPreview] = React.useState<ImportPreview | null>(null);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [progress, setProgress] = React.useState({ done: 0, total: 0 });
  const [results, setResults] = React.useState<RowResult[]>([]);

  const reset = React.useCallback(() => {
    setStep("pick");
    setFile(null);
    setPreview(null);
    setResults([]);
    setProgress({ done: 0, total: 0 });
    setPage(1);
  }, []);

  function handleOpenChange(next: boolean) {
    if (step === "importing") return; // jangan tutup saat proses berjalan
    onOpenChange(next);
    if (!next) {
      if (step === "done") onImported();
      setTimeout(reset, 200);
    }
  }

  async function runPreview() {
    setLoading(true);
    try {
      let res: Response;
      if (source === "file") {
        if (!file) return;
        const form = new FormData();
        form.append("file", file);
        form.append("createMissing", String(createMissing));
        form.append("updateExisting", String(updateExisting));
        res = await fetch("/api/admin/products/import/preview", { method: "POST", body: form });
      } else {
        res = await fetch("/api/admin/products/import/woocommerce", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: siteUrl, createMissing, updateExisting }),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membaca data");
      setPreview(data);
      setPage(1);
      setStep("preview");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function runImport() {
    if (!preview) return;
    const actionable = new Set(preview.plans.filter((p) => p.action !== "skip").map((p) => p.rowNumber));
    const rows = preview.rows.filter((r) => actionable.has(r.rowNumber));
    setStep("importing");
    setProgress({ done: 0, total: rows.length });

    const all: RowResult[] = [];
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      try {
        const res = await fetch("/api/admin/products/import/commit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: batch, options: { createMissing, updateExisting } }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Batch gagal");
        all.push(...data.results);
      } catch (err) {
        all.push(
          ...batch.map((r) => ({ rowNumber: r.rowNumber, status: "failed" as const, name: r.name, message: (err as Error).message }))
        );
      }
      setProgress({ done: Math.min(i + BATCH_SIZE, rows.length), total: rows.length });
      setResults([...all]);
    }
    setStep("done");
    const ok = all.filter((r) => r.status === "created" || r.status === "updated").length;
    toast.success(`${ok} produk berhasil diimpor`);
  }

  const summary = preview?.summary;
  const errorsByRow = React.useMemo(() => {
    const m = new Map<number, string[]>();
    preview?.issues.filter((i) => i.level === "error").forEach((i) => m.set(i.rowNumber, [...(m.get(i.rowNumber) || []), i.message]));
    return m;
  }, [preview]);
  const warningCount = preview?.issues.filter((i) => i.level === "warning").length || 0;
  const pagedPlans = (preview?.plans || []).slice((page - 1) * pageSize, page * pageSize);
  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;
  const count = (s: RowResult["status"]) => results.filter((r) => r.status === s).length;
  const failed = results.filter((r) => r.status === "failed");
  const imageWarnings = results.flatMap((r) => (r.imageWarnings || []).map((w) => `Baris ${r.rowNumber}: ${w}`));

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      dismissible={step !== "importing"}
      className="flex flex-col"
      style={{ maxWidth: "920px", maxHeight: "90vh" }}
    >
      <DialogHeader className="mb-4">
        <DialogTitle>Import Produk Massal</DialogTitle>
        <DialogDescription>
          Upload file Excel/CSV atau ambil katalog langsung dari website WooCommerce lama toko.
        </DialogDescription>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0, margin: "0 -24px", padding: "0 24px 4px" }}>
        {/* ============ STEP 1: PILIH SUMBER ============ */}
        {step === "pick" && (
          <div className="space-y-4">
            <Tabs value={source} onValueChange={(v) => setSource(v as "file" | "website")}>
              <TabsList>
                <TabsTrigger value="file" className="flex items-center gap-2">
                  <FileSpreadsheet size={14} />
                  <span>Dari File Excel / CSV</span>
                </TabsTrigger>
                <TabsTrigger value="website" className="flex items-center gap-2">
                  <Globe size={14} />
                  <span>Dari Website WooCommerce</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="file" className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e5e3dd] bg-[#fdfdfc] p-4">
                  <div>
                    <p className="text-xs font-bold text-[#111413]">Belum punya file?</p>
                    <p className="admin-form-hint">Unduh template berisi kolom & dropdown kategori/merek toko Anda.</p>
                  </div>
                  <a href="/api/admin/products/import/template">
                    <Button type="button" variant="outline" size="sm" className="flex items-center gap-1.5">
                      <Download size={14} />
                      <span>Unduh Template</span>
                    </Button>
                  </a>
                </div>

                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setFile(e.target.files[0]);
                    e.target.value = "";
                  }}
                />
                {file ? (
                  <div className="admin-dropzone flex flex-col items-center justify-center py-5 text-center" style={{ cursor: "default" }}>
                    <FileSpreadsheet size={36} className="text-[#15803d] mx-auto mb-2" />
                    <p className="text-xs font-bold text-[#111413] max-w-sm truncate">{file.name}</p>
                    <p className="text-[11px] text-[#525854] mt-0.5 font-medium">{formatBytes(file.size)}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFile(null)}
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
                      if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
                    }}
                    onClick={() => fileRef.current?.click()}
                  >
                    <UploadCloud size={36} className="text-[#818779] mx-auto mb-2" />
                    <p className="text-sm font-bold text-[#111413]">Tarik & Lepas File Katalog ke Sini</p>
                    <p className="text-xs text-[#525854] mt-1">
                      atau <span className="text-red-600 font-bold underline">klik untuk memilih dari komputer</span>
                    </p>
                    <p className="admin-form-hint mt-2">Format: .xlsx atau .csv — maksimal 1.000 produk / 10MB per file</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="website" className="space-y-4">
                <div>
                  <Label htmlFor="import-site-url">Alamat Website Toko</Label>
                  <Input
                    id="import-site-url"
                    type="url"
                    value={siteUrl}
                    onChange={(e) => setSiteUrl(e.target.value)}
                    placeholder="https://namatoko.com"
                  />
                  <p className="admin-form-hint mt-1">
                    Untuk website berbasis WordPress + WooCommerce. Nama, harga, kategori, deskripsi & foto produk akan diambil otomatis.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-start justify-between gap-3 rounded-xl border border-[#e5e3dd] p-4 cursor-pointer">
                <span>
                  <span className="text-xs font-bold text-[#111413] block">Buat kategori & merek baru otomatis</span>
                  <span className="admin-form-hint block mt-0.5">Jika mati, baris dengan kategori/merek tak dikenal ditolak.</span>
                </span>
                <Switch checked={createMissing} onCheckedChange={setCreateMissing} />
              </label>
              <label className="flex items-start justify-between gap-3 rounded-xl border border-[#e5e3dd] p-4 cursor-pointer">
                <span>
                  <span className="text-xs font-bold text-[#111413] block">Update produk dengan SKU yang sama</span>
                  <span className="admin-form-hint block mt-0.5">Cocok untuk update harga massal dari file export.</span>
                </span>
                <Switch checked={updateExisting} onCheckedChange={setUpdateExisting} />
              </label>
            </div>
          </div>
        )}

        {/* ============ STEP 2: PRATINJAU ============ */}
        {step === "preview" && preview && summary && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Produk Baru", value: summary.create, variant: "success" as const },
                { label: "Di-update", value: summary.update, variant: "info" as const },
                { label: "Dilewati", value: summary.skip, variant: "secondary" as const },
                { label: "Bermasalah", value: summary.invalid, variant: "destructive" as const },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-[#e5e3dd] p-3">
                  <p className="text-[11px] font-semibold text-[#525854] uppercase tracking-wider">{s.label}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xl font-black text-[#111413]">{s.value}</span>
                    <Badge variant={s.variant}>{s.label}</Badge>
                  </div>
                </div>
              ))}
            </div>

            {(summary.newCategories.length > 0 || summary.newBrands.length > 0) && (
              <div className="rounded-xl border border-[#e5e3dd] bg-[#fdfdfc] p-4 text-xs text-[#111413] space-y-2">
                {summary.newCategories.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold mr-1">Kategori baru:</span>
                    {summary.newCategories.map((c) => (
                      <Badge key={c} variant="purple">{c}</Badge>
                    ))}
                  </div>
                )}
                {summary.newBrands.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold mr-1">Merek baru:</span>
                    {summary.newBrands.map((b) => (
                      <Badge key={b} variant="purple">{b}</Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {warningCount > 0 && (
              <p className="admin-form-hint flex items-center gap-1.5">
                <AlertTriangle size={12} /> {warningCount} catatan (mis. produk tanpa foto/harga) — tidak menghalangi import.
              </p>
            )}

            <div className="rounded-xl border border-[#e5e3dd] overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead style={{ width: 60 }}>Baris</TableHead>
                    <TableHead>Produk</TableHead>
                    <TableHead>Kategori & Merek</TableHead>
                    <TableHead>Harga</TableHead>
                    <TableHead>Foto</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedPlans.map((p) => {
                    const errs = errorsByRow.get(p.rowNumber);
                    return (
                      <TableRow key={p.rowNumber}>
                        <TableCell className="text-xs text-[#525854]">{p.rowNumber}</TableCell>
                        <TableCell>
                          <div className="font-bold text-[#111413] text-xs line-clamp-1">{p.name || "—"}</div>
                          {p.code && <div className="font-mono text-[11px] text-[#525854]">{p.code}</div>}
                          {errs && <div className="admin-form-hint">{errs.join("; ")}</div>}
                        </TableCell>
                        <TableCell className="text-xs">
                          {p.category || "—"}
                          <div className="text-[11px] text-[#525854]">{p.brand || "—"}</div>
                        </TableCell>
                        <TableCell className="text-xs">{p.basePrice ? rupiah(p.basePrice) : "Hubungi"}</TableCell>
                        <TableCell className="text-xs">{p.imageCount}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={errs ? "destructive" : ACTION_BADGE[p.action].variant}>
                            {errs ? "Error" : ACTION_BADGE[p.action].label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <AdminPagination
                currentPage={page}
                totalPages={Math.ceil(preview.plans.length / pageSize) || 1}
                totalItems={preview.plans.length}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(s) => {
                  setPageSize(s);
                  setPage(1);
                }}
                pageSizeOptions={[10, 25, 50]}
              />
            </div>
          </div>
        )}

        {/* ============ STEP 3: PROSES ============ */}
        {step === "importing" && (
          <div className="py-10 text-center space-y-4">
            <p className="text-sm font-bold text-[#111413]">
              Mengimpor {progress.done} dari {progress.total} produk…
            </p>
            <div className="mx-auto h-2.5 w-full max-w-md overflow-hidden rounded-full bg-[#f1f3ed]">
              <div className="h-full rounded-full bg-[#cc252b] transition-all" style={{ width: `${pct}%` }} />
            </div>
            <p className="admin-form-hint">Foto diunduh & dikompres otomatis. Jangan tutup jendela ini.</p>
          </div>
        )}

        {/* ============ STEP 4: SELESAI ============ */}
        {step === "done" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-[#e5e3dd] bg-[#fdfdfc] p-4">
              <CheckCircle2 size={28} className="text-[#15803d] shrink-0" />
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-[#111413]">Import selesai:</span>
                <Badge variant="success">{count("created")} baru</Badge>
                <Badge variant="info">{count("updated")} di-update</Badge>
                <Badge variant="secondary">{count("skipped")} dilewati</Badge>
                <Badge variant="destructive">{count("failed")} gagal</Badge>
              </div>
            </div>
            {failed.length > 0 && (
              <div className="rounded-xl border border-[#e5e3dd] p-4">
                <p className="text-xs font-bold text-[#111413] mb-2">Baris gagal</p>
                <ul className="space-y-1">
                  {failed.slice(0, 50).map((f) => (
                    <li key={f.rowNumber} className="admin-form-hint">
                      Baris {f.rowNumber} — {f.name || "tanpa nama"}: {f.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {imageWarnings.length > 0 && (
              <div className="rounded-xl border border-[#e5e3dd] p-4">
                <p className="text-xs font-bold text-[#111413] mb-2">Foto yang gagal diunduh ({imageWarnings.length})</p>
                <ul className="space-y-1">
                  {imageWarnings.slice(0, 30).map((w) => (
                    <li key={w} className="admin-form-hint">{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <DialogFooter>
        {step === "pick" && (
          <>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Batal
            </Button>
            <Button
              type="button"
              onClick={runPreview}
              disabled={loading || (source === "file" ? !file : !/^https?:\/\/.+\..+/.test(siteUrl.trim()))}
            >
              {loading ? (source === "website" ? "Mengambil katalog…" : "Membaca file…") : "Periksa Data"}
            </Button>
          </>
        )}
        {step === "preview" && summary && (
          <>
            <Button type="button" variant="outline" onClick={() => setStep("pick")}>
              Kembali
            </Button>
            <Button type="button" onClick={runImport} disabled={summary.create + summary.update === 0}>
              Import {summary.create + summary.update} Produk
            </Button>
          </>
        )}
        {step === "importing" && (
          <Button type="button" disabled>
            Memproses… {pct}%
          </Button>
        )}
        {step === "done" && (
          <>
            <Button type="button" variant="outline" onClick={reset}>
              Import Lagi
            </Button>
            <Button type="button" onClick={() => handleOpenChange(false)}>
              Selesai
            </Button>
          </>
        )}
      </DialogFooter>
    </Dialog>
  );
}
