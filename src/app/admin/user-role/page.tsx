"use client";

import * as React from "react";
import {
  Users,
  ShieldCheck,
  Plus,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  SlidersHorizontal,
  UserCheck,
  LayoutDashboard,
  Package,
  FolderTree,
  Image as ImageIcon,
  Wrench,
  MessageSquare,
  Settings,
} from "lucide-react";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/admin/ui/tabs";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/admin/ui/dialog";
import { Switch } from "@/components/admin/ui/switch";
import { AdminPagination } from "@/components/admin/ui/pagination";
import { HugeIconEdit, HugeIconTrash } from "@/components/admin/ui/huge-icons";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { useCan } from "@/components/admin/permissions";
import { useToast } from "@/components/admin/ui/toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

// ==========================================================
// SMALL LOCAL HELPERS (built on the standard admin components)
// ==========================================================
function StatCard({
  label,
  value,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone?: "neutral" | "success" | "accent";
}) {
  const toneClass =
    tone === "success"
      ? "bg-[#dcfce7] text-[#15803d]"
      : tone === "accent"
      ? "bg-[#fee2e2] text-[#cc252b]"
      : "bg-[#f1f3ed] text-[#111413]";

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#525854] uppercase tracking-wider">
            {label}
          </span>
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${toneClass}`}>
            {icon}
          </div>
        </div>
        <div className="mt-3 text-2xl font-black text-[#111413]">{value}</div>
      </CardContent>
    </Card>
  );
}

function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [visible, setVisible] = React.useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? "text" : "password"}
        required
        autoComplete="new-password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ paddingRight: "40px" }}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="admin-action-btn"
        style={{ position: "absolute", right: "4px", top: "50%", transform: "translateY(-50%)" }}
        aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
      >
        {visible ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}


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

const GROUP_ICONS: Record<string, React.ReactNode> = {
  dashboard: <LayoutDashboard size={16} />,
  products: <Package size={16} />,
  categories_brands: <FolderTree size={16} />,
  banners: <ImageIcon size={16} />,
  services: <Wrench size={16} />,
  inquiries: <MessageSquare size={16} />,
  settings: <Settings size={16} />,
  users_roles: <Users size={16} />,
};

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

const PERMISSION_LABELS: Record<string, string> = Object.fromEntries(
  PERMISSION_GROUPS.flatMap((g) => g.items.map((i) => [i.key, i.label] as const))
);

export default function UserRolePage() {
  const can = useCan();
  const canManageUsers = can("users:manage");
  const canManageRoles = can("roles:manage");
  const toast = useToast();
  const [activeTab, setActiveTab] = React.useState<"users" | "roles">("users");

  // Data states
  const [users, setUsers] = React.useState<any[]>([]);
  const [roles, setRoles] = React.useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = React.useState(true);
  const [loadingRoles, setLoadingRoles] = React.useState(true);
  const [usersPage, setUsersPage] = React.useState(1);
  const [usersPageSize, setUsersPageSize] = React.useState(10);

  // User Modal State
  const [isUserModalOpen, setIsUserModalOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<any | null>(null);
  const [userForm, setUserForm] = React.useState({
    name: "",
    email: "",
    password: "",
    roleId: "",
    isActive: true,
  });
  const [submittingUser, setSubmittingUser] = React.useState(false);

  // Reset Password Modal State
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = React.useState(false);
  const [resetTargetUser, setResetTargetUser] = React.useState<any | null>(null);
  const [newPassword, setNewPassword] = React.useState("");
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
        isActive: user.isActive !== undefined ? Boolean(user.isActive) : true,
      });
    } else {
      setEditingUser(null);
      setUserForm({
        name: "",
        email: "",
        password: "",
        roleId: roles.find((r) => r.slug === "customer_service" || r.slug === "admin_katalog")?.id || roles[0]?.id || "",
        isActive: true,
      });
    }
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
      if (editingUser) {
        payload.isActive = userForm.isActive;
      }
      if (!editingUser) {
        payload.password = userForm.password;
        payload.isActive = true;
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
  const pagedUsers = users.slice((usersPage - 1) * usersPageSize, usersPage * usersPageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-[#111413] tracking-tight">User & Role</h2>
        <p className="text-sm text-[#525854] mt-1">
          Kelola staf pengelola toko dan atur hak akses (Role-Based Access Control) secara granular.
        </p>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Pengguna" value={`${users.length} Akun`} icon={<Users size={18} />} />
        <StatCard
          label="Pengguna Aktif"
          value={`${activeUsersCount} Aktif`}
          icon={<UserCheck size={18} />}
          tone="success"
        />
        <StatCard
          label="Pilihan Role"
          value={`${roles.length} Role`}
          icon={<ShieldCheck size={18} />}
          tone="accent"
        />
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "users" | "roles")}>
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users size={14} />
            <span>Daftar Pengguna ({users.length})</span>
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <ShieldCheck size={14} />
            <span>Role & Hak Akses ({roles.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* ==========================================================
            TAB 1: DAFTAR PENGGUNA
            ========================================================== */}
        <TabsContent value="users" className="space-y-4">
          {canManageUsers && (
            <div className="flex justify-end">
              <Button onClick={() => handleOpenUserModal()} className="flex items-center gap-1.5">
                <Plus size={16} />
                <span>Tambah Pengguna</span>
              </Button>
            </div>
          )}

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pengguna</TableHead>
                  <TableHead>Email Login</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status Akun</TableHead>
                  <TableHead>Terakhir Login</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingUsers ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-[#525854]">
                      Belum ada akun staf. Klik &quot;Tambah Pengguna&quot; untuk membuat akun baru.
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedUsers.map((u) => {
                    const roleName = u.roleRef?.name || u.role || "Staff";
                    const isOwner = u.role?.toUpperCase() === "OWNER" || u.roleRef?.slug === "owner";

                    return (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#f1f3ed] flex items-center justify-center font-bold text-xs text-[#111413] shrink-0">
                              {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-[#111413] leading-tight">{u.name}</div>
                              <div className="text-xs text-[#525854] mt-0.5">
                                Dibuat {formatDate(u.createdAt)}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-[#525854]">{u.email}</TableCell>
                        <TableCell>
                          <Badge variant={isOwner ? "default" : "secondary"}>{roleName}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.isActive ? "success" : "outline"}>
                            {u.isActive ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-[#525854]">{formatDate(u.lastLoginAt)}</TableCell>
                        <TableCell className="text-right">
                          {canManageUsers ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setResetTargetUser(u);
                                setNewPassword("");
                                setIsResetPasswordModalOpen(true);
                              }}
                              className="admin-action-btn"
                              title="Reset Password"
                            >
                              <KeyRound size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenUserModal(u)}
                              className="admin-action-btn"
                              title="Edit Pengguna"
                            >
                              <HugeIconEdit size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteUserTarget(u)}
                              className="admin-action-btn delete"
                              title={isOwner ? "Akun owner tidak dapat dihapus" : "Hapus Pengguna"}
                              disabled={isOwner}
                            >
                              <HugeIconTrash size={16} />
                            </button>
                          </div>
                          ) : (
                            <span className="text-xs text-[#525854]">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            <AdminPagination
              currentPage={usersPage}
              totalPages={Math.ceil(users.length / usersPageSize) || 1}
              totalItems={users.length}
              pageSize={usersPageSize}
              onPageChange={(p) => setUsersPage(p)}
              onPageSizeChange={(s) => {
                setUsersPageSize(s);
                setUsersPage(1);
              }}
              pageSizeOptions={[5, 10, 20]}
            />
          </Card>
        </TabsContent>

        {/* ==========================================================
            TAB 2: ROLE & HAK AKSES
            ========================================================== */}
        <TabsContent value="roles" className="space-y-4">
          {canManageRoles && (
            <div className="flex justify-end">
              <Button onClick={() => handleOpenRoleModal()} className="flex items-center gap-1.5">
                <Plus size={16} />
                <span>Buat Custom Role</span>
              </Button>
            </div>
          )}

          {loadingRoles ? (
            <Card>
              <CardContent className="text-center text-sm py-8">Memuat data...</CardContent>
            </Card>
          ) : roles.length === 0 ? (
            <Card>
              <CardContent className="text-center text-sm text-[#525854] py-8">
                Belum ada role terkonfigurasi.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles.map((r) => {
                const userCount = r._count?.users || 0;
                const permissionsList: string[] = Array.isArray(r.permissions) ? r.permissions : [];
                const isAllPermissions = permissionsList.includes("*") || r.slug === "owner";

                return (
                  <Card key={r.id} className="flex flex-col">
                    <CardHeader
                      className="admin-card-header-surface p-5 border-b border-[#e5e3dd] mb-4"
                      style={{
                        backgroundColor: "var(--surface)",
                        borderBottom: "1px solid var(--border)",
                        padding: "16px 20px",
                        marginBottom: "16px",
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              minWidth: 36,
                              borderRadius: 8,
                              backgroundColor: "#ffffff",
                              border: "1px solid var(--border)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: r.isSystem ? "var(--red)" : "var(--ink)",
                              flexShrink: 0,
                            }}
                          >
                            {r.isSystem ? <ShieldCheck size={18} /> : <SlidersHorizontal size={18} />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-base text-[#111413]">{r.name}</span>
                              <Badge variant={r.isSystem ? "default" : "outline"}>
                                {r.isSystem ? "Sistem" : "Custom"}
                              </Badge>
                            </div>
                            <div className="font-mono text-xs text-[#525854] mt-0.5">{r.slug}</div>
                          </div>
                        </div>
                        <Badge variant="secondary">{userCount} Pengguna</Badge>
                      </div>
                      <CardDescription className="text-xs line-clamp-2 mt-2">
                        {r.description || "Tidak ada deskripsi tambahan."}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="p-5 pt-0 flex-1 flex flex-col justify-between gap-4">
                      <div>
                        <div className="text-xs font-semibold text-[#525854] uppercase tracking-wider mb-2">
                          Hak Akses
                        </div>
                        {isAllPermissions ? (
                          <Badge variant="default" className="inline-flex items-center gap-1.5">
                            <Sparkles size={12} />
                            <span>Akses Penuh (Super Admin)</span>
                          </Badge>
                        ) : permissionsList.length === 0 ? (
                          <span className="text-xs text-[#525854] italic">Belum ada hak akses aktif.</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {permissionsList.slice(0, 6).map((perm) => (
                              <Badge key={perm} variant="secondary" title={perm}>
                                {PERMISSION_LABELS[perm] || perm}
                              </Badge>
                            ))}
                            {permissionsList.length > 6 && (
                              <Badge variant="outline">+{permissionsList.length - 6} lainnya</Badge>
                            )}
                          </div>
                        )}
                      </div>

                      <div
                        className="admin-role-card-footer mt-4 pt-4 border-t flex items-center gap-2"
                        style={{
                          marginTop: "16px",
                          paddingTop: "16px",
                          borderTop: "1px solid var(--border)",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={r.isSystem || !canManageRoles}
                          onClick={() => handleOpenRoleModal(r)}
                          className="flex-1 flex items-center justify-center gap-1.5"
                          title={r.isSystem ? "Role sistem tidak dapat dimodifikasi" : "Edit Hak Akses"}
                        >
                          <SlidersHorizontal size={14} />
                          <span>{r.isSystem ? "Role Bawaan" : "Edit Hak Akses"}</span>
                        </Button>
                        {!r.isSystem && canManageRoles && (
                          <button
                            type="button"
                            onClick={() => setDeleteRoleTarget(r)}
                            className="admin-action-btn delete"
                            title="Hapus Role"
                          >
                            <HugeIconTrash size={16} />
                          </button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ==========================================================
          DIALOG 1: TAMBAH / EDIT USER
          ========================================================== */}
      <Dialog
        open={isUserModalOpen}
        onOpenChange={setIsUserModalOpen}
        dismissible={!submittingUser}
        style={{ maxWidth: "520px" }}
      >
        <form onSubmit={handleSaveUser}>
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit Pengguna" : "Tambah Pengguna Baru"}</DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Perbarui informasi akun staf atau ubah role-nya."
                : "Buat akun login staf baru untuk mengelola operasional toko."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="user-name">Nama Lengkap *</Label>
              <Input
                id="user-name"
                type="text"
                required
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                placeholder="e.g. Budi Santoso"
              />
            </div>

            <div>
              <Label htmlFor="user-email">Email Login *</Label>
              <Input
                id="user-email"
                type="email"
                required
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                placeholder="nama@hadicomputer.com"
              />
              <p className="text-xs text-[#525854] mt-1">
                Email ini dipakai staf untuk login ke CMS.
              </p>
            </div>

            {!editingUser && (
              <div>
                <Label htmlFor="user-password">Password Awal *</Label>
                <PasswordInput
                  id="user-password"
                  value={userForm.password}
                  onChange={(v) => setUserForm({ ...userForm, password: v })}
                  placeholder="Minimal 6 karakter"
                />
              </div>
            )}

            <div>
              <Label htmlFor="user-role">Role *</Label>
              <Select
                id="user-role"
                required
                value={userForm.roleId}
                onChange={(e) => setUserForm({ ...userForm, roleId: e.target.value })}
              >
                <option value="" disabled>
                  Pilih role...
                </option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                    {r.isSystem ? " (Sistem)" : ""}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-[#525854] mt-1">
                Menu CMS yang bisa diakses mengikuti hak akses role ini.
              </p>
            </div>

            {editingUser && !(editingUser.role?.toUpperCase() === "OWNER" || editingUser.roleRef?.slug === "owner") && (
              <div>
                <Label htmlFor="user-status">Status Akun</Label>
                <div className="flex items-center gap-2.5 mt-1.5">
                  <Switch
                    id="user-status"
                    checked={Boolean(userForm.isActive)}
                    onCheckedChange={(checked) => setUserForm({ ...userForm, isActive: checked })}
                  />
                  <span className="text-xs text-[#525854]">
                    {userForm.isActive ? "Akun Aktif (Staf dapat login ke CMS)" : "Nonaktif (Akses login ditutup)"}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
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
          </DialogFooter>
        </form>
      </Dialog>

      {/* ==========================================================
          DIALOG 2: RESET PASSWORD
          ========================================================== */}
      <Dialog
        open={isResetPasswordModalOpen}
        onOpenChange={setIsResetPasswordModalOpen}
        dismissible={!submittingReset}
      >
        <form onSubmit={handleExecuteResetPassword}>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Buat password baru untuk akun <strong>{resetTargetUser?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="reset-password">Password Baru *</Label>
              <PasswordInput
                id="reset-password"
                value={newPassword}
                onChange={setNewPassword}
                placeholder="Minimal 6 karakter"
              />
              <p className="text-xs text-[#525854] mt-1">
                Staf memakai password ini untuk login berikutnya.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsResetPasswordModalOpen(false)}
              disabled={submittingReset}
            >
              Batal
            </Button>
            <Button type="submit" disabled={submittingReset}>
              {submittingReset ? "Menyimpan..." : "Simpan Password"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* ==========================================================
          DIALOG 3: BUAT / EDIT CUSTOM ROLE
          ========================================================== */}
      <Dialog
        open={isRoleModalOpen}
        onOpenChange={setIsRoleModalOpen}
        dismissible={!submittingRole}
        className="flex flex-col"
        style={{ maxWidth: "760px", maxHeight: "90vh" }}
      >
        <form onSubmit={handleSaveRole} className="flex flex-col flex-1" style={{ minHeight: 0 }}>
          <DialogHeader>
            <DialogTitle>{editingRole ? `Edit Role: ${editingRole.name}` : "Buat Custom Role"}</DialogTitle>
            <DialogDescription>
              Tentukan modul yang boleh diakses dan dijalankan oleh staf dengan role ini.
            </DialogDescription>
          </DialogHeader>

          <div
            className="flex-1 overflow-y-auto space-y-6"
            style={{ minHeight: 0, margin: "0 -24px", padding: "4px 24px 8px" }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role-name">Nama Role *</Label>
                <Input
                  id="role-name"
                  type="text"
                  required
                  value={roleForm.name}
                  onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                  placeholder="e.g. Admin Gudang & Stok"
                />
              </div>
              <div>
                <Label htmlFor="role-desc">Deskripsi</Label>
                <Input
                  id="role-desc"
                  type="text"
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  placeholder="e.g. Menangani inventaris barang & foto"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-bold text-[#111413]">Matriks Hak Akses</div>
                  <p className="text-xs text-[#525854]">Centang aksi yang diizinkan untuk role ini.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const allKeys = PERMISSION_GROUPS.flatMap((g) => g.items.map((i) => i.key));
                      setRoleForm({ ...roleForm, permissions: allKeys });
                    }}
                  >
                    Pilih Semua
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setRoleForm({ ...roleForm, permissions: [] })}
                  >
                    Kosongkan
                  </Button>
                </div>
              </div>

              {PERMISSION_GROUPS.map((group) => {
                const groupKeys = group.items.map((i) => i.key);
                const isGroupAllSelected = groupKeys.every((k) => roleForm.permissions.includes(k));
                const selectedCount = groupKeys.filter((k) => roleForm.permissions.includes(k)).length;

                return (
                  <div key={group.id} className="admin-perm-group-card">
                    {/* Header Box with Table-Style Gray Background */}
                    <div className="admin-perm-group-header">
                      <div className="min-w-0 flex items-center gap-3">
                        <div className="admin-perm-group-icon">
                          {GROUP_ICONS[group.id] || <ShieldCheck size={16} />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#111413]">{group.title}</span>
                            <Badge
                              variant={
                                isGroupAllSelected
                                  ? "success"
                                  : selectedCount > 0
                                  ? "default"
                                  : "outline"
                              }
                            >
                              {selectedCount}/{groupKeys.length}
                            </Badge>
                          </div>
                          <p className="text-xs text-[#525854] mt-0.5">{group.desc}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="text-xs text-[#525854] hidden sm:inline font-medium">
                          {isGroupAllSelected
                            ? "Semua Aktif"
                            : selectedCount > 0
                            ? "Sebagian Aktif"
                            : "Nonaktif"}
                        </span>
                        <Switch
                          checked={isGroupAllSelected}
                          onCheckedChange={() => handleToggleGroupPermissions(group)}
                        />
                      </div>
                    </div>

                    {/* Content Body with Proper 16px Padding & Choice Cards */}
                    <div className="admin-perm-group-body grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {group.items.map((item) => {
                        const isChecked = roleForm.permissions.includes(item.key);
                        const inputId = `perm-${item.key.replace(/[^a-z0-9]/gi, "-")}`;
                        return (
                          <label
                            key={item.key}
                            htmlFor={inputId}
                            className={`admin-choice-card ${isChecked ? "active" : ""}`}
                          >
                            <input
                              id={inputId}
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleTogglePermission(item.key)}
                              className="admin-checkbox mt-0.5 shrink-0"
                            />
                            <span style={{ display: "block" }}>
                              <span
                                className="text-xs font-bold text-[#111413] leading-tight"
                                style={{ display: "block" }}
                              >
                                {item.label}
                              </span>
                              <span
                                className="text-[11px] text-[#525854]"
                                style={{ display: "block", marginTop: "2px", lineHeight: 1.45 }}
                              >
                                {item.desc}
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRoleModalOpen(false)}
              disabled={submittingRole}
            >
              Batal
            </Button>
            <Button type="submit" disabled={submittingRole}>
              {submittingRole ? "Menyimpan..." : editingRole ? "Simpan Perubahan" : "Buat Role"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* ==========================================================
          CONFIRM DIALOGS
          ========================================================== */}
      <ConfirmDialog
        open={Boolean(deleteUserTarget)}
        onOpenChange={(open) => !open && setDeleteUserTarget(null)}
        title="Hapus Pengguna?"
        description={`Apakah Anda yakin ingin menghapus akun "${deleteUserTarget?.name}" (${deleteUserTarget?.email})? Akses login pengguna ini ke CMS akan dicabut permanen.`}
        confirmLabel="Ya, Hapus Pengguna"
        onConfirm={handleExecuteDeleteUser}
        loading={deletingUser}
      />

      <ConfirmDialog
        open={Boolean(deleteRoleTarget)}
        onOpenChange={(open) => !open && setDeleteRoleTarget(null)}
        title="Hapus Custom Role?"
        description={`Apakah Anda yakin ingin menghapus role "${deleteRoleTarget?.name}"? Role hanya dapat dihapus jika tidak ada staf yang menggunakannya.`}
        confirmLabel="Ya, Hapus Role"
        onConfirm={handleExecuteDeleteRole}
        loading={deletingRole}
      />
    </div>
  );
}
