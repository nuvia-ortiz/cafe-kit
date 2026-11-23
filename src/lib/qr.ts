import "server-only";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { contrast } from "./theme";

/** Public base URL: PUBLIC_URL in production, otherwise whatever host the panel was opened on. */
export async function baseUrl() {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export function cafeQrUrl(base: string, slug: string, table?: string) {
  const u = new URL(`/c/${slug}`, base);
  u.searchParams.set("qr", "1");
  if (table) u.searchParams.set("mesa", table);
  return u.toString();
}

/** Dark modules in the café's text colour when it is dark enough to scan reliably, else black. */
export function qrInk(ink: string) {
  return contrast(ink, "#FFFFFF") >= 7 ? ink : "#000000";
}

export async function qrSvg(text: string, ink = "#000000") {
  return QRCode.toString(text, { type: "svg", errorCorrectionLevel: "M", margin: 2, color: { dark: ink, light: "#FFFFFF" } });
}

export async function qrPng(text: string, ink = "#000000") {
  return QRCode.toBuffer(text, { type: "png", errorCorrectionLevel: "M", margin: 2, width: 1024, color: { dark: ink, light: "#FFFFFF" } });
}
