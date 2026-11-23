"use client";
import { useState, useTransition } from "react";
import { Storefront, type StoreCafe, type StoreMenu } from "@/components/storefront";
import {
  FONTS, HEROES, LAYOUTS, PRESETS, RADII, contrastWarnings, themeFromPreset,
  type FontKey, type Palette, type PresetKey, type Theme,
} from "@/lib/theme";
import { saveStyle, type Result } from "../actions";
import { Card, Notice, btnGhost, btnPrimary, labelCls } from "@/components/panel/ui";

const COLOR_LABELS: Record<keyof Palette, string> = {
  ground: "Fondo de la página",
  surface: "Fondo de las tarjetas",
  ink: "Texto",
  accent: "Botones principales",
  accent2: "Detalles y logo",
};
const SECTION_LABELS: Record<keyof Theme["sections"], string> = {
  featured: "Lo más pedido",
  about: "Quiénes somos",
  hours: "Horario",
  location: "Dirección y mapa",
  payments: "Formas de pago",
};

function Choice<T extends string>({ name, value, options, onChange }: { name: string; value: T; options: Record<T, string>; onChange: (v: T) => void }) {
  return (
    <div role="radiogroup" aria-label={name} className="flex flex-wrap gap-2">
      {(Object.entries(options) as [T, string][]).map(([k, label]) => (
        <label key={k} className={`flex min-h-11 cursor-pointer items-center rounded-xl border-2 px-3 text-sm font-semibold ${value === k ? "border-[var(--p-brand)] bg-[#eaf1fb]" : "border-[var(--p-line)] bg-white"}`}>
          <input type="radio" name={name} value={k} checked={value === k} onChange={() => onChange(k)} className="sr-only" />
          {label}
        </label>
      ))}
    </div>
  );
}

