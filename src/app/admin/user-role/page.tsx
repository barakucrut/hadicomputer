"use client";

import * as React from "react";
import {
  Users,
  ShieldCheck,
  Plus,
  KeyRound,
  Trash2,
  Lock,
  Unlock,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  SlidersHorizontal,
  X,
  AlertTriangle,
  UserCheck,
  UserX,
  Edit2,
} from "lucide-react";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/admin/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/admin/ui/table";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { useToast } from "@/components/admin/ui/toast";

// ==========================================================
// PERMISSION MATRIX DEFINITION
// ==========================================================
interface PermissionDef {
  key: string;
  label: string;
  desc: string;
}

interface PermissionGroup {
  id: string;
  title: string;
  desc: string;
  items: PermissionDef[];
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: "dashboard",
    title: "Dashboard & Ringkasan Toko",
    desc: "Akses membaca metrik statistik performa toko dan ringkasan aktivitas.",
    items: [
      {
        key: "dashboard:view",
        label: "Lihat Dashboard",
        desc: "Melihat grafik performa, statistik produk, dan riwayat inquiry.",
      },
    ],
  },
  {
    id: "products",
    title: "Katalog Produk",
    desc: "Pengelolaan inventaris perangkat, spesifikasi, foto, dan ketersediaan.",
    items: [
      {
        key: "products:view",
        label: "Lihat Katalog",
        desc: "Melihat daftar produk, pencarian, dan detail stok.",
      },
      {
        key: "products:create",
        label: "Tambah Produk",
        desc: "Mengunggah produk baru ke etalase toko.",
      },
      {
        key: "products:edit",
        label: "Edit Produk & Stok",
        desc: "Mengubah harga, diskon, ketersediaan, dan varian spesifikasi.",
      },
      {
        key: "products:delete",
        label: "Hapus & Bulk Delete",
        desc: "Menghapus produk satuan atau menggunakan fitur bulk delete.",
      },
    ],
  },
  {
    id: "categories_brands",
    title: "Kategori & Merek Hardware",
    desc: "Klasifikasi katalog berdasarkan kategori perangkat dan brand resmi.",
    items: [
      {
        key: "categories:manage",
        label: "Kelola Kategori",
        desc: "Tambah, edit, ubah urutan, dan hapus kategori produk.",
      },
      {
        key: "brands:manage",
        label: "Kelola Merek",
        desc: "Tambah, edit nama, dan hapus merek brand hardware.",
      },
    ],
  },
  {
    id: "banners",
    title: "Banner Hero Promo",
    desc: "Kustomisasi slider visual utama di beranda etalase depan.",
    items: [
      {
        key: "banners:view",
        label: "Lihat Banner",
        desc: "Melihat daftar banner promo aktif di beranda.",
      },
      {
        key: "banners:manage",
        label: "Kelola Banner & Hotspot",
        desc: "Upload banner baru, atur urutan carousel, dan tentukan hotspot.",
      },
    ],
  },
  {
    id: "services",
    title: "Layanan & Jasa Servis",
    desc: "Daftar jasa reparasi, perawatan laptop/PC, dan estimasi biaya teknis.",
    items: [
      {
        key: "services:view",
        label: "Lihat Layanan",
        desc: "Melihat daftar jasa servis dan biaya reparasi.",
      },
      {
        key: "services:manage",
        label: "Kelola Layanan",
        desc: "Tambah, ubah estimasi tarif, deskripsi, dan hapus jasa servis.",
      },
    ],
  },
  {
    id: "inquiries",
    title: "Inquiry WhatsApp & Leads",
    desc: "Pemantauan calon pembeli yang menghubungi toko via tombol WhatsApp.",
    items: [
      {
        key: "inquiries:view",
        label: "Lihat Log & Analitik WA",
        desc: "Membuka riwayat klik konsultasi WhatsApp dan tren produk.",
      },
    ],
  },
  {
    id: "settings",
    title: "Pengaturan Toko & Identitas",
    desc: "Kustomisasi tampilan etalase, branding, nomor kontak, dan tata letak.",
    items: [
      {
        key: "settings:appearance",
        label: "Desain & Tampilan",
        desc: "Ubah pilihan template etalase, warna aksen, font, dan logo toko.",
      },
      {
        key: "settings:store_info",
        label: "Kontak & Alamat Toko",
        desc: "Ubah nomor WA konsultasi, jam operasional, alamat, dan maps.",
      },
      {
        key: "settings:sections",
        label: "Section Builder Beranda",
        desc: "Mengatur saklar tampil/sembunyi section beranda & teks sapaan.",
      },
    ],
  },
  {
    id: "users_roles",
    title: "Manajemen Tim & Hak Akses",
    desc: "Pengelolaan akun pengelola CMS toko dan konfigurasi custom role.",
    items: [
      {
        key: "users:view",
        label: "Lihat Pengguna",
        desc: "Melihat daftar pengguna pengelola CMS dan status akun.",
      },
      {
        key: "users:manage",
        label: "Kelola Pengguna",
        desc: "Tambah staf baru, ubah role, dan reset password anggota tim.",
      },
      {
        key: "roles:manage",
        label: "Kelola Custom Role",
        desc: "Membuat role baru dan mengatur checklist hak akses granular.",
      },
    ],
  },
];

