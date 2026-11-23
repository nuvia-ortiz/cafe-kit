import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { LoginForm } from "./form";

export const metadata: Metadata = { title: "Entrar al panel" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await currentUser()) redirect("/panel");
  return (
    <main className="grid min-h-dvh place-items-center bg-[var(--p-bg)] px-4 text-[var(--p-ink)]">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--p-line)] bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Panel de tu cafetería</h1>
        <p className="mb-6 mt-1 text-sm text-[var(--p-muted)]">Entra para cambiar la carta, los precios y el estilo de tu web.</p>
        <LoginForm />
        <details className="mt-6 rounded-lg bg-[var(--p-bg)] p-3 text-sm">
          <summary className="cursor-pointer font-semibold">Cuentas de la demo</summary>
          <ul className="mt-2 space-y-1 text-[var(--p-muted)]">
            <li><code>dueno@demo.local</code> · dueño de una cafetería</li>
            <li><code>colonial@demo.local</code> · otra cafetería</li>
            <li><code>admin@demo.local</code> · administra todas</li>
            <li>Contraseña: <code>demo1234</code></li>
          </ul>
        </details>
        <p className="mt-4 text-center text-sm"><Link href="/" className="underline">Volver al inicio</Link></p>
      </div>
    </main>
  );
}
