"use client";
/* eslint-disable @next/next/no-img-element -- café uploads are served from /media with their own cache headers */

import { useEffect, useMemo, useState } from "react";
import type { Theme } from "@/lib/theme";
import { themeVars } from "@/lib/theme";
import { cartTotal, formatPrice, initialsOf, orderMessage, telegramLink, telLink, whatsappLink, type CartLine, type OrderInfo } from "@/lib/order";

// The public web of a café. The same component renders the live preview in the panel,
// so what the owner sees while editing is exactly what their customers get.

export type StoreCafe = {
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
  channels: ("whatsapp" | "telegram" | "call")[];
  payments: string[];
  currency: string;
  noticeOn: boolean;
  noticeText: string;
  theme: Theme;
  logoUrl: string | null;
  heroUrl: string | null;
};
export type StoreMenu = {
  categories: { id: number; name: string }[];
  products: { id: number; categoryId: number; name: string; description: string; price: number | null; available: boolean; featured: boolean; imageUrl: string | null }[];
};

type Props = { cafe: StoreCafe; menu: StoreMenu; table?: string; preview?: boolean };

function Logo({ cafe, size }: { cafe: StoreCafe; size: number }) {
  if (cafe.logoUrl)
    return <img src={cafe.logoUrl} alt="" width={size} height={size} className="rounded-card object-cover" style={{ width: size, height: size }} />;
  return (
    <span
      aria-hidden="true"
      className="grid place-items-center rounded-card bg-accent2 font-display font-extrabold text-on-accent2"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initialsOf(cafe.name)}
    </span>
  );
}

