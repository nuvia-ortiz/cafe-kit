import type { Metadata } from "next";
import { requireCafeId } from "@/lib/auth";
import { cafeById, mediaUrl } from "@/lib/cafe";
import { PageHead } from "@/components/panel/ui";
import { BusinessForm, ImageForm } from "./forms";

export const metadata: Metadata = { title: "Panel · Mi negocio" };

export default async function NegocioPage() {
  const { cafeId } = await requireCafeId();
  const c = (await cafeById(cafeId))!;
  return (
    <>
      <PageHead title="Mi negocio" desc="Datos que ven tus clientes y cómo te hacen los pedidos." />
      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <BusinessForm
          key={c.id}
          cafe={{
            name: c.name, tagline: c.tagline, about: c.about, address: c.address, mapUrl: c.mapUrl, hours: c.hours,
            whatsapp: c.whatsapp, telegram: c.telegram, phone: c.phone, channels: c.channels, payments: c.payments,
            currency: c.currency, noticeOn: c.noticeOn, noticeText: c.noticeText,
          }}
        />
        <div className="flex flex-col gap-4">
          <ImageForm kind="logo" title="Logo" desc="Cuadrado, mínimo 200 × 200 px. Si no subes uno, usamos tus iniciales." url={mediaUrl(c.logoId)} />
          <ImageForm kind="hero" title="Foto de portada" desc="Horizontal. Se ve si eliges «Foto de portada» en Estilo." url={mediaUrl(c.heroId)} />
        </div>
      </div>
    </>
  );
}
