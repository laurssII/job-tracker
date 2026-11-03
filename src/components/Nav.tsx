"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IS_DEMO } from "@/lib/mode";

const LINKS = [
  { href: "/", label: "Resumen" },
  { href: "/applications", label: "Solicitudes" },
  { href: "/board", label: "Tablero" },
];

export function Nav() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="font-semibold tracking-tight">
          Job Tracker
        </Link>
        <nav className="flex gap-1 text-sm">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-1.5 ${
                isActive(link.href)
                  ? "bg-slate-100 font-medium text-slate-900"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {IS_DEMO ? (
            // En la demo no hay servidor con los datos: el CSV se genera en el navegador.
            <button
              type="button"
              onClick={async () => {
                const [{ listApplications }, { downloadCsv }] = await Promise.all([
                  import("@/lib/local-store"),
                  import("@/lib/download"),
                ]);
                downloadCsv(listApplications());
              }}
              className="rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              Exportar CSV
            </button>
          ) : (
            <a
              href="/api/export"
              className="rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              Exportar CSV
            </a>
          )}
          <Link
            href="/applications/new"
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            + Nueva solicitud
          </Link>
        </div>
      </div>
    </header>
  );
}
