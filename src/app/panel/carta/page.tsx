import type { Metadata } from "next";
import { requireCafeId } from "@/lib/auth";
import { cafeById, mediaUrl, menuOf } from "@/lib/cafe";
import { PageHead } from "@/components/panel/ui";
import { MenuEditor } from "./editor";

export const metadata: Metadata = { title: "Panel · Carta y precios" };

export default async function CartaPage() {
  const { cafeId } = await requireCafeId();
  const cafe = (await cafeById(cafeId))!;
  const { categories, products } = await menuOf(cafeId);
  return (
    <>
      <PageHead title="Carta y precios" desc="Cambia un precio y sal del campo: se guarda solo. El interruptor marca lo que hoy no hay." />
      <MenuEditor
        currency={cafe.currency}
        categories={categories}
        products={products.map((p) => ({ ...p, imageUrl: mediaUrl(p.imageId) }))}
      />
    </>
  );
}
