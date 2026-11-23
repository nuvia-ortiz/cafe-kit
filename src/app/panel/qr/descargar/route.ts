import { currentUser } from "@/lib/auth";
import { cafeById } from "@/lib/cafe";
import { baseUrl, cafeQrUrl, qrInk, qrPng, qrSvg } from "@/lib/qr";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return new Response("Inicia sesión", { status: 401 });
  const cafeId = user.role === "owner" ? user.cafeId : Number((await cookies()).get("cafe_admin_pick")?.value) || null;
  const cafe = cafeId ? await cafeById(cafeId) : null;
  if (!cafe) return new Response("Sin cafetería", { status: 404 });

  const q = new URL(req.url).searchParams;
  const mesa = (q.get("mesa") ?? "").replace(/[^\w-]/g, "").slice(0, 10) || undefined;
  const url = cafeQrUrl(await baseUrl(), cafe.slug, mesa);
  const ink = qrInk(cafe.theme.palette.ink);
  const name = `qr-${cafe.slug}${mesa ? `-mesa-${mesa}` : ""}`;

  if (q.get("formato") === "svg") {
    return new Response(await qrSvg(url, ink), {
      headers: { "Content-Type": "image/svg+xml", "Content-Disposition": `attachment; filename="${name}.svg"` },
    });
  }
  return new Response(new Uint8Array(await qrPng(url, ink)), {
    headers: { "Content-Type": "image/png", "Content-Disposition": `attachment; filename="${name}.png"` },
  });
}
