"use client";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#c9cdd6] bg-white px-4 font-semibold">
      Imprimir
    </button>
  );
}
