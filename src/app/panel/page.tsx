import type { Metadata } from "next";
import Link from "next/link";
import { requireCafeId } from "@/lib/auth";
import { cafeById, menuOf, visitStats } from "@/lib/cafe";
import { Card, PageHead, btnGhost } from "@/components/panel/ui";
import { togglePublished, toggleNotice } from "./actions";

export const metadata: Metadata = { title: "Panel · Inicio" };

function Switch({ on, label, action }: { on: boolean; label: string; action: () => Promise<void> }) {
  return (
    <form action={action}>
      <button
        role="switch"
        aria-checked={on}
        aria-label={label}
        className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${on ? "bg-[#1f7a3e]" : "bg-[#9aa1ae]"}`}
      >
        <span className={`absolute top-1 size-6 rounded-full bg-white shadow transition-all ${on ? "left-7" : "left-1"}`} />
      </button>
    </form>
  );
}

export default async function PanelHome() {
  const { user, cafeId } = await requireCafeId();
  const cafe = (await cafeById(cafeId))!;
  const { categories, products } = await menuOf(cafeId);
  const stats = await visitStats(cafeId);
  const out = products.filter((p) => !p.available);
  const noPrice = products.filter((p) => p.price == null);
  const totalQr = stats.days.reduce((s, d) => s + d.qr, 0);
  const totalWeb = stats.days.reduce((s, d) => s + d.web, 0);
  const max = Math.max(1, ...stats.days.map((d) => d.qr + d.web));

  return (
    <>
      <PageHead title={`Hola, ${user.name.split(" ")[0]}`} desc="Lo más usado del día, a un toque." />

      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Estado de tu web" id="estado">
          <ul className="divide-y divide-[var(--p-line)]">
            <li className="flex items-center gap-4 py-3">
              <div className="flex-1">
                <div className="font-semibold">Web publicada</div>
                <div className="text-sm text-[var(--p-muted)]">{cafe.published ? "Cualquiera con el QR o el enlace la puede ver." : "Solo la ves tú. Publícala cuando esté lista."}</div>
              </div>
              <Switch on={cafe.published} label="Web publicada" action={togglePublished} />
            </li>
            <li className="flex items-center gap-4 py-3">
              <div className="flex-1">
                <div className="font-semibold">Aviso arriba de la web</div>
                <div className="text-sm text-[var(--p-muted)]">
                  {cafe.noticeText ? `«${cafe.noticeText}»` : <>Escribe el aviso en <Link className="underline" href="/panel/negocio#aviso">Mi negocio</Link>.</>}
                </div>
              </div>
              <Switch on={cafe.noticeOn} label="Mostrar aviso" action={toggleNotice} />
            </li>
          </ul>
        </Card>

        <Card title="Tu carta" id="carta-res" action={<Link href="/panel/carta" className={btnGhost}>Editar carta</Link>}>
          <dl className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-[var(--p-bg)] p-3"><dt className="text-sm text-[var(--p-muted)]">Productos</dt><dd className="text-2xl font-bold">{products.length}</dd></div>
            <div className="rounded-xl bg-[var(--p-bg)] p-3"><dt className="text-sm text-[var(--p-muted)]">Secciones</dt><dd className="text-2xl font-bold">{categories.length}</dd></div>
            <div className="rounded-xl bg-[var(--p-bg)] p-3"><dt className="text-sm text-[var(--p-muted)]">Hoy no hay</dt><dd className="text-2xl font-bold">{out.length}</dd></div>
          </dl>
          {noPrice.length > 0 && (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {noPrice.length === 1 ? "1 producto sale" : `${noPrice.length} productos salen`} como «Consultar» porque no tienen precio.
            </p>
          )}
        </Card>

        <Card title="Visitas de los últimos 14 días" id="visitas" desc={`${totalQr} desde el código QR · ${totalWeb} desde el enlace`} action={<Link href="/panel/qr" className={btnGhost}>Imprimir QR</Link>}>
          <div className="flex h-40 items-end gap-1" aria-hidden="true">
            {stats.days.map((d) => (
              <div key={d.day} className="flex h-full flex-1 flex-col justify-end" title={`${d.day}: ${d.qr} QR, ${d.web} enlace`}>
                <div className="rounded-t bg-[#9db7dc]" style={{ height: `${(d.web / max) * 100}%` }} />
                <div className="bg-[var(--p-brand)]" style={{ height: `${(d.qr / max) * 100}%` }} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-4 text-sm text-[var(--p-muted)]">
            <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-[var(--p-brand)]" /> Código QR</span>
            <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-[#9db7dc]" /> Enlace</span>
          </div>
          <table className="sr-only">
            <caption>Visitas por día</caption>
            <thead><tr><th>Día</th><th>QR</th><th>Enlace</th></tr></thead>
            <tbody>{stats.days.map((d) => <tr key={d.day}><td>{d.day}</td><td>{d.qr}</td><td>{d.web}</td></tr>)}</tbody>
          </table>
          {stats.tables.length > 0 && (
            <p className="mt-3 text-sm">Mesas que más escanean: {stats.tables.slice(0, 5).map(([t, n]) => `mesa ${t} (${n})`).join(", ")}</p>
          )}
        </Card>

        <Card title="Accesos rápidos" id="rapidos">
          <div className="grid gap-2 sm:grid-cols-2">
            <Link href="/panel/carta" className={btnGhost}>Marcar lo que no hay hoy</Link>
            <Link href="/panel/estilo" className={btnGhost}>Cambiar colores y letra</Link>
            <Link href="/panel/negocio" className={btnGhost}>Horario y WhatsApp</Link>
            <Link href={`/c/${cafe.slug}`} target="_blank" className={btnGhost}>Ver como cliente ↗</Link>
          </div>
        </Card>
      </div>
    </>
  );
}
