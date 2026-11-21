/** Validasi input akun tim platform (murni, bisa dites). */
import { isPlatformRole, type PlatformRole } from "./platform-access";
import { PASSWORD_MIN, passwordPolicyError } from "./password-policy";

export interface TeamMemberInput {
  name?: string;
  email?: string;
  phone?: string | null;
  role?: PlatformRole;
  isActive?: boolean;
  password?: string;
  /** Atasan CMO (hanya untuk MARKETING). null = lepas dari tim. */
  managerId?: string | null;
}

export type TeamInputResult = { ok: true; data: TeamMemberInput } | { ok: false; error: string };

/** @deprecated pakai PASSWORD_MIN dari password-policy */
export const MIN_PASSWORD_LENGTH = PASSWORD_MIN;

export function parseTeamMemberInput(body: unknown, mode: "create" | "update"): TeamInputResult {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const data: TeamMemberInput = {};

  if (mode === "create" || b.name !== undefined) {
    const name = typeof b.name === "string" ? b.name.trim().slice(0, 150) : "";
    if (name.length < 2) return { ok: false, error: "Nama wajib diisi (min. 2 karakter)." };
    data.name = name;
  }
  if (mode === "create") {
    const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 191) return { ok: false, error: "Format email tidak valid." };
    data.email = email;
  }
  if (b.phone !== undefined) {
    const phone = typeof b.phone === "string" ? b.phone.replace(/[^\d+]/g, "").slice(0, 30) : "";
    data.phone = phone || null;
  }
  if (mode === "create" || b.role !== undefined) {
    const role = b.role ?? "MARKETING";
    if (!isPlatformRole(role)) return { ok: false, error: "Peran tidak dikenal." };
    data.role = role;
  }
  if (b.isActive !== undefined) data.isActive = b.isActive === true;
  if (b.managerId !== undefined) {
    data.managerId = typeof b.managerId === "string" && b.managerId.trim() ? b.managerId.trim().slice(0, 191) : null;
  }
  if (mode === "create" || (typeof b.password === "string" && b.password !== "")) {
    const password = typeof b.password === "string" ? b.password : "";
    const policy = passwordPolicyError(password, { email: data.email });
    if (policy) return { ok: false, error: policy };
    data.password = password;
  }
  return { ok: true, data };
}

/** Kolom akun tim yang aman dikirim ke UI (tanpa passwordHash). */
export const TEAM_SELECT = {
  id: true,
  email: true,
  name: true,
  phone: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  managerId: true,
  manager: { select: { id: true, name: true } },
  _count: { select: { acquiredTenants: true, reports: true } },
} as const;

/**
 * Aturan struktur tim (murni): hanya MARKETING yang punya atasan, dan bukan dirinya sendiri.
 * Peran lain selalu dilepas dari atasan (managerId = null).
 */
export function resolveManagerId(input: {
  role: PlatformRole;
  managerId: string | null | undefined;
  selfId?: string;
}): { ok: true; managerId: string | null | undefined } | { ok: false; error: string } {
  if (input.role !== "MARKETING") return { ok: true, managerId: null };
  if (input.managerId && input.selfId && input.managerId === input.selfId) {
    return { ok: false, error: "Akun tidak bisa menjadi atasan dirinya sendiri." };
  }
  return { ok: true, managerId: input.managerId };
}
