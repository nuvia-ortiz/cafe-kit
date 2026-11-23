import { describe, expect, it } from "vitest";
import { cartTotal, formatPrice, initialsOf, orderMessage, slugify, telLink, telegramLink, whatsappLink } from "@/lib/order";

const lines = [
  { id: 1, name: "Cortadito", price: 150, qty: 2 },
  { id: 2, name: "Pan con lechón", price: 450, qty: 1 },
];

describe("order", () => {
  it("adds up the cart", () => {
    expect(cartTotal(lines)).toEqual({ items: 3, total: 750, hasUnpriced: false });
    expect(cartTotal([...lines, { id: 3, name: "Especial", price: null, qty: 1 }]).hasUnpriced).toBe(true);
  });

  it("formats prices the Spanish way", () => {
    expect(formatPrice(1500, "CUP")).toBe("1500 CUP".replace("1500", (1500).toLocaleString("es-ES")));
    expect(formatPrice(2.5, "USD")).toBe("2,50 USD");
    expect(formatPrice(null, "CUP")).toBe("Consultar");
  });

  it("writes a message the café can read at a glance", () => {
    const msg = orderMessage("Cafetería de Barrio", lines, { name: "Ana", mode: "local", table: "4", note: "sin azúcar" }, "CUP");
    expect(msg).toContain("Hola Cafetería de Barrio");
    expect(msg).toContain("• 2 × Cortadito — 300 CUP");
    expect(msg).toContain("Total: 750 CUP");
    expect(msg).toContain("Mesa 4");
    expect(msg).toContain("A nombre de: Ana");
    expect(msg).toContain("Nota: sin azúcar");
  });

  it("asks for the address on delivery", () => {
    expect(orderMessage("X", lines, { name: "", mode: "domicilio", address: "Calle 5 #12" }, "CUP")).toContain("A domicilio: Calle 5 #12");
  });

  it("builds channel links", () => {
    expect(whatsappLink("+53 5 123-4567", "hola mundo")).toBe("https://wa.me/5351234567?text=hola%20mundo");
    expect(telegramLink("@mi_cafe")).toBe("https://t.me/mi_cafe");
    expect(telLink("+53 (7) 000 0000")).toBe("tel:+5370000000");
  });

  it("slugifies Spanish names", () => {
    expect(slugify("Rincón Colonial & Café")).toBe("rincon-colonial-cafe");
    expect(slugify("  ¡Ñandú!  ")).toBe("nandu");
  });

  it("makes initials for cafés without logo", () => {
    expect(initialsOf("Cafetería de Barrio")).toBe("CB");
    expect(initialsOf("el té")).toBe("E");
  });
});
