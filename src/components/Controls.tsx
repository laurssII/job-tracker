"use client";

import { LANGS, type Lang } from "@/i18n/lang";
import { useLang } from "@/i18n/LanguageProvider";
import { useTheme } from "@/theme/ThemeProvider";

const LANGUAGE_NAMES: Record<Lang, string> = { es: "Español", en: "English" };

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}

/** Selector de idioma (ES / EN) y botón de modo claro / oscuro. */
export function Controls() {
  const { lang, setLang, t } = useLang();
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  const themeLabel = isDark ? t.controls.switchToLight : t.controls.switchToDark;

  return (
    <div className="flex items-center gap-2">
      <div role="group" aria-label={t.controls.language} className="flex overflow-hidden rounded-md border border-slate-300">
        {LANGS.map((code) => (
          <button
            key={code}
            type="button"
            lang={code}
            aria-pressed={lang === code}
            aria-label={LANGUAGE_NAMES[code]}
            title={LANGUAGE_NAMES[code]}
            onClick={() => setLang(code)}
            className={`px-2 py-1 text-xs font-semibold ${
              lang === code ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {code.toUpperCase()}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={toggle}
        aria-label={themeLabel}
        title={themeLabel}
        className="rounded-md border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-100"
      >
        {isDark ? <SunIcon /> : <MoonIcon />}
      </button>
    </div>
  );
}
