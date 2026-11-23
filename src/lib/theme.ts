// Theme model shared by the public site, the live preview in the panel and the printable QR poster.
// Everything a café can change about its look lives here, so a new option only needs adding once.

export const FONTS = {
  bricolage: { label: "Bricolage (cercana)", css: "var(--font-bricolage), system-ui, sans-serif" },
  fraunces: { label: "Fraunces (clásica)", css: "var(--font-fraunces), Georgia, serif" },
  playfair: { label: "Playfair (elegante)", css: "var(--font-playfair), Georgia, serif" },
  space: { label: "Space Grotesk (moderna)", css: "var(--font-space), system-ui, sans-serif" },
  nunito: { label: "Nunito (redondeada)", css: "var(--font-nunito), system-ui, sans-serif" },
  inter: { label: "Inter (neutra)", css: "var(--font-inter), system-ui, sans-serif" },
} as const;
export type FontKey = keyof typeof FONTS;

export const RADII = { round: "Redondeado", soft: "Suave", square: "Recto" } as const;
export type RadiusKey = keyof typeof RADII;

export const LAYOUTS = { list: "Lista", cards: "Tarjetas", grid: "Cuadrícula con fotos" } as const;
export type LayoutKey = keyof typeof LAYOUTS;

export const HEROES = { color: "Color de fondo", image: "Foto de portada", minimal: "Solo texto" } as const;
export type HeroKey = keyof typeof HEROES;

export type Palette = {
  ground: string; // page background
  surface: string; // cards
  ink: string; // main text
  accent: string; // main buttons
  accent2: string; // badges, logo tile, details
};

export type Theme = {
  preset: PresetKey | "custom";
  palette: Palette;
  font: FontKey;
  bodyFont: FontKey;
  radius: RadiusKey;
  layout: LayoutKey;
  hero: HeroKey;
  sections: { featured: boolean; about: boolean; hours: boolean; payments: boolean; location: boolean };
};

export const PRESETS = {
  clasico: {
    label: "Clásico",
    hint: "Cálido, de barrio",
    palette: { ground: "#F5EFE4", surface: "#FFFDF8", ink: "#2B1B14", accent: "#2F5D3A", accent2: "#A4502A" },
    font: "bricolage",
    radius: "round",
  },
  colonial: {
    label: "Colonial",
    hint: "Casona, tejas, azul",
    palette: { ground: "#FBF4E6", surface: "#FFFFFF", ink: "#3A2416", accent: "#A4502A", accent2: "#2E5E8C" },
    font: "fraunces",
    radius: "soft",
  },
  moderno: {
    label: "Moderno",
    hint: "Limpio, de especialidad",
    palette: { ground: "#F4F4F2", surface: "#FFFFFF", ink: "#111111", accent: "#111111", accent2: "#E0A526" },
    font: "space",
    radius: "square",
  },
  nocturno: {
    label: "Nocturno",
    hint: "Oscuro, para la noche",
    palette: { ground: "#17120F", surface: "#231B16", ink: "#F3E9DD", accent: "#E0A526", accent2: "#C8643B" },
    font: "playfair",
    radius: "soft",
  },
} as const satisfies Record<string, { label: string; hint: string; palette: Palette; font: FontKey; radius: RadiusKey }>;
export type PresetKey = keyof typeof PRESETS;

export const DEFAULT_THEME: Theme = {
  preset: "clasico",
  palette: { ...PRESETS.clasico.palette },
  font: "bricolage",
  bodyFont: "inter",
  radius: "round",
  layout: "cards",
  hero: "color",
  sections: { featured: true, about: true, hours: true, payments: true, location: true },
};

const HEX = /^#[0-9a-fA-F]{6}$/;

