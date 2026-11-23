import "server-only";
import { createClient, type Client, type InValue } from "@libsql/client";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { seedDemo } from "./seed";

// One SQLite file holds everything, images included, so a deploy is a single process with a single volume.
// DATABASE_URL can point at a libSQL/Turso server instead without touching the queries.

const SCHEMA = `
CREATE TABLE IF NOT EXISTS cafes (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  tagline TEXT NOT NULL DEFAULT '',
  about TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  map_url TEXT NOT NULL DEFAULT '',
  hours TEXT NOT NULL DEFAULT '',
  whatsapp TEXT NOT NULL DEFAULT '',
  telegram TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  channels TEXT NOT NULL DEFAULT '["whatsapp"]',
  payments TEXT NOT NULL DEFAULT '[]',
  currency TEXT NOT NULL DEFAULT 'CUP',
  notice_on INTEGER NOT NULL DEFAULT 0,
  notice_text TEXT NOT NULL DEFAULT '',
  theme TEXT NOT NULL DEFAULT '{}',
  logo_id INTEGER,
  hero_id INTEGER,
  published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super','owner')),
  cafe_id INTEGER REFERENCES cafes(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY,
  cafe_id INTEGER NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY,
  cafe_id INTEGER NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price REAL,
  available INTEGER NOT NULL DEFAULT 1,
  featured INTEGER NOT NULL DEFAULT 0,
  image_id INTEGER,
  position INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS media (
  id INTEGER PRIMARY KEY,
  cafe_id INTEGER NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  mime TEXT NOT NULL,
  data BLOB NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS visits (
  cafe_id INTEGER NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  source TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (cafe_id, day, source)
);
CREATE INDEX IF NOT EXISTS products_cafe ON products(cafe_id, category_id, position);
CREATE INDEX IF NOT EXISTS categories_cafe ON categories(cafe_id, position);
`;

declare global {
  var __cafeDb: Promise<Client> | undefined;
}

async function open(): Promise<Client> {
  let url = process.env.DATABASE_URL;
  if (!url) {
    const dir = path.join(process.cwd(), "data");
    mkdirSync(dir, { recursive: true });
    url = "file:" + path.join(dir, "cafe-kit.db");
  }
  const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
  await client.execute("PRAGMA foreign_keys = ON");
  if (url.startsWith("file:")) await client.execute("PRAGMA journal_mode = WAL");
  await client.executeMultiple(SCHEMA);
  const { rows } = await client.execute("SELECT COUNT(*) AS n FROM users");
  if (Number(rows[0].n) === 0) {
    if (process.env.SEED_DEMO !== "false") await seedDemo(client);
    else if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      // Real installs start empty: the first platform admin comes from the environment.
      const bcrypt = (await import("bcryptjs")).default;
      await client.execute({
        sql: "INSERT INTO users (email, name, password_hash, role) VALUES (?, 'Administración', ?, 'super')",
        args: [process.env.ADMIN_EMAIL, await bcrypt.hash(process.env.ADMIN_PASSWORD, 10)],
      });
    }
  }
  return client;
}

export function db(): Promise<Client> {
  globalThis.__cafeDb ??= open().catch((e) => {
    globalThis.__cafeDb = undefined;
    throw e;
  });
  return globalThis.__cafeDb;
}

export async function all<T>(sql: string, args: InValue[] = []): Promise<T[]> {
  const res = await (await db()).execute({ sql, args });
  return res.rows as unknown as T[];
}
export async function one<T>(sql: string, args: InValue[] = []): Promise<T | undefined> {
  return (await all<T>(sql, args))[0];
}
export async function run(sql: string, args: InValue[] = []) {
  return (await db()).execute({ sql, args });
}
