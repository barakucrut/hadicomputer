"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, AlertCircle, ArrowRight, Eye, EyeOff } from "lucide-react";
import "@/app/admin.css";
import { RigspaceMark } from "@/components/admin/rigspace-mark";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Email atau password tidak sesuai");
      }

      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat masuk ke panel admin");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-container">
      <div className="admin-login-wrapper">
        {/* Brand Header */}
        <div className="admin-login-header">
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <RigspaceMark size={56} />
          </div>
          <h1 className="admin-login-title">Rigspace.id</h1>
          <p className="admin-login-subtitle">Content Management System</p>
        </div>

        {/* Shadcn Card Box */}
        <div className="admin-login-card">
          <h2 className="admin-login-card-title">Masuk ke Akun Toko</h2>
          <p className="admin-login-card-desc">
            Masukkan email dan password akun Anda.
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
            {/* Email Field */}
            <div className="admin-form-group">
              <label className="shadcn-label" htmlFor="admin-email">
                Email
              </label>
              <div className="admin-input-wrapper">
                <span className="admin-input-icon-left">
                  <Mail size={16} />
                </span>
                <input
                  id="admin-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@tokoanda.com"
                  className="admin-input-styled has-left-icon"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field with Eye Toggle */}
            <div className="admin-form-group">
              <label className="shadcn-label" htmlFor="admin-password">
                Password
              </label>
              <div className="admin-input-wrapper">
                <span className="admin-input-icon-left">
                  <Lock size={16} />
                </span>
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="admin-login-submit-btn"
            >
              <span>{loading ? "Memverifikasi Kredensial..." : "Masuk ke Panel Admin"}</span>
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="admin-login-footer-text">
          &copy; {new Date().getFullYear()} Rigspace.id — Platform website toko komputer & elektronik.
        </p>
      </div>
    </div>
  );
}
