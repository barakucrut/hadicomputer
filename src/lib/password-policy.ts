/**
 * Standar password SEMUA akun (admin toko /admin & tim platform /god-mode).
 * Murni (tanpa I/O) supaya dipakai bersama API, form, dan tes.
 *
 * - 8–72 karakter (72 = batas bcrypt; sisa karakter diabaikan bcrypt, jadi ditolak).
 * - Tidak boleh hanya spasi.
 * - Tidak boleh sama dengan email / nama pengguna email.
 */
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

export const PASSWORD_RULE_TEXT = `Minimal ${PASSWORD_MIN} karakter, maksimal ${PASSWORD_MAX}, dan tidak sama dengan email.`;

/** null = lolos; string = pesan error (Bahasa Indonesia, aman ditampilkan). */
export function passwordPolicyError(password: unknown, opts: { email?: string | null } = {}): string | null {
  if (typeof password !== "string" || password.length === 0) return "Password wajib diisi.";
  if (password.trim().length === 0) return "Password tidak boleh hanya berisi spasi.";
  if (password.length < PASSWORD_MIN) return `Password minimal ${PASSWORD_MIN} karakter.`;
  // Panjang byte, bukan karakter: bcrypt memotong di 72 byte (emoji/huruf non-latin > 1 byte)
  if (new TextEncoder().encode(password).length > PASSWORD_MAX) return `Password maksimal ${PASSWORD_MAX} karakter.`;

  const email = (opts.email || "").trim().toLowerCase();
  if (email) {
    const lower = password.trim().toLowerCase();
    const localPart = email.split("@")[0];
    if (lower === email || (localPart.length >= 3 && lower === localPart)) {
      return "Password tidak boleh sama dengan email.";
    }
  }
  return null;
}

export interface PasswordChangeInput {
  currentPassword?: unknown;
  newPassword?: unknown;
  confirmPassword?: unknown;
}

/** Validasi form ubah password sendiri (sebelum cek password lama ke database). */
export function passwordChangeError(input: PasswordChangeInput, opts: { email?: string | null } = {}): string | null {
  const { currentPassword, newPassword, confirmPassword } = input;
  if (typeof currentPassword !== "string" || !currentPassword) return "Password saat ini wajib diisi.";
  const policy = passwordPolicyError(newPassword, opts);
  if (policy) return policy.replace(/^Password/, "Password baru");
  if (newPassword !== confirmPassword) return "Konfirmasi password baru tidak sesuai.";
  if (newPassword === currentPassword) return "Password baru tidak boleh sama dengan password lama.";
  return null;
}
