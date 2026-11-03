"use client";

import Link from "next/link";
import { useLang } from "@/i18n/LanguageProvider";
import { FOLLOW_UP_DAYS, isWorkMode } from "@/lib/constants";
import { formatPercent, formatShortDate } from "@/lib/format";
import { NO_SOURCE, type FollowUp, type GroupStat, type WeekCount } from "@/lib/stats";

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** Barras horizontales: una por estado. */
export function BarList({ items }: { items: { label: string; value: number }[] }) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.label} className="grid grid-cols-[10rem_1fr_2rem] items-center gap-2 text-sm">
          <span className="truncate text-slate-600">{item.label}</span>
          <span className="h-2 rounded-full bg-slate-100">
            <span
              className="block h-2 rounded-full bg-slate-700"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </span>
          <span className="text-right tabular-nums text-slate-700">{item.value}</span>
        </li>
      ))}
    </ul>
  );
}

/** Tabla de rendimiento por fuente o modalidad. */
export function GroupTable({ title, groups }: { title: string; groups: GroupStat[] }) {
  const { lang, t } = useLang();
  if (groups.every((group) => group.total === 0)) {
    return <p className="text-sm text-slate-500">{t.dashboard.noData}</p>;
  }
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
          <th className="pb-2 font-medium">{title}</th>
          <th className="pb-2 text-right font-medium">{t.dashboard.colSent}</th>
          <th className="pb-2 text-right font-medium">{t.dashboard.colReplies}</th>
          <th className="pb-2 text-right font-medium">{t.dashboard.colInterviews}</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {groups.map((group) => (
          <tr key={group.key}>
            <td className="py-1.5">
              {isWorkMode(group.key) ? t.workModes[group.key] : group.key === NO_SOURCE ? t.dashboard.noSource : group.key}
            </td>
            <td className="py-1.5 text-right tabular-nums">{group.total}</td>
            <td className="py-1.5 text-right tabular-nums">
              {group.responded}{" "}
              <span className="text-xs text-slate-500">({group.total ? formatPercent(group.responseRate, lang) : "—"})</span>
            </td>
            <td className="py-1.5 text-right tabular-nums">{group.interviews}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Columnas verticales: solicitudes enviadas por semana. */
export function WeeklyChart({ weeks }: { weeks: WeekCount[] }) {
  const { lang } = useLang();
  const max = Math.max(1, ...weeks.map((week) => week.count));
  return (
    // Las columnas ocupan todo el alto (sin items-end): así el alto en % de cada barra tiene una referencia.
    <div className="flex h-36 gap-2">
      {weeks.map((week) => (
        <div key={week.weekStart} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-xs tabular-nums text-slate-600">{week.count}</span>
          <div className="flex w-full flex-1 items-end">
            <div
              className="w-full rounded-t bg-slate-700"
              style={{ height: `${(week.count / max) * 100}%`, minHeight: week.count > 0 ? 4 : 0 }}
            />
          </div>
          <span className="text-[10px] text-slate-500">{formatShortDate(week.weekStart, lang)}</span>
        </div>
      ))}
    </div>
  );
}

export function FollowUpList({ items }: { items: FollowUp[] }) {
  const { t } = useLang();
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">{t.dashboard.nothingPending}</p>;
  }
  return (
    <ul className="divide-y divide-slate-100">
      {items.map(({ application, kind, days }) => (
        <li key={application.id} className="flex items-center justify-between gap-3 py-2 text-sm">
          <div className="min-w-0">
            <Link href={`/applications/${application.id}`} className="font-medium hover:underline">
              {application.company}
            </Link>
            <span className="text-slate-500"> · {application.role}</span>
            <p className="truncate text-xs text-slate-500">
              {kind === "action"
                ? `${application.nextAction ?? t.dashboard.nextActionFallback} — ${
                    days === 0 ? t.dashboard.dueToday : t.dashboard.overdue(days)
                  }`
                : t.dashboard.stale(t.statuses[application.status], days, FOLLOW_UP_DAYS)}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
              kind === "action" ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-600"
            }`}
          >
            {kind === "action" ? t.dashboard.badgeAction : t.dashboard.badgeFollowUp}
          </span>
        </li>
      ))}
    </ul>
  );
}
