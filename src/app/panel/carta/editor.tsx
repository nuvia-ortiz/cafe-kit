"use client";
/* eslint-disable @next/next/no-img-element */
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  addCategory, deleteCategory, deleteProduct, moveCategory, moveProduct, renameCategory,
  saveProduct, setPrice, toggleAvailable, type Result,
} from "../actions";
import { Card, Notice, btnGhost, btnPrimary, inputCls, labelCls } from "@/components/panel/ui";

type Category = { id: number; name: string };
type Product = {
  id: number; categoryId: number; name: string; description: string; price: number | null;
  available: boolean; featured: boolean; imageUrl: string | null;
};

const P = {
  up: "M12 19V5M5 12l7-7 7 7",
  down: "M12 5v14M5 12l7 7 7-7",
  edit: "M14 4l6 6-11 11H3v-6L14 4Z",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",
  star: "M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9L12 3Z",
};
function IconBtn({ d, label, onClick, disabled }: { d: string; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label} className="grid size-11 place-items-center rounded-xl text-[var(--p-muted)] hover:bg-[var(--p-bg)] disabled:opacity-30">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5" aria-hidden="true"><path d={d} /></svg>
    </button>
  );
}

function PriceInput({ p, currency }: { p: Product; currency: string }) {
  const [msg, setMsg] = useState<Result>({});
  const [pending, start] = useTransition();
  const initial = p.price == null ? "" : String(p.price).replace(".", ",");
  return (
    <div className="flex items-center gap-2">
      <label className="sr-only" htmlFor={`price-${p.id}`}>Precio de {p.name}</label>
      <input
        id={`price-${p.id}`}
        defaultValue={initial}
        inputMode="decimal"
        placeholder="Consultar"
        className={`h-11 w-28 rounded-xl border px-3 text-right ${msg.error ? "border-red-600" : "border-[#c9cdd6]"}`}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        onBlur={(e) => {
          const v = e.currentTarget.value.trim();
          if (v === initial) return;
          start(async () => setMsg(await setPrice(p.id, v)));
        }}
      />
      <span className="w-10 text-sm text-[var(--p-muted)]">{currency}</span>
      <span className="w-14 text-xs" role="status">{pending ? "…" : msg.error ? <span className="text-red-700">{msg.error}</span> : msg.ok ? <span className="text-green-700">✓</span> : null}</span>
    </div>
  );
}

