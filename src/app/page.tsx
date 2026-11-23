import Link from "next/link";
import { allCafes } from "@/lib/cafe";
import { FONTS, PRESETS, themeVars, themeFromPreset, type PresetKey } from "@/lib/theme";

export const dynamic = "force-dynamic";

const FEATURES = [
  ["Carta con código QR", "El cliente escanea en la mesa o en el mostrador y ve la carta del día en su móvil. Un QR por mesa si quieres saber desde dónde piden."],
  ["Pedidos por WhatsApp, Telegram o llamada", "Arma el pedido en la web y te llega escrito, con total, mesa o dirección. Sin comisiones ni apps que instalar."],
  ["Un panel para cambiarlo todo", "Precios, lo que hoy no hay, horario, aviso de apagón, fotos, colores, letras y orden de la web. Sin saber programar."],
  ["Estilo propio", "Parte de un estilo y hazlo tuyo: cinco colores, seis tipos de letra, tres formas de carta. El panel avisa si algo no se lee bien."],
];

export default async function Home() {
  const cafes = (await allCafes()).filter((c) => c.published);
  return (
    <div className="min-h-dvh bg-[#faf7f2] text-[#231a14]">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-5">
        <span className="font-[family-name:var(--font-bricolage)] text-xl font-extrabold">Cafe Kit</span>
        <Link href="/entrar" className="inline-flex min-h-11 items-center rounded-full bg-[#231a14] px-5 font-bold text-white">Entrar al panel</Link>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 pb-14 pt-10 sm:pt-16">
          <h1 className="max-w-3xl font-[family-name:var(--font-bricolage)] text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            La web de tu cafetería, con su carta en un código QR.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#5b4a3e]">
            Una plantilla que cada cafetería personaliza desde su panel: la carta, los precios, el estilo y cómo le hacen los pedidos.
            Imprimes el QR, lo pones en la mesa y listo.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {cafes[0] && <Link href={`/c/${cafes[0].slug}`} className="inline-flex min-h-12 items-center rounded-full bg-[#2f5d3a] px-6 font-bold text-white">Ver una cafetería de ejemplo</Link>}
            <Link href="/entrar" className="inline-flex min-h-12 items-center rounded-full border-2 border-[#231a14] px-6 font-bold">Probar el panel</Link>
          </div>
        </section>

        <section aria-labelledby="que" className="bg-white">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <h2 id="que" className="font-[family-name:var(--font-bricolage)] text-3xl font-extrabold">Qué incluye</h2>
            <ul className="mt-6 grid gap-4 md:grid-cols-2">
              {FEATURES.map(([t, d]) => (
                <li key={t} className="rounded-2xl border border-[#eadfce] p-5">
                  <h3 className="text-lg font-bold">{t}</h3>
                  <p className="mt-1 leading-relaxed text-[#5b4a3e]">{d}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="estilos" className="mx-auto max-w-6xl px-4 py-14">
          <h2 id="estilos" className="font-[family-name:var(--font-bricolage)] text-3xl font-extrabold">Una plantilla, muchos estilos</h2>
          <p className="mt-2 text-[#5b4a3e]">Cuatro puntos de partida. Cada dueño los ajusta hasta que la web se parezca a su local.</p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(Object.keys(PRESETS) as PresetKey[]).map((k) => {
              const t = themeFromPreset(k);
              return (
                <li key={k} style={themeVars(t) as React.CSSProperties} className="overflow-hidden rounded-2xl border border-line bg-ground text-ink">
                  <div className="p-5" style={{ background: "var(--c-soft)" }}>
                    <div className="text-2xl font-extrabold leading-tight" style={{ fontFamily: FONTS[t.font].css }}>{PRESETS[k].label}</div>
                    <div className="mt-1 text-sm text-muted">{PRESETS[k].hint}</div>
                  </div>
                  <div className="flex flex-col gap-2 p-5">
                    {["Cortadito", "Pan con tortilla"].map((n) => (
                      <div key={n} className="flex items-center justify-between rounded-card border border-line bg-surface px-3 py-2 text-sm font-semibold">
                        {n}<span className="rounded-btn bg-accent px-2.5 py-1 text-xs text-on-accent">Añadir</span>
                      </div>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {cafes.length > 0 && (
          <section aria-labelledby="demos" className="bg-white">
            <div className="mx-auto max-w-6xl px-4 py-14">
              <h2 id="demos" className="font-[family-name:var(--font-bricolage)] text-3xl font-extrabold">Cafeterías de ejemplo</h2>
              <p className="mt-2 text-[#5b4a3e]">Mismo sistema, cada una con su carta y su estilo. Los precios son de ejemplo.</p>
              <ul className="mt-6 grid gap-4 md:grid-cols-2">
                {cafes.map((c) => (
                  <li key={c.id}>
                    <Link href={`/c/${c.slug}`} style={themeVars(c.theme) as React.CSSProperties} className="block rounded-2xl border border-line bg-ground p-6 text-ink hover:shadow-md">
                      <div className="font-display text-2xl font-extrabold">{c.name}</div>
                      <div className="mt-1 text-muted">{c.tagline}</div>
                      <div className="mt-4 inline-flex min-h-11 items-center rounded-btn bg-accent px-4 font-bold text-on-accent">Abrir su web</div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-8 text-sm text-[#5b4a3e]">
        Proyecto de portfolio · Next.js, SQLite y un panel hecho a mano.
      </footer>
    </div>
  );
}
