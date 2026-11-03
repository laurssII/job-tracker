"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { useLang } from "@/i18n/LanguageProvider";
import { SORT_KEYS, STATUSES, WORK_MODES } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { filtersToQuery, hasActiveFilters } from "@/lib/filters";
import type { Application, ListFilters } from "@/lib/types";

const SELECT =
  "rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none";

/**
 * Lista con filtros. El formulario usa GET (los filtros van en la URL), así que funciona igual
 * en el servidor y en la demo. Para exportar, el servidor pasa `exportHref` (enlace a /api/export)
 * y la demo pasa `onExport` (genera el CSV en el navegador).
 */
export function ApplicationsListView({
  applications,
  sources,
  filters,
  exportHref,
  onExport,
}: {
  applications: Application[];
  sources: string[];
  filters: ListFilters;
  exportHref?: string;
  onExport?: () => void;
}) {
  const { lang, t } = useLang();
  const l = t.list;
  const hasFilters = hasActiveFilters(filters);
  const exportLabel = hasFilters ? l.exportFiltered : l.exportAll;
  const exportClass = "text-sm text-slate-600 hover:text-slate-900";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{l.title}</h1>
        {onExport ? (
          <button type="button" onClick={onExport} className={exportClass}>
            {exportLabel}
          </button>
        ) : exportHref !== undefined ? (
          <a href={exportHref} className={exportClass}>
            {exportLabel}
          </a>
        ) : null}
      </div>

      <form method="get" className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-3">
        <input
          type="search"
          name="q"
          defaultValue={filters.q ?? ""}
          placeholder={l.searchPlaceholder}
          className="min-w-52 flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
        />
        <select name="status" defaultValue={filters.status ?? ""} className={SELECT} aria-label={l.status}>
          <option value="">{l.allStatuses}</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {t.statuses[status]}
            </option>
          ))}
        </select>
        <select name="workMode" defaultValue={filters.workMode ?? ""} className={SELECT} aria-label={l.workMode}>
          <option value="">{l.allWorkModes}</option>
          {WORK_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {t.workModes[mode]}
            </option>
          ))}
        </select>
        <select name="source" defaultValue={filters.source ?? ""} className={SELECT} aria-label={l.source}>
          <option value="">{l.allSources}</option>
          {sources.map((source) => (
            <option key={source} value={source}>
              {source}
            </option>
          ))}
        </select>
        <select name="sort" defaultValue={filters.sort ?? "applied_desc"} className={SELECT} aria-label={l.sort}>
          {SORT_KEYS.map((key) => (
            <option key={key} value={key}>
              {t.sort[key]}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700">
          {l.filter}
        </button>
        {hasFilters && (
          <Link href="/applications" className="text-sm text-slate-600 hover:text-slate-900">
            {l.clear}
          </Link>
        )}
      </form>

      <p className="text-sm text-slate-500">
        {l.count(applications.length)}
      </p>

      {applications.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white py-12 text-center text-sm text-slate-500">
          {hasFilters ? l.noMatches : l.none}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">{l.colCompanyRole}</th>
                <th className="px-4 py-2 font-medium">{l.colWorkMode}</th>
                <th className="px-4 py-2 font-medium">{l.colApplied}</th>
                <th className="px-4 py-2 font-medium">{l.colStatus}</th>
                <th className="px-4 py-2 font-medium">{l.colSource}</th>
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
                    {t.workModes[app.workMode]}
                    {app.location && <p className="text-xs text-slate-500">{app.location}</p>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-slate-600">{formatDate(app.appliedAt, lang)}</td>
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
