"use client";

/**
 * Pantallas del modo demo. Hacen lo mismo que las páginas del servidor, pero leen y escriben
 * en el almacén del navegador (src/lib/local-store.ts) y reutilizan las mismas vistas.
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useSyncExternalStore } from "react";
import { ApplicationForm } from "@/components/ApplicationForm";
import { KanbanBoard } from "@/components/KanbanBoard";
import { ApplicationDetailView } from "@/components/views/ApplicationDetailView";
import { ApplicationsListView, exportLabel } from "@/components/views/ApplicationsListView";
import { DashboardView } from "@/components/views/DashboardView";
import { todayISO } from "@/lib/dates";
import { downloadCsv } from "@/lib/download";
import { applicationToValues, newApplicationValues } from "@/lib/form-values";
import * as store from "@/lib/local-store";
import type { ListFilters } from "@/lib/types";
import {
  INITIAL_FORM_STATE,
  parseApplicationForm,
  parseStatusChangeForm,
  type FormState,
} from "@/lib/validation";

/**
 * Versión de los datos del navegador. En el servidor (y en el primer render del navegador)
 * es null, así que las pantallas muestran «Cargando…» y no hay diferencias al hidratar.
 */
function useDemoVersion(): number | null {
  return useSyncExternalStore<number | null>(store.subscribe, store.getVersion, () => null);
}

function Loading() {
  return <p className="py-16 text-center text-sm text-slate-500">Cargando datos de ejemplo…</p>;
}

function NotFoundMessage() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-2xl font-semibold">No encontrado</h1>
      <p className="mt-2 text-slate-600">Esta solicitud no existe o se ha eliminado.</p>
      <Link href="/applications" className="mt-6 inline-block text-sm font-medium text-blue-700 hover:underline">
        Volver a las solicitudes
      </Link>
    </div>
  );
}

export function DemoBanner() {
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
      <strong>Demo.</strong> Los datos son ficticios y se guardan solo en este navegador.{" "}
      <button
        type="button"
        onClick={() => {
          if (window.confirm("¿Restablecer los datos de ejemplo? Se perderán los cambios que hayas hecho en la demo.")) {
            store.resetDemo();
          }
        }}
        className="font-medium underline hover:no-underline"
      >
        Restablecer datos
      </button>
    </div>
  );
}

export function DemoDashboard() {
  const version = useDemoVersion();
  const data = useMemo(
    () =>
      version === null ? null : { applications: store.listApplications(), history: store.listAllHistory() },
    [version],
  );
  if (!data) return <Loading />;
  return <DashboardView applications={data.applications} history={data.history} today={todayISO()} />;
}

export function DemoApplications({ filters }: { filters: ListFilters }) {
  const version = useDemoVersion();
  const filtersKey = JSON.stringify(filters);
  const data = useMemo(
    () =>
      version === null
        ? null
        : { applications: store.listApplications(filters), sources: store.listSources() },
    [version, filtersKey], // filtersKey representa a `filters`
  );
  if (!data) return <Loading />;

  return (
    <ApplicationsListView
      applications={data.applications}
      sources={data.sources}
      filters={filters}
      exportControl={
        <button
          type="button"
          onClick={() => downloadCsv(data.applications)}
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          {exportLabel(filters)}
        </button>
      }
    />
  );
}

export function DemoBoard() {
  const version = useDemoVersion();
  const applications = useMemo(() => (version === null ? null : store.listApplications()), [version]);
  if (!applications) return <Loading />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Tablero</h1>
      <KanbanBoard
        applications={applications}
        onMove={async (id, status) => ({ ok: store.changeStatus(id, status, todayISO(), null) })}
      />
    </div>
  );
}

export function DemoDetail({ id }: { id: number }) {
  const router = useRouter();
  const version = useDemoVersion();
  const data = useMemo(
    () => (version === null ? null : { application: store.getApplication(id), history: store.getHistory(id) }),
    [version, id],
  );
  if (!data) return <Loading />;
  if (!data.application) return <NotFoundMessage />;

  return (
    <ApplicationDetailView
      application={data.application}
      history={data.history}
      today={todayISO()}
      changeStatus={(formData) => {
        const parsed = parseStatusChangeForm(formData, todayISO());
        if (parsed) store.changeStatus(id, parsed.status, parsed.date, parsed.note);
      }}
      deleteAction={async () => {
        router.push("/applications");
        store.deleteApplication(id);
      }}
    />
  );
}

export function DemoNew() {
  const router = useRouter();
  const action = useCallback(
    async (_previous: FormState, formData: FormData): Promise<FormState> => {
      const parsed = parseApplicationForm(formData);
      if (!parsed.ok) return { errors: parsed.errors, values: parsed.values };
      const id = store.createApplication(parsed.data);
      router.push(`/applications/${id}`);
      return INITIAL_FORM_STATE;
    },
    [router],
  );

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Nueva solicitud</h1>
      <ApplicationForm
        mode="create"
        action={action}
        initialValues={newApplicationValues(todayISO())}
        cancelHref="/applications"
      />
    </div>
  );
}

export function DemoEdit({ id }: { id: number }) {
  const router = useRouter();
  const version = useDemoVersion();
  const application = useMemo(() => (version === null ? null : store.getApplication(id)), [version, id]);

  const action = useCallback(
    async (_previous: FormState, formData: FormData): Promise<FormState> => {
      const parsed = parseApplicationForm(formData);
      if (!parsed.ok) return { errors: parsed.errors, values: parsed.values };
      // El estado no se edita aquí: tiene su propio formulario para que quede en el historial.
      const { status: _status, ...update } = parsed.data;
      store.updateApplication(id, update);
      router.push(`/applications/${id}`);
      return INITIAL_FORM_STATE;
    },
    [id, router],
  );

  if (version === null) return <Loading />;
  if (!application) return <NotFoundMessage />;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">
        Editar: {application.company} <span className="font-normal text-slate-500">· {application.role}</span>
      </h1>
      <ApplicationForm
        mode="edit"
        action={action}
        initialValues={applicationToValues(application)}
        cancelHref={`/applications/${id}`}
      />
    </div>
  );
}
