import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PageHead } from "@/components/panel/ui";
import { PasswordForm } from "./form";

export const metadata: Metadata = { title: "Panel · Mi cuenta" };

export default async function CuentaPage() {
  const user = await requireUser();
  return (
    <>
      <PageHead title="Mi cuenta" desc={`Entras como ${user.email}.`} />
      <div className="max-w-lg"><PasswordForm /></div>
    </>
  );
}
