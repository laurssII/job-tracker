/**
 * Modo de la aplicación.
 *
 * - Normal (por defecto): los datos viven en SQLite, en el servidor. Es tu uso real.
 * - Demo (NEXT_PUBLIC_DEMO=true): los datos viven en el navegador de cada visitante
 *   (localStorage), con solicitudes ficticias precargadas. Es lo que se publica en Vercel.
 *
 * Al empezar por NEXT_PUBLIC_, Next sustituye el valor al compilar, así que es el mismo
 * en el servidor y en el navegador.
 */
export const IS_DEMO = process.env.NEXT_PUBLIC_DEMO === "true";
