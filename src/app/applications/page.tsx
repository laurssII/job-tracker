import Link from "next/link";
import { listApplications, listSources } from "@/lib/applications";
import {
  SORT_LABELS,
  STATUSES,
  STATUS_LABELS,
  WORK_MODES,
  WORK_MODE_LABELS,
} from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { parseFilters } from "@/lib/validation";
import { StatusBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const SELECT =
  "rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none";

export default async function ApplicationsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const applications = listApplications(filters);
  const sources = listSources();
  const hasFilters = Object.keys(filters).length > 0;

  const exportQuery = new URLSearchParams(
    Object.entries(filters).map(([key, value]) => [key, String(value)]),
  ).toString();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Solicitudes</h1>
        <a
          href={`/api/export${exportQuery ? `?${exportQuery}` : ""}`}
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          Exportar {hasFilters ? "estos resultados" : "todo"} a CSV
        </a>
      </div>

      <form method="get" className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-3">
        <input
          type="search"
          name="q"
          defaultValue={filters.q ?? ""}
          placeholder="Buscar empresa, rol, ubicación o notas…"
          className="min-w-52 flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
        />
        <select name="status" defaultValue={filters.status ?? ""} className={SELECT} aria-label="Estado">
          <option value="">Todos los estados</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
        <select name="workMode" defaultValue={filters.workMode ?? ""} className={SELECT} aria-label="Modalidad">
          <option value="">Toda modalidad</option>
          {WORK_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {WORK_MODE_LABELS[mode]}
            </option>
          ))}
        </select>
        <select name="source" defaultValue={filters.source ?? ""} className={SELECT} aria-label="Fuente">
          <option value="">Toda fuente</option>
          {sources.map((source) => (
            <option key={source} value={source}>
              {source}
            </option>
          ))}
        </select>
        <select name="sort" defaultValue={filters.sort ?? "applied_desc"} className={SELECT} aria-label="Orden">
          {Object.entries(SORT_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700">
          Filtrar
        </button>
        {hasFilters && (
          <Link href="/applications" className="text-sm text-slate-600 hover:text-slate-900">
            Limpiar
          </Link>
        )}
      </form>

      <p className="text-sm text-slate-500">
        {applications.length} {applications.length === 1 ? "solicitud" : "solicitudes"}
      </p>

      {applications.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white py-12 text-center text-sm text-slate-500">
          {hasFilters ? "Ninguna solicitud coincide con los filtros." : "Aún no hay solicitudes."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Empresa y rol</th>
                <th className="px-4 py-2 font-medium">Modalidad</th>
                <th className="px-4 py-2 font-medium">Solicitud</th>
                <th className="px-4 py-2 font-medium">Estado</th>
                <th className="px-4 py-2 font-medium">Fuente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5">
                    <Link href={`/applications/${app.id}`} className="font-medium hover:underline">
                      {app.company}
                    </Link>
                    <p className="text-xs text-slate-500">{app.role}</p>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {WORK_MODE_LABELS[app.workMode]}
                    {app.location && <p className="text-xs text-slate-400">{app.location}</p>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-slate-600">{formatDate(app.appliedAt)}</td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{app.source ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
