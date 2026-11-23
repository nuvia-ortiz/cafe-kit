import type { Client } from "@libsql/client";
import bcrypt from "bcryptjs";
import { DEFAULT_THEME, themeFromPreset } from "./theme";

// Demo data: one platform admin and two cafés that share nothing but the template.
// Prices are illustrative; each owner sets their own from the panel.

type Item = [name: string, price: number, description?: string, featured?: boolean, available?: boolean];

const MENUS: Record<string, [string, Item[]][]> = {
  barrio: [
    ["Cafés", [
      ["Colada", 120, "Para compartir, en vasito de cartón", true],
      ["Cortadito", 150, "Café con un toque de leche espumada", true],
      ["Café con leche", 180],
      ["Café bombón", 200, "Con leche condensada"],
    ]],
    ["Para comer", [
      ["Pan con lechón", 450, "Con mojo y cebolla", true],
      ["Pan con tortilla", 250],
      ["Croquetas (4)", 200],
    ]],
    ["Batidos y dulces", [
      ["Batido de mamey", 350, "", false, false],
      ["Batido de guayaba", 300],
      ["Flan", 250, "Casero, del día"],
    ]],
  ],
  colonial: [
    ["Del cafetal", [
      ["Espresso", 150, "Café de Sierra Maestra, tueste medio", true],
      ["Capuchino", 280],
      ["Café frío con canela", 300, "Para el mediodía", true],
    ]],
    ["Desayunos", [
      ["Tostada con mantequilla", 180],
      ["Desayuno completo", 650, "Huevos, pan, jugo natural y café", true],
    ]],
    ["Postres", [
      ["Pudín de pan", 220],
      ["Cascos de guayaba con queso", 280],
    ]],
  ],
};

export async function seedDemo(c: Client) {
  const hash = await bcrypt.hash("demo1234", 10);
  const tx = await c.transaction("write");
  try {
    await tx.execute({
      sql: "INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, 'super')",
      args: ["admin@demo.local", "Administración", hash],
    });

    const cafes = [
      {
        slug: "cafeteria-de-barrio",
        name: "Cafetería de Barrio",
        tagline: "El cafecito de siempre, hecho al momento.",
        about: "Abrimos temprano para los que van al trabajo y cerramos tarde para la tertulia. Café recién colado, pan del día y precios de barrio.",
        address: "Calle 23 entre L y M, Vedado",
        hours: "Lunes a sábado: 7:00 – 21:00\nDomingo: 8:00 – 14:00",
        whatsapp: "+53 5 000 0000",
        telegram: "",
        phone: "+53 7 000 0000",
        channels: ["whatsapp", "call"],
        payments: ["Efectivo", "Transfermóvil", "EnZona"],
        notice: [1, "Hay apagón: seguimos abiertos con planta eléctrica."],
        theme: { ...DEFAULT_THEME },
        owner: ["dueno@demo.local", "Dueño de la cafetería"],
        menu: MENUS.barrio,
      },
      {
        slug: "rincon-colonial",
        name: "Rincón Colonial",
        tagline: "Café de montaña en una casona de 1840.",
        about: "Servimos café cubano de origen en el patio de una casa colonial restaurada. Pide desde la mesa escaneando el código.",
        address: "Calle Obispo 000, Habana Vieja",
        hours: "Todos los días: 9:00 – 20:00",
        whatsapp: "+53 5 111 1111",
        telegram: "rinconcolonial_demo",
        phone: "",
        channels: ["whatsapp", "telegram"],
        payments: ["Efectivo", "Transfermóvil", "Divisas"],
        notice: [0, ""],
        theme: { ...themeFromPreset("colonial"), layout: "list" as const },
        owner: ["colonial@demo.local", "Encargada del Rincón"],
        menu: MENUS.colonial,
      },
    ];

    for (const cf of cafes) {
      const res = await tx.execute({
        sql: `INSERT INTO cafes (slug, name, tagline, about, address, hours, whatsapp, telegram, phone, channels, payments,
                notice_on, notice_text, theme) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [cf.slug, cf.name, cf.tagline, cf.about, cf.address, cf.hours, cf.whatsapp, cf.telegram, cf.phone,
          JSON.stringify(cf.channels), JSON.stringify(cf.payments), cf.notice[0], cf.notice[1], JSON.stringify(cf.theme)],
      });
      const cafeId = Number(res.lastInsertRowid);
      await tx.execute({
        sql: "INSERT INTO users (email, name, password_hash, role, cafe_id) VALUES (?, ?, ?, 'owner', ?)",
        args: [cf.owner[0], cf.owner[1], hash, cafeId],
      });
      for (const [ci, [catName, items]] of cf.menu.entries()) {
        const cat = await tx.execute({ sql: "INSERT INTO categories (cafe_id, name, position) VALUES (?, ?, ?)", args: [cafeId, catName, ci] });
        for (const [pi, [name, price, description = "", featured = false, available = true]] of items.entries()) {
          await tx.execute({
            sql: `INSERT INTO products (cafe_id, category_id, name, description, price, featured, available, position)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [cafeId, Number(cat.lastInsertRowid), name, description, price, featured ? 1 : 0, available ? 1 : 0, pi],
          });
        }
      }
    }
    await tx.commit();
  } catch (e) {
    await tx.rollback();
    throw e;
  } finally {
    tx.close();
  }
}
