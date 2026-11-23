import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { cafeBySlug, countVisit } from "@/lib/cafe";
import { currentUser } from "@/lib/auth";
import { storeMenu, toStoreCafe } from "@/lib/store";
import { Storefront } from "@/components/storefront";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/c/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const cafe = await cafeBySlug(slug);
  if (!cafe) return { title: "Cafetería no encontrada" };
  return {
    title: `${cafe.name} · Carta`,
    description: cafe.tagline || `Carta y pedidos de ${cafe.name}`,
  };
}

export async function generateViewport(props: PageProps<"/c/[slug]">): Promise<Viewport> {
  const { slug } = await props.params;
  const cafe = await cafeBySlug(slug);
  return { themeColor: cafe?.theme.palette.ground ?? "#ffffff" };
}

export default async function CafePage(props: PageProps<"/c/[slug]">) {
  const { slug } = await props.params;
  const sp = await props.searchParams;
  const cafe = await cafeBySlug(slug);
  if (!cafe) notFound();

  const user = await currentUser();
  const isEditor = !!user && (user.role === "super" || user.cafeId === cafe.id);
  if (!cafe.published && !isEditor) notFound();

  const mesa = typeof sp.mesa === "string" ? sp.mesa.replace(/[^\w-]/g, "").slice(0, 10) : undefined;
  const fromQr = sp.qr === "1";
  if (!isEditor) await countVisit(cafe.id, fromQr ? (mesa ? `qr:${mesa}` : "qr") : "web");

  return (
    <>
      {!cafe.published && (
        <p className="bg-yellow-200 px-4 py-2 text-center text-sm font-semibold text-yellow-950">
          Vista previa: esta web aún no está publicada y solo la ves tú.
        </p>
      )}
      <Storefront cafe={toStoreCafe(cafe)} menu={await storeMenu(cafe.id)} table={mesa} />
    </>
  );
}
