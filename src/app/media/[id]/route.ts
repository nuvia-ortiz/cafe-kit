import { one } from "@/lib/db";

export async function GET(_req: Request, ctx: RouteContext<"/media/[id]">) {
  const { id } = await ctx.params;
  const row = await one<{ mime: string; data: ArrayBuffer }>("SELECT mime, data FROM media WHERE id = ?", [Number(id) || 0]);
  if (!row) return new Response("No encontrado", { status: 404 });
  return new Response(new Uint8Array(row.data), {
    headers: {
      "Content-Type": row.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
