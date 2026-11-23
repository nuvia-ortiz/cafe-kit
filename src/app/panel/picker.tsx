"use client";
import { pickCafe } from "./actions";

export function CafePicker({ cafes, current }: { cafes: { id: number; name: string }[]; current: number }) {
  return (
    <label className="block">
      <span className="sr-only">Cafetería que editas</span>
      <select
        value={current}
        onChange={(e) => pickCafe(Number(e.target.value))}
        className="mt-1 min-h-11 w-full rounded-xl border border-[#c9cdd6] bg-white px-2 font-bold"
      >
        {cafes.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </label>
  );
}