function Icon({ d, className = "size-5" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
const I = {
  bolt: "M13 2 4 14h7l-1 8 9-12h-7z",
  clock: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  pin: "M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  card: "M3 7h18v10H3zM3 11h18",
  bag: "M6 8h12l-1 12H7L6 8Zm3 0a3 3 0 0 1 6 0",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  x: "M6 6l12 12M18 6 6 18",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z",
  chat: "M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z",
  send: "M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z",
};

export function Storefront({ cafe, menu, table, preview }: Props) {
  const t = cafe.theme;
  const [cart, setCart] = useState<Record<number, number>>({});
  const [open, setOpen] = useState(false);

  const byId = useMemo(() => new Map(menu.products.map((p) => [p.id, p])), [menu.products]);
  const lines: CartLine[] = Object.entries(cart)
    .filter(([, q]) => q > 0)
    .map(([id, qty]) => {
      const p = byId.get(Number(id))!;
      return { id: p.id, name: p.name, price: p.price, qty };
    })
    .filter((l) => l.name);
  const { items, total, hasUnpriced } = cartTotal(lines);
  const canOrder = cafe.channels.length > 0;

  const add = (id: number, d: number) => setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] ?? 0) + d) }));
  const featured = menu.products.filter((p) => p.featured && p.available);

  return (
    <div style={themeVars(t) as React.CSSProperties} className="min-h-full bg-ground font-body text-ink" data-theme-preset={t.preset}>
      {cafe.noticeOn && cafe.noticeText && (
        <div role="status" className="flex items-center justify-center gap-2 bg-ink px-4 py-2 text-center text-sm font-semibold text-ground">
          <Icon d={I.bolt} className="size-4 shrink-0" />
          {cafe.noticeText}
        </div>
      )}

      <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Logo cafe={cafe} size={40} />
          <span className="font-display text-xl font-extrabold leading-tight">{cafe.name}</span>
          <nav aria-label="Secciones" className="ml-auto hidden gap-1 text-sm font-semibold sm:flex">
            <a href="#carta" className="rounded-btn px-3 py-2 hover:bg-soft">Carta</a>
            {(t.sections.hours || t.sections.location) && <a href="#visitanos" className="rounded-btn px-3 py-2 hover:bg-soft">Visítanos</a>}
          </nav>
        </div>
      </header>

      <main>
        {t.hero !== "minimal" ? (
          <section
            className={`relative overflow-hidden ${t.hero === "image" && cafe.heroUrl ? "text-white" : ""}`}
            style={t.hero === "image" && cafe.heroUrl ? undefined : { background: "var(--c-soft)" }}
          >
            {t.hero === "image" && cafe.heroUrl && (
              <>
                <img src={cafe.heroUrl} alt="" className="absolute inset-0 size-full object-cover" />
                <div className="absolute inset-0 bg-black/55" />
              </>
            )}
            <div className="relative mx-auto max-w-5xl px-4 py-14 sm:py-20">
              <h1 className="max-w-2xl font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">{cafe.tagline || cafe.name}</h1>
              {table && <p className="mt-4 inline-block rounded-btn bg-accent2 px-3 py-1 text-sm font-bold text-on-accent2">Estás en la mesa {table}</p>}
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#carta" className="inline-flex min-h-12 items-center rounded-btn bg-accent px-6 font-bold text-on-accent">Ver la carta</a>
              </div>
            </div>
          </section>
        ) : (
          <section className="mx-auto max-w-5xl px-4 pb-2 pt-10">
            <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{cafe.tagline || cafe.name}</h1>
            {table && <p className="mt-3 inline-block rounded-btn bg-accent2 px-3 py-1 text-sm font-bold text-on-accent2">Estás en la mesa {table}</p>}
          </section>
        )}

        {t.sections.featured && featured.length > 0 && (
          <section aria-labelledby="dest" className="mx-auto max-w-5xl px-4 pt-10">
            <h2 id="dest" className="font-display text-2xl font-bold">Lo más pedido</h2>
            <ul className="mt-4 flex snap-x gap-3 overflow-x-auto pb-2">
              {featured.map((p) => (
                <li key={p.id} className="w-60 shrink-0 snap-start rounded-card border border-line bg-surface p-4">
                  {p.imageUrl && <img src={p.imageUrl} alt="" loading="lazy" className="mb-3 aspect-[4/3] w-full rounded-card object-cover" />}
                  <div className="font-bold">{p.name}</div>
                  <div className="mt-1 text-sm text-muted">{formatPrice(p.price, cafe.currency)}</div>
                  {canOrder && (
                    <button type="button" onClick={() => add(p.id, 1)} className="mt-3 inline-flex min-h-11 items-center gap-1 rounded-btn bg-accent px-4 text-sm font-bold text-on-accent">
                      <Icon d={I.plus} className="size-4" /> Añadir
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section id="carta" aria-labelledby="carta-h" className="mx-auto max-w-5xl scroll-mt-20 px-4 pt-10">
          <h2 id="carta-h" className="font-display text-3xl font-bold">Carta</h2>
          {menu.categories.length > 1 && (
            <nav aria-label="Categorías" className="sticky top-[65px] z-10 -mx-4 mt-3 flex gap-2 overflow-x-auto bg-ground/95 px-4 py-2 backdrop-blur">
              {menu.categories.map((c) => (
                <a key={c.id} href={`#cat-${c.id}`} className="shrink-0 rounded-btn border border-line bg-surface px-4 py-2 text-sm font-semibold">
                  {c.name}
                </a>
              ))}
            </nav>
          )}
          {menu.categories.map((c) => {
            const prods = menu.products.filter((p) => p.categoryId === c.id);
            if (!prods.length) return null;
            return (
              <div key={c.id} id={`cat-${c.id}`} className="scroll-mt-32 pt-6">
                <h3 className="font-display text-xl font-bold">{c.name}</h3>
                <ul
                  className={
                    t.layout === "list"
                      ? "mt-3 divide-y divide-line rounded-card border border-line bg-surface"
                      : t.layout === "grid"
                        ? "mt-3 grid grid-cols-2 gap-3 md:grid-cols-3"
                        : "mt-3 grid gap-3 md:grid-cols-2"
                  }
                >
                  {prods.map((p) => (
                    <ProductItem key={p.id} p={p} layout={t.layout} currency={cafe.currency} qty={cart[p.id] ?? 0} onAdd={canOrder ? add : undefined} />
                  ))}
                </ul>
              </div>
            );
          })}
          {menu.products.length === 0 && <p className="mt-4 text-muted">La carta se está preparando.</p>}
        </section>

        {(t.sections.about && cafe.about) || (t.sections.hours && cafe.hours) || (t.sections.location && cafe.address) || (t.sections.payments && cafe.payments.length) ? (
          <section id="visitanos" aria-label="Información" className="mx-auto grid max-w-5xl scroll-mt-20 gap-4 px-4 pb-32 pt-12 md:grid-cols-2">
            {t.sections.about && cafe.about && (
              <div className="rounded-card border border-line bg-surface p-5 md:col-span-2">
                <h2 className="font-display text-xl font-bold">Quiénes somos</h2>
                <p className="mt-2 whitespace-pre-line leading-relaxed text-muted">{cafe.about}</p>
              </div>
            )}
            {t.sections.hours && cafe.hours && (
              <div className="rounded-card border border-line bg-surface p-5">
                <h2 className="flex items-center gap-2 font-display text-xl font-bold"><Icon d={I.clock} /> Horario</h2>
                <p className="mt-2 whitespace-pre-line leading-relaxed">{cafe.hours}</p>
              </div>
            )}
            {t.sections.location && cafe.address && (
              <div className="rounded-card border border-line bg-surface p-5">
                <h2 className="flex items-center gap-2 font-display text-xl font-bold"><Icon d={I.pin} /> Dónde estamos</h2>
                <p className="mt-2">{cafe.address}</p>
                {cafe.mapUrl && (
                  <a href={cafe.mapUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center font-bold text-accent underline underline-offset-4">
                    Cómo llegar
                  </a>
                )}
              </div>
            )}
            {t.sections.payments && cafe.payments.length > 0 && (
              <div className="rounded-card border border-line bg-surface p-5 md:col-span-2">
                <h2 className="flex items-center gap-2 font-display text-xl font-bold"><Icon d={I.card} /> Formas de pago</h2>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {cafe.payments.map((p) => (
                    <li key={p} className="rounded-btn bg-soft px-3 py-1.5 text-sm font-semibold">{p}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        ) : (
          <div className="pb-32" />
        )}
      </main>

      <footer className="border-t border-line px-4 py-6 text-center text-sm text-muted">
        © {cafe.name} · Precios en {cafe.currency}
      </footer>

      {items > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 p-3 sm:p-4">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mx-auto flex min-h-14 w-full max-w-xl items-center justify-between gap-3 rounded-btn bg-accent px-5 font-bold text-on-accent shadow-lg"
          >
            <span className="flex items-center gap-2"><Icon d={I.bag} /> Ver pedido ({items})</span>
            <span>{formatPrice(total, cafe.currency)}{hasUnpriced ? " +" : ""}</span>
          </button>
        </div>
      )}

      {open && (
        <OrderSheet
          cafe={cafe}
          lines={lines}
          table={table}
          preview={preview}
          onQty={add}
          onClose={() => setOpen(false)}
          onSent={() => setCart({})}
        />
      )}
    </div>
  );
}

function ProductItem({
  p,
  layout,
  currency,
  qty,
  onAdd,
}: {
  p: StoreMenu["products"][number];
  layout: Theme["layout"];
  currency: string;
  qty: number;
  onAdd?: (id: number, d: number) => void;
}) {
  const price = p.available ? (
    <span className="font-bold">{formatPrice(p.price, currency)}</span>
  ) : (
    <span className="rounded-btn bg-soft px-2 py-0.5 text-xs font-bold">Hoy no hay</span>
  );
  const control =
    onAdd && p.available ? (
      qty > 0 ? (
        <div className="flex items-center gap-1" role="group" aria-label={`Cantidad de ${p.name}`}>
          <button type="button" onClick={() => onAdd(p.id, -1)} aria-label={`Quitar un ${p.name}`} className="grid size-11 place-items-center rounded-btn border border-line">
            <Icon d={I.minus} className="size-4" />
          </button>
          <span className="w-6 text-center font-bold" aria-live="polite">{qty}</span>
          <button type="button" onClick={() => onAdd(p.id, 1)} aria-label={`Añadir otro ${p.name}`} className="grid size-11 place-items-center rounded-btn bg-accent text-on-accent">
            <Icon d={I.plus} className="size-4" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => onAdd(p.id, 1)} aria-label={`Añadir ${p.name}`} className="grid size-11 place-items-center rounded-btn bg-accent text-on-accent">
          <Icon d={I.plus} className="size-4" />
        </button>
      )
    ) : null;

  if (layout === "grid")
    return (
      <li className={`flex flex-col overflow-hidden rounded-card border border-line bg-surface ${p.available ? "" : "opacity-70"}`}>
        {p.imageUrl ? (
          <img src={p.imageUrl} alt="" loading="lazy" className="aspect-square w-full object-cover" />
        ) : (
          <div aria-hidden="true" className="grid aspect-square w-full place-items-center bg-soft font-display text-4xl font-extrabold text-accent2">
            {p.name[0]}
          </div>
        )}
        <div className="flex flex-1 flex-col gap-1 p-3">
          <span className="font-bold leading-snug">{p.name}</span>
          {p.description && <span className="line-clamp-2 text-sm text-muted">{p.description}</span>}
          <div className="mt-auto flex items-center justify-between gap-2 pt-2">{price}{control}</div>
        </div>
      </li>
    );

  return (
    <li className={`flex items-center gap-3 ${layout === "cards" ? "rounded-card border border-line bg-surface p-3" : "px-4 py-3"} ${p.available ? "" : "opacity-70"}`}>
      {p.imageUrl && layout === "cards" && <img src={p.imageUrl} alt="" loading="lazy" className="size-20 shrink-0 rounded-card object-cover" />}
      <div className="min-w-0 flex-1">
        <div className="font-bold">{p.name}</div>
        {p.description && <div className="text-sm text-muted">{p.description}</div>}
        <div className="mt-1">{price}</div>
      </div>
      {control}
    </li>
  );
}

function OrderSheet({
  cafe,
  lines,
  table,
  preview,
  onQty,
  onClose,
  onSent,
}: {
  cafe: StoreCafe;
  lines: CartLine[];
  table?: string;
  preview?: boolean;
  onQty: (id: number, d: number) => void;
  onClose: () => void;
  onSent: () => void;
}) {
  const [info, setInfo] = useState<OrderInfo>({ name: "", mode: table ? "local" : "llevar", table: table ?? "", address: "", note: "" });
  const [copied, setCopied] = useState(false);
  const msg = orderMessage(cafe.name, lines, info, cafe.currency);
  const { total, hasUnpriced } = cartTotal(lines);

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [onClose]);
  useEffect(() => {
    if (lines.length === 0) onClose();
  }, [lines.length, onClose]);

  const field = "mt-1 w-full min-h-12 rounded-card border border-line bg-surface px-3 text-base text-ink";
  const sendTelegram = async () => {
    try {
      await navigator.clipboard.writeText(msg);
      setCopied(true);
    } catch {
      setCopied(false);
    }
    if (!preview) window.open(telegramLink(cafe.telegram), "_blank", "noopener");
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pedido-h"
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[var(--r-card)] bg-ground p-5 text-ink sm:rounded-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 id="pedido-h" className="font-display text-2xl font-bold">Tu pedido</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="grid size-11 place-items-center rounded-btn">
            <Icon d={I.x} />
          </button>
        </div>

        <ul className="mt-3 divide-y divide-line rounded-card border border-line bg-surface">
          {lines.map((l) => (
            <li key={l.id} className="flex items-center gap-3 px-3 py-2">
              <span className="flex-1 font-semibold">{l.name}</span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => onQty(l.id, -1)} aria-label={`Quitar un ${l.name}`} className="grid size-10 place-items-center rounded-btn border border-line"><Icon d={I.minus} className="size-4" /></button>
                <span className="w-6 text-center font-bold">{l.qty}</span>
                <button type="button" onClick={() => onQty(l.id, 1)} aria-label={`Añadir otro ${l.name}`} className="grid size-10 place-items-center rounded-btn border border-line"><Icon d={I.plus} className="size-4" /></button>
              </div>
            </li>
          ))}
          <li className="flex justify-between px-3 py-3 font-bold">
            <span>Total</span>
            <span>{formatPrice(total, cafe.currency)}{hasUnpriced ? " + a consultar" : ""}</span>
          </li>
        </ul>

        <fieldset className="mt-4">
          <legend className="text-sm font-bold">¿Cómo lo quieres?</legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(["local", "llevar", "domicilio"] as const).map((m) => (
              <label key={m} className={`flex min-h-12 cursor-pointer items-center justify-center rounded-btn border px-2 text-center text-sm font-semibold ${info.mode === m ? "border-accent bg-accent text-on-accent" : "border-line bg-surface"}`}>
                <input type="radio" name="mode" value={m} checked={info.mode === m} onChange={() => setInfo({ ...info, mode: m })} className="sr-only" />
                {m === "local" ? "Aquí" : m === "llevar" ? "Para llevar" : "A domicilio"}
              </label>
            ))}
          </div>
        </fieldset>
        {info.mode === "local" && (
          <label className="mt-3 block text-sm font-bold">Mesa
            <input className={field} inputMode="numeric" value={info.table} onChange={(e) => setInfo({ ...info, table: e.target.value.slice(0, 10) })} />
          </label>
        )}
        {info.mode === "domicilio" && (
          <label className="mt-3 block text-sm font-bold">Dirección
            <input className={field} autoComplete="street-address" value={info.address} onChange={(e) => setInfo({ ...info, address: e.target.value.slice(0, 160) })} />
          </label>
        )}
        <label className="mt-3 block text-sm font-bold">Tu nombre
          <input className={field} autoComplete="given-name" value={info.name} onChange={(e) => setInfo({ ...info, name: e.target.value.slice(0, 60) })} />
        </label>
        <label className="mt-3 block text-sm font-bold">Nota (opcional)
          <input className={field} placeholder="Sin azúcar, bien caliente…" value={info.note} onChange={(e) => setInfo({ ...info, note: e.target.value.slice(0, 200) })} />
        </label>

        <div className="mt-5 flex flex-col gap-2">
          {cafe.channels.includes("whatsapp") && cafe.whatsapp && (
            <a
              href={preview ? undefined : whatsappLink(cafe.whatsapp, msg)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => !preview && onSent()}
              className="flex min-h-14 items-center justify-center gap-2 rounded-btn bg-accent font-bold text-on-accent"
              data-testid="send-whatsapp"
            >
              <Icon d={I.chat} /> Enviar por WhatsApp
            </a>
          )}
          {cafe.channels.includes("telegram") && cafe.telegram && (
            <button type="button" onClick={sendTelegram} className="flex min-h-14 items-center justify-center gap-2 rounded-btn border-2 border-accent font-bold text-ink">
              <Icon d={I.send} /> Enviar por Telegram
            </button>
          )}
          {copied && <p role="status" className="text-center text-sm">Pedido copiado: pégalo en el chat de Telegram.</p>}
          {cafe.channels.includes("call") && cafe.phone && (
            <a href={preview ? undefined : telLink(cafe.phone)} className="flex min-h-14 items-center justify-center gap-2 rounded-btn border-2 border-line font-bold">
              <Icon d={I.phone} /> Llamar para pedir
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
