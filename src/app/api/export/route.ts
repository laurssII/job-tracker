import { listApplications } from "@/lib/applications";
import { applicationsToCsv } from "@/lib/csv";
import { todayISO } from "@/lib/dates";
import { parseFilters } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** Descarga las solicitudes en CSV. Acepta los mismos filtros que la lista (?q=&status=...). */
export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters = parseFilters(Object.fromEntries(searchParams));
  const csv = applicationsToCsv(listApplications(filters));

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="solicitudes-${todayISO()}.csv"`,
    },
  });
}