export default function UserRolePage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = React.useState<"users" | "roles">("users");

  // Data states
  const [users, setUsers] = React.useState<any[]>([]);
  const [roles, setRoles] = React.useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = React.useState(true);
  const [loadingRoles, setLoadingRoles] = React.useState(true);

  // User Modal State
  const [isUserModalOpen, setIsUserModalOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<any | null>(null);
  const [userForm, setUserForm] = React.useState({
    name: "",
    email: "",
    password: "",
    roleId: "",
  });
  const [showPassword, setShowPassword] = React.useState(false);
  const [submittingUser, setSubmittingUser] = React.useState(false);

  // Reset Password Modal State
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = React.useState(false);
  const [resetTargetUser, setResetTargetUser] = React.useState<any | null>(null);
  const [newPassword, setNewPassword] = React.useState("");
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [submittingReset, setSubmittingReset] = React.useState(false);

  // Custom Role Modal State
  const [isRoleModalOpen, setIsRoleModalOpen] = React.useState(false);
  const [editingRole, setEditingRole] = React.useState<any | null>(null);
  const [roleForm, setRoleForm] = React.useState<{
    name: string;
    description: string;
    permissions: string[];
  }>({
    name: "",
    description: "",
    permissions: [],
  });
  const [submittingRole, setSubmittingRole] = React.useState(false);

  // Delete Confirmations
  const [deleteUserTarget, setDeleteUserTarget] = React.useState<any | null>(null);
  const [deletingUser, setDeletingUser] = React.useState(false);

  const [deleteRoleTarget, setDeleteRoleTarget] = React.useState<any | null>(null);
  const [deletingRole, setDeletingRole] = React.useState(false);

  // Fetch Users
  const fetchUsers = React.useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (res.ok && data.users) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error("Fetch users error:", err);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  // Fetch Roles
  const fetchRoles = React.useCallback(async () => {
    setLoadingRoles(true);
    try {
      const res = await fetch("/api/admin/roles");
      const data = await res.json();
      if (res.ok && data.roles) {
        setRoles(data.roles);
      }
    } catch (err) {
      console.error("Fetch roles error:", err);
    } finally {
      setLoadingRoles(false);
    }
  }, []);

  React.useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [fetchUsers, fetchRoles]);

  // Open User Modal (Create or Edit)
  function handleOpenUserModal(user?: any) {
    if (user) {
      setEditingUser(user);
      setUserForm({
        name: user.name || "",
        email: user.email || "",
        password: "",
        roleId: user.roleId || user.roleRef?.id || "",
      });
    } else {
      setEditingUser(null);
      setUserForm({
        name: "",
        email: "",
        password: "",
        roleId: roles.find((r) => r.slug === "customer_service" || r.slug === "admin_katalog")?.id || roles[0]?.id || "",
      });
    }
    setShowPassword(false);
    setIsUserModalOpen(true);
  }

  // Save User (POST or PUT)
  async function handleSaveUser(e: React.FormEvent) {
    e.preventDefault();
    if (!userForm.name || !userForm.email || !userForm.roleId) {
      toast.error("Nama, email, dan role wajib diisi.");
      return;
    }
    if (!editingUser && (!userForm.password || userForm.password.length < 6)) {
      toast.error("Password minimal 6 karakter untuk pengguna baru.");
      return;
    }

    setSubmittingUser(true);
    try {
      const url = editingUser ? `/api/admin/users/${editingUser.id}` : "/api/admin/users";
      const method = editingUser ? "PUT" : "POST";

      const payload: any = {
        name: userForm.name,
        email: userForm.email,
        roleId: userForm.roleId,
      };
      if (!editingUser) {
        payload.password = userForm.password;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(editingUser ? "Data pengguna berhasil diperbarui!" : "Pengguna baru berhasil ditambahkan!");
        setIsUserModalOpen(false);
        fetchUsers();
        fetchRoles();
      } else {
        toast.error(data.error || "Gagal menyimpan data pengguna.");
      }
    } catch {
      toast.error("Terjadi kesalahan saat memproses data pengguna.");
    } finally {
      setSubmittingUser(false);
    }
  }

  // Toggle User Active Status
  async function handleToggleUserStatus(user: any) {
    const nextStatus = !user.isActive;
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Akun "${user.name}" ${nextStatus ? "diaktifkan" : "dinonaktifkan"}!`);
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, isActive: nextStatus } : u))
        );
      } else {
        toast.error(data.error || "Gagal mengubah status akun.");
      }
    } catch {
      toast.error("Terjadi kesalahan koneksi.");
    }
  }

  // Execute Delete User
  async function handleExecuteDeleteUser() {
    if (!deleteUserTarget) return;
    setDeletingUser(true);
    try {
      const res = await fetch(`/api/admin/users/${deleteUserTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Pengguna "${deleteUserTarget.name}" berhasil dihapus!`);
        setDeleteUserTarget(null);
        fetchUsers();
        fetchRoles();
      } else {
        toast.error(data.error || "Gagal menghapus pengguna.");
      }
    } catch {
      toast.error("Terjadi kesalahan saat menghapus pengguna.");
    } finally {
      setDeletingUser(false);
    }
  }

  // Execute Reset Password
  async function handleExecuteResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetTargetUser) return;
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password baru minimal 6 karakter.");
      return;
    }

    setSubmittingReset(true);
    try {
      const res = await fetch(`/api/admin/users/${resetTargetUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Password untuk "${resetTargetUser.name}" berhasil direset!`);
        setIsResetPasswordModalOpen(false);
        setResetTargetUser(null);
        setNewPassword("");
      } else {
        toast.error(data.error || "Gagal mereset password.");
      }
    } catch {
      toast.error("Terjadi kesalahan saat mereset password.");
    } finally {
      setSubmittingReset(false);
    }
  }

  // Open Custom Role Modal
  function handleOpenRoleModal(role?: any) {
    if (role) {
      setEditingRole(role);
      setRoleForm({
        name: role.name || "",
        description: role.description || "",
        permissions: Array.isArray(role.permissions) ? role.permissions : [],
      });
    } else {
      setEditingRole(null);
      setRoleForm({
        name: "",
        description: "",
        permissions: ["dashboard:view", "products:view"],
      });
    }
    setIsRoleModalOpen(true);
  }

  // Toggle individual permission in role form
  function handleTogglePermission(permKey: string) {
    setRoleForm((prev) => {
      const exists = prev.permissions.includes(permKey);
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter((k) => k !== permKey)
          : [...prev.permissions, permKey],
      };
    });
  }

  // Toggle all permissions for a group
  function handleToggleGroupPermissions(group: PermissionGroup) {
    const groupKeys = group.items.map((i) => i.key);
    const allSelected = groupKeys.every((k) => roleForm.permissions.includes(k));

    setRoleForm((prev) => {
      if (allSelected) {
        return {
          ...prev,
          permissions: prev.permissions.filter((k) => !groupKeys.includes(k)),
        };
      } else {
        const set = new Set([...prev.permissions, ...groupKeys]);
        return { ...prev, permissions: Array.from(set) };
      }
    });
  }

  // Save Role
  async function handleSaveRole(e: React.FormEvent) {
    e.preventDefault();
    if (!roleForm.name.trim()) {
      toast.error("Nama role wajib diisi.");
      return;
    }

    setSubmittingRole(true);
    try {
      const url = editingRole ? `/api/admin/roles/${editingRole.id}` : "/api/admin/roles";
      const method = editingRole ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(roleForm),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(editingRole ? "Role berhasil diperbarui!" : "Custom role baru berhasil dibuat!");
        setIsRoleModalOpen(false);
        fetchRoles();
      } else {
        toast.error(data.error || "Gagal menyimpan role.");
      }
    } catch {
      toast.error("Terjadi kesalahan saat memproses data role.");
    } finally {
      setSubmittingRole(false);
    }
  }

  // Execute Delete Role
  async function handleExecuteDeleteRole() {
    if (!deleteRoleTarget) return;
    setDeletingRole(true);
    try {
      const res = await fetch(`/api/admin/roles/${deleteRoleTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Role "${deleteRoleTarget.name}" berhasil dihapus!`);
        setDeleteRoleTarget(null);
        fetchRoles();
      } else {
        toast.error(data.error || "Gagal menghapus role.");
      }
    } catch {
      toast.error("Terjadi kesalahan koneksi.");
    } finally {
      setDeletingRole(false);
    }
  }

  // Format Date Helper
  function formatDate(d?: string | null) {
    if (!d) return "-";
    try {
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(d));
    } catch {
      return "-";
    }
  }

  const activeUsersCount = users.filter((u) => u.isActive).length;

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#111413] tracking-tight">User & Role</h2>
          <p className="text-sm text-[#525854] mt-1">
            Kelola staf pengelola toko dan atur pembatasan hak akses (*Role-Based Access Control*) secara granular.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "users" ? (
            <Button
              type="button"
              onClick={() => handleOpenUserModal()}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              <span>Tambah Pengguna Baru</span>
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => handleOpenRoleModal()}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              <span>Buat Custom Role</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Metric Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-[#e5e5e2] shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f1f3ed] border border-[#e2e5dc] flex items-center justify-center text-[#111413]">
              <Users size={18} />
            </div>
            <div>
              <span className="text-xs font-semibold text-[#818779] block">Total Pengguna</span>
              <span className="text-xl font-black text-[#111413]">{users.length} Akun</span>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-[#e5e5e2] shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <UserCheck size={18} />
            </div>
            <div>
              <span className="text-xs font-semibold text-[#818779] block">Pengguna Aktif</span>
              <span className="text-xl font-black text-emerald-700">{activeUsersCount} Aktif</span>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-[#e5e5e2] shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
              <ShieldCheck size={18} />
            </div>
            <div>
              <span className="text-xs font-semibold text-[#818779] block">Pilihan Role</span>
              <span className="text-xl font-black text-purple-700">{roles.length} Role</span>
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="admin-tab-list">
        <button
          type="button"
          onClick={() => setActiveTab("users")}
          className={`admin-tab-trigger ${activeTab === "users" ? "active" : ""}`}
        >
          <Users size={15} />
          <span>Daftar Pengguna ({users.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("roles")}
          className={`admin-tab-trigger ${activeTab === "roles" ? "active" : ""}`}
        >
          <ShieldCheck size={15} />
          <span>Kelola Role & Hak Akses ({roles.length})</span>
        </button>
      </div>

      {/* ==========================================================
          TAB 1: DAFTAR PENGGUNA (USERS TABLE)
          ========================================================== */}
      {activeTab === "users" && (
        <Card className="overflow-hidden border-[#e5e5e2] shadow-sm rounded-2xl">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead style={{ width: "240px" }}>Pengguna</TableHead>
                <TableHead>Email Login</TableHead>
                <TableHead>Role / Peran</TableHead>
                <TableHead>Status Akun</TableHead>
                <TableHead>Terakhir Login</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingUsers ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-[#525854]">
                    Memuat daftar pengguna...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-[#525854]">
                    Belum ada akun staf pengelola. Klik tombol "Tambah Pengguna Baru" di atas.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => {
                  const roleName = u.roleRef?.name || u.role || "Staff";
                  const isOwner = u.role?.toUpperCase() === "OWNER" || u.roleRef?.slug === "owner";

                  return (
                    <TableRow key={u.id}>
                      {/* Name & Avatar */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#f1f3ed] border border-[#e2e5dc] flex items-center justify-center font-bold text-xs text-[#111413] shrink-0">
                            {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                          </div>
                          <div>
                            <div className="font-bold text-[#111413] text-sm leading-tight">{u.name}</div>
                            <span className="text-[11px] text-[#818779]">
                              Dibuat: {formatDate(u.createdAt)}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Email */}
                      <TableCell className="font-mono text-xs text-[#111413]">
                        {u.email}
                      </TableCell>

                      {/* Role Badge */}
                      <TableCell>
                        <Badge
                          variant={isOwner ? "default" : "secondary"}
                          className="font-bold text-xs"
                        >
                          {roleName}
                        </Badge>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => handleToggleUserStatus(u)}
                          title="Klik untuk mengubah status aktif/nonaktif"
                          className="admin-badge-btn"
                        >
                          <Badge
                            variant={u.isActive ? "success" : "outline"}
                            className="font-bold text-[11px]"
                          >
                            {u.isActive ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </button>
                      </TableCell>

                      {/* Last Login */}
                      <TableCell className="text-xs text-[#525854]">
                        {formatDate(u.lastLoginAt)}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Reset Password */}
                          <button
                            type="button"
                            onClick={() => {
                              setResetTargetUser(u);
                              setNewPassword("");
                              setShowNewPassword(false);
                              setIsResetPasswordModalOpen(true);
                            }}
                            title="Reset Password Akun"
                            className="admin-action-btn"
                          >
                            <KeyRound size={15} />
                          </button>

                          {/* Edit User Info */}
                          <button
                            type="button"
                            onClick={() => handleOpenUserModal(u)}
                            title="Edit Data Pengguna"
                            className="admin-action-btn"
                          >
                            <Edit2 size={15} />
                          </button>

                          {/* Delete User */}
                          <button
                            type="button"
                            onClick={() => setDeleteUserTarget(u)}
                            title="Hapus Pengguna"
                            className="admin-action-btn delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* ==========================================================
          TAB 2: KELOLA ROLE & HAK AKSES (ROLES GRID)
          ========================================================== */}
      {activeTab === "roles" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {loadingRoles ? (
              <div className="col-span-full h-32 flex items-center justify-center text-sm text-[#525854]">
                Memuat daftar role...
              </div>
            ) : roles.length === 0 ? (
              <div className="col-span-full h-32 flex items-center justify-center text-sm text-[#525854]">
                Belum ada role terkonfigurasi.
              </div>
            ) : (
              roles.map((r) => {
                const userCount = r._count?.users || 0;
                const permissionsList: string[] = Array.isArray(r.permissions) ? r.permissions : [];
                const isAllPermissions = permissionsList.includes("*") || r.slug === "owner";

                return (
                  <Card
                    key={r.id}
                    className="flex flex-col justify-between border-[#e5e5e2] shadow-xs rounded-2xl overflow-hidden hover:border-[#111413]/30 transition-all"
                  >
                    <CardHeader className="p-5 border-b border-[#ecece8] bg-[#fdfdfc]">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-base text-[#111413]">{r.name}</span>
                            <Badge
                              variant={r.isSystem ? "default" : "outline"}
                              className="text-[10px] font-bold"
                            >
                              {r.isSystem ? "Sistem" : "Custom Role"}
                            </Badge>
                          </div>
                          <span className="font-mono text-[11px] text-[#818779] block mt-0.5">
                            slug: {r.slug}
                          </span>
                        </div>

                        <Badge variant="secondary" className="text-[11px] font-bold">
                          {userCount} Pengguna
                        </Badge>
                      </div>

                      <CardDescription className="text-xs text-[#525854] mt-2 line-clamp-2">
                        {r.description || "Tidak ada deskripsi tambahan."}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      {/* Permissions Summary Badges */}
                      <div>
                        <span className="text-[11px] font-bold text-[#818779] uppercase tracking-wider block mb-2">
                          Hak Akses Diizinkan:
                        </span>
                        {isAllPermissions ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold">
                            <Sparkles size={13} />
                            <span>Akses Penuh Tanpa Batas (Super Admin)</span>
                          </div>
                        ) : permissionsList.length === 0 ? (
                          <span className="text-xs text-[#818779] italic">
                            Belum ada hak akses yang diaktifkan.
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {permissionsList.slice(0, 6).map((perm) => (
                              <span
                                key={perm}
                                className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#f1f3ed] text-[#252b24] border border-[#e2e5dc]"
                              >
                                {perm}
                              </span>
                            ))}
                            {permissionsList.length > 6 && (
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                                +{permissionsList.length - 6} lainnya
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-3 border-t border-[#f1f3ed] flex items-center justify-between gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={r.isSystem}
                          onClick={() => handleOpenRoleModal(r)}
                          className="flex-1 text-xs font-bold"
                          title={r.isSystem ? "Role sistem tidak dapat dimodifikasi" : "Edit Hak Akses Role"}
                        >
                          <SlidersHorizontal size={14} className="mr-1.5" />
                          <span>{r.isSystem ? "Role Bawaan" : "Edit Hak Akses"}</span>
                        </Button>

                        {!r.isSystem && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteRoleTarget(r)}
                            className="px-3"
                            title="Hapus Role"
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ==========================================================
          MODAL 1: TAMBAH / EDIT USER
          ========================================================== */}
      {isUserModalOpen && (
        <div className="admin-dialog-root" role="dialog" aria-modal="true">
          <div className="admin-dialog-backdrop" onClick={() => !submittingUser && setIsUserModalOpen(false)} />
          <div className="admin-dialog-card" style={{ maxWidth: "520px" }}>
            <div className="admin-dialog-header">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-[#111413]">
                    {editingUser ? "Edit Pengguna Toko" : "Tambah Pengguna Baru"}
                  </h3>
                  <p className="text-xs text-[#525854] mt-0.5">
                    {editingUser
                      ? "Perbarui informasi akun staf atau ubah peran tugasnya."
                      : "Buat akun login staf baru untuk mengelola operasional toko."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveUser}>
              <div className="p-6 space-y-4">
                {/* Nama Lengkap */}
                <div>
                  <label className="text-xs font-bold text-[#111413] block mb-1.5">
                    Nama Lengkap Staf *
                  </label>
                  <input
                    type="text"
                    required
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    placeholder="Contoh: Budi Santoso (Admin Katalog)"
                    className="admin-input-styled"
                  />
                </div>

                {/* Email Login */}
                <div>
                  <label className="text-xs font-bold text-[#111413] block mb-1.5">
                    Alamat Email Login *
                  </label>
                  <input
                    type="email"
                    required
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    placeholder="nama@hadicomputer.com"
                    className="admin-input-styled"
                  />
                  <span className="text-[11px] text-red-500 mt-1 block">
                    Email ini digunakan saat staf login ke halaman CMS pengelola.
                  </span>
                </div>

                {/* Password (only for new user) */}
                {!editingUser && (
                  <div>
                    <label className="text-xs font-bold text-[#111413] block mb-1.5">
                      Password Login Awal *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={userForm.password}
                        onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                        placeholder="Minimal 6 karakter"
                        className="admin-input-styled"
                        style={{ paddingRight: "40px" }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Role Assignment */}
                <div>
                  <label className="text-xs font-bold text-[#111413] block mb-1.5">
                    Tugaskan Peran / Role *
                  </label>
                  <select
                    required
                    value={userForm.roleId}
                    onChange={(e) => setUserForm({ ...userForm, roleId: e.target.value })}
                    className="admin-input-styled"
                    style={{ height: "42px" }}
                  >
                    <option value="" disabled>Pilih Role...</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} {r.isSystem ? "(Sistem)" : ""}
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] text-[#818779] mt-1 block">
                    Hak akses menu CMS akan disesuaikan secara otomatis berdasarkan role ini.
                  </span>
                </div>
              </div>

              <div className="admin-dialog-footer">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsUserModalOpen(false)}
                  disabled={submittingUser}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={submittingUser}>
                  {submittingUser ? "Menyimpan..." : editingUser ? "Simpan Perubahan" : "Buat Pengguna"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================
          MODAL 2: RESET PASSWORD PENGGUNA
          ========================================================== */}
      {isResetPasswordModalOpen && (
        <div className="admin-dialog-root" role="dialog" aria-modal="true">
          <div className="admin-dialog-backdrop" onClick={() => !submittingReset && setIsResetPasswordModalOpen(false)} />
          <div className="admin-dialog-card" style={{ maxWidth: "440px" }}>
            <div className="admin-dialog-header">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-[#111413]">Reset Password Staf</h3>
                  <p className="text-xs text-[#525854] mt-0.5">
                    Buat kata sandi baru untuk akun <strong>{resetTargetUser?.name}</strong>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsResetPasswordModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <form onSubmit={handleExecuteResetPassword}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#111413] block mb-1.5">
                    Password Baru (Minimal 6 Karakter) *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Masukkan kata sandi baru..."
                      className="admin-input-styled"
                      style={{ paddingRight: "40px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <span className="text-[11px] text-red-500 mt-1 block">
                    Staf harus menggunakan kata sandi ini untuk sesi login berikutnya.
                  </span>
                </div>
              </div>

              <div className="admin-dialog-footer">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsResetPasswordModalOpen(false)}
                  disabled={submittingReset}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={submittingReset}>
                  {submittingReset ? "Mereset..." : "Simpan Password Baru"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================
          MODAL 3: BUAT / EDIT CUSTOM ROLE
          ========================================================== */}
      {isRoleModalOpen && (
        <div className="admin-dialog-root" role="dialog" aria-modal="true">
          <div className="admin-dialog-backdrop" onClick={() => !submittingRole && setIsRoleModalOpen(false)} />
          <div className="admin-dialog-card" style={{ maxWidth: "760px", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
            <div className="admin-dialog-header">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-[#111413]">
                    {editingRole ? `Edit Custom Role: ${editingRole.name}` : "Buat Custom Role Baru"}
                  </h3>
                  <p className="text-xs text-[#525854] mt-0.5">
                    Tentukan modul apa saja yang boleh diakses dan dijalankan oleh staf dengan role ini.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveRole} style={{ display: "flex", flexDirection: "column", overflow: "hidden", flex: 1 }}>
              <div className="p-6 space-y-6 overflow-y-auto" style={{ flex: 1 }}>
                {/* Role Name & Description */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-[#ecece8]">
                  <div>
                    <label className="text-xs font-bold text-[#111413] block mb-1.5">
                      Nama Role *
                    </label>
                    <input
                      type="text"
                      required
                      value={roleForm.name}
                      onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                      placeholder="Contoh: Admin Gudang & Stok"
                      className="admin-input-styled"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#111413] block mb-1.5">
                      Deskripsi Tugas
                    </label>
                    <input
                      type="text"
                      value={roleForm.description}
                      onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                      placeholder="Contoh: Menangani inventaris barang & foto"
                      className="admin-input-styled"
                    />
                  </div>
                </div>

                {/* Modular Permission Checklist */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-[#111413]">
                        Matriks Hak Akses & Permission
                      </h4>
                      <p className="text-xs text-[#818779]">
                        Centang aksi yang diizinkan untuk role ini.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const allKeys = PERMISSION_GROUPS.flatMap((g) => g.items.map((i) => i.key));
                          setRoleForm({ ...roleForm, permissions: allKeys });
                        }}
                        className="text-xs font-bold text-red-600 hover:underline"
                      >
                        Pilih Semua
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        type="button"
                        onClick={() => setRoleForm({ ...roleForm, permissions: [] })}
                        className="text-xs font-bold text-gray-500 hover:underline"
                      >
                        Kosongkan
                      </button>
                    </div>
                  </div>

                  {/* Groups */}
                  <div className="space-y-4">
                    {PERMISSION_GROUPS.map((group) => {
                      const groupKeys = group.items.map((i) => i.key);
                      const isGroupAllSelected = groupKeys.every((k) =>
                        roleForm.permissions.includes(k)
                      );
                      const isGroupSomeSelected =
                        groupKeys.some((k) => roleForm.permissions.includes(k)) &&
                        !isGroupAllSelected;

                      return (
                        <div
                          key={group.id}
                          className="rounded-xl border border-[#e5e5e2] bg-[#fcfcfc] overflow-hidden"
                        >
                          {/* Group Header */}
                          <div className="px-4 py-3 bg-[#f7f8f4] border-b border-[#e8ebe2] flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-[#111413]">
                                  {group.title}
                                </span>
                              </div>
                              <span className="text-[11px] text-[#818779] block">
                                {group.desc}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleToggleGroupPermissions(group)}
                              className="text-[11px] font-bold text-[#525854] hover:text-[#111413] px-2 py-1 rounded bg-white border border-[#d1d5db]"
                            >
                              {isGroupAllSelected ? "Batalkan Grup" : "Pilih Grup"}
                            </button>
                          </div>

                          {/* Group Items */}
                          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white">
                            {group.items.map((item) => {
                              const isChecked = roleForm.permissions.includes(item.key);
                              return (
                                <label
                                  key={item.key}
                                  onClick={() => handleTogglePermission(item.key)}
                                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer ${
                                    isChecked
                                      ? "border-red-200 bg-red-50/30"
                                      : "border-[#f1f3ed] hover:border-gray-300"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {}} // handled by parent click
                                    className="admin-checkbox mt-0.5 shrink-0"
                                  />
                                  <div>
                                    <span className="text-xs font-bold text-[#111413] block leading-tight">
                                      {item.label}
                                    </span>
                                    <span className="text-[11px] text-[#818779] leading-snug mt-0.5 block">
                                      {item.desc}
                                    </span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="admin-dialog-footer border-t border-[#ecece8] bg-white">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsRoleModalOpen(false)}
                  disabled={submittingRole}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={submittingRole}>
                  {submittingRole ? "Menyimpan..." : editingRole ? "Simpan Perubahan Role" : "Buat Role"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================
          CONFIRM DIALOGS
          ========================================================== */}
      {/* Delete User Confirm */}
      <ConfirmDialog
        open={Boolean(deleteUserTarget)}
        onOpenChange={(open) => !open && setDeleteUserTarget(null)}
        title="Hapus Pengguna?"
        description={`Apakah Anda yakin ingin menghapus akun "${deleteUserTarget?.name}" (${deleteUserTarget?.email})? Akses login pengguna ini ke CMS toko akan dicabut permanen.`}
        confirmLabel="Ya, Hapus Pengguna"
        onConfirm={handleExecuteDeleteUser}
        loading={deletingUser}
      />

      {/* Delete Role Confirm */}
      <ConfirmDialog
        open={Boolean(deleteRoleTarget)}
        onOpenChange={(open) => !open && setDeleteRoleTarget(null)}
        title="Hapus Custom Role?"
        description={`Apakah Anda yakin ingin menghapus role "${deleteRoleTarget?.name}"? Role ini hanya dapat dihapus jika tidak ada staf aktif yang menggunakannya.`}
        confirmLabel="Ya, Hapus Role"
        onConfirm={handleExecuteDeleteRole}
        loading={deletingRole}
      />
    </div>
  );
}
