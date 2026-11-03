"use client";

/**
 * Pantallas del modo demo. Hacen lo mismo que las páginas del servidor, pero leen y escriben
 * en el almacén del navegador (src/lib/local-store.ts) y reutilizan las mismas vistas.
 */
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { ApplicationForm, FormHeading } from "@/components/ApplicationForm";
import { BoardHeading, KanbanBoard } from "@/components/KanbanBoard";
import { NotFoundMessage } from "@/components/NotFoundMessage";
import { ApplicationDetailView } from "@/components/views/ApplicationDetailView";
import { ApplicationsListView } from "@/components/views/ApplicationsListView";
import { DashboardView } from "@/components/views/DashboardView";
import { useLang } from "@/i18n/LanguageProvider";
import { todayISO } from "@/lib/dates";
import { downloadCsv } from "@/lib/download";
import { applicationToValues, newApplicationValues } from "@/lib/form-values";
import * as store from "@/lib/local-store";
import { getNotice, showNotice, subscribeNotice } from "@/lib/notice";
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
  const { t } = useLang();
  return <p className="py-16 text-center text-sm text-slate-500">{t.demo.loading}</p>;
}

/** Barra superior de la demo. Solo lleva «Restablecer datos»; «Vaciar demo» está en el pie. */
export function DemoBanner() {
  const router = useRouter();
  const { lang, t } = useLang();
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
      <strong>{t.demo.bannerTitle}</strong> {t.demo.bannerText}{" "}
      <button
        type="button"
        onClick={() => {
          if (window.confirm(t.demo.resetConfirm)) {
            store.resetDemo(lang);
            showNotice(t.demo.resetDone);
            router.push("/");
          }
        }}
        className="font-medium underline hover:no-underline"
      >
        {t.demo.reset}
      </button>
    </div>
  );
}

/** Aviso flotante, abajo y centrado. El contenedor está siempre en la página para que los lectores de pantalla lo anuncien. */
function DemoNotice() {
  const message = useSyncExternalStore<string | null>(subscribeNotice, getNotice, () => null);
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
    >
      {message && <p className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">{message}</p>}
    </div>
  );
}

/** Pie de página de la demo: aquí vive «Vaciar demo», fuera de la barra superior para no sobrecargarla. */
export function DemoFooter() {
  const router = useRouter();
  const { lang, t } = useLang();

  // Si los ejemplos siguen sin tocar, se muestran en el idioma elegido (también al cargar la página).
  useEffect(() => {
    store.syncSeedLanguage(lang);
  }, [lang]);

  return (
    <>
      <footer className="border-t border-slate-200 px-4 py-6 text-center text-xs text-slate-500">
        {t.demo.footerPrompt}{" "}
        <button
          type="button"
          onClick={() => {
            if (window.confirm(t.demo.clearConfirm)) {
              store.deleteAllApplications();
              showNotice(t.demo.clearDone);
              router.push("/");
            }
          }}
          className="font-medium text-slate-700 underline hover:no-underline"
        >
          {t.demo.clear}
        </button>
      </footer>
      <DemoNotice />
    </>
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
  const { lang } = useLang();
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
      onExport={() => downloadCsv(data.applications, lang)}
    />
  );
}

export function DemoBoard() {
  const version = useDemoVersion();
  const applications = useMemo(() => (version === null ? null : store.listApplications()), [version]);
  if (!applications) return <Loading />;

  return (
    <div className="space-y-4">
      <BoardHeading />
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
      <FormHeading mode="create" />
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
      <FormHeading mode="edit" company={application.company} role={application.role} />
      <ApplicationForm
        mode="edit"
        action={action}
        initialValues={applicationToValues(application)}
        cancelHref={`/applications/${id}`}
      />
    </div>
  );
}
