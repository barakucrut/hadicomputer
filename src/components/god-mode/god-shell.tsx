"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Inbox, KeyRound, LayoutDashboard, LogOut, Menu, Palette, Receipt, Store, UsersRound, X } from "lucide-react";
import { Badge } from "@/components/admin/ui/badge";
import { Button } from "@/components/admin/ui/button";
import { ChangePasswordDialog } from "@/components/account/change-password-dialog";
import { RigspaceMark } from "@/components/admin/rigspace-mark";
import { CmsMerchantSwitcher } from "./cms-merchant-switcher";
import { PLATFORM_ROLE_LABEL, godNavFor, type GodNavItem, type PlatformRole } from "@/lib/platform-access";

export interface GodSessionUser {
  username: string;
  name: string;
  role: PlatformRole;
  userId: string | null;
}

interface GodSessionState {
  user: GodSessionUser | null;
  nav: GodNavItem[];
  loading: boolean;
}

// Satu request /auth/me per muat halaman, dipakai bersama sidebar, badge & halaman
let cached: Promise<{ user: GodSessionUser; nav: GodNavItem[] } | null> | null = null;

function loadSession() {
  if (!cached) {
    cached = fetch("/api/god-mode/auth/me", { cache: "no-store" })
      .then(async (res) => (res.ok ? res.json() : null))
      .then((data) => (data?.user ? { user: data.user as GodSessionUser, nav: data.nav as GodNavItem[] } : null))
      .catch(() => null);
  }
  return cached;
}

/** Sesi tim platform di client (untuk menyembunyikan menu/aksi). Penegakan tetap di API. */
export function useGodSession(): GodSessionState {
  const [state, setState] = React.useState<GodSessionState>({ user: null, nav: [], loading: true });
  React.useEffect(() => {
    let alive = true;
    loadSession().then((session) => {
      if (!alive) return;
      if (!session) {
        cached = null;
        // Pastikan cookie sesi basi ikut terhapus sebelum ke halaman login (cegah redirect loop)
        fetch("/api/god-mode/auth/logout", { method: "POST" })
          .catch(() => undefined)
          .finally(() => {
            window.location.href = "/god-mode/login";
          });
        return;
      }
      setState({ user: session.user, nav: session.nav, loading: false });
    });
    return () => {
      alive = false;
    };
  }, []);
  return state;
}

const ICONS: Record<GodNavItem["icon"], React.ComponentType<{ size?: number }>> = {
  dashboard: LayoutDashboard,
  tenants: Store,
  leads: Inbox,
  team: UsersRound,
  transactions: Receipt,
  styleguide: Palette,
};

export async function godLogout(router: ReturnType<typeof useRouter>) {
  try {
    await fetch("/api/god-mode/auth/logout", { method: "POST" });
  } finally {
    cached = null;
    router.push("/god-mode/login");
    router.refresh();
  }
}

// Drawer sidebar di mobile: tombol menu (topbar) & sidebar berada di komponen berbeda
const MENU_EVENT = "god-mode-menu";
function setMobileMenu(open: boolean) {
  window.dispatchEvent(new CustomEvent(MENU_EVENT, { detail: open }));
}

/** Badge peran di topbar (+ tombol menu sidebar di layar < 768px). */
export function GodRoleBadge() {
  const { user } = useGodSession();
  return (
    <>
      <button
        type="button"
        onClick={() => setMobileMenu(true)}
        className="admin-action-btn md:hidden"
        aria-label="Buka menu"
      >
        <Menu size={18} />
      </button>
      {user && (
        <Badge variant={user.role === "SUPERADMIN" ? "destructive" : user.role === "CMO" ? "purple" : "info"} className="max-sm:hidden text-[11px]">
          {PLATFORM_ROLE_LABEL[user.role].toUpperCase()}
        </Badge>
      )}
    </>
  );
}

