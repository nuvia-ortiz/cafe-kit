import Link from "next/link";
import { requireCafeId } from "@/lib/auth";
import { allCafes, cafeById } from "@/lib/cafe";
import { PanelNav } from "@/components/panel/nav";
import { logout } from "../entrar/actions";
import { CafePicker } from "./picker";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: LayoutProps<"/panel">) {
  const { user, cafeId } = await requireCafeId();
  const cafe = await cafeById(cafeId);
  const cafes = user.role === "super" ? await allCafes() : [];
  const items = [
    { href: "/panel", label: "Inicio", icon: "home" },
    { href: "/panel/negocio", label: "Mi negocio", icon: "store" },
    { href: "/panel/estilo", label: "Estilo de la web", icon: "brush" },
    { href: "/panel/carta", label: "Carta y precios", icon: "list" },
    { href: "/panel/qr", label: "Código QR", icon: "qr" },
    ...(user.role === "super" ? [{ href: "/panel/negocios", label: "Cafeterías", icon: "users" }] : []),
    { href: "/panel/cuenta", label: "Mi cuenta", icon: "key" },
  ];
  return (
    <div className="min-h-dvh bg-[var(--p-bg)] text-[var(--p-ink)]">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-4 p-3 sm:p-4 lg:flex-row lg:gap-6">
        <aside className="no-print shrink-0 lg:sticky lg:top-4 lg:h-[calc(100dvh-2rem)] lg:w-60">
          <div className="flex h-full flex-col gap-3 rounded-2xl border border-[var(--p-line)] bg-white p-3">
            <div className="px-2 pt-1">
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--p-muted)]">{user.role === "super" ? "Editando" : "Tu cafetería"}</div>
              {user.role === "super" ? (
                <CafePicker cafes={cafes.map((c) => ({ id: c.id, name: c.name }))} current={cafeId} />
              ) : (
                <div className="truncate text-lg font-bold">{cafe?.name}</div>
              )}
              {cafe && (
                <Link href={`/c/${cafe.slug}`} target="_blank" className="mt-1 inline-flex min-h-9 items-center text-sm font-semibold text-[var(--p-brand)] underline underline-offset-4">
                  Ver mi web ↗
                </Link>
              )}
            </div>
            <PanelNav items={items} />
            <form action={logout} className="mt-auto hidden lg:block">
              <div className="truncate px-3 pb-2 text-xs text-[var(--p-muted)]">{user.email}</div>
              <button className="min-h-11 w-full rounded-xl px-3 text-left text-[15px] font-semibold hover:bg-[#e8eaee]">Salir</button>
            </form>
          </div>
        </aside>
        <main className="min-w-0 flex-1 pb-16">{children}</main>
        <form action={logout} className="no-print lg:hidden">
          <button className="min-h-11 w-full rounded-xl border border-[var(--p-line)] bg-white font-semibold">Salir ({user.email})</button>
        </form>
      </div>
    </div>
  );
}
