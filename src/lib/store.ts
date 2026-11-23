import "server-only";
import { mediaUrl, menuOf, type Cafe } from "./cafe";
import type { StoreCafe, StoreMenu } from "@/components/storefront";

/** Plain, serialisable shape the public site and the panel preview receive. */
export function toStoreCafe(c: Cafe): StoreCafe {
  return {
    slug: c.slug, name: c.name, tagline: c.tagline, about: c.about, address: c.address, mapUrl: c.mapUrl, hours: c.hours,
    whatsapp: c.whatsapp, telegram: c.telegram, phone: c.phone, channels: c.channels, payments: c.payments, currency: c.currency,
    noticeOn: c.noticeOn, noticeText: c.noticeText, theme: c.theme, logoUrl: mediaUrl(c.logoId), heroUrl: mediaUrl(c.heroId),
  };
}

export async function storeMenu(cafeId: number): Promise<StoreMenu> {
  const { categories, products } = await menuOf(cafeId);
  return {
    categories: categories.map(({ id, name }) => ({ id, name })),
    products: products.map((p) => ({
      id: p.id, categoryId: p.categoryId, name: p.name, description: p.description, price: p.price,
      available: p.available, featured: p.featured, imageUrl: mediaUrl(p.imageId),
    })),
  };
}
