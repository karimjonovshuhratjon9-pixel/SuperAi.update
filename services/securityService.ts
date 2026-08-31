import { User } from "../types";
import { dbService } from "./dbService";

// ================= PASSWORD HASHING =================
// Web Crypto API based SHA-256 hashing with salt
export async function hashPassword(
  password: string,
  salt?: string,
): Promise<{ hash: string; salt: string }> {
  const useSalt = salt || generateSalt();
  const data = `${useSalt}:${password}`;
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(data),
  );
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return { hash: hashHex, salt: useSalt };
}

export function generateSalt(length = 16): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, (v) => chars[v % chars.length]).join("");
}

export async function verifyPassword(
  password: string,
  hash: string,
  salt: string,
): Promise<boolean> {
  const { hash: computedHash } = await hashPassword(password, salt);
  return computedHash === hash;
}

// ================= SESSION MANAGEMENT =================
const SESSION_KEY = "superai_session_v2";
const SESSION_TOKEN_KEY = "superai_session_token";

export interface SessionData {
  userId: string;
  token: string;
  createdAt: number;
  expiresAt: number;
  userAgent?: string;
}

export function createSession(user: User): SessionData {
  const token = generateSessionToken();
  const session: SessionData = {
    userId: user.id,
    token,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    userAgent: navigator.userAgent,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.setItem(SESSION_TOKEN_KEY, token);
  return session;
}

export function getSession(): SessionData | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as SessionData;
    if (session.expiresAt < Date.now()) {
      destroySession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function destroySession(): void {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_TOKEN_KEY);
}

export function isSessionValid(): boolean {
  return getSession() !== null;
}

function generateSessionToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// ================= CSRF PROTECTION =================
const CSRF_KEY = "superai_csrf_token";

export function getCsrfToken(): string {
  let token = localStorage.getItem(CSRF_KEY);
  if (!token) {
    token = generateSessionToken();
    localStorage.setItem(CSRF_KEY, token);
  }
  return token;
}

export function validateCsrfToken(token: string): boolean {
  return token === getCsrfToken();
}

// ================= INPUT VALIDATION =================
export function sanitizeInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=\s*["']?[^"'>]+["']?/gi, "")
    .trim();
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password: string): {
  valid: boolean;
  message: string;
} {
  if (password.length < 8) {
    return {
      valid: false,
      message: "Parol kamida 8 belgidan iborat bo'lishi kerak",
    };
  }
  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: "Parolda kamida bitta katta harf bo'lishi kerak",
    };
  }
  if (!/[0-9]/.test(password)) {
    return {
      valid: false,
      message: "Parolda kamida bitta raqam bo'lishi kerak",
    };
  }
  return { valid: true, message: "Parol kuchli" };
}

// ================= FILE VALIDATION =================
export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/csv",
  "text/plain",
  "application/json",
  "application/zip",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

export function validateFile(file: File): { valid: boolean; message: string } {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      message: `Fayl hajmi ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB dan oshmasligi kerak`,
    };
  }
  if (
    !ALLOWED_FILE_TYPES.includes(file.type) &&
    !isAllowedExtension(file.name)
  ) {
    return { valid: false, message: "Fayl turi ruxsat etilmagan" };
  }
  return { valid: true, message: "Fayl yaroqli" };
}

function isAllowedExtension(filename: string): boolean {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const allowed = [
    "pdf",
    "doc",
    "docx",
    "xls",
    "xlsx",
    "ppt",
    "pptx",
    "csv",
    "txt",
    "json",
    "zip",
    "png",
    "jpg",
    "jpeg",
    "webp",
    "gif",
    "svg",
    "js",
    "ts",
    "tsx",
    "jsx",
    "py",
    "html",
    "css",
    "md",
  ];
  return allowed.includes(ext);
}

// ================= RATE LIMITING =================
const RATE_LIMIT_KEY = "superai_rate_limits";

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

export function checkRateLimit(action: string, maxPerMinute = 30): boolean {
  try {
    const raw = localStorage.getItem(RATE_LIMIT_KEY);
    const limits: Record<string, RateLimitEntry> = raw ? JSON.parse(raw) : {};
    const now = Date.now();
    const entry = limits[action];

    if (!entry || now - entry.windowStart > 60_000) {
      limits[action] = { count: 1, windowStart: now };
      localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(limits));
      return true;
    }

    if (entry.count >= maxPerMinute) {
      return false;
    }

    entry.count++;
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(limits));
    return true;
  } catch {
    return true;
  }
}

// ================= AUDIT LOGGING =================
export async function logAuditAction(
  userId: string,
  action: string,
  details: Record<string, any> = {},
): Promise<void> {
  try {
    await dbService.saveAuditLog({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      userId,
      action,
      details,
      timestamp: Date.now(),
    });
  } catch {
    /* audit log failure should not break app */
  }
}

