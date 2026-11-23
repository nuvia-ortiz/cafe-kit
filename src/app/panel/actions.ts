"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { all, db, one, run } from "@/lib/db";
import { changePassword, hashPassword, requireCafeId, requireSuper, requireUser } from "@/lib/auth";
import { CHANNELS, CURRENCIES, PAYMENTS, touch } from "@/lib/cafe";
import { parseTheme } from "@/lib/theme";
import { slugify } from "@/lib/order";

// Every action re-checks the session and scopes writes to the café the user may edit:
// the browser never decides which café a row belongs to.

export type Result = { ok?: string; error?: string };

function refresh() {
  revalidatePath("/", "layout");
}

const text = (max: number) => z.string().trim().max(max);

// ---------- business details ----------

const Business = z.object({
  name: text(60).min(2, "El nombre es muy corto"),
  tagline: text(120),
  about: text(800),
  address: text(160),
  mapUrl: z.union([z.literal(""), z.url({ protocol: /^https?$/, error: "El enlace del mapa no es válido" })]),
  hours: text(400),
  whatsapp: text(30).regex(/^[+\d\s()-]*$/, "El WhatsApp solo admite números"),
  telegram: text(40).regex(/^@?[A-Za-z0-9_]*$/, "Usuario de Telegram no válido (solo letras, números y _)"),
  phone: text(30).regex(/^[+\d\s()-]*$/, "El teléfono solo admite números"),
  currency: z.enum(CURRENCIES),
  noticeText: text(140),
});

export async function saveBusiness(_prev: Result, form: FormData): Promise<Result> {
  const { cafeId } = await requireCafeId();
  const parsed = Business.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos" };
  const v = parsed.data;
  const channels = form.getAll("channels").map(String).filter((c) => c in CHANNELS);
  const payments = form.getAll("payments").map(String).filter((p) => (PAYMENTS as readonly string[]).includes(p));
  if (channels.includes("whatsapp") && !v.whatsapp) return { error: "Has activado WhatsApp: escribe el número." };
  if (channels.includes("telegram") && !v.telegram) return { error: "Has activado Telegram: escribe el usuario." };
  if (channels.includes("call") && !v.phone) return { error: "Has activado Llamada: escribe el teléfono." };
  await run(
    `UPDATE cafes SET name=?, tagline=?, about=?, address=?, map_url=?, hours=?, whatsapp=?, telegram=?, phone=?, currency=?,
       notice_text=?, notice_on=?, channels=?, payments=?, updated_at=datetime('now') WHERE id=?`,
    [v.name, v.tagline, v.about, v.address, v.mapUrl, v.hours, v.whatsapp, v.telegram.replace(/^@/, ""), v.phone, v.currency,
      v.noticeText, form.get("noticeOn") === "on" && v.noticeText ? 1 : 0, JSON.stringify(channels), JSON.stringify(payments), cafeId],
  );
  refresh();
  return { ok: "Guardado. Tu web ya muestra los cambios." };
}

export async function toggleNotice() {
  const { cafeId } = await requireCafeId();
  await run("UPDATE cafes SET notice_on = CASE WHEN notice_on = 1 OR notice_text = '' THEN 0 ELSE 1 END, updated_at = datetime('now') WHERE id = ?", [cafeId]);
  refresh();
}

export async function togglePublished() {
  const { cafeId } = await requireCafeId();
  await run("UPDATE cafes SET published = 1 - published, updated_at = datetime('now') WHERE id = ?", [cafeId]);
  refresh();
}

// ---------- style ----------

export async function saveStyle(themeJson: string): Promise<Result> {
  const { cafeId } = await requireCafeId();
  let raw: unknown;
  try {
    raw = JSON.parse(themeJson);
  } catch {
    return { error: "No se pudo leer el estilo" };
  }
  const theme = parseTheme(raw); // whitelists every key and colour
  await run("UPDATE cafes SET theme = ?, updated_at = datetime('now') WHERE id = ?", [JSON.stringify(theme), cafeId]);
  refresh();
  return { ok: "Estilo publicado." };
}

