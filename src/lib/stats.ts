import {
  CLOSED_STATUSES,
  FOLLOW_UP_DAYS,
  PROGRESS_STATUSES,
  RESPONSE_STATUSES,
  STATUSES,
  WORK_MODES,
  type Status,
} from "./constants";
import { addDays, daysBetween, startOfWeek } from "./dates";
import type { Application, StatusChange } from "./types";

export interface GroupStat {
  key: string;
  total: number;
  responded: number;
  interviews: number;
  /** Respuestas / solicitudes enviadas, entre 0 y 1. */
  responseRate: number;
}

export interface WeekCount {
  /** Lunes de la semana (YYYY-MM-DD). */
  weekStart: string;
  count: number;
}

export interface Stats {
  total: number;
  /** Solicitudes ya enviadas (todas menos las "pendiente"). */
  sent: number;
  pending: number;
  /** Solicitudes que han recibido alguna respuesta (aunque fuera un rechazo). */
  responded: number;
  responseRate: number;
  /** Solicitudes que han llegado a entrevista, prueba técnica u oferta. */
  interviews: number;
  interviewRate: number;
  offers: number;
  offerRate: number;
  rejected: number;
  ghosted: number;
  /** Procesos abiertos: enviada, respondida, entrevista, prueba técnica u oferta. */
  active: number;
  avgDaysToResponse: number | null;
  byStatus: Record<Status, number>;
  bySource: GroupStat[];
  byWorkMode: GroupStat[];
  weekly: WeekCount[];
}

export interface FollowUp {
  application: Application;
  /** "action": tiene una próxima acción vencida o para hoy. "stale": lleva días sin respuesta. */
  kind: "action" | "stale";
  /** Días de retraso de la acción, o días desde que se envió. */
  days: number;
}

interface Flags {
  responded: boolean;
  interviewed: boolean;
  offered: boolean;
  firstResponseDate: string | null;
}

const WEEKS_SHOWN = 8;
const NO_SOURCE = "Sin especificar";

function byDate(a: StatusChange, b: StatusChange): number {
  return a.changedAt === b.changedAt ? a.id - b.id : a.changedAt < b.changedAt ? -1 : 1;
}

function rate(part: number, whole: number): number {
  return whole === 0 ? 0 : part / whole;
}

function summarize(key: string, apps: Application[], flags: Map<number, Flags>): GroupStat {
  let responded = 0;
  let interviews = 0;
  for (const app of apps) {
    const f = flags.get(app.id);
    if (f?.responded) responded += 1;
    if (f?.interviewed) interviews += 1;
  }
  return { key, total: apps.length, responded, interviews, responseRate: rate(responded, apps.length) };
}

function groupBy(
  apps: Application[],
  keyOf: (app: Application) => string,
  flags: Map<number, Flags>,
): GroupStat[] {
  const groups = new Map<string, Application[]>();
  for (const app of apps) {
    const key = keyOf(app);
    const list = groups.get(key);
    if (list) list.push(app);
    else groups.set(key, [app]);
  }
  return [...groups.entries()]
    .map(([key, list]) => summarize(key, list, flags))
    .sort((a, b) => b.total - a.total || a.key.localeCompare(b.key));
}

export function computeStats(apps: Application[], history: StatusChange[], today: string): Stats {
  const historyByApp = new Map<number, StatusChange[]>();
  for (const change of history) {
    const list = historyByApp.get(change.applicationId);
    if (list) list.push(change);
    else historyByApp.set(change.applicationId, [change]);
  }

  const sentApps = apps.filter((app) => app.status !== "pendiente");

  const flags = new Map<number, Flags>();
  const responseDays: number[] = [];
  for (const app of sentApps) {
    const changes = (historyByApp.get(app.id) ?? []).slice().sort(byDate);
    const firstResponse = changes.find((c) => RESPONSE_STATUSES.includes(c.status));
    const entry: Flags = {
      responded: Boolean(firstResponse),
      interviewed: changes.some((c) => PROGRESS_STATUSES.includes(c.status)),
      offered: changes.some((c) => c.status === "oferta"),
      firstResponseDate: firstResponse?.changedAt ?? null,
    };
    flags.set(app.id, entry);
    if (firstResponse) {
      responseDays.push(Math.max(0, daysBetween(app.appliedAt, firstResponse.changedAt)));
    }
  }

  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<Status, number>;
  for (const app of apps) byStatus[app.status] += 1;

  const sent = sentApps.length;
  const responded = [...flags.values()].filter((f) => f.responded).length;
  const interviews = [...flags.values()].filter((f) => f.interviewed).length;
  const offers = [...flags.values()].filter((f) => f.offered).length;

  const currentWeek = startOfWeek(today);
  const weekly: WeekCount[] = [];
  for (let i = WEEKS_SHOWN - 1; i >= 0; i -= 1) {
    const weekStart = addDays(currentWeek, -7 * i);
    const weekEnd = addDays(weekStart, 6);
    const count = sentApps.filter((a) => a.appliedAt >= weekStart && a.appliedAt <= weekEnd).length;
    weekly.push({ weekStart, count });
  }

  const modeGroups = groupBy(sentApps, (a) => a.workMode, flags);

  return {
    total: apps.length,
    sent,
    pending: byStatus.pendiente,
    responded,
    responseRate: rate(responded, sent),
    interviews,
    interviewRate: rate(interviews, sent),
    offers,
    offerRate: rate(offers, sent),
    rejected: byStatus.rechazada,
    ghosted: byStatus.sin_respuesta,
    active:
      byStatus.enviada + byStatus.respondida + byStatus.entrevista + byStatus.prueba_tecnica + byStatus.oferta,
    avgDaysToResponse:
      responseDays.length === 0
        ? null
        : Math.round((responseDays.reduce((sum, d) => sum + d, 0) / responseDays.length) * 10) / 10,
    byStatus,
    bySource: groupBy(sentApps, (a) => a.source ?? NO_SOURCE, flags),
    // Siempre las tres modalidades, en el mismo orden, aunque alguna tenga 0 solicitudes.
    byWorkMode: WORK_MODES.map(
      (mode) => modeGroups.find((g) => g.key === mode) ?? summarize(mode, [], flags),
    ),
    weekly,
  };
}

/** Solicitudes que conviene mover: acciones vencidas y envíos sin respuesta pasado el plazo. */
export function followUps(apps: Application[], today: string): FollowUp[] {
  const actions: FollowUp[] = [];
  const stale: FollowUp[] = [];

  for (const app of apps) {
    if (CLOSED_STATUSES.includes(app.status)) continue;

    if (app.nextActionDate && app.nextActionDate <= today) {
      actions.push({ application: app, kind: "action", days: daysBetween(app.nextActionDate, today) });
    } else if (app.status === "enviada") {
      const days = daysBetween(app.appliedAt, today);
      if (days >= FOLLOW_UP_DAYS) stale.push({ application: app, kind: "stale", days });
    }
  }

  actions.sort((a, b) => b.days - a.days);
  stale.sort((a, b) => b.days - a.days);
  return [...actions, ...stale];
}
