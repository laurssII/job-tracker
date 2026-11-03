/**
 * Se ejecuta en el <head>, antes de pintar la página: aplica el tema guardado (o el del sistema)
 * para que no haya un parpadeo claro → oscuro al cargar.
 */
export const THEME_STORAGE_KEY = "theme";

export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){}})()`;