/** Sidebar god-mode bersama: menu mengikuti peran sesi. */
export function GodSidebar({ active }: { active: string }) {
  const router = useRouter();
  const { user, nav } = useGodSession();
  // Sebelum sesi termuat, tampilkan menu yang aman untuk semua peran (hindari kedip menu superadmin)
  const items = user ? nav : godNavFor("MARKETING");
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [passwordOpen, setPasswordOpen] = React.useState(false);

  React.useEffect(() => {
    const onToggle = (e: Event) => setMobileOpen(Boolean((e as CustomEvent<boolean>).detail));
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    window.addEventListener(MENU_EVENT, onToggle);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(MENU_EVENT, onToggle);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <>
    {mobileOpen && (
      <div className="fixed inset-0 z-[45] bg-black/40 backdrop-blur-[2px] md:hidden" onClick={() => setMobileOpen(false)} />
    )}
    {/* < 768px: drawer tersembunyi di kiri; >= 768px admin.css memaksa transform: none */}
    <aside className="admin-sidebar" style={{ transform: mobileOpen ? "translateX(0)" : "translateX(-100%)" }}>
      <div className="admin-sidebar-header flex items-center justify-between">
        <Link href="/god-mode" className="flex items-center gap-2.5 no-underline" style={{ color: "var(--ink)" }}>
          <RigspaceMark size={36} />
          <span className="flex min-w-0 flex-col" style={{ lineHeight: 1.15 }}>
            <span className="whitespace-nowrap" style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.01em" }}>
              Rigspace.id
            </span>
            <span className="whitespace-nowrap" style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)" }}>
              {user?.role === "SUPERADMIN" || !user ? "God-Mode · Master Engine" : user.role === "CMO" ? "God-Mode · Sales Lead" : "God-Mode · Partner Growth"}
            </span>
          </span>
        </Link>
        <button type="button" onClick={() => setMobileOpen(false)} className="admin-action-btn md:hidden" aria-label="Tutup menu">
          <X size={18} />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const isActive = item.href === active;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`admin-nav-item${isActive ? " active" : ""}`}
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="admin-sidebar-footer flex flex-col gap-3 p-3.5" style={{ borderTop: "1px solid var(--border)" }}>
        {user && (
          <div className="min-w-0">
            <div className="truncate text-xs font-bold" style={{ color: "var(--ink)" }}>
              {user.name}
            </div>
            <div className="truncate text-[11px]" style={{ color: "var(--muted)" }}>
              {PLATFORM_ROLE_LABEL[user.role]} · {user.username}
            </div>
          </div>
        )}
        {/* Superadmin bawaan (env) tidak punya akun di database: password diatur lewat env */}
        {user?.userId && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setMobileOpen(false);
              setPasswordOpen(true);
            }}
            className="w-full"
          >
            <KeyRound size={14} />
            <span>Ubah Password</span>
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => godLogout(router)}
          className="w-full"
        >
          <LogOut size={14} />
          <span>Keluar God-Mode</span>
        </Button>
        <div className="text-[11px] leading-snug" style={{ color: "var(--muted)" }}>
          Rigspace.id
          <br />
          <strong>The OS for PC Retailers</strong>
        </div>
      </div>
    </aside>
    <ChangePasswordDialog
      open={passwordOpen}
      onOpenChange={setPasswordOpen}
      endpoint="/api/god-mode/auth/change-password"
      email={user?.username}
    />
    </>
  );
}

/** Kerangka halaman god-mode baru: sidebar + topbar + konten. */
export function GodPageFrame({
  active,
  title,
  actions,
  children,
}: {
  active: string;
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <div className="admin-shell-root">
      <GodSidebar active={active} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="admin-topbar">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="truncate text-sm font-extrabold max-sm:hidden" style={{ color: "var(--ink)" }}>
              {title}
            </span>
            <GodRoleBadge />
          </div>
          <div className="flex items-center gap-3">
            {/* Pindah ke CMS toko mana pun dalam lingkup peran (marketing = tokonya saja) */}
            <CmsMerchantSwitcher />
            {actions}
            <Button
              variant="outline"
              onClick={() => godLogout(router)}
              className="flex h-10 items-center gap-1.5 border-red-200 px-4 text-xs font-bold text-red-600 hover:bg-red-50"
              title="Keluar dari sesi God-Mode"
            >
              <LogOut size={14} />
              <span className="max-sm:hidden">Logout</span>
            </Button>
          </div>
        </header>
        <main className="admin-main-content">{children}</main>
      </div>
    </div>
  );
}
