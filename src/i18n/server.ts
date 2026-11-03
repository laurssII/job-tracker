import { cookies, headers } from "next/headers";
import { LANG_COOKIE, resolveLang, type Lang } from "./lang";

/** Idioma de la petición actual (solo en el servidor): cookie, o idioma del navegador. */
export async function getServerLang(): Promise<Lang> {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  return resolveLang(cookieStore.get(LANG_COOKIE)?.value, headerStore.get("accept-language"));
}
