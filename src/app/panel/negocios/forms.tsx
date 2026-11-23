"use client";
import { useActionState } from "react";
import { createCafe, pickCafe, type Result } from "../actions";
import { Card, Notice, btnGhost, btnPrimary, inputCls, labelCls } from "@/components/panel/ui";

export function EditButton({ id }: { id: number }) {
  return <button type="button" onClick={() => pickCafe(id)} className={btnGhost}>Editar</button>;
}

export function NewCafeForm() {
  const [state, action, pending] = useActionState<Result, FormData>(createCafe, {});
  return (
    <Card title="Dar de alta una cafetería" id="alta" desc="Se crea como borrador con su cuenta de dueño. Envíale el correo y la contraseña inicial.">
      <form action={action} className="flex flex-col gap-3">
        <label className={labelCls}>Nombre de la cafetería<input name="name" required className={inputCls} /></label>
        <label className={labelCls}>Dirección web (opcional)<input name="slug" placeholder="se genera desde el nombre" className={inputCls} /></label>
        <label className={labelCls}>Estilo inicial
          <select name="preset" className={inputCls} defaultValue="clasico">
            <option value="clasico">Clásico</option><option value="colonial">Colonial</option><option value="moderno">Moderno</option><option value="nocturno">Nocturno</option>
          </select>
        </label>
        <label className={labelCls}>Nombre del dueño<input name="ownerName" required className={inputCls} /></label>
        <label className={labelCls}>Correo del dueño<input name="ownerEmail" type="email" required className={inputCls} /></label>
        <label className={labelCls}>Contraseña inicial (mín. 8)<input name="password" type="text" minLength={8} required autoComplete="off" className={inputCls} /></label>
        <Notice state={state} />
        <button disabled={pending} className={btnPrimary}>{pending ? "Creando…" : "Crear cafetería"}</button>
      </form>
    </Card>
  );
}
