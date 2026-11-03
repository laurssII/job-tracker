"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Controls } from "@/components/Controls";
import { useLang } from "@/i18n/LanguageProvider";
import { IS_DEMO } from "@/lib/mode";

export function Nav() {
  const pathname = usePathname();
  const { lang, t } = useLang();
  const links = [
    { href: "/", label: t.nav.summary },
    { href: "/applications", label: t.nav.applications },
    { href: "/board", label: t.nav.board },
  ];
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="font-semibold tracking-tight">
          Job Tracker
        </Link>
        <nav aria-label={t.nav.mainNav} className="flex gap-1 text-sm">
          {links.map((link) => (
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
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          {IS_DEMO ? (
            // En la demo no hay servidor con los datos: el CSV se genera en el navegador.
            <button
              type="button"
              onClick={async () => {
                const [{ listApplications }, { downloadCsv }] = await Promise.all([
                  import("@/lib/local-store"),
                  import("@/lib/download"),
                ]);
                downloadCsv(listApplications(), lang);
              }}
              className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              {t.nav.exportCsv}
            </button>
          ) : (
            <a
              href="/api/export"
              className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              {t.nav.exportCsv}
            </a>
          )}
          <Link
            href="/applications/new"
            className="whitespace-nowrap rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            {t.nav.newApplication}
          </Link>
          <Controls />
        </div>
      </div>
    </header>
  );
}
