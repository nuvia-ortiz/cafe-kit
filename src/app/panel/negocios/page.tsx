import type { Metadata } from "next";
import Link from "next/link";
import { requireSuper } from "@/lib/auth";
import { allCafes } from "@/lib/cafe";
import { all } from "@/lib/db";
import { Card, PageHead } from "@/components/panel/ui";
import { NewCafeForm, EditButton } from "./forms";

export const metadata: Metadata = { title: "Panel · Cafeterías" };

export default async function NegociosPage() {
  await requireSuper();
  const cafes = await allCafes();
  const owners = await all<{ cafe_id: number; email: string }>("SELECT cafe_id, email FROM users WHERE role = 'owner'");
  return (
    <>
      <PageHead title="Cafeterías" desc="Cada cafetería que contrata el servicio tiene su web, su dueño y su panel. Nadie ve los datos de otra." />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card title={`${cafes.length} cafeterías`} id="lista">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-[var(--p-muted)]"><tr><th className="py-2 pr-3 font-semibold">Nombre</th><th className="py-2 pr-3 font-semibold">Web</th><th className="py-2 pr-3 font-semibold">Dueño</th><th className="py-2 pr-3 font-semibold">Estado</th><th /></tr></thead>
              <tbody className="divide-y divide-[var(--p-line)]">
                {cafes.map((c) => (
                  <tr key={c.id}>
                    <td className="py-2 pr-3 font-semibold">{c.name}</td>
                    <td className="py-2 pr-3"><Link href={`/c/${c.slug}`} target="_blank" className="underline">/c/{c.slug}</Link></td>
                    <td className="py-2 pr-3">{owners.filter((o) => Number(o.cafe_id) === c.id).map((o) => o.email).join(", ") || "—"}</td>
                    <td className="py-2 pr-3">{c.published ? <span className="rounded-full bg-green-50 px-2 py-0.5 font-semibold text-green-800">Publicada</span> : <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-900">Borrador</span>}</td>
                    <td className="py-2"><EditButton id={c.id} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <NewCafeForm />
      </div>
    </>
  );
}
