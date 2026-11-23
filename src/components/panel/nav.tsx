"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ICONS: Record<string, string> = {
  home: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  store: "M4 7h16l-1 4H5L4 7Zm1 4v9h14v-9M9 20v-5h6v5",
  brush: "M14 4l6 6-9 9H5v-6l9-9Z",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  qr: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2",
  users: "M16 20v-2a4 4 0 0 0-8 0v2M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM20 20v-2a4 4 0 0 0-3-3.9",
  key: "M15 7a4 4 0 1 1-3.9 5H3v4h3v-2h2v2h3",
};

export function PanelNav({ items }: { items: { href: string; label: string; icon: string }[] }) {
  const path = usePathname();
  return (
    <nav aria-label="Panel" className="flex gap-1 overflow-x-auto lg:flex-col">
      {items.map((it) => {
        const active = it.href === "/panel" ? path === "/panel" : path.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 shrink-0 items-center gap-2.5 rounded-xl px-3 text-[15px] font-semibold ${active ? "bg-[var(--p-brand)] text-white" : "text-[var(--p-ink)] hover:bg-[#e8eaee]"}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5" aria-hidden="true"><path d={ICONS[it.icon]} /></svg>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
