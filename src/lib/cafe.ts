import "server-only";
import { all, one, run } from "./db";
import { parseTheme, type Theme } from "./theme";

export const CHANNELS = { whatsapp: "WhatsApp", telegram: "Telegram", call: "Llamada" } as const;
export type Channel = keyof typeof CHANNELS;

export const PAYMENTS = ["Efectivo", "Transfermóvil", "EnZona", "Divisas", "Tarjeta"] as const;
export const CURRENCIES = ["CUP", "USD", "MLC", "EUR"] as const;

export type Cafe = {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  about: string;
  address: string;
  mapUrl: string;
  hours: string;
  whatsapp: string;
  telegram: string;
  phone: string;
  channels: Channel[];
  payments: string[];
  currency: string;
  noticeOn: boolean;
  noticeText: string;
  theme: Theme;
  logoId: number | null;
  heroId: number | null;
  published: boolean;
  updatedAt: string;
};

export type Category = { id: number; name: string; position: number };
export type Product = {
  id: number;
  categoryId: number;
  name: string;
  description: string;
  price: number | null;
  available: boolean;
  featured: boolean;
  imageId: number | null;
  position: number;
};

type CafeRow = Record<string, unknown>;

function list<T extends string>(raw: unknown, allowed: readonly T[]): T[] {
  try {
    const v = JSON.parse(String(raw));
    return Array.isArray(v) ? v.filter((x): x is T => allowed.includes(x)) : [];
  } catch {
    return [];
  }
}

function toCafe(r: CafeRow): Cafe {
  return {
    id: Number(r.id),
    slug: String(r.slug),
    name: String(r.name),
    tagline: String(r.tagline),
    about: String(r.about),
    address: String(r.address),
    mapUrl: String(r.map_url),
    hours: String(r.hours),
    whatsapp: String(r.whatsapp),
    telegram: String(r.telegram),
    phone: String(r.phone),
    channels: list(r.channels, Object.keys(CHANNELS) as Channel[]),
    payments: list(r.payments, PAYMENTS as unknown as string[]),
    currency: String(r.currency),
    noticeOn: Number(r.notice_on) === 1,
    noticeText: String(r.notice_text),
    theme: parseTheme(r.theme),
    logoId: r.logo_id == null ? null : Number(r.logo_id),
    heroId: r.hero_id == null ? null : Number(r.hero_id),
    published: Number(r.published) === 1,
    updatedAt: String(r.updated_at),
  };
}

export async function cafeBySlug(slug: string) {
  const r = await one<CafeRow>("SELECT * FROM cafes WHERE slug = ?", [slug]);
  return r ? toCafe(r) : null;
}
export async function cafeById(id: number) {
  const r = await one<CafeRow>("SELECT * FROM cafes WHERE id = ?", [id]);
  return r ? toCafe(r) : null;
}
export async function allCafes() {
  return (await all<CafeRow>("SELECT * FROM cafes ORDER BY name")).map(toCafe);
}

export async function menuOf(cafeId: number) {
  const cats = await all<CafeRow>("SELECT id, name, position FROM categories WHERE cafe_id = ? ORDER BY position, id", [cafeId]);
  const prods = await all<CafeRow>("SELECT * FROM products WHERE cafe_id = ? ORDER BY position, id", [cafeId]);
  const categories: Category[] = cats.map((c) => ({ id: Number(c.id), name: String(c.name), position: Number(c.position) }));
  const products: Product[] = prods.map((p) => ({
    id: Number(p.id),
    categoryId: Number(p.category_id),
    name: String(p.name),
    description: String(p.description),
    price: p.price == null ? null : Number(p.price),
    available: Number(p.available) === 1,
    featured: Number(p.featured) === 1,
    imageId: p.image_id == null ? null : Number(p.image_id),
    position: Number(p.position),
  }));
  return { categories, products };
}

export async function touch(cafeId: number) {
  await run("UPDATE cafes SET updated_at = datetime('now') WHERE id = ?", [cafeId]);
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

/** Counts a visit; `source` is "qr" or "qr:<table>" when the visitor came from a printed code, else "web". */
export async function countVisit(cafeId: number, source: string) {
  await run(
    `INSERT INTO visits (cafe_id, day, source, count) VALUES (?, ?, ?, 1)
     ON CONFLICT (cafe_id, day, source) DO UPDATE SET count = count + 1`,
    [cafeId, today(), source.slice(0, 40)],
  );
}

export async function visitStats(cafeId: number, days = 14) {
  const since = new Date(Date.now() - (days - 1) * 86400000).toISOString().slice(0, 10);
  const rows = await all<{ day: string; source: string; count: number }>(
    "SELECT day, source, count FROM visits WHERE cafe_id = ? AND day >= ? ORDER BY day",
    [cafeId, since],
  );
  const byDay = new Map<string, { qr: number; web: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - (days - 1 - i) * 86400000).toISOString().slice(0, 10);
    byDay.set(d, { qr: 0, web: 0 });
  }
  const tables = new Map<string, number>();
  for (const r of rows) {
    const slot = byDay.get(String(r.day));
    const n = Number(r.count);
    const isQr = String(r.source).startsWith("qr");
    if (slot) slot[isQr ? "qr" : "web"] += n;
    if (String(r.source).startsWith("qr:")) {
      const t = String(r.source).slice(3);
      tables.set(t, (tables.get(t) ?? 0) + n);
    }
  }
  return {
    days: [...byDay.entries()].map(([day, v]) => ({ day, ...v })),
    tables: [...tables.entries()].sort((a, b) => b[1] - a[1]),
  };
}

export function mediaUrl(id: number | null) {
  return id == null ? null : `/media/${id}`;
}
