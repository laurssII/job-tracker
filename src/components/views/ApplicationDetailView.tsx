import Link from "next/link";
import { DeleteButton } from "@/components/DeleteButton";
import { StatusBadge } from "@/components/StatusBadge";
import { STATUSES, STATUS_LABELS, WORK_MODE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { Application, StatusChange } from "@/lib/types";

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-800">{children || "—"}</dd>
    </div>
  );
}

/**
 * Ficha de una solicitud. Los cambios (estado, borrado) llegan como funciones: acciones de servidor
 * en el modo normal y funciones del navegador en la demo.
 */
export function ApplicationDetailView({
  application,
  history,
  today,
  changeStatus,
  deleteAction,
}: {
  application: Application;
  history: StatusChange[];
  today: string;
  changeStatus: (formData: FormData) => void | Promise<void>;
  deleteAction: () => Promise<void>;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/applications" className="text-sm text-slate-500 hover:text-slate-900">
            ← Solicitudes
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{application.company}</h1>
          <p className="text-slate-600">{application.role}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={application.status} />
          <Link
            href={`/applications/${application.id}/edit`}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100"
          >
            Editar
          </Link>
          <DeleteButton action={deleteAction} company={application.company} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <dl className="grid gap-4 sm:grid-cols-3">
              <Detail label="Modalidad">{WORK_MODE_LABELS[application.workMode]}</Detail>
              <Detail label="Ubicación">{application.location}</Detail>
              <Detail label="Contrato">{application.contractType}</Detail>
              <Detail label="Salario">{application.salary}</Detail>
              <Detail label="Fecha de solicitud">{formatDate(application.appliedAt)}</Detail>
              <Detail label="Fuente">{application.source}</Detail>
              <Detail label="Versión de CV">{application.cvVersion}</Detail>
              <Detail label="Contacto">
                {application.contactName}
                {application.contactEmail && (
                  <>
                    {application.contactName && <br />}
                    <a href={`mailto:${application.contactEmail}`} className="text-blue-700 hover:underline">
                      {application.contactEmail}
                    </a>
                  </>
                )}
              </Detail>
              <Detail label="Oferta">
                {application.url && (
                  <a href={application.url} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">
                    Ver anuncio ↗
                  </a>
                )}
              </Detail>
            </dl>
          </section>

          {(application.nextAction || application.nextActionDate) && (
            <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="text-xs font-semibold uppercase tracking-wide">Próxima acción</p>
              <p className="mt-1">
                {application.nextAction ?? "Sin descripción"}
                {application.nextActionDate && <> — {formatDate(application.nextActionDate)}</>}
              </p>
            </section>
          )}

          {application.notes && (
            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold">Notas</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{application.notes}</p>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold">Cambiar estado</h2>
            <form action={changeStatus} className="mt-3 space-y-3">
              <select
                name="status"
                defaultValue={application.status}
                aria-label="Nuevo estado"
                className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
              <input
                type="date"
                name="date"
                defaultValue={today}
                aria-label="Fecha del cambio"
                className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                type="text"
                name="note"
                maxLength={500}
                placeholder="Nota (opcional)"
                className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
              >
                Actualizar estado
              </button>
            </form>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold">Historial</h2>
            <ol className="mt-3 space-y-4 border-l border-slate-200 pl-4">
              {[...history].reverse().map((change) => (
                <li key={change.id} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-slate-400 ring-4 ring-white" />
                  <StatusBadge status={change.status} />
                  <p className="mt-1 text-xs text-slate-500">{formatDate(change.changedAt)}</p>
                  {change.note && <p className="mt-0.5 text-sm text-slate-700">{change.note}</p>}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