export function StyleEditor({ cafe, menu }: { cafe: StoreCafe; menu: StoreMenu }) {
  const [theme, setTheme] = useState<Theme>(cafe.theme);
  const [saved, setSaved] = useState<string>(JSON.stringify(cafe.theme));
  const [device, setDevice] = useState<"movil" | "pc">("movil");
  const [state, setState] = useState<Result>({});
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(theme) !== saved;
  const warnings = contrastWarnings(theme.palette);

  const set = (patch: Partial<Theme>) => {
    setState({});
    setTheme((t) => ({ ...t, ...patch }));
  };
  const setColor = (k: keyof Palette, v: string) => set({ preset: "custom", palette: { ...theme.palette, [k]: v.toUpperCase() } });

  const publish = () =>
    start(async () => {
      const json = JSON.stringify(theme);
      const r = await saveStyle(json);
      setState(r);
      if (r.ok) setSaved(json);
    });

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-4">
        <Card title="Punto de partida" id="preset" desc="Cambia de golpe colores, letra y esquinas. Después ajusta lo que quieras.">
          <div className="grid gap-2 sm:grid-cols-2">
            {(Object.entries(PRESETS) as [PresetKey, (typeof PRESETS)[PresetKey]][]).map(([k, p]) => (
              <button
                key={k}
                type="button"
                aria-pressed={theme.preset === k}
                onClick={() => set(themeFromPreset(k, theme))}
                className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left ${theme.preset === k ? "border-[var(--p-brand)]" : "border-[var(--p-line)]"}`}
              >
                <span className="flex gap-1" aria-hidden="true">
                  {[p.palette.ground, p.palette.accent, p.palette.accent2].map((c) => (
                    <span key={c} className="size-6 rounded-md border border-black/10" style={{ background: c }} />
                  ))}
                </span>
                <span>
                  <span className="block text-[17px] font-bold" style={{ fontFamily: FONTS[p.font].css }}>{p.label}</span>
                  <span className="text-xs text-[var(--p-muted)]">{p.hint}</span>
                </span>
              </button>
            ))}
          </div>
          {theme.preset === "custom" && <p className="mt-2 text-sm text-[var(--p-muted)]">Estás usando colores propios.</p>}
        </Card>

        <Card title="Colores" id="colores" desc="El color del texto de cada botón se elige solo para que siempre se lea.">
          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(COLOR_LABELS) as (keyof Palette)[]).map((k) => (
              <div key={k} className="flex items-center gap-3">
                <input
                  type="color"
                  aria-label={COLOR_LABELS[k]}
                  value={theme.palette[k]}
                  onChange={(e) => setColor(k, e.target.value)}
                  className="h-11 w-14 shrink-0 cursor-pointer rounded-lg border border-[#c9cdd6] bg-white p-1"
                />
                <label className="min-w-0 flex-1 text-sm font-semibold">
                  {COLOR_LABELS[k]}
                  {/* uncontrolled so half-typed codes are allowed; remounts when the picker changes the colour */}
                  <input
                    key={theme.palette[k]}
                    defaultValue={theme.palette[k]}
                    onChange={(e) => /^#[0-9a-fA-F]{6}$/.test(e.target.value) && setColor(k, e.target.value)}
                    maxLength={7}
                    spellCheck={false}
                    className="mt-0.5 block w-full rounded-lg border border-[#c9cdd6] px-2 py-1 font-mono text-sm font-normal"
                  />
                </label>
              </div>
            ))}
          </div>
          {warnings.length > 0 && (
            <div role="alert" className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Ojo, puede costar leer: {warnings.map((w) => `${w.pair.toLowerCase()} (${w.ratio}:1, lo mínimo es 4,5:1)`).join("; ")}.
            </div>
          )}
        </Card>

        <Card title="Letras y formas" id="letras">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelCls}>Letra de los títulos
              <select value={theme.font} onChange={(e) => set({ font: e.target.value as FontKey })} className="mt-1 min-h-11 w-full rounded-xl border border-[#c9cdd6] bg-white px-2">
                {(Object.entries(FONTS) as [FontKey, (typeof FONTS)[FontKey]][]).map(([k, f]) => <option key={k} value={k}>{f.label}</option>)}
              </select>
            </label>
            <label className={labelCls}>Letra del texto
              <select value={theme.bodyFont} onChange={(e) => set({ bodyFont: e.target.value as FontKey })} className="mt-1 min-h-11 w-full rounded-xl border border-[#c9cdd6] bg-white px-2">
                {(Object.entries(FONTS) as [FontKey, (typeof FONTS)[FontKey]][]).map(([k, f]) => <option key={k} value={k}>{f.label}</option>)}
              </select>
            </label>
          </div>
          <div className="mt-4 text-sm font-semibold">Esquinas</div>
          <div className="mt-2"><Choice name="Esquinas" value={theme.radius} options={RADII} onChange={(radius) => set({ radius })} /></div>
        </Card>

        <Card title="Cómo se ordena la web" id="orden">
          <div className="text-sm font-semibold">Portada</div>
          <div className="mt-2"><Choice name="Portada" value={theme.hero} options={HEROES} onChange={(hero) => set({ hero })} /></div>
          {theme.hero === "image" && !cafe.heroUrl && (
            <p className="mt-2 text-sm text-amber-900">Sube la foto en «Mi negocio» → Foto de portada. Mientras tanto se usa el color.</p>
          )}
          <div className="mt-4 text-sm font-semibold">Carta</div>
          <div className="mt-2"><Choice name="Carta" value={theme.layout} options={LAYOUTS} onChange={(layout) => set({ layout })} /></div>
          <div className="mt-4 text-sm font-semibold">Secciones que se muestran</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {(Object.keys(SECTION_LABELS) as (keyof Theme["sections"])[]).map((k) => (
              <label key={k} className="flex min-h-11 items-center gap-2 rounded-xl border border-[var(--p-line)] px-3 text-sm">
                <input type="checkbox" className="size-5" checked={theme.sections[k]} onChange={(e) => set({ sections: { ...theme.sections, [k]: e.target.checked } })} />
                {SECTION_LABELS[k]}
              </label>
            ))}
          </div>
        </Card>

        <div className="sticky bottom-3 z-10 flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--p-line)] bg-white/95 p-3 backdrop-blur">
          <button type="button" onClick={publish} disabled={pending || !dirty} className={btnPrimary}>{pending ? "Publicando…" : "Publicar estilo"}</button>
          <button type="button" onClick={() => { setTheme(JSON.parse(saved)); setState({}); }} disabled={!dirty || pending} className={btnGhost}>Deshacer cambios</button>
          <div className="min-w-0 flex-1">{dirty && !state.error ? <span className="text-sm text-[var(--p-muted)]">Cambios sin publicar</span> : <Notice state={state} />}</div>
        </div>
      </div>

      <div className="flex flex-col gap-3 xl:sticky xl:top-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--p-muted)]">Vista previa</h2>
          <div role="radiogroup" aria-label="Dispositivo" className="flex rounded-xl border border-[var(--p-line)] bg-white p-1">
            {(["movil", "pc"] as const).map((d) => (
              <label key={d} className={`flex min-h-9 cursor-pointer items-center rounded-lg px-3 text-sm font-semibold ${device === d ? "bg-[var(--p-brand)] text-white" : ""}`}>
                <input type="radio" name="device" className="sr-only" checked={device === d} onChange={() => setDevice(d)} />
                {d === "movil" ? "Móvil" : "Ordenador"}
              </label>
            ))}
          </div>
        </div>
        <div
          className={`mx-auto w-full overflow-hidden border-[#1a1d23] bg-white ${device === "movil" ? "max-w-[390px] rounded-[32px] border-[10px]" : "rounded-xl border"}`}
        >
          {/* transform makes the storefront's fixed bars stick to this frame instead of the window */}
          <div className="h-[72dvh] overflow-y-auto" style={{ transform: "translateZ(0)" }} data-testid="style-preview">
            <Storefront cafe={{ ...cafe, theme }} menu={menu} preview />
          </div>
        </div>
      </div>
    </div>
  );
}
