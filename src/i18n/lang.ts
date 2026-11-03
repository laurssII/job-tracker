/**
 * Idiomas de la interfaz. Este fichero no importa nada pesado: lo usan tanto el servidor
 * (para leer la cookie) como el navegador.
 */
export const LANGS = ["es", "en"] as const;
export type Lang = (typeof LANGS)[number];

export const DEFAULT_LANG: Lang = "es";

/** Cookie donde se guarda el idioma elegido. La lee el servidor, así la página llega ya en tu idioma. */
export const LANG_COOKIE = "lang";

export function isLang(value: unknown): value is Lang {
  return typeof value === "string" && (LANGS as readonly string[]).includes(value);
}

/**
 * Idioma que se usa al cargar una página:
 * 1. el de la cookie, si el usuario ya eligió uno;
 * 2. si no, el del navegador (cabecera Accept-Language): español y gallego → español; el resto → inglés;
 * 3. sin ninguna pista, español.
 */
export function resolveLang(cookieValue?: string | null, acceptLanguage?: string | null): Lang {
  if (isLang(cookieValue)) return cookieValue;
  const preferred = acceptLanguage?.split(",")[0]?.trim().toLowerCase();
  if (!preferred) return DEFAULT_LANG;
  return preferred.startsWith("es") || preferred.startsWith("gl") ? "es" : "en";
}

/** Configuración regional para fechas y números. */
export const LOCALES: Record<Lang, string> = { es: "es-ES", en: "en-GB" };
