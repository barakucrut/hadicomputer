"use client";

import * as React from "react";
import { Eye, EyeOff, Plus, UsersRound } from "lucide-react";
import { Badge } from "@/components/admin/ui/badge";
import { Button } from "@/components/admin/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
import { AdminPagination } from "@/components/admin/ui/pagination";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/admin/ui/dialog";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { HugeIconEdit, HugeIconTrash } from "@/components/admin/ui/huge-icons";
import { Switch } from "@/components/admin/ui/switch";
import { ToastProvider, useToast } from "@/components/admin/ui/toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { GodPageFrame } from "@/components/god-mode/god-shell";
import { PLATFORM_ROLE_LABEL, type PlatformRole } from "@/lib/platform-access";
import "@/app/admin.css";

interface Member {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: PlatformRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  managerId: string | null;
  manager: { id: string; name: string } | null;
  _count: { acquiredTenants: number; reports: number };
}

interface FormState {
  name: string;
  email: string;
  phone: string;
  role: PlatformRole;
  password: string;
  isActive: boolean;
  managerId: string;
}

const EMPTY_FORM: FormState = { name: "", email: "", phone: "", role: "MARKETING", password: "", isActive: true, managerId: "" };

const ROLE_BADGE: Record<PlatformRole, "destructive" | "purple" | "info"> = {
  SUPERADMIN: "destructive",
  CMO: "purple",
  MARKETING: "info",
};

