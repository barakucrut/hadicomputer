"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, User, Lock, AlertCircle, ArrowRight, Eye, EyeOff, Sparkles } from "lucide-react";
import "@/app/admin.css";

export default function GodModeLoginPage() {
  const router = useRouter();
  const [username, setUsername] = React.useState("superadmin@platform.com");
  const [password, setPassword] = React.useState("SuperGodMode2026!");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/god-mode/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Username atau password tidak sesuai");
      }

      router.push("/god-mode");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat otentikasi God Mode");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-container">
      <div className="admin-login-wrapper">
        {/* Brand Header */}
        <div className="admin-login-header">
          <div
            className="admin-login-brand-icon"
            style={{
              backgroundColor: "var(--red)",
              color: "#ffffff",
              boxShadow: "0 6px 16px rgba(221, 32, 40, 0.3)",
            }}
          >
            ⚡
          </div>
          <h1 className="admin-login-title">Pusat Kendali God-Mode</h1>
          <p className="admin-login-subtitle">
            Platform Multi-Tenant & Sistem Manajemen Retailer Terpusat
          </p>
        </div>

        {/* Shadcn Card Box */}
        <div className="admin-login-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
            <h2 className="admin-login-card-title">Akses Superadmin</h2>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: "var(--red)",
                backgroundColor: "rgba(221, 32, 40, 0.1)",
                padding: "3px 8px",
                borderRadius: "6px",
                letterSpacing: "0.5px",
              }}
            >
              ISOLATED ACCESS
            </span>
          </div>
          <p className="admin-login-card-desc">
            Kredensial master untuk monitoring ekosistem toko, database SHA-1, dan toggle modul runtime.
          </p>

          {error && (
            <div
              style={{
                marginBottom: "20px",
                padding: "12px 14px",
                borderRadius: "8px",
                backgroundColor: "#fee2e2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                fontSize: "12px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Username/Email Field */}
            <div className="admin-form-group">
              <label className="shadcn-label" htmlFor="god-username">
                Username / Email Master Superadmin
              </label>
              <div className="admin-input-wrapper">
                <span className="admin-input-icon-left">
                  <User size={16} />
                </span>
                <input
                  id="god-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="superadmin@platform.com atau godmode"
                  className="admin-input-styled has-left-icon"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password Field with Eye Toggle */}
            <div className="admin-form-group">
              <label className="shadcn-label" htmlFor="god-password">
                Master Security Key / Password
              </label>
              <div className="admin-input-wrapper">
                <span className="admin-input-icon-left">
                  <Lock size={16} />
                </span>
                <input
                  id="god-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="admin-input-styled has-left-icon has-right-icon"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="admin-password-toggle-btn"
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
                  title={showPassword ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Quick credentials helper badge */}
            <div
              style={{
                marginBottom: "20px",
                padding: "10px 12px",
                borderRadius: "8px",
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                fontSize: "12px",
                color: "var(--muted)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Sparkles size={14} className="text-amber-500" style={{ flexShrink: 0 }} />
              <span>
                Default dev: <strong style={{ color: "var(--ink)" }}>superadmin@platform.com</strong> / <strong style={{ color: "var(--ink)" }}>SuperGodMode2026!</strong>
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="admin-login-submit-btn"
            >
              <span>{loading ? "Memverifikasi Akses Master..." : "Masuk ke Pusat Kendali"}</span>
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="admin-login-footer-text">
          &copy; {new Date().getFullYear()} Platform Multi-Tenant SaaS. Dilindungi sesi terenkripsi JWT.
        </p>
      </div>
    </div>
  );
}
