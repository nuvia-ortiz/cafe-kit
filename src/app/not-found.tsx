import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#faf7f2] px-4 text-center text-[#231a14]">
      <div>
        <h1 className="text-3xl font-extrabold">No encontramos esta página</h1>
        <p className="mt-2 text-[#5b4a3e]">Puede que la cafetería haya cambiado su dirección o que la web aún no esté publicada.</p>
        <Link href="/" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-[#231a14] px-5 font-bold text-white">Ir al inicio</Link>
      </div>
    </main>
  );
}
