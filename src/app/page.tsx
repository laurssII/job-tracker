import Link from "next/link";
import { listAllHistory, listApplications } from "@/lib/applications";
import { STATUSES, STATUS_LABELS } from "@/lib/constants";
import { todayISO } from "@/lib/dates";
import { formatDays, formatPercent } from "@/lib/format";
import { computeStats, followUps } from "@/lib/stats";
import { BarList, FollowUpList, GroupTable, Panel, Stat, WeeklyChart } from "@/components/dashboard";

// Lee la base de datos en cada visita (no se genera de forma estática en el build).
export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const today = todayISO();
  const applications = listApplications();

  if (applications.length === 0) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-semibold">Aún no tienes solicitudes</h1>
        <p className="mx-auto mt-2 max-w-md text-slate-600">
          Añade tu primera solicitud, o carga datos de ejemplo con{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">npm run seed</code> para ver cómo queda el
          panel.
        </p>
        <Link
          href="/applications/new"
          className="mt-6 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          + Nueva solicitud
        </Link>
      </div>
    );
  }

  const stats = computeStats(applications, listAllHistory(), today);
  const pending = followUps(applications, today);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Resumen</h1>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Stat label="Enviadas" value={String(stats.sent)} hint={stats.pending ? `${stats.pending} pendientes de enviar` : undefined} />
        <Stat label="Tasa de respuesta" value={formatPercent(stats.responseRate)} hint={`${stats.responded} de ${stats.sent}`} />
        <Stat label="Entrevistas" value={String(stats.interviews)} hint={`${formatPercent(stats.interviewRate)} de las enviadas`} />
        <Stat label="Ofertas" value={String(stats.offers)} />
        <Stat label="Respuesta en" value={formatDays(stats.avgDaysToResponse)} hint="de media" />
        <Stat label="Procesos activos" value={String(stats.active)} hint={`${stats.rejected} rechazadas · ${stats.ghosted} sin respuesta`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={`Requieren seguimiento (${pending.length})`}>
          <FollowUpList items={pending} />
        </Panel>
        <Panel title="Solicitudes enviadas por semana">
          <WeeklyChart weeks={stats.weekly} />
        </Panel>
        <Panel title="Estado actual">
          <BarList items={STATUSES.map((status) => ({ label: STATUS_LABELS[status], value: stats.byStatus[status] }))} />
        </Panel>
        <div className="space-y-6">
          <Panel title="Por modalidad">
            <GroupTable title="Modalidad" groups={stats.byWorkMode} />
          </Panel>
          <Panel title="Por fuente">
            <GroupTable title="Fuente" groups={stats.bySource} />
          </Panel>
        </div>
      </div>
    </div>
  );
}
