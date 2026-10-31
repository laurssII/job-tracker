import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-2xl font-semibold">No encontrado</h1>
      <p className="mt-2 text-slate-600">Esta solicitud no existe o se ha eliminado.</p>
      <Link href="/applications" className="mt-6 inline-block text-sm font-medium text-blue-700 hover:underline">
        Volver a las solicitudes
      </Link>
    </div>
  );
}
