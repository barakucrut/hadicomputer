"use client";

import * as React from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { Button } from "@/components/admin/ui/button";
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/admin/ui/dialog";
import { useToast } from "@/components/admin/ui/toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PASSWORD_RULE_TEXT, passwordChangeError } from "@/lib/password-policy";

type Endpoint = "/api/admin/auth/change-password" | "/api/god-mode/auth/change-password";

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  placeholder: string;
}) {
  const [show, setShow] = React.useState(false);
  return (
    <div>
      <Label htmlFor={id} className="text-xs font-bold text-[#111413]">
        {label}
      </Label>
      <div className="admin-password-wrapper mt-1">
        <Input
          id={id}
          type={show ? "text" : "password"}
          required
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="text-xs h-10 pr-10 w-full"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="admin-password-toggle-btn"
          title={show ? "Sembunyikan password" : "Lihat password"}
          aria-label={show ? "Sembunyikan password" : "Lihat password"}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

/**
 * Form ubah password akun sendiri — dipakai /admin (tab Keamanan & dialog sidebar) dan /god-mode.
 * Aturan password dari src/lib/password-policy.ts (sama dengan validasi API).
 */
export function ChangePasswordForm({
  endpoint,
  email,
  onDone,
  onCancel,
  submitLabel = "Simpan Password",
}: {
  endpoint: Endpoint;
  email?: string | null;
  onDone?: () => void;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const invalid = passwordChangeError({ currentPassword, newPassword, confirmPassword }, { email });
    if (invalid) {
      toast.error(invalid);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Gagal mengubah password.");
      toast.success("Password berhasil diperbarui. Gunakan password baru saat login berikutnya.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onDone?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan saat mengubah password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PasswordField
        id="cp-current"
        label="Password Saat Ini *"
        value={currentPassword}
        onChange={setCurrentPassword}
        autoComplete="current-password"
        placeholder="Masukkan password saat ini"
      />
      <div>
        <PasswordField
          id="cp-new"
          label="Password Baru *"
          value={newPassword}
          onChange={setNewPassword}
          autoComplete="new-password"
          placeholder="Masukkan password baru"
        />
        <p className="admin-form-hint mt-1">{PASSWORD_RULE_TEXT}</p>
      </div>
      <PasswordField
        id="cp-confirm"
        label="Konfirmasi Password Baru *"
        value={confirmPassword}
        onChange={setConfirmPassword}
        autoComplete="new-password"
        placeholder="Ulangi password baru"
      />
      <DialogFooter>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            Batal
          </Button>
        )}
        <Button type="submit" disabled={saving} className="flex items-center gap-2">
          <KeyRound size={15} />
          <span>{saving ? "Menyimpan..." : submitLabel}</span>
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ChangePasswordDialog({
  open,
  onOpenChange,
  endpoint,
  email,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  endpoint: Endpoint;
  email?: string | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} style={{ maxWidth: 460, width: "100%" }}>
      <DialogHeader>
        <DialogTitle>Ubah Password</DialogTitle>
        <DialogDescription>Ganti password akun Anda{email ? ` (${email})` : ""}.</DialogDescription>
      </DialogHeader>
      {open && (
        <ChangePasswordForm endpoint={endpoint} email={email} onDone={() => onOpenChange(false)} onCancel={() => onOpenChange(false)} />
      )}
    </Dialog>
  );
}
