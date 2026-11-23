import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { one, run } from "./db";

// Database sessions: the cookie carries a random token, the table stores only its hash.
// Logging out or changing the password deletes the rows, so a stolen cookie stops working at once.

const COOKIE = "cafe_session";
const TTL_MS = 1000 * 60 * 60 * 24 * 14;

export type User = { id: number; email: string; name: string; role: "super" | "owner"; cafeId: number | null };

let DUMMY: string | undefined;
const sha = (s: string) => createHash("sha256").update(s).digest("hex");

export async function verifyLogin(email: string, password: string): Promise<User | null> {
  const r = await one<Record<string, unknown>>("SELECT * FROM users WHERE email = ?", [email.trim()]);
  // Compare against a dummy hash when the user does not exist so timing does not reveal valid emails.
  DUMMY ??= bcrypt.hashSync("not-a-real-password", 10);
  const ok = await bcrypt.compare(password, r ? String(r.password_hash) : DUMMY);
  if (!r || !ok) return null;
  return toUser(r);
}

function toUser(r: Record<string, unknown>): User {
  return {
    id: Number(r.id),
    email: String(r.email),
    name: String(r.name),
    role: r.role === "super" ? "super" : "owner",
    cafeId: r.cafe_id == null ? null : Number(r.cafe_id),
  };
}

export async function startSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expires = Date.now() + TTL_MS;
  await run("DELETE FROM sessions WHERE expires_at < ?", [Date.now()]);
  await run("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)", [sha(token), userId, expires]);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.INSECURE_COOKIES !== "true",
    path: "/",
    expires: new Date(expires),
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await run("DELETE FROM sessions WHERE token_hash = ?", [sha(token)]);
  jar.delete(COOKIE);
}

export const currentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const r = await one<Record<string, unknown>>(
    `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?`,
    [sha(token), Date.now()],
  );
  return r ? toUser(r) : null;
});

export async function requireUser(): Promise<User> {
  const u = await currentUser();
  if (!u) redirect("/entrar");
  return u;
}

export async function requireSuper(): Promise<User> {
  const u = await requireUser();
  if (u.role !== "super") redirect("/panel");
  return u;
}

/**
 * The café the panel is editing. Owners always get their own; the platform admin picks one
 * through the `cafe` cookie set from the Negocios page.
 */
export async function requireCafeId(): Promise<{ user: User; cafeId: number }> {
  const user = await requireUser();
  if (user.role === "owner") {
    if (user.cafeId == null) redirect("/entrar");
    return { user, cafeId: user.cafeId };
  }
  const picked = Number((await cookies()).get("cafe_admin_pick")?.value);
  if (picked) {
    const exists = await one("SELECT id FROM cafes WHERE id = ?", [picked]);
    if (exists) return { user, cafeId: picked };
  }
  const first = await one<{ id: number }>("SELECT id FROM cafes ORDER BY name LIMIT 1");
  if (!first) redirect("/panel/negocios");
  return { user, cafeId: Number(first.id) };
}

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}

export async function changePassword(userId: number, current: string, next: string) {
  const r = await one<{ password_hash: string }>("SELECT password_hash FROM users WHERE id = ?", [userId]);
  if (!r || !(await bcrypt.compare(current, String(r.password_hash)))) return false;
  await run("UPDATE users SET password_hash = ? WHERE id = ?", [await hashPassword(next), userId]);
  await run("DELETE FROM sessions WHERE user_id = ?", [userId]);
  return true;
}

// Small in-memory brake on password guessing; enough for a single-process deploy.
const attempts = new Map<string, { n: number; until: number }>();
export function loginAllowed(key: string) {
  const a = attempts.get(key);
  return !a || a.until < Date.now() || a.n < 5;
}
export function loginFailed(key: string) {
  const a = attempts.get(key);
  const fresh = !a || a.until < Date.now();
  attempts.set(key, { n: fresh ? 1 : a!.n + 1, until: Date.now() + 10 * 60 * 1000 });
}
export function loginSucceeded(key: string) {
  attempts.delete(key);
}