// ---------- images ----------

const MAX_BYTES = 2 * 1024 * 1024;

/** Sniffs the real format from the bytes; SVG and anything else is refused so uploads can never carry script. */
function imageMime(b: Uint8Array): string | null {
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "image/webp";
  return null;
}

async function storeImage(cafeId: number, file: FormDataEntryValue | null): Promise<{ id?: number; error?: string }> {
  if (!(file instanceof File) || file.size === 0) return {};
  if (file.size > MAX_BYTES) return { error: "La imagen pesa más de 2 MB. Prueba con una más pequeña." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = imageMime(bytes);
  if (!mime) return { error: "Formato no admitido. Usa JPG, PNG o WebP." };
  const res = await run("INSERT INTO media (cafe_id, mime, data) VALUES (?, ?, ?)", [cafeId, mime, bytes]);
  return { id: Number(res.lastInsertRowid) };
}

async function dropImage(cafeId: number, id: number | null | undefined) {
  if (id) await run("DELETE FROM media WHERE id = ? AND cafe_id = ?", [id, cafeId]);
}

export async function uploadBrandImage(_prev: Result, form: FormData): Promise<Result> {
  const { cafeId } = await requireCafeId();
  const kind = form.get("kind") === "hero" ? "hero_id" : "logo_id";
  const prev = await one<{ id: number | null }>(`SELECT ${kind} AS id FROM cafes WHERE id = ?`, [cafeId]);
  if (form.get("remove") === "1") {
    await run(`UPDATE cafes SET ${kind} = NULL, updated_at = datetime('now') WHERE id = ?`, [cafeId]);
    await dropImage(cafeId, prev?.id);
    refresh();
    return { ok: "Imagen quitada." };
  }
  const img = await storeImage(cafeId, form.get("file"));
  if (img.error) return { error: img.error };
  if (!img.id) return { error: "Elige una imagen primero." };
  await run(`UPDATE cafes SET ${kind} = ?, updated_at = datetime('now') WHERE id = ?`, [img.id, cafeId]);
  await dropImage(cafeId, prev?.id);
  refresh();
  return { ok: "Imagen actualizada." };
}

// ---------- categories ----------

export async function addCategory(_prev: Result, form: FormData): Promise<Result> {
  const { cafeId } = await requireCafeId();
  const name = String(form.get("name") ?? "").trim().slice(0, 40);
  if (!name) return { error: "Escribe el nombre de la sección" };
  const max = await one<{ m: number | null }>("SELECT MAX(position) AS m FROM categories WHERE cafe_id = ?", [cafeId]);
  await run("INSERT INTO categories (cafe_id, name, position) VALUES (?, ?, ?)", [cafeId, name, Number(max?.m ?? -1) + 1]);
  await touch(cafeId);
  refresh();
  return { ok: `Sección «${name}» creada.` };
}

export async function renameCategory(id: number, name: string) {
  const { cafeId } = await requireCafeId();
  const n = name.trim().slice(0, 40);
  if (n) await run("UPDATE categories SET name = ? WHERE id = ? AND cafe_id = ?", [n, id, cafeId]);
  refresh();
}

export async function deleteCategory(id: number): Promise<Result> {
  const { cafeId } = await requireCafeId();
  const n = await one<{ n: number }>("SELECT COUNT(*) AS n FROM products WHERE category_id = ? AND cafe_id = ?", [id, cafeId]);
  if (Number(n?.n) > 0) return { error: "Mueve o borra antes los productos de esta sección." };
  await run("DELETE FROM categories WHERE id = ? AND cafe_id = ?", [id, cafeId]);
  refresh();
  return { ok: "Sección borrada." };
}

async function swapPosition(table: "categories" | "products", cafeId: number, id: number, dir: -1 | 1) {
  const scope = table === "products" ? "AND category_id = (SELECT category_id FROM products WHERE id = ?)" : "";
  const rows = await all<{ id: number }>(
    `SELECT id FROM ${table} WHERE cafe_id = ? ${scope} ORDER BY position, id`,
    table === "products" ? [cafeId, id] : [cafeId],
  );
  const ids = rows.map((r) => Number(r.id));
  const i = ids.indexOf(id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j]!, ids[i]!];
  const c = await db();
  await c.batch(ids.map((rid, pos) => ({ sql: `UPDATE ${table} SET position = ? WHERE id = ? AND cafe_id = ?`, args: [pos, rid, cafeId] })), "write");
}

