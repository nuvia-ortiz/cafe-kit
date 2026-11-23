// Pure helpers for the order flow, shared by the browser cart and the unit tests.

export type CartLine = { id: number; name: string; price: number | null; qty: number };

export function formatPrice(n: number | null, currency: string) {
  if (n == null) return "Consultar";
  const v = Number.isInteger(n) ? n.toLocaleString("es-ES") : n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${v} ${currency}`;
}

export function cartTotal(lines: CartLine[]) {
  const priced = lines.filter((l) => l.price != null);
  return {
    items: lines.reduce((s, l) => s + l.qty, 0),
    total: priced.reduce((s, l) => s + (l.price as number) * l.qty, 0),
    hasUnpriced: priced.length !== lines.length,
  };
}

export type OrderInfo = { name: string; mode: "local" | "llevar" | "domicilio"; table?: string; address?: string; note?: string };

export function orderMessage(cafeName: string, lines: CartLine[], info: OrderInfo, currency: string) {
  const { total, hasUnpriced } = cartTotal(lines);
  const where =
    info.mode === "local"
      ? `Para tomar aquí${info.table ? ` · Mesa ${info.table}` : ""}`
      : info.mode === "llevar"
        ? "Para llevar"
        : `A domicilio: ${info.address?.trim() || "(sin dirección)"}`;
  const out = [
    `Hola ${cafeName}, quiero hacer un pedido:`,
    "",
    ...lines.map((l) => `• ${l.qty} × ${l.name}${l.price != null ? ` — ${formatPrice(l.price * l.qty, currency)}` : ""}`),
    "",
    `Total: ${formatPrice(total, currency)}${hasUnpriced ? " (+ productos a consultar)" : ""}`,
    where,
  ];
  if (info.name.trim()) out.push(`A nombre de: ${info.name.trim()}`);
  if (info.note?.trim()) out.push(`Nota: ${info.note.trim()}`);
  return out.join("\n");
}

/** wa.me wants the number in international format with digits only. */
export function whatsappLink(phone: string, text: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

/** Telegram cannot prefill a message to a user, so the panel copies the text and opens the chat. */
export function telegramLink(username: string) {
  return `https://t.me/${username.replace(/^@/, "").trim()}`;
}

export function telLink(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function initialsOf(name: string) {
  return (
    name
      .split(/\s+/)
      .filter((w) => w.length > 2 || /^[A-ZÁÉÍÓÚÑ]/.test(w))
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join("") || name.trim().charAt(0).toUpperCase()
  );
}
