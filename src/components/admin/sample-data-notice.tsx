"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/admin/ui/button";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { useToast } from "@/components/admin/ui/toast";
import { useCan } from "@/components/admin/permissions";

/** Pemberitahuan di dashboard selama toko masih berisi data contoh Starter Pack. */
export function SampleDataNotice({ products, banners, services }: { products: number; banners: number; services: number }) {
  const router = useRouter();
  const toast = useToast();
  const can = useCan();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [removing, setRemoving] = React.useState(false);

  if (products + banners + services === 0) return null;

  async function handleClear() {
    setRemoving(true);
    try {
      const res = await fetch("/api/admin/sample-data", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus data contoh");
      toast.success(`${data.removed.products} produk contoh dihapus. Toko siap diisi produk asli!`);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setRemoving(false);
    }
  }

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-[#e5e3dd] bg-[#fdfdfc] p-4">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 shrink-0 rounded-lg bg-[#fee2e2] text-[#cc252b] flex items-center justify-center">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="text-sm font-bold text-[#111413]">Toko masih berisi data contoh</p>
            <p className="admin-form-hint mt-0.5">
              {products} produk, {banners} banner & {services} layanan contoh dari Starter Pack. Selama data contoh ada,
              toko tidak diindeks Google. Import atau tambahkan produk asli, lalu hapus data contoh.
            </p>
          </div>
        </div>
        {can("products:delete") && (
          <Button type="button" variant="outline" size="sm" onClick={() => setConfirmOpen(true)} disabled={removing}>
            Hapus Data Contoh
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Hapus semua data contoh?"
        description={`${products} produk, ${banners} banner, dan ${services} layanan contoh akan dihapus permanen. Produk asli yang Anda tambahkan tidak ikut terhapus.`}
        confirmLabel="Ya, Hapus Data Contoh"
        onConfirm={handleClear}
        loading={removing}
      />
    </>
  );
}
