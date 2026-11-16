"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Layers,
  Image as ImageIcon,
  Wrench,
  MessageSquare,
  Settings,
  ExternalLink,
  LogOut,
  Store,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { ToastProvider } from "@/components/admin/ui/toast";
import "@/app/admin.css";

interface AdminShellProps {
  children: React.ReactNode;
  user?: {
    name: string;
    email: string;
    role: string;
    tenantId?: string | null;
    tenantName?: string;
    isImpersonating?: boolean;
  } | null;
}

export function AdminShell({ children, user }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("admin_sidebar_collapsed");
      if (saved === "true") setIsCollapsed(true);
    } catch {
      // Ignore SSR / privacy mode
    }
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("admin_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  // If on login page, don't show admin shell
  if (pathname === "/admin/login") {
    return <ToastProvider>{children}</ToastProvider>;
  }

  const navItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Katalog Produk", href: "/admin/produk", icon: Package },
    { label: "Kategori & Merek", href: "/admin/kategori", icon: Layers },
    { label: "Banner Hero", href: "/admin/banner", icon: ImageIcon },
    { label: "Layanan & Servis", href: "/admin/layanan", icon: Wrench },
    { label: "Inquiry WhatsApp", href: "/admin/inquiry-analytics", icon: MessageSquare },
    { label: "Pengaturan Toko", href: "/admin/pengaturan", icon: Settings },
  ];

  async function handleLogout() {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }

  return (
    <ToastProvider>
      <div className="admin-shell-root">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 45,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(2px)",
          }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`admin-sidebar ${isCollapsed ? "is-collapsed" : ""}`}
        style={{
          transform: mobileMenuOpen ? "translateX(0)" : undefined,
        }}
      >
        {/* Brand Header */}
        <div className="admin-sidebar-header">
          <Link
            href="/admin"
            title="Hadi CMS — Dashboard"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontWeight: 800,
              fontSize: "17px",
              color: "var(--ink)",
              textDecoration: "none",
              minWidth: 0,
            }}
          >
            <div
              style={{
                height: "36px",
                width: "36px",
                minWidth: "36px",
                borderRadius: "10px",
                backgroundColor: "var(--red)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: "15px",
                boxShadow: "0 4px 10px rgba(221, 32, 40, 0.25)",
              }}
            >
              HC
            </div>
            <span className="admin-sidebar-brand-text" style={{ whiteSpace: "nowrap" }}>
              Hadi CMS
            </span>
          </Link>

          {/* Desktop Toggle in Sidebar Header */}
          <button
            type="button"
            onClick={toggleSidebar}
            className="admin-sidebar-header-toggle hidden md:inline-flex"
            title="Ciutkan Sidebar"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--muted)",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "6px",
            }}
          >
            <PanelLeftClose size={18} />
          </button>

          {/* Mobile close */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--muted)",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav
          style={{
            flex: 1,
            padding: isCollapsed ? "16px 8px" : "16px 12px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            overflowY: "auto",
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`admin-nav-item ${isActive ? "active" : ""}`}
                title={item.label}
              >
                <Icon
                  size={19}
                  style={{ color: isActive ? "#ffffff" : "var(--muted)", flexShrink: 0 }}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div
          className="admin-sidebar-footer"
          style={{
            padding: isCollapsed ? "12px 8px" : "14px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          {user?.role === "SUPERADMIN" && (
            <Link
              href="/god-mode"
              title="Kembali ke Pusat Kendali God-Mode"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: isCollapsed ? "center" : "space-between",
                padding: "9px 12px",
                borderRadius: "var(--radius-sm)",
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--red)",
                backgroundColor: "rgba(221, 32, 40, 0.08)",
                textDecoration: "none",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(221, 32, 40, 0.15)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(221, 32, 40, 0.08)")}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span>⚡</span>
                <span>Pusat God-Mode</span>
              </span>
            </Link>
          )}

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            title="Buka Toko Publik"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: isCollapsed ? "center" : "space-between",
              padding: "9px 12px",
              borderRadius: "var(--radius-sm)",
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--muted)",
              textDecoration: "none",
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Store size={16} style={{ flexShrink: 0 }} />
              <span>Buka Toko Publik</span>
            </span>
            <ExternalLink size={13} style={{ flexShrink: 0 }} />
          </a>
          <button
            onClick={handleLogout}
            title="Keluar Akun"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: isCollapsed ? "center" : "flex-start",
              gap: "8px",
              padding: "9px 12px",
              borderRadius: "var(--radius-sm)",
              fontSize: "12px",
              fontWeight: 600,
              color: "#dc2626",
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fee2e2")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <LogOut size={16} style={{ flexShrink: 0 }} />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Superadmin Impersonation Banner */}
        {user?.role === "SUPERADMIN" && (
          <div
            style={{
              backgroundColor: "#111413",
              color: "#ffffff",
              padding: "8px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "12px",
              fontWeight: 600,
              borderBottom: "2px solid var(--red)",
              zIndex: 40,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  backgroundColor: "var(--red)",
                  color: "#ffffff",
                  padding: "2px 7px",
                  borderRadius: "4px",
                  fontSize: "10px",
                  fontWeight: 900,
                  letterSpacing: "0.5px",
                }}
              >
                GOD-MODE
              </span>
              <span>
                Mode Akses Master: Anda sedang mengelola toko <strong>{user.tenantName || "Hadi Computer"}</strong>
              </span>
            </div>
            <Link
              href="/god-mode"
              style={{
                color: "#ffffff",
                backgroundColor: "rgba(255,255,255,0.15)",
                padding: "4px 12px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 700,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.25)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.15)")}
            >
              <span>⚡ Kembali ke God-Mode</span>
            </Link>
          </div>
        )}

        {/* Top Navbar */}
        <header className="admin-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Desktop Toggle Button in Topbar */}
            <button
              type="button"
              onClick={toggleSidebar}
              className="hidden md:inline-flex"
              title={isCollapsed ? "Bentangkan Sidebar" : "Ciutkan Sidebar"}
              style={{
                background: "transparent",
                border: "1px solid var(--border)",
                color: "var(--muted)",
                cursor: "pointer",
                padding: "6px",
                borderRadius: "6px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.15s ease, color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--surface)";
                e.currentTarget.style.color = "var(--ink)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--muted)";
              }}
            >
              {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden"
              style={{
                background: "transparent",
                border: "none",
                color: "var(--muted)",
                cursor: "pointer",
                padding: "4px",
              }}
            >
              <Menu size={22} />
            </button>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink)" }}>
              Panel Pengelola {user?.tenantName || "Hadi Computer"}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ textAlign: "right" }} className="hidden sm:block">
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)" }}>
                {user?.name || "Owner Hadi Computer"}
              </div>
              <div style={{ fontSize: "11px", color: "var(--muted)" }}>
                {user?.email || "admin@hadicomputer.com"}
              </div>
            </div>
            <div
              style={{
                height: "36px",
                width: "36px",
                borderRadius: "50%",
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "13px",
                color: "var(--red)",
              }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : "H"}
            </div>
          </div>
        </header>

        {/* Content Body with Generous, Elegant Margin */}
        <main className="admin-main-content">{children}</main>
      </div>
    </div>
    </ToastProvider>
  );
}
