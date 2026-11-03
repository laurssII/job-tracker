"use client";

import Link from "next/link";
import { BarList, FollowUpList, GroupTable, Panel, Stat, WeeklyChart } from "@/components/dashboard";
import { useLang } from "@/i18n/LanguageProvider";
import { STATUSES } from "@/lib/constants";
import { formatDays, formatPercent } from "@/lib/format";
import { IS_DEMO } from "@/lib/mode";
import { computeStats, followUps } from "@/lib/stats";
import type { Application, StatusChange } from "@/lib/types";

/** Pantalla de resumen. La usan tanto la página del servidor como la demo del navegador. */
export function DashboardView({
  applications,
  history,
  today,
}: {
  applications: Application[];
  history: StatusChange[];
  today: string;
}) {
  const { lang, t } = useLang();
  const d = t.dashboard;

  if (applications.length === 0) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-semibold">{d.emptyTitle}</h1>
        <p className="mx-auto mt-2 max-w-md text-slate-600">
          {IS_DEMO ? (
            d.emptyDemo
          ) : (
            <>
              {d.emptyBefore}{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">npm run seed</code> {d.emptyAfter}
            </>
          )}
        </p>
        <Link
          href="/applications/new"
          className="mt-6 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          {d.newApplication}
        </Link>
      </div>
    );
  }

  const stats = computeStats(applications, history, today);
  const pending = followUps(applications, today);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{d.title}</h1>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Stat label={d.sent} value={String(stats.sent)} hint={stats.pending ? d.pendingHint(stats.pending) : undefined} />
        <Stat
          label={d.responseRate}
          value={formatPercent(stats.responseRate, lang)}
          hint={d.outOf(stats.responded, stats.sent)}
        />
        <Stat
          label={d.interviews}
          value={String(stats.interviews)}
          hint={d.ofSent(formatPercent(stats.interviewRate, lang))}
        />
        <Stat label={d.offers} value={String(stats.offers)} />
        <Stat label={d.responseIn} value={formatDays(stats.avgDaysToResponse, lang)} hint={d.onAverage} />
        <Stat label={d.active} value={String(stats.active)} hint={d.activeHint(stats.rejected, stats.ghosted)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={d.needFollowUp(pending.length)}>
          <FollowUpList items={pending} />
        </Panel>
        <Panel title={d.weekly}>
          <WeeklyChart weeks={stats.weekly} />
        </Panel>
        <Panel title={d.currentStatus}>
          <BarList items={STATUSES.map((status) => ({ label: t.statuses[status], value: stats.byStatus[status] }))} />
        </Panel>
        <div className="space-y-6">
          <Panel title={d.byWorkMode}>
            <GroupTable title={d.workMode} groups={stats.byWorkMode} />
          </Panel>
          <Panel title={d.bySource}>
            <GroupTable title={d.source} groups={stats.bySource} />
          </Panel>
        </div>
      </div>
    </div>
  );
}
