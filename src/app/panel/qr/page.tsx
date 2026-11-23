import type { Metadata } from "next";
import { requireCafeId } from "@/lib/auth";
import { cafeById, mediaUrl } from "@/lib/cafe";
import { baseUrl, cafeQrUrl, qrInk, qrSvg } from "@/lib/qr";
import { themeVars } from "@/lib/theme";
import { Card, PageHead, btnGhost, btnPrimary, inputCls, labelCls } from "@/components/panel/ui";
import { initialsOf } from "@/lib/order";
import { PrintButton } from "./print";

export const metadata: Metadata = { title: "Panel · Código QR" };

/* eslint-disable @next/next/no-img-element */

function LogoTile({ size, logo, name }: { size: number; logo: string | null; name: string }) {
  return logo ? (
    <img src={logo} alt="" className="rounded-card object-cover" style={{ width: size, height: size }} />
  ) : (
    <span aria-hidden="true" className="grid place-items-center rounded-card bg-accent2 font-display font-extrabold text-on-accent2" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {initialsOf(name)}
    </span>
  );
}

export default async function QrPage(props: PageProps<"/panel/qr">) {
  const { cafeId } = await requireCafeId();
  const cafe = (await cafeById(cafeId))!;
  const sp = await props.searchParams;
  const mesas = Math.min(60, Math.max(0, Number(sp.mesas) || 0));
  const base = await baseUrl();
  const url = cafeQrUrl(base, cafe.slug);
  const ink = qrInk(cafe.theme.palette.ink);
  const svg = await qrSvg(url, ink);
  const tableSvgs = await Promise.all(Array.from({ length: mesas }, (_, i) => qrSvg(cafeQrUrl(base, cafe.slug, String(i + 1)), ink)));
  const vars = themeVars(cafe.theme) as React.CSSProperties;
  const logo = mediaUrl(cafe.logoId);

  return (
    <>
      <div className="no-print">
        <PageHead title="Código QR" desc="Imprímelo y ponlo en el mostrador o en cada mesa. Al escanearlo, el cliente abre tu carta y puede pedir." />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="no-print flex flex-col gap-4">
          <Card title="Tu enlace" id="enlace" desc="Es el mismo que lleva el QR. También puedes compartirlo por WhatsApp o ponerlo en tus redes.">
            <code className="block break-all rounded-xl bg-[var(--p-bg)] p-3 text-sm" data-testid="qr-url">{url}</code>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href="/panel/qr/descargar?formato=png" className={btnPrimary} download>Descargar PNG</a>
              <a href="/panel/qr/descargar?formato=svg" className={btnGhost} download>Descargar SVG (imprenta)</a>
              <PrintButton />
            </div>
          </Card>

          <Card title="Un QR por mesa" id="mesas" desc="Cada código dice en qué mesa está el cliente: el pedido te llega con el número de mesa y ves qué mesas escanean más.">
            <form className="flex flex-wrap items-end gap-2">
              <label className={labelCls}>Número de mesas<input type="number" name="mesas" min={1} max={60} defaultValue={mesas || 6} className={`${inputCls} w-32`} /></label>
              <button className={btnPrimary}>Generar hoja de mesas</button>
            </form>
            {mesas > 0 && <p className="mt-2 text-sm text-[var(--p-muted)]">Abajo tienes {mesas} tarjetas. Pulsa «Imprimir» y recórtalas.</p>}
          </Card>
        </div>

        {/* Poster: what gets printed when there is no table sheet */}
        <div className={mesas ? "no-print" : ""}>
          <div style={vars} className="mx-auto flex max-w-[380px] flex-col items-center gap-4 rounded-card border border-line bg-ground p-8 text-center text-ink print:max-w-none print:border-0 print:p-16" data-testid="qr-poster">
            <LogoTile size={64} logo={logo} name={cafe.name} />
            <div className="font-display text-3xl font-extrabold leading-tight">{cafe.name}</div>
            <div className="w-full max-w-[280px] rounded-card bg-white p-3 print:max-w-[420px]" role="img" aria-label={`Código QR que abre ${url}`} dangerouslySetInnerHTML={{ __html: svg }} />
            <div className="font-display text-xl font-bold">Escanea para ver la carta y pedir</div>
            <div className="text-sm text-muted">Apunta con la cámara del móvil</div>
          </div>
        </div>
      </div>

      {mesas > 0 && (
        <section aria-label="Hoja de mesas" className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 print:mt-0 print:grid-cols-3 print:gap-4">
          {tableSvgs.map((s, i) => (
            <div key={i} style={vars} className="flex break-inside-avoid flex-col items-center gap-2 rounded-card border-2 border-dashed border-line bg-ground p-4 text-center text-ink">
              <div className="flex items-center gap-2">
                <LogoTile size={28} logo={logo} name={cafe.name} />
                <span className="font-display text-lg font-extrabold">{cafe.name}</span>
              </div>
              <div className="w-full max-w-[180px] rounded-card bg-white p-2" role="img" aria-label={`QR de la mesa ${i + 1}`} dangerouslySetInnerHTML={{ __html: s }} />
              <div className="font-display text-2xl font-extrabold">Mesa {i + 1}</div>
              <div className="text-xs text-muted">Escanea y pide desde la mesa</div>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
