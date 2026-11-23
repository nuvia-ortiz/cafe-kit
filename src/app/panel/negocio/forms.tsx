"use client";
/* eslint-disable @next/next/no-img-element */
import { useActionState } from "react";
import { saveBusiness, uploadBrandImage, type Result } from "../actions";
import { Card, Notice, btnGhost, btnPrimary, inputCls, labelCls } from "@/components/panel/ui";

const CHANNELS = [
  ["whatsapp", "WhatsApp", "El pedido llega escrito a tu WhatsApp."],
  ["telegram", "Telegram", "Se copia el pedido y se abre tu chat."],
  ["call", "Llamada", "Botón para llamarte."],
] as const;
const PAYMENTS = ["Efectivo", "Transfermóvil", "EnZona", "Divisas", "Tarjeta"];
const CURRENCIES = ["CUP", "USD", "MLC", "EUR"];

type BusinessData = {
  name: string; tagline: string; about: string; address: string; mapUrl: string; hours: string;
  whatsapp: string; telegram: string; phone: string; channels: string[]; payments: string[];
  currency: string; noticeOn: boolean; noticeText: string;
};

export function BusinessForm({ cafe }: { cafe: BusinessData }) {
  const [state, action, pending] = useActionState<Result, FormData>(saveBusiness, {});
  const check = "flex min-h-11 items-center gap-2.5 rounded-xl border border-[var(--p-line)] px-3";
  return (
    <form action={action} className="flex flex-col gap-4">
      <Card title="Lo básico" id="basico">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={labelCls}>Nombre de la cafetería<input name="name" required defaultValue={cafe.name} className={inputCls} /></label>
          <label className={labelCls}>Moneda de los precios
            <select name="currency" defaultValue={cafe.currency} className={inputCls}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select>
          </label>
          <label className={`${labelCls} sm:col-span-2`}>Frase de portada<input name="tagline" defaultValue={cafe.tagline} placeholder="El cafecito de siempre, hecho al momento." className={inputCls} /></label>
          <label className={`${labelCls} sm:col-span-2`}>Quiénes somos<textarea name="about" rows={3} defaultValue={cafe.about} className={`${inputCls} py-2`} /></label>
        </div>
      </Card>

      <Card title="Cómo te piden" id="pedidos" desc="Elige uno o varios. El cliente arma el pedido en la web y te llega por aquí.">
        <div className="grid gap-2 sm:grid-cols-3">
          {CHANNELS.map(([k, label, hint]) => (
            <label key={k} className={`${check} py-2`}>
              <input type="checkbox" name="channels" value={k} defaultChecked={cafe.channels.includes(k)} className="size-5" />
              <span><span className="block font-semibold">{label}</span><span className="text-xs text-[var(--p-muted)]">{hint}</span></span>
            </label>
          ))}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className={labelCls}>Número de WhatsApp<input name="whatsapp" type="tel" defaultValue={cafe.whatsapp} placeholder="+53 5 000 0000" className={inputCls} /></label>
          <label className={labelCls}>Usuario de Telegram<input name="telegram" defaultValue={cafe.telegram} placeholder="@micafeteria" className={inputCls} /></label>
          <label className={labelCls}>Teléfono<input name="phone" type="tel" defaultValue={cafe.phone} placeholder="+53 7 000 0000" className={inputCls} /></label>
        </div>
        <div className="mt-4 text-sm font-semibold">Formas de pago que aceptas</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {PAYMENTS.map((p) => (
            <label key={p} className={check}><input type="checkbox" name="payments" value={p} defaultChecked={cafe.payments.includes(p)} className="size-5" />{p}</label>
          ))}
        </div>
      </Card>

      <Card title="Dónde y cuándo" id="donde">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={labelCls}>Dirección<input name="address" defaultValue={cafe.address} className={inputCls} /></label>
          <label className={labelCls}>Enlace de Google Maps (opcional)<input name="mapUrl" type="url" defaultValue={cafe.mapUrl} placeholder="https://maps.app.goo.gl/…" className={inputCls} /></label>
          <label className={`${labelCls} sm:col-span-2`}>Horario<textarea name="hours" rows={3} defaultValue={cafe.hours} placeholder={"Lunes a sábado: 7:00 – 21:00\nDomingo: cerrado"} className={`${inputCls} py-2`} /></label>
        </div>
      </Card>

      <div id="aviso">
        <Card title="Aviso del día" desc="Una línea arriba de toda la web: apagón, cerrado por inventario, hoy hay dulce de coco…">
          <label className={labelCls}>Texto del aviso<input name="noticeText" maxLength={140} defaultValue={cafe.noticeText} className={inputCls} /></label>
          <label className={`${check} mt-3 w-fit`}><input type="checkbox" name="noticeOn" defaultChecked={cafe.noticeOn} className="size-5" /> Mostrar el aviso</label>
        </Card>
      </div>

      <div className="sticky bottom-3 z-10 flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--p-line)] bg-white/95 p-3 backdrop-blur">
        <button disabled={pending} className={btnPrimary}>{pending ? "Guardando…" : "Guardar cambios"}</button>
        <div className="min-w-0 flex-1"><Notice state={state} /></div>
      </div>
    </form>
  );
}

export function ImageForm({ kind, title, desc, url }: { kind: "logo" | "hero"; title: string; desc: string; url: string | null }) {
  const [state, action, pending] = useActionState<Result, FormData>(uploadBrandImage, {});
  return (
    <Card title={title} desc={desc} id={`img-${kind}`}>
      {url ? (
        <img src={url} alt={`${title} actual`} className={`mb-3 rounded-xl border border-[var(--p-line)] object-cover ${kind === "logo" ? "size-28" : "aspect-video w-full"}`} />
      ) : (
        <div className="mb-3 grid h-24 place-items-center rounded-xl border border-dashed border-[#9aa1ae] text-sm text-[var(--p-muted)]">Sin imagen</div>
      )}
      <form action={action} className="flex flex-col gap-2">
        <input type="hidden" name="kind" value={kind} />
        <label className={labelCls}>Elegir imagen (JPG, PNG o WebP, máx. 2 MB)
          <input type="file" name="file" accept="image/jpeg,image/png,image/webp" className="mt-1 block w-full text-sm file:mr-3 file:min-h-11 file:rounded-xl file:border-0 file:bg-[var(--p-bg)] file:px-4 file:font-semibold" />
        </label>
        <div className="flex flex-wrap gap-2">
          <button disabled={pending} className={btnPrimary}>{pending ? "Subiendo…" : "Subir"}</button>
          {url && <button name="remove" value="1" disabled={pending} className={btnGhost}>Quitar</button>}
        </div>
        <Notice state={state} />
      </form>
    </Card>
  );
}