// ================= SECURE STORAGE =================
// API keys stored with obfuscation (not plaintext)
const STORAGE_PREFIX = "sa_enc_";

export function secureStore(key: string, value: string): void {
  try {
    const encoded = btoa(unescape(encodeURIComponent(value)));
    localStorage.setItem(STORAGE_PREFIX + key, encoded);
  } catch {
    /* ignore */
  }
}

export function secureGet(key: string): string {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return "";
    return decodeURIComponent(escape(atob(raw)));
  } catch {
    return "";
  }
}

export function secureRemove(key: string): void {
  localStorage.removeItem(STORAGE_PREFIX + key);
}

// ================= AUTH SERVICE =================
export async function registerUser(
  name: string,
  email: string,
  password: string,
): Promise<{ success: boolean; message: string; user?: User }> {
  if (!validateEmail(email)) {
    return { success: false, message: "Email manzili noto'g'ri" };
  }
  const pwCheck = validatePassword(password);
  if (!pwCheck.valid) {
    return { success: false, message: pwCheck.message };
  }

  const existing = await dbService.getUserByEmail(email);
  if (existing) {
    return {
      success: false,
      message: "Bu email bilan hisob allaqachon mavjud",
    };
  }

  const { hash, salt } = await hashPassword(password);
  const user: User = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    name,
    email,
    passwordHash: `${salt}:${hash}`,
    role: "user",
    plan: "FREE",
    xp: 0,
    level: 1,
    streak: 0,
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
    emailVerified: false,
    language: "uz",
    theme: "dark",
    aiPreferences: {
      defaultModel: "gemini",
      temperature: 0.7,
      responseLength: "medium",
      memoryEnabled: true,
      webSearchEnabled: false,
      autoTools: true,
    },
    notificationPreferences: {
      email: true,
      browser: true,
      system: true,
    },
    privacySettings: {
      chatHistory: true,
      memory: true,
      dataControls: true,
    },
  };

  await dbService.saveUser(user);
  await logAuditAction(user.id, "user.register", { email });

  return {
    success: true,
    message: "Hisob muvaffaqiyatli yaratildi!",
    user,
  };
}

export async function loginUser(
  email: string,
  password: string,
): Promise<{ success: boolean; message: string; user?: User }> {
  const user = await dbService.getUserByEmail(email);
  if (!user) {
    return { success: false, message: "Email yoki parol noto'g'ri" };
  }

  if (user.isSuspended) {
    return { success: false, message: "Hisobingiz vaqtincha bloklangan" };
  }

  const [salt, hash] = (user.passwordHash || "").split(":");
  if (!salt || !hash) {
    return { success: false, message: "Hisob paroli sozlanmagan" };
  }

  const valid = await verifyPassword(password, hash, salt);
  if (!valid) {
    return { success: false, message: "Email yoki parol noto'g'ri" };
  }

  user.lastLoginAt = Date.now();
  await dbService.saveUser(user);
  createSession(user);
  await logAuditAction(user.id, "user.login", { email });

  return { success: true, message: "Tizimga muvaffaqiyatli kirdingiz!", user };
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<{ success: boolean; message: string }> {
  const user = await dbService.getUser(userId);
  if (!user) return { success: false, message: "Foydalanuvchi topilmadi" };

  const [salt, hash] = (user.passwordHash || "").split(":");
  if (!salt || !hash) return { success: false, message: "Parol sozlanmagan" };

  const valid = await verifyPassword(currentPassword, hash, salt);
  if (!valid) return { success: false, message: "Joriy parol noto'g'ri" };

  const pwCheck = validatePassword(newPassword);
  if (!pwCheck.valid) return { success: false, message: pwCheck.message };

  const { hash: newHash, salt: newSalt } = await hashPassword(newPassword);
  user.passwordHash = `${newSalt}:${newHash}`;
  await dbService.saveUser(user);
  await logAuditAction(userId, "user.password_change");

  return { success: true, message: "Parol muvaffaqiyatli o'zgartirildi!" };
}

export async function resetPassword(
  email: string,
  newPassword: string,
): Promise<{ success: boolean; message: string }> {
  const user = await dbService.getUserByEmail(email);
  if (!user) return { success: false, message: "Email topilmadi" };

  const pwCheck = validatePassword(newPassword);
  if (!pwCheck.valid) return { success: false, message: pwCheck.message };

  const { hash, salt } = await hashPassword(newPassword);
  user.passwordHash = `${salt}:${hash}`;
  await dbService.saveUser(user);
  await logAuditAction(user.id, "user.password_reset");

  return { success: true, message: "Parol muvaffaqiyatli tiklandi!" };
}

export async function logoutUser(userId: string): Promise<void> {
  await logAuditAction(userId, "user.logout");
  destroySession();
}