/** Parses whatever is stored, falling back to defaults key by key so old rows keep working after new options appear. */
export function parseTheme(raw: unknown): Theme {
  let v: Record<string, unknown> = {};
  if (typeof raw === "string") {
    try {
      v = JSON.parse(raw);
    } catch {
      v = {};
    }
  } else if (raw && typeof raw === "object") v = raw as Record<string, unknown>;

  const p = (v.palette ?? {}) as Record<string, unknown>;
  const palette = Object.fromEntries(
    (Object.keys(DEFAULT_THEME.palette) as (keyof Palette)[]).map((k) => [
      k,
      typeof p[k] === "string" && HEX.test(p[k] as string) ? (p[k] as string).toUpperCase() : DEFAULT_THEME.palette[k],
    ]),
  ) as Palette;
  const pick = <T extends string>(val: unknown, allowed: Record<T, unknown>, fallback: T): T =>
    typeof val === "string" && val in allowed ? (val as T) : fallback;
  const s = (v.sections ?? {}) as Record<string, unknown>;
  const sections = Object.fromEntries(
    Object.entries(DEFAULT_THEME.sections).map(([k, d]) => [k, typeof s[k] === "boolean" ? s[k] : d]),
  ) as Theme["sections"];

  return {
    preset: pick(v.preset, { ...PRESETS, custom: 1 }, DEFAULT_THEME.preset),
    palette,
    font: pick(v.font, FONTS, DEFAULT_THEME.font),
    bodyFont: pick(v.bodyFont, FONTS, DEFAULT_THEME.bodyFont),
    radius: pick(v.radius, RADII, DEFAULT_THEME.radius),
    layout: pick(v.layout, LAYOUTS, DEFAULT_THEME.layout),
    hero: pick(v.hero, HEROES, DEFAULT_THEME.hero),
    sections,
  };
}

export function themeFromPreset(key: PresetKey, base: Theme = DEFAULT_THEME): Theme {
  const p = PRESETS[key];
  return { ...base, preset: key, palette: { ...p.palette }, font: p.font, radius: p.radius };
}

// --- colour maths (WCAG 2.x relative luminance) ---

function channel(c: number) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}
export function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}
export function contrast(a: string, b: string) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
/** Text colour that reads best on top of `bg`: the owner never has to pick it. */
export function onColor(bg: string) {
  return contrast(bg, "#FFFFFF") >= contrast(bg, "#111111") ? "#FFFFFF" : "#111111";
}
/** Mix two hex colours; t = 0 → a, t = 1 → b. */
export function mix(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return "#" + ((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1).toUpperCase();
}

export type ContrastWarning = { pair: string; ratio: number };
/** Pairs that fall under WCAG AA (4.5:1 for body text) so the panel can warn before publishing. */
export function contrastWarnings(p: Palette): ContrastWarning[] {
  const checks: [string, string, string][] = [
    ["Texto sobre el fondo", p.ink, p.ground],
    ["Texto sobre las tarjetas", p.ink, p.surface],
  ];
  return checks
    .map(([pair, a, b]) => ({ pair, ratio: Math.round(contrast(a, b) * 10) / 10 }))
    .filter((w) => w.ratio < 4.5);
}

/** CSS custom properties the public site reads; computed on the server so there is no flash of the wrong style. */
export function themeVars(t: Theme): Record<string, string> {
  const p = t.palette;
  const dark = luminance(p.ground) < 0.2;
  const radius = { round: ["999px", "20px"], soft: ["12px", "14px"], square: ["4px", "6px"] }[t.radius];
  return {
    "--c-ground": p.ground,
    "--c-surface": p.surface,
    "--c-ink": p.ink,
    "--c-muted": mix(p.ink, p.ground, 0.32),
    "--c-line": mix(p.ink, p.surface, dark ? 0.78 : 0.86),
    "--c-accent": p.accent,
    "--c-on-accent": onColor(p.accent),
    "--c-accent2": p.accent2,
    "--c-on-accent2": onColor(p.accent2),
    "--c-soft": mix(p.accent2, p.surface, 0.85),
    "--f-display": FONTS[t.font].css,
    "--f-body": FONTS[t.bodyFont].css,
    "--r-btn": radius[0],
    "--r-card": radius[1],
  };
}