function ProductForm({ categories, product, defaultCategory, onDone }: { categories: Category[]; product?: Product; defaultCategory?: number; onDone: () => void }) {
  const [state, action, pending] = useActionState<Result, FormData>(saveProduct, {});
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  useEffect(() => {
    if (state.ok) onDone();
  }, [state, onDone]);
  return (
    <dialog ref={ref} onClose={onDone} aria-labelledby="pf-h" className="m-auto w-[min(560px,calc(100vw-24px))] rounded-2xl p-0 backdrop:bg-black/50">
      <form action={action} className="flex flex-col gap-3 p-5">
        <h2 id="pf-h" className="text-xl font-bold">{product ? "Editar producto" : "Nuevo producto"}</h2>
        {product && <input type="hidden" name="id" value={product.id} />}
        <label className={labelCls}>Nombre<input name="name" required maxLength={60} defaultValue={product?.name} className={inputCls} autoFocus /></label>
        <label className={labelCls}>Descripción (opcional)<input name="description" maxLength={160} defaultValue={product?.description} className={inputCls} /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={labelCls}>Precio<input name="price" inputMode="decimal" placeholder="Vacío = «Consultar»" defaultValue={product?.price == null ? "" : String(product.price).replace(".", ",")} className={inputCls} /></label>
          <label className={labelCls}>Sección
            <select name="categoryId" defaultValue={product?.categoryId ?? defaultCategory} className={inputCls}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        </div>
        <label className={labelCls}>Foto (opcional, JPG/PNG/WebP, máx. 2 MB)
          <input type="file" name="image" accept="image/jpeg,image/png,image/webp" className="mt-1 block w-full text-sm file:mr-3 file:min-h-11 file:rounded-xl file:border-0 file:bg-[var(--p-bg)] file:px-4 file:font-semibold" />
        </label>
        {product?.imageUrl && (
          <div className="flex items-center gap-3">
            <img src={product.imageUrl} alt="" className="size-14 rounded-lg object-cover" />
            <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="removeImage" className="size-5" /> Quitar foto</label>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <label className="flex min-h-11 items-center gap-2 rounded-xl border border-[var(--p-line)] px-3 text-sm"><input type="checkbox" name="available" defaultChecked={product?.available ?? true} className="size-5" /> Hoy hay</label>
          <label className="flex min-h-11 items-center gap-2 rounded-xl border border-[var(--p-line)] px-3 text-sm"><input type="checkbox" name="featured" defaultChecked={product?.featured} className="size-5" /> Destacar en «Lo más pedido»</label>
        </div>
        <Notice state={state} />
        <div className="mt-1 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={() => ref.current?.close()} className={btnGhost}>Cancelar</button>
          <button disabled={pending} className={btnPrimary}>{pending ? "Guardando…" : "Guardar"}</button>
        </div>
      </form>
    </dialog>
  );
}

export function MenuEditor({ currency, categories, products }: { currency: string; categories: Category[]; products: Product[] }) {
  const [editing, setEditing] = useState<{ product?: Product; categoryId?: number } | null>(null);
  const [catState, catAction, catPending] = useActionState<Result, FormData>(addCategory, {});
  const [msg, setMsg] = useState<Result>({});
  const [, start] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      {msg.error && <Notice state={msg} />}
      {categories.length === 0 && <p className="rounded-xl bg-white p-4">Empieza creando una sección (por ejemplo «Cafés»).</p>}

      {categories.map((c, ci) => {
        const items = products.filter((p) => p.categoryId === c.id);
        return (
          <Card
            key={c.id}
            id={`cat-${c.id}`}
            title={c.name}
            desc={`${items.length} ${items.length === 1 ? "producto" : "productos"}`}
            action={
              <div className="flex flex-wrap items-center gap-1">
                <IconBtn d={P.up} label={`Subir sección ${c.name}`} disabled={ci === 0} onClick={() => start(() => moveCategory(c.id, -1))} />
                <IconBtn d={P.down} label={`Bajar sección ${c.name}`} disabled={ci === categories.length - 1} onClick={() => start(() => moveCategory(c.id, 1))} />
                <IconBtn
                  d={P.edit}
                  label={`Renombrar sección ${c.name}`}
                  onClick={() => {
                    const n = prompt("Nuevo nombre de la sección", c.name);
                    if (n && n.trim() !== c.name) start(() => renameCategory(c.id, n));
                  }}
                />
                <IconBtn
                  d={P.trash}
                  label={`Borrar sección ${c.name}`}
                  onClick={() => confirm(`¿Borrar la sección «${c.name}»?`) && start(async () => setMsg(await deleteCategory(c.id)))}
                />
              </div>
            }
          >
            <ul className="divide-y divide-[var(--p-line)]">
              {items.map((p, pi) => (
                <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2" data-testid={`product-${p.name}`}>
                  {p.imageUrl ? <img src={p.imageUrl} alt="" className="size-11 rounded-lg object-cover" /> : <span aria-hidden="true" className="grid size-11 place-items-center rounded-lg bg-[var(--p-bg)] font-bold text-[var(--p-muted)]">{p.name[0]}</span>}
                  <div className="min-w-[10rem] flex-1">
                    <div className="flex items-center gap-1.5 font-semibold">
                      {p.name}
                      {p.featured && <svg viewBox="0 0 24 24" className="size-4 fill-amber-400" role="img" aria-label="Destacado"><path d={P.star} /></svg>}
                    </div>
                    {p.description && <div className="truncate text-sm text-[var(--p-muted)]">{p.description}</div>}
                  </div>
                  <PriceInput key={p.id} p={p} currency={currency} />
                  <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={p.available}
                      aria-label={`${p.name}: hoy hay`}
                      onClick={() => start(() => toggleAvailable(p.id))}
                      className={`relative h-8 w-14 rounded-full transition-colors ${p.available ? "bg-[#1f7a3e]" : "bg-[#9aa1ae]"}`}
                    >
                      <span className={`absolute top-1 size-6 rounded-full bg-white shadow transition-all ${p.available ? "left-7" : "left-1"}`} />
                    </button>
                    <span className="w-16">{p.available ? "Hay" : "No hay"}</span>
                  </label>
                  <div className="flex">
                    <IconBtn d={P.up} label={`Subir ${p.name}`} disabled={pi === 0} onClick={() => start(() => moveProduct(p.id, -1))} />
                    <IconBtn d={P.down} label={`Bajar ${p.name}`} disabled={pi === items.length - 1} onClick={() => start(() => moveProduct(p.id, 1))} />
                    <IconBtn d={P.edit} label={`Editar ${p.name}`} onClick={() => setEditing({ product: p })} />
                    <IconBtn d={P.trash} label={`Borrar ${p.name}`} onClick={() => confirm(`¿Borrar «${p.name}» de la carta?`) && start(() => deleteProduct(p.id))} />
                  </div>
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => setEditing({ categoryId: c.id })} className={`${btnGhost} mt-3 border-dashed`}>+ Añadir producto a {c.name}</button>
          </Card>
        );
      })}

      <Card title="Nueva sección" id="nueva-seccion" desc="Por ejemplo: Cafés, Para comer, Batidos, Dulces.">
        <form action={catAction} className="flex flex-wrap items-end gap-2">
          <label className={`${labelCls} min-w-[14rem] flex-1`}>Nombre de la sección<input name="name" maxLength={40} required className={inputCls} /></label>
          <button disabled={catPending} className={btnPrimary}>Crear sección</button>
        </form>
        <div className="mt-2"><Notice state={catState} /></div>
      </Card>

      {editing && (
        <ProductForm
          categories={categories}
          product={editing.product}
          defaultCategory={editing.categoryId}
          onDone={() => setEditing(null)}
        />
      )}
    </div>
  );
}