function formatDate(value: string | null) {
  if (!value) return "Belum pernah";
  return new Date(value).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function TeamContent() {
  const toast = useToast();
  const [members, setMembers] = React.useState<Member[]>([]);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Member | null>(null);
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [showPassword, setShowPassword] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const [deleteTarget, setDeleteTarget] = React.useState<Member | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/god-mode/team", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memuat tim platform.");
      setMembers(data.members);
      setCurrentUserId(data.currentUserId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat tim platform.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowPassword(false);
    setDialogOpen(true);
  }

  function openEdit(m: Member) {
    setEditing(m);
    setForm({ name: m.name, email: m.email, phone: m.phone || "", role: m.role, password: "", isActive: m.isActive, managerId: m.managerId || "" });
    setShowPassword(false);
    setDialogOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch(editing ? `/api/god-mode/team/${editing.id}` : "/api/god-mode/team", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editing
            ? { name: form.name, phone: form.phone, role: form.role, isActive: form.isActive, password: form.password, managerId: form.role === "MARKETING" ? form.managerId || null : null }
            : { name: form.name, email: form.email, phone: form.phone, role: form.role, password: form.password, managerId: form.role === "MARKETING" ? form.managerId || null : null }
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan akun tim.");
      toast.success(editing ? `Akun ${form.name} diperbarui.` : `Akun ${form.name} dibuat. Bagikan email & password-nya secara pribadi.`);
      setDialogOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan akun tim.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(m: Member) {
    try {
      const res = await fetch(`/api/god-mode/team/${m.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !m.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengubah status akun.");
      toast.success(`${m.name} ${m.isActive ? "dinonaktifkan" : "diaktifkan kembali"}.`);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengubah status akun.");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/god-mode/team/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus akun tim.");
      toast.success(data.message || "Akun tim dihapus.");
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus akun tim.");
    } finally {
      setDeleting(false);
    }
  }

  const visible = members.slice((page - 1) * pageSize, page * pageSize);
  const marketingCount = members.filter((m) => m.role === "MARKETING" && m.isActive).length;
  const cmoCount = members.filter((m) => m.role === "CMO" && m.isActive).length;
  const cmoOptions = members.filter((m) => m.role === "CMO" && (m.isActive || m.id === form.managerId) && m.id !== editing?.id);

  return (
    <GodPageFrame
      active="/god-mode/team"
      title="Tim Platform"
      actions={
        <Button onClick={openCreate} className="flex h-10 items-center gap-1.5 px-4 text-xs font-bold">
          <Plus size={16} />
          <span className="max-sm:hidden">Tambah Akun</span>
        </Button>
      }
    >
      <div className="w-full space-y-8 pb-20">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#111413]">Tim Platform</h1>
          <p className="text-sm text-[#525854]">
            Akun internal rigspace.id. Marketing hanya melihat dashboard & tenant yang ditugaskan kepadanya — tanpa keuangan, tanpa masuk CMS toko.
          </p>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="border-b border-[#e5e5e2] p-5">
            <CardTitle className="flex items-center gap-2 text-base">
              <UsersRound size={18} className="text-[#cc252b]" />
              Daftar Akun ({members.length})
            </CardTitle>
            <CardDescription>
              {cmoCount} CMO & {marketingCount} marketing aktif. Tenant dipindahkan dari menu Daftar Tenant Toko → tombol Pindahkan ke Marketing.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#fcfcfc]">
                    <TableHead className="px-6 py-3.5">Nama & Email</TableHead>
                    <TableHead className="px-6 py-3.5">Peran & Tim</TableHead>
                    <TableHead className="px-6 py-3.5">Tenant</TableHead>
                    <TableHead className="px-6 py-3.5">Login Terakhir</TableHead>
                    <TableHead className="px-6 py-3.5">Status</TableHead>
                    <TableHead className="px-6 py-3.5 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center text-sm text-[#818779]">
                        Memuat data...
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center text-sm text-red-600">
                        {error}
                      </TableCell>
                    </TableRow>
                  ) : visible.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center text-sm text-[#818779]">
                        Belum ada akun tim. Tambahkan akun marketing pertama Anda.
                      </TableCell>
                    </TableRow>
                  ) : (
                    visible.map((m) => {
                      const isSelf = m.id === currentUserId;
                      return (
                        <TableRow key={m.id}>
                          <TableCell className="px-6 py-4">
                            <div className="text-sm font-bold text-[#111413]">
                              {m.name} {isSelf && <span className="text-xs font-semibold text-[#818779]">(Anda)</span>}
                            </div>
                            <div className="text-xs text-[#818779]">{m.email}</div>
                            {m.phone && <div className="text-xs text-[#818779]">{m.phone}</div>}
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <Badge variant={ROLE_BADGE[m.role]}>{PLATFORM_ROLE_LABEL[m.role]}</Badge>
                            <div className="mt-1 text-xs text-[#818779]">
                              {m.role === "CMO"
                                ? `${m._count.reports} anggota tim`
                                : m.role === "MARKETING"
                                  ? m.manager
                                    ? `Atasan: ${m.manager.name}`
                                    : "Tanpa atasan CMO"
                                  : "Akses penuh"}
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-sm font-bold text-[#111413]">{m._count.acquiredTenants}</TableCell>
                          <TableCell className="px-6 py-4 text-xs text-[#525854]">{formatDate(m.lastLoginAt)}</TableCell>
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={m.isActive}
                                disabled={isSelf}
                                onCheckedChange={() => handleToggleActive(m)}
                              />
                              <Badge variant={m.isActive ? "success" : "secondary"}>{m.isActive ? "Aktif" : "Nonaktif"}</Badge>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center justify-end gap-1.5">
                              <button type="button" className="admin-action-btn" title="Edit akun" onClick={() => openEdit(m)}>
                                <HugeIconEdit size={16} />
                              </button>
                              {!isSelf && (
                                <button type="button" className="admin-action-btn delete" title="Hapus akun" onClick={() => setDeleteTarget(m)}>
                                  <HugeIconTrash size={16} />
                                </button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            <AdminPagination
              currentPage={page}
              totalPages={Math.ceil(members.length / pageSize) || 1}
              totalItems={members.length}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen} dismissible={!saving}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Akun Tim" : "Tambah Akun Tim"}</DialogTitle>
            <DialogDescription>
              {editing ? "Kosongkan password bila tidak ingin menggantinya." : "Akun marketing bisa langsung login di /god-mode/login."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label htmlFor="team-name">Nama Lengkap *</Label>
              <Input id="team-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="mis. Rina Marketing" required />
            </div>
            <div>
              <Label htmlFor="team-email">Email Login *</Label>
              <Input
                id="team-email"
                type="email"
                value={form.email}
                disabled={Boolean(editing)}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="nama@rigspace.id"
                required
              />
              {editing && <p className="admin-form-hint mt-1">Email tidak bisa diubah. Buat akun baru bila email berganti.</p>}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="team-phone">No. WhatsApp</Label>
                <Input id="team-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="628xxxxxxxxxx" />
              </div>
              <div>
                <Label htmlFor="team-role">Peran</Label>
                <Select
                  id="team-role"
                  value={form.role}
                  disabled={editing?.id === currentUserId}
                  onChange={(e) => setForm({ ...form, role: e.target.value as PlatformRole })}
                >
                  <option value="MARKETING">Marketing — tenant sendiri saja</option>
                  <option value="CMO">CMO — tenant sendiri + tenant timnya</option>
                  <option value="SUPERADMIN">Superadmin — akses penuh</option>
                </Select>
              </div>
            </div>
            {form.role === "MARKETING" && (
              <div>
                <Label htmlFor="team-manager">Atasan (CMO)</Label>
                <Select id="team-manager" value={form.managerId} onChange={(e) => setForm({ ...form, managerId: e.target.value })}>
                  <option value="">— Tanpa atasan CMO —</option>
                  {cmoOptions.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                      {m.isActive ? "" : " (nonaktif)"}
                    </option>
                  ))}
                </Select>
                <p className="admin-form-hint mt-1">
                  {cmoOptions.length === 0
                    ? "Belum ada akun CMO aktif. Buat akun dengan peran CMO dulu."
                    : "CMO atasan bisa memantau semua tenant milik marketing ini."}
                </p>
              </div>
            )}
            {form.role === "CMO" && editing && editing.role === "CMO" && editing._count.reports > 0 && (
              <p className="admin-form-hint">CMO ini memimpin {editing._count.reports} marketing.</p>
            )}
            {editing?.role === "CMO" && form.role !== "CMO" && editing._count.reports > 0 && (
              <p className="text-xs text-red-600">
                Mengubah peran akan melepas {editing._count.reports} marketing dari tim CMO ini.
              </p>
            )}
            <div>
              <Label htmlFor="team-password">{editing ? "Password Baru" : "Password *"}</Label>
              <div className="admin-password-wrapper">
                <Input
                  id="team-password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={editing ? "Biarkan kosong bila tidak diganti" : "Minimal 8 karakter"}
                  autoComplete="new-password"
                  className="pr-10"
                  required={!editing}
                />
                <button
                  type="button"
                  className="admin-password-toggle-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="admin-form-hint mt-1">Minimal 8 karakter. Bagikan ke anggota tim secara pribadi, jangan lewat grup.</p>
            </div>
            {form.role === "SUPERADMIN" && (
              <p className="text-xs text-red-600">Superadmin bisa melihat keuangan, mengubah paket, menghapus tenant, dan masuk CMS semua toko.</p>
            )}
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                Batal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Buat Akun"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus Akun Tim?"
        description={
          deleteTarget && deleteTarget._count.acquiredTenants > 0
            ? `"${deleteTarget.name}" masih memegang ${deleteTarget._count.acquiredTenants} tenant, jadi akun hanya akan dinonaktifkan. Pindahkan tenantnya dulu bila ingin menghapus permanen.`
            : `Yakin menghapus akun "${deleteTarget?.name}"? Tindakan ini tidak dapat dibatalkan.`
        }
        confirmLabel={deleteTarget && deleteTarget._count.acquiredTenants > 0 ? "Ya, Nonaktifkan" : "Ya, Hapus"}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </GodPageFrame>
  );
}

export default function GodModeTeamPage() {
  return (
    <ToastProvider>
      <TeamContent />
    </ToastProvider>
  );
}
