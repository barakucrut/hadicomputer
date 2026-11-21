"use client";

import * as React from "react";
import { ChevronDown, Store } from "lucide-react";
import { useToast } from "@/components/admin/ui/toast";

interface SwitcherTenant {
  id: string;
  name: string;
  slug: string;
  status?: string;
  settings?: { primaryColor?: string } | null;
}

/**
 * Dropdown "Masuk CMS Merchant" untuk semua peran tim platform.
 * Daftar toko dari /api/god-mode/tenants (sudah dibatasi lingkup peran: marketing = tokonya saja),
 * dan impersonasi dicek ulang di server, jadi aman ditampilkan untuk marketing & CMO.
 */
export function CmsMerchantSwitcher() {
  const toast = useToast();
  const [tenants, setTenants] = React.useState<SwitcherTenant[]>([]);
  const [open, setOpen] = React.useState(false);
  const [opening, setOpening] = React.useState<string | null>(null);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    fetch("/api/god-mode/tenants", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data?.tenants && setTenants(data.tenants))
      .catch(() => undefined);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function openCms(t: SwitcherTenant) {
    setOpening(t.id);
    try {
      const res = await fetch("/api/god-mode/auth/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: t.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Gagal membuka CMS toko.");
      window.location.href = "/admin";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membuka CMS toko.");
      setOpening(null);
    }
  }

  if (tenants.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Masuk CMS Merchant"
        className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg bg-white px-3.5 text-[13px] font-bold"
        style={{ border: "1px solid var(--border)", color: "var(--ink)", boxShadow: "var(--shadow-xs)" }}
      >
        <Store size={16} style={{ color: "var(--red)" }} />
        <span className="max-sm:hidden">Masuk CMS Merchant</span>
        <ChevronDown size={14} className="text-[#818779]" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-[100] mt-2 w-[300px] max-w-[calc(100vw-32px)] overflow-hidden rounded-xl bg-white p-2"
          style={{ border: "1px solid #e2e8f0", boxShadow: "0 10px 30px -5px rgba(0,0,0,0.12), 0 4px 6px -2px rgba(0,0,0,0.05)" }}
        >
          <div className="px-2.5 pb-2 pt-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#64748b]">
            Pilih toko untuk dikelola (CMS)
          </div>
          <div className="flex max-h-[240px] flex-col gap-0.5 overflow-y-auto">
            {tenants.map((t) => (
              <button
                key={t.id}
                type="button"
                role="menuitem"
                disabled={opening !== null}
                onClick={() => openCms(t)}
                className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg bg-transparent px-2.5 py-2 text-left hover:bg-[#f8fafc]"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="h-[9px] w-[9px] shrink-0 rounded-full" style={{ backgroundColor: t.settings?.primaryColor || "#cc252b" }} />
                  <span className="truncate text-[13px] font-bold" style={{ color: "var(--ink)" }}>
                    {t.name}
                  </span>
                </span>
                <span className="shrink-0 rounded bg-[#fee2e2] px-1.5 py-0.5 text-[10px] font-extrabold text-[#b91c1c]">
                  {opening === t.id ? "Membuka..." : "Buka CMS ↗"}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
