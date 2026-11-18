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
  Users,
  ExternalLink,
  LogOut,
  Store,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
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
    roleName?: string;
    permissions?: string[];
  } | null;
}

interface TenantOption {
  id: string;
  name: string;
  slug: string;
  settings?: { primaryColor?: string } | null;
}

export function AdminShell({ children, user }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  // Superadmin Merchant Switcher State
  const [isMerchantDropdownOpen, setIsMerchantDropdownOpen] = React.useState(false);
  const [tenants, setTenants] = React.useState<TenantOption[]>([]);
  const merchantDropdownRef = React.useRef<HTMLDivElement>(null);

  // Fetch tenants if Superadmin
  React.useEffect(() => {
    if (user?.role === "SUPERADMIN") {
      fetch("/api/god-mode/tenants")
        .then((res) => res.json())
        .then((data) => {
          if (data.tenants) setTenants(data.tenants);
        })
        .catch(console.error);
    }
  }, [user?.role]);

  // Click outside to close dropdown
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        merchantDropdownRef.current &&
        !merchantDropdownRef.current.contains(event.target as Node)
      ) {
        setIsMerchantDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSwitchTenant(tenantId: string) {
    try {
      const res = await fetch("/api/god-mode/auth/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal beralih tenant");

      try {
        sessionStorage.setItem(
          "admin_flash_message",
          JSON.stringify({
            message: `Beralih ke CMS ${data.tenant?.name || "Merchant"}!`,
            type: "success",
          })
        );
      } catch {}

      setIsMerchantDropdownOpen(false);
      window.location.reload();
    } catch (err: any) {
      console.error("Switch tenant error:", err);
    }
  }

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

  const allNavItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard, permission: "dashboard:view" },
    { label: "Katalog Produk", href: "/admin/produk", icon: Package, permission: "products:view" },
    { label: "Kategori & Merek", href: "/admin/kategori", icon: Layers, permission: "categories:manage" },
    { label: "Banner Hero", href: "/admin/banner", icon: ImageIcon, permission: "banners:view" },
    { label: "Layanan & Servis", href: "/admin/layanan", icon: Wrench, permission: "services:view" },
    { label: "Inquiry WhatsApp", href: "/admin/inquiry-analytics", icon: MessageSquare, permission: "inquiries:view" },
    { label: "User & Role", href: "/admin/user-role", icon: Users, permission: "users:view" },
    { label: "Pengaturan Toko", href: "/admin/pengaturan", icon: Settings, permission: "settings:appearance" },
  ];

  const isOwner =
    user?.role?.toUpperCase() === "OWNER" ||
    user?.role === "owner" ||
    user?.permissions?.includes("*");

  const visibleNavItems = allNavItems.filter((item) => {
    if (isOwner) return true;
    if (!item.permission) return true;
    return user?.permissions?.includes(item.permission);
  });

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
          {visibleNavItems.map((item) => {
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
            {/* Superadmin Tenant Switcher Dropdown (Pinned to Topbar) */}
            {user?.role === "SUPERADMIN" && (
              <div ref={merchantDropdownRef} style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setIsMerchantDropdownOpen(!isMerchantDropdownOpen)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    height: "40px",
                    padding: "0 14px",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    backgroundColor: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "var(--ink)",
                    cursor: "pointer",
                    boxShadow: "var(--shadow-xs)",
                    boxSizing: "border-box",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
                  title="Beralih ke merchant lain atau kembali ke God-Mode"
                >
                  <Store size={16} className="text-[#cc252b]" />
                  <span style={{ maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user.tenantName || "Pilih Merchant"}
                  </span>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 800,
                      backgroundColor: "#fee2e2",
                      color: "#b91c1c",
                      padding: "1px 6px",
                      borderRadius: "4px",
                    }}
                  >
                    CMS
                  </span>
                  <ChevronDown size={14} className="text-[#818779]" />
                </button>

                {isMerchantDropdownOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      right: 0,
                      width: "320px",
                      backgroundColor: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                      zIndex: 100,
                      overflow: "hidden",
                      padding: "8px",
                    }}
                  >
                    {/* Header */}
                    <div
                      style={{
                        padding: "6px 10px 8px 10px",
                        fontSize: "11px",
                        fontWeight: 800,
                        color: "#64748b",
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                      }}
                    >
                      SUPERADMIN CONTROL
                    </div>

                    {/* Option 1: Back to God Mode */}
                    <Link
                      href="/god-mode"
                      onClick={() => setIsMerchantDropdownOpen(false)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "9px 10px",
                        borderRadius: "8px",
                        backgroundColor: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        textDecoration: "none",
                        marginBottom: "6px",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#fee2e2";
                        e.currentTarget.style.borderColor = "#fca5a5";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#f8fafc";
                        e.currentTarget.style.borderColor = "#e2e8f0";
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "16px" }}>⚡</span>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: "12.5px", fontWeight: 800, color: "var(--ink)" }}>
                            Pusat Kendali God-Mode
                          </span>
                          <span style={{ fontSize: "10.5px", color: "var(--muted)" }}>
                            Kembali ke dashboard utama platform
                          </span>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 800,
                          backgroundColor: "#ffffff",
                          color: "#cc252b",
                          padding: "3px 7px",
                          borderRadius: "4px",
                          border: "1px solid #fca5a5",
                        }}
                      >
                        Buka ↗
                      </span>
                    </Link>

                    <div style={{ height: "1px", backgroundColor: "#f1f5f9", margin: "6px 0" }} />

                    <div
                      style={{
                        padding: "4px 10px 6px 10px",
                        fontSize: "10.5px",
                        fontWeight: 800,
                        color: "#94a3b8",
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                      }}
                    >
                      PILIH MERCHANT TOKO (CMS)
                    </div>

                    {/* List of Tenants */}
                    <div style={{ maxHeight: "240px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "2px" }}>
                      {tenants.map((t) => {
                        const isCurrent = t.id === user?.tenantId;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              if (!isCurrent) {
                                handleSwitchTenant(t.id);
                              } else {
                                setIsMerchantDropdownOpen(false);
                              }
                            }}
                            style={{
                              width: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "8px 10px",
                              borderRadius: "8px",
                              backgroundColor: isCurrent ? "#f1f5f9" : "transparent",
                              border: "none",
                              cursor: isCurrent ? "default" : "pointer",
                              textAlign: "left",
                              transition: "background-color 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              if (!isCurrent) e.currentTarget.style.backgroundColor = "#f8fafc";
                            }}
                            onMouseLeave={(e) => {
                              if (!isCurrent) e.currentTarget.style.backgroundColor = "transparent";
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                              <span
                                style={{
                                  width: "9px",
                                  height: "9px",
                                  borderRadius: "50%",
                                  backgroundColor: t.settings?.primaryColor || "#cc252b",
                                  flexShrink: 0,
                                }}
                              />
                              <span
                                style={{
                                  fontSize: "12.5px",
                                  fontWeight: isCurrent ? 800 : 600,
                                  color: "var(--ink)",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {t.name}
                              </span>
                            </div>

                            {isCurrent ? (
                              <span
                                style={{
                                  fontSize: "10px",
                                  fontWeight: 800,
                                  backgroundColor: "#dcfce7",
                                  color: "#15803d",
                                  padding: "2px 7px",
                                  borderRadius: "4px",
                                  flexShrink: 0,
                                }}
                              >
                                ✓ Aktif
                              </span>
                            ) : (
                              <span
                                style={{
                                  fontSize: "10px",
                                  fontWeight: 800,
                                  backgroundColor: "#fee2e2",
                                  color: "#b91c1c",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  flexShrink: 0,
                                }}
                              >
                                Buka CMS ↗
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{ textAlign: "right" }} className="hidden sm:block">
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)", display: "flex", alignItems: "center", gap: "6px", justifyContent: "flex-end" }}>
                <span>{user?.name || "Owner Hadi Computer"}</span>
                {user?.roleName && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#f1f3ed] text-[#525854] border border-[#e2e5dc]">
                    {user.roleName}
                  </span>
                )}
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
