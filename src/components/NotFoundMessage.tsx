"use client";

import Link from "next/link";
import { useLang } from "@/i18n/LanguageProvider";

/** «Esta solicitud no existe»: lo usan la página 404 del servidor y la demo. */
export function NotFoundMessage() {
  const { t } = useLang();
  return (
    <div className="py-16 text-center">
      <h1 className="text-2xl font-semibold">{t.notFound.title}</h1>
      <p className="mt-2 text-slate-600">{t.notFound.text}</p>
      <Link href="/applications" className="mt-6 inline-block text-sm font-medium text-blue-700 hover:underline">
        {t.notFound.back}
      </Link>
    </div>
  );
}
