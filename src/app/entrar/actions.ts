"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { endSession, loginAllowed, loginFailed, loginSucceeded, startSession, verifyLogin } from "@/lib/auth";

export type LoginState = { error?: string; email?: string };

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim().slice(0, 120);
  const password = String(form.get("password") ?? "").slice(0, 200);
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const key = `${ip}|${email.toLowerCase()}`;
  if (!loginAllowed(key)) return { error: "Demasiados intentos. Espera 10 minutos y vuelve a probar.", email };
  const user = email && password ? await verifyLogin(email, password) : null;
  if (!user) {
    loginFailed(key);
    return { error: "Correo o contraseña incorrectos.", email };
  }
  loginSucceeded(key);
  await startSession(user.id);
  redirect("/panel");
}

export async function logout() {
  await endSession();
  redirect("/entrar");
}