export async function moveCategory(id: number, dir: -1 | 1) {
  const { cafeId } = await requireCafeId();
  await swapPosition("categories", cafeId, id, dir);
  refresh();
}

// ---------- products ----------

const ProductSchema = z.object({
  name: text(60).min(1, "Escribe el nombre del producto"),
  description: text(160),
  price: z.string().trim().max(12).regex(/^(\d+([.,]\d{1,2})?)?$/, "Precio no válido: usa solo números, por ejemplo 150 o 2,50"),
  categoryId: z.coerce.number().int().positive("Elige una sección"),
});

export async function saveProduct(_prev: Result, form: FormData): Promise<Result> {
  const { cafeId } = await requireCafeId();
  const parsed = ProductSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos" };
  const v = parsed.data;
  const cat = await one("SELECT id FROM categories WHERE id = ? AND cafe_id = ?", [v.categoryId, cafeId]);
  if (!cat) return { error: "Esa sección no existe" };
  const price = v.price === "" ? null : Number(v.price.replace(",", "."));
  const available = form.get("available") === "on" ? 1 : 0;
  const featured = form.get("featured") === "on" ? 1 : 0;
  const id = Number(form.get("id")) || 0;

  const img = await storeImage(cafeId, form.get("image"));
  if (img.error) return { error: img.error };

  if (id) {
    const prev = await one<{ image_id: number | null; category_id: number }>("SELECT image_id, category_id FROM products WHERE id = ? AND cafe_id = ?", [id, cafeId]);
    if (!prev) return { error: "Ese producto ya no existe" };
    const removeImg = form.get("removeImage") === "on";
    const imageId = img.id ?? (removeImg ? null : prev.image_id);
    const moved = Number(prev.category_id) !== v.categoryId;
    await run(
      `UPDATE products SET name=?, description=?, price=?, category_id=?, available=?, featured=?, image_id=?
         ${moved ? ", position = (SELECT COALESCE(MAX(position), -1) + 1 FROM products WHERE category_id = ?)" : ""}
       WHERE id=? AND cafe_id=?`,
      [v.name, v.description, price, v.categoryId, available, featured, imageId, ...(moved ? [v.categoryId] : []), id, cafeId],
    );
    if (img.id || removeImg) await dropImage(cafeId, prev.image_id);
  } else {
    await run(
      `INSERT INTO products (cafe_id, category_id, name, description, price, available, featured, image_id, position)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, (SELECT COALESCE(MAX(position), -1) + 1 FROM products WHERE category_id = ?))`,
      [cafeId, v.categoryId, v.name, v.description, price, available, featured, img.id ?? null, v.categoryId],
    );
  }
  await touch(cafeId);
  refresh();
  return { ok: id ? "Producto guardado." : `«${v.name}» añadido a la carta.` };
}

export async function toggleAvailable(id: number) {
  const { cafeId } = await requireCafeId();
  await run("UPDATE products SET available = 1 - available WHERE id = ? AND cafe_id = ?", [id, cafeId]);
  await touch(cafeId);
  refresh();
}

