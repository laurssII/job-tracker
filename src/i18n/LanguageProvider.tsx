"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, useTransition } from "react";
import { dictionaries, type Dictionary } from "./dictionaries";
import { LANG_COOKIE, type Lang } from "./lang";

interface LanguageValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Textos de la interfaz en el idioma actual. */
  t: Dictionary;
}

const LanguageContext = createContext<LanguageValue | null>(null);

const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * `initialLang` lo decide el servidor (cookie o idioma del navegador), así la primera pantalla
 * ya llega en el idioma correcto y no hay parpadeo ni diferencias al hidratar.
 */
export function LanguageProvider({ initialLang, children }: { initialLang: Lang; children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const router = useRouter();
  const [, startTransition] = useTransition();

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback(
    (next: Lang) => {
      setLangState(next);
      document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=${ONE_YEAR}; SameSite=Lax`;
      // Vuelve a pedir al servidor lo que depende del idioma (título de la pestaña, etc.).
      startTransition(() => router.refresh());
    },
    [router],
  );

  const value = useMemo<LanguageValue>(() => ({ lang, setLang, t: dictionaries[lang] }), [lang, setLang]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang(): LanguageValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang debe usarse dentro de <LanguageProvider>");
  return ctx;
}
