import { expect, test, type Page } from "@playwright/test";

// One story, in order, on a fresh demo database: a customer scans, the owner edits, the customer sees it.

async function login(page: Page, email: string, password = "demo1234") {
  await page.goto("/entrar");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/panel$/);
}

test.describe.configure({ mode: "serial" });

test("customer scans the table QR and sends an order by WhatsApp", async ({ page }) => {
  await page.goto("/c/cafeteria-de-barrio?qr=1&mesa=4");
  await expect(page.getByRole("status").first()).toContainText("apagón");
  await expect(page.getByText("Estás en la mesa 4")).toBeVisible();

  // Out of stock: labelled and cannot be added
  const mamey = page.locator("#carta li", { hasText: "Batido de mamey" });
  await expect(mamey.getByText("Hoy no hay")).toBeVisible();
  await expect(mamey.getByRole("button")).toHaveCount(0);

  await page.locator("#carta").getByRole("button", { name: "Añadir Cortadito" }).click();
  await page.locator("#carta").getByRole("button", { name: "Añadir otro Cortadito" }).click();
  await page.locator("#carta").getByRole("button", { name: "Añadir Pan con lechón" }).click();
  await page.getByRole("button", { name: /Ver pedido \(3\)/ }).click();

  const dialog = page.getByRole("dialog", { name: "Tu pedido" });
  await expect(dialog.getByLabel("Mesa")).toHaveValue("4");
  await dialog.getByLabel("Tu nombre").fill("Ana");
  const href = decodeURIComponent((await dialog.getByTestId("send-whatsapp").getAttribute("href"))!);
  expect(href).toMatch(/^https:\/\/wa\.me\/5350000000\?text=/);
  expect(href).toContain("• 2 × Cortadito");
  expect(href).toContain("Mesa 4");
  expect(href).toContain("A nombre de: Ana");
});

test("wrong password is rejected without saying which part failed", async ({ page }) => {
  await page.goto("/entrar");
  await page.getByLabel("Correo").fill("dueno@demo.local");
  await page.getByLabel("Contraseña").fill("nope");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Correo" })).toHaveText("Correo o contraseña incorrectos.");
});

test("the panel is closed to anonymous visitors", async ({ page }) => {
  await page.goto("/panel/carta");
  await expect(page).toHaveURL(/\/entrar$/);
  const res = await page.request.get("/panel/qr/descargar");
  expect(res.status()).toBe(401);
});

test("owner changes a price and marks a product as sold out", async ({ page }, info) => {
  await login(page, "dueno@demo.local");
  await page.getByRole("link", { name: "Carta y precios" }).click();
  const price = page.getByLabel("Precio de Colada");
  // A retry runs on the same database, so it needs a price that isn't saved yet.
  const value = String(130 + info.retry * 5);
  await price.fill(value);
  await price.press("Enter");
  await expect(page.getByTestId("product-Colada").getByRole("status")).toHaveText("✓");
  await page.getByRole("switch", { name: "Flan: hoy hay" }).click();
  await expect(page.getByRole("switch", { name: "Flan: hoy hay" })).toHaveAttribute("aria-checked", "false");

  await page.goto("/c/cafeteria-de-barrio");
  await expect(page.locator("#carta li", { hasText: "Colada" })).toContainText(`${value} CUP`);
  await expect(page.locator("#carta li", { hasText: "Flan" })).toContainText("Hoy no hay");
});

test("owner adds a section and a product", async ({ page }) => {
  await login(page, "dueno@demo.local");
  await page.goto("/panel/carta");
  await page.getByLabel("Nombre de la sección").fill("Jugos");
  await page.getByRole("button", { name: "Crear sección" }).click();
  await page.getByRole("button", { name: "+ Añadir producto a Jugos" }).click();
  const dlg = page.getByRole("dialog");
  await dlg.getByLabel("Nombre", { exact: true }).fill("Jugo de guayaba");
  await dlg.getByLabel("Precio").fill("200");
  await dlg.getByLabel("Destacar en «Lo más pedido»").check();
  await dlg.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByTestId("product-Jugo de guayaba")).toBeVisible();

  await page.goto("/c/cafeteria-de-barrio");
  await expect(page.locator("[id^=cat-]").filter({ hasText: "Jugos" })).toContainText("Jugo de guayaba");
  await expect(page.getByRole("region", { name: "Lo más pedido" })).toContainText("Jugo de guayaba");
});

test("owner restyles the web and publishes it", async ({ page }) => {
  await login(page, "dueno@demo.local");
  await page.goto("/panel/estilo");
  await page.getByRole("button", { name: /Nocturno/ }).click();
  await expect(page.getByTestId("style-preview").locator("[data-theme-preset]")).toHaveAttribute("data-theme-preset", "nocturno");
  await page.getByText("Cuadrícula con fotos").click();
  await page.getByRole("button", { name: "Publicar estilo" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Estilo publicado." })).toBeVisible();

  await page.goto("/c/cafeteria-de-barrio");
  await expect(page.locator("[data-theme-preset]")).toHaveAttribute("data-theme-preset", "nocturno");
  const bg = await page.locator("[data-theme-preset]").evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg).toBe("rgb(23, 18, 15)");
});

test("owner prints the QR and per-table cards", async ({ page }) => {
  await login(page, "dueno@demo.local");
  await page.goto("/panel/qr");
  await expect(page.getByTestId("qr-url")).toHaveText("http://localhost:3200/c/cafeteria-de-barrio?qr=1");
  await expect(page.getByTestId("qr-poster").locator("svg")).toBeVisible();

  const png = await page.request.get("/panel/qr/descargar?formato=png&mesa=2");
  expect(png.headers()["content-type"]).toBe("image/png");
  expect((await png.body()).subarray(1, 4).toString()).toBe("PNG");

  await page.getByLabel("Número de mesas").fill("3");
  await page.getByRole("button", { name: "Generar hoja de mesas" }).click();
  await expect(page.getByRole("img", { name: /QR de la mesa/ })).toHaveCount(3);
});

test("a café owner cannot reach the platform admin", async ({ page }) => {
  await login(page, "colonial@demo.local");
  await page.goto("/panel/negocios");
  await expect(page).toHaveURL(/\/panel$/);
  await expect(page.locator("aside")).toContainText("Rincón Colonial");
});

test("platform admin creates a café that stays private until published", async ({ page, browser }) => {
  await login(page, "admin@demo.local");
  await page.goto("/panel/negocios");
  await page.getByLabel("Nombre de la cafetería").fill("Café del Parque");
  await page.getByLabel("Nombre del dueño").fill("Luis");
  await page.getByLabel("Correo del dueño").fill("luis@demo.local");
  await page.getByLabel("Contraseña inicial (mín. 8)").fill("parque2026");
  await page.getByRole("button", { name: "Crear cafetería" }).click();
  await expect(page.getByRole("status")).toContainText("/c/cafe-del-parque");

  const anon = await browser.newContext();
  const res = await (await anon.newPage()).goto("/c/cafe-del-parque");
  expect(res?.status()).toBe(404);

  const owner = await (await browser.newContext()).newPage();
  await login(owner, "luis@demo.local", "parque2026");
  await owner.getByRole("switch", { name: "Web publicada" }).click();
  await expect(owner.getByRole("switch", { name: "Web publicada" })).toHaveAttribute("aria-checked", "true");
  const res2 = await (await anon.newPage()).goto("/c/cafe-del-parque");
  expect(res2?.status()).toBe(200);
});