export async function setPrice(id: number, value: string): Promise<Result> {
  const { cafeId } = await requireCafeId();
  const v = value.trim();
  if (v !== "" && !/^\d{1,9}([.,]\d{1,2})?$/.test(v)) return { error: "Precio no válido" };
  await run("UPDATE products SET price = ? WHERE id = ? AND cafe_id = ?", [v === "" ? null : Number(v.replace(",", ".")), id, cafeId]);
  await touch(cafeId);
  refresh();
  return { ok: "Precio guardado" };
}

export async function moveProduct(id: number, dir: -1 | 1) {
  const { cafeId } = await requireCafeId();
  await swapPosition("products", cafeId, id, dir);
  refresh();
}

export async function deleteProduct(id: number) {
  const { cafeId } = await requireCafeId();
  const prev = await one<{ image_id: number | null }>("SELECT image_id FROM products WHERE id = ? AND cafe_id = ?", [id, cafeId]);
  await run("DELETE FROM products WHERE id = ? AND cafe_id = ?", [id, cafeId]);
  await dropImage(cafeId, prev?.image_id);
  await touch(cafeId);
  refresh();
}

// ---------- account ----------

export async function updatePassword(_prev: Result, form: FormData): Promise<Result> {
  const user = await requireUser();
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  if (next.length < 8) return { error: "La nueva contraseña debe tener al menos 8 caracteres." };
  if (next !== String(form.get("repeat") ?? "")) return { error: "Las contraseñas nuevas no coinciden." };
  if (!(await changePassword(user.id, current, next))) return { error: "La contraseña actual no es correcta." };
  redirect("/entrar");
}

// ---------- platform admin ----------

const NewCafe = z.object({
  name: text(60).min(2, "Nombre de la cafetería muy corto"),
  slug: text(48),
  ownerName: text(60).min(2, "Escribe el nombre del dueño"),
  ownerEmail: z.email("Correo del dueño no válido").max(120),
  password: z.string().min(8, "La contraseña inicial debe tener al menos 8 caracteres").max(200),
  preset: z.enum(["clasico", "colonial", "moderno", "nocturno"]),
});

export async function createCafe(_prev: Result, form: FormData): Promise<Result> {
  await requireSuper();
  const parsed = NewCafe.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos" };
  const v = parsed.data;
  const slug = slugify(v.slug || v.name);
  if (slug.length < 2) return { error: "La dirección web es muy corta" };
  if (await one("SELECT id FROM cafes WHERE slug = ?", [slug])) return { error: `Ya existe una cafetería en /c/${slug}` };
  if (await one("SELECT id FROM users WHERE email = ?", [v.ownerEmail])) return { error: "Ese correo ya tiene cuenta" };
  const { themeFromPreset } = await import("@/lib/theme");
  const c = await db();
  const tx = await c.transaction("write");
  try {
    const res = await tx.execute({
      sql: "INSERT INTO cafes (slug, name, tagline, theme, published) VALUES (?, ?, ?, ?, 0)",
      args: [slug, v.name, "", JSON.stringify(themeFromPreset(v.preset))],
    });
    const cafeId = Number(res.lastInsertRowid);
    await tx.execute({
      sql: "INSERT INTO users (email, name, password_hash, role, cafe_id) VALUES (?, ?, ?, 'owner', ?)",
      args: [v.ownerEmail, v.ownerName, await hashPassword(v.password), cafeId],
    });
    await tx.execute({ sql: "INSERT INTO categories (cafe_id, name, position) VALUES (?, 'Cafés', 0)", args: [cafeId] });
    await tx.commit();
  } catch (e) {
    await tx.rollback();
    throw e;
  } finally {
    tx.close();
  }
  refresh();
  return { ok: `Creada «${v.name}» en /c/${slug}. Está sin publicar hasta que el dueño la termine.` };
}

export async function pickCafe(id: number) {
  await requireSuper();
  (await cookies()).set("cafe_admin_pick", String(id), { httpOnly: true, sameSite: "lax", path: "/" });
  redirect("/panel");
}
