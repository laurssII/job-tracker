import { listApplications } from "@/lib/applications";
import { getServerLang } from "@/i18n/server";
import { applicationsToCsv, csvFileName } from "@/lib/csv";
import { todayISO } from "@/lib/dates";
import { IS_DEMO } from "@/lib/mode";
import { parseFilters } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** Descarga las solicitudes en CSV. Acepta los mismos filtros que la lista (?q=&status=...). */
export async function GET(request: Request) {
  // En la demo los datos están en el navegador; el CSV se genera allí.
  if (IS_DEMO) return new Response("No disponible en la demo", { status: 404 });

  const { searchParams } = new URL(request.url);
  const filters = parseFilters(Object.fromEntries(searchParams));
  const lang = await getServerLang();
  const csv = applicationsToCsv(listApplications(filters), lang);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${csvFileName(lang, todayISO())}"`,
    },
  });
}
