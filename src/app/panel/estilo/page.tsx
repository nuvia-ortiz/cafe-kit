import type { Metadata } from "next";
import { requireCafeId } from "@/lib/auth";
import { cafeById } from "@/lib/cafe";
import { storeMenu, toStoreCafe } from "@/lib/store";
import { PageHead } from "@/components/panel/ui";
import { StyleEditor } from "./editor";

export const metadata: Metadata = { title: "Panel · Estilo de la web" };

export default async function EstiloPage() {
  const { cafeId } = await requireCafeId();
  const cafe = (await cafeById(cafeId))!;
  return (
    <>
      <PageHead title="Estilo de la web" desc="Elige un punto de partida y ajústalo hasta que sea tuyo. La vista previa es tu web real." />
      <StyleEditor key={cafe.id} cafe={toStoreCafe(cafe)} menu={await storeMenu(cafeId)} />
    </>
  );
}
