// Small shared pieces of the panel, so every screen looks and behaves the same.
import type { ReactNode } from "react";

export function Card({ title, desc, children, id, action }: { title: string; desc?: string; children: ReactNode; id?: string; action?: ReactNode }) {
  return (
    <section aria-labelledby={id} className="rounded-2xl border border-[var(--p-line)] bg-white p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id={id} className="text-lg font-bold">{title}</h2>
          {desc && <p className="mt-0.5 text-sm text-[var(--p-muted)]">{desc}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function PageHead({ title, desc, children }: { title: string; desc?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {desc && <p className="mt-1 text-[var(--p-muted)]">{desc}</p>}
      </div>
      {children}
    </div>
  );
}

export const inputCls = "mt-1 w-full min-h-11 rounded-xl border border-[#c9cdd6] bg-white px-3 text-[15px] font-normal";
export const labelCls = "block text-sm font-semibold";
export const btnPrimary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--p-brand)] px-5 font-bold text-white disabled:opacity-60";
export const btnGhost = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#c9cdd6] bg-white px-4 font-semibold disabled:opacity-60";

export function Notice({ state }: { state: { ok?: string; error?: string } }) {
  if (state.error) return <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{state.error}</p>;
  if (state.ok) return <p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-green-800">{state.ok}</p>;
  return null;
}
