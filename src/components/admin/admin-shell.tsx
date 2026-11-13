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
} from "lucide-react";
import "@/app/admin.css";

interface AdminShellProps {
  children: React.ReactNode;
  user?: { name: string; email: string; role: string } | null;
}

export function AdminShell({ children, user }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // If on login page, don't show admin shell
  if (pathname === "/admin/login") {
    return <>{children}</>;
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
        className="admin-sidebar"
        style={{
          transform: mobileMenuOpen ? "translateX(0)" : undefined,
        }}
      >
        {/* Brand Header */}
        <div className="admin-sidebar-header">
          <Link
            href="/admin"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontWeight: 800,
              fontSize: "17px",
              color: "var(--ink)",
              textDecoration: "none",
            }}
          >
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
                boxShadow: "0 4px 10px rgba(221, 32, 40, 0.25)",
              }}
            >
              HC
            </div>
            <span>Hadi CMS</span>
          </Link>
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
            padding: "16px 12px",
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
              >
                <Icon
                  size={18}
                  style={{ color: isActive ? "#ffffff" : "var(--muted)" }}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div
          style={{
            padding: "14px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
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
              <Store size={15} />
              Buka Toko Publik
            </span>
            <ExternalLink size={13} />
          </a>
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
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
            <LogOut size={15} />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top Navbar */}
        <header className="admin-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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
              Panel Pengelola Hadi Computer
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
  );
}
