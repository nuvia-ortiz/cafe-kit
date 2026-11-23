"use client";
import { useActionState } from "react";
import { updatePassword, type Result } from "../actions";
import { Card, Notice, btnPrimary, inputCls, labelCls } from "@/components/panel/ui";

export function PasswordForm() {
  const [state, action, pending] = useActionState<Result, FormData>(updatePassword, {});
  return (
    <Card title="Cambiar contraseña" id="pw" desc="Al cambiarla se cierra la sesión en todos tus dispositivos.">
      <form action={action} className="flex flex-col gap-3">
        <label className={labelCls}>Contraseña actual<input name="current" type="password" autoComplete="current-password" required className={inputCls} /></label>
        <label className={labelCls}>Nueva contraseña (mín. 8)<input name="next" type="password" autoComplete="new-password" minLength={8} required className={inputCls} /></label>
        <label className={labelCls}>Repite la nueva<input name="repeat" type="password" autoComplete="new-password" minLength={8} required className={inputCls} /></label>
        <Notice state={state} />
        <button disabled={pending} className={btnPrimary}>Cambiar contraseña</button>
      </form>
    </Card>
  );
}
