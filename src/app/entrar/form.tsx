"use client";
import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  const input = "mt-1 w-full min-h-12 rounded-xl border border-[#c9cdd6] bg-white px-3 text-base";
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <label className="text-sm font-semibold">Correo
        <input name="email" type="email" autoComplete="username" required defaultValue={state.email} className={input} />
      </label>
      <label className="text-sm font-semibold">Contraseña
        <input name="password" type="password" autoComplete="current-password" required className={input} />
      </label>
      {state.error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{state.error}</p>}
      <button disabled={pending} className="min-h-12 rounded-xl bg-[var(--p-brand)] font-bold text-white disabled:opacity-60">
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
