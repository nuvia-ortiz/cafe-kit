import { describe, expect, it } from "vitest";
import { DEFAULT_THEME, PRESETS, contrast, contrastWarnings, onColor, parseTheme, themeFromPreset, themeVars, type PresetKey } from "@/lib/theme";

describe("parseTheme", () => {
  it("falls back to defaults for garbage", () => {
    expect(parseTheme("not json")).toEqual(DEFAULT_THEME);
    expect(parseTheme(null)).toEqual(DEFAULT_THEME);
  });

  it("keeps valid keys and drops invalid ones one by one", () => {
    const t = parseTheme({
      palette: { ground: "#000000", ink: "red", accent: "#12ab34" },
      font: "playfair",
      radius: "triangle",
      layout: "grid",
      sections: { about: false, hacked: true },
    });
    expect(t.palette.ground).toBe("#000000");
    expect(t.palette.ink).toBe(DEFAULT_THEME.palette.ink);
    expect(t.palette.accent).toBe("#12AB34");
    expect(t.font).toBe("playfair");
    expect(t.radius).toBe(DEFAULT_THEME.radius);
    expect(t.layout).toBe("grid");
    expect(t.sections.about).toBe(false);
    expect("hacked" in t.sections).toBe(false);
  });

  it("never lets CSS injection through a colour", () => {
    const t = parseTheme({ palette: { accent: "#fff; background:url(x)" } });
    expect(t.palette.accent).toBe(DEFAULT_THEME.palette.accent);
  });
});

describe("colour helpers", () => {
  it("computes WCAG contrast", () => {
    expect(contrast("#000000", "#FFFFFF")).toBeCloseTo(21, 0);
    expect(contrast("#777777", "#777777")).toBe(1);
  });

  it("picks readable text for any button colour", () => {
    expect(onColor("#111111")).toBe("#FFFFFF");
    expect(onColor("#F2D08C")).toBe("#111111");
    for (const hex of ["#2F5D3A", "#A4502A", "#E0A526", "#2E5E8C", "#FFEE00", "#0000FF"]) {
      expect(contrast(hex, onColor(hex))).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("every preset passes AA for body text", () => {
    for (const k of Object.keys(PRESETS) as PresetKey[]) {
      expect(contrastWarnings(themeFromPreset(k).palette), k).toEqual([]);
    }
  });

  it("warns when the owner picks unreadable colours", () => {
    const w = contrastWarnings({ ...DEFAULT_THEME.palette, ink: "#DDDDDD", ground: "#FFFFFF", surface: "#FFFFFF" });
    expect(w.length).toBe(2);
  });

  it("muted text in every preset stays readable on the page", () => {
    for (const k of Object.keys(PRESETS) as PresetKey[]) {
      const v = themeVars(themeFromPreset(k));
      expect(contrast(v["--c-muted"], v["--c-ground"]), k).toBeGreaterThanOrEqual(4.5);
    }
  });
});
