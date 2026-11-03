"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useLang } from "@/i18n/LanguageProvider";
import { STATUSES, WORK_MODES } from "@/lib/constants";
import { INITIAL_FORM_STATE, type FormState, type FormValues } from "@/lib/validation";

interface Props {
  mode: "create" | "edit";
  action: (previous: FormState, formData: FormData) => Promise<FormState>;
  initialValues: FormValues;
  cancelHref: string;
}

const INPUT =
  "mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";

function Field({
  label,
  error,
  required,
  className = "",
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block text-sm font-medium text-slate-700 ${className}`}>
      {label}
      {required && <span className="text-rose-700"> *</span>}
      {children}
      {error && <span className="mt-1 block text-xs font-normal text-rose-700">{error}</span>}
    </label>
  );
}

/** Título de la página de nueva solicitud / edición. */
export function FormHeading({ mode, company, role }: { mode: "create" | "edit"; company?: string; role?: string }) {
  const { t } = useLang();
  return (
    <h1 className="mb-6 text-2xl font-semibold tracking-tight">
      {mode === "create" ? (
        t.form.newTitle
      ) : (
        <>
          {t.form.editTitle} {company} <span className="font-normal text-slate-500">· {role}</span>
        </>
      )}
    </h1>
  );
}

export function ApplicationForm({ mode, action, initialValues, cancelHref }: Props) {
  const { t } = useLang();
  const f = t.form;
  const [state, formAction, pending] = useActionState(action, INITIAL_FORM_STATE);

  /** Texto del error de un campo, en el idioma actual. */
  const error = (name: string): string | undefined => {
    const found = state.errors[name];
    if (!found) return undefined;
    return found.code === "too_long" ? t.errors.too_long(found.max ?? 0) : t.errors[found.code];
  };
  const errors = state.errors;

  // Tras un error se vuelve a mostrar lo que escribió el usuario; si no, los valores iniciales.
  const value = (name: string): string => state.values[name] ?? initialValues[name] ?? "";

  return (
    <form action={formAction} className="space-y-6">
      {Object.keys(errors).length > 0 && (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {f.reviewFields}
        </p>
      )}

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{f.sectionOffer}</legend>
        <Field label={f.company} required error={error("company")}>
          <input name="company" defaultValue={value("company")} className={INPUT} autoFocus />
        </Field>
        <Field label={f.role} required error={error("role")}>
          <input name="role" defaultValue={value("role")} className={INPUT} />
        </Field>
        <Field label={f.workMode} required error={error("workMode")}>
          <select name="workMode" defaultValue={value("workMode")} className={INPUT}>
            {WORK_MODES.map((workMode) => (
              <option key={workMode} value={workMode}>
                {t.workModes[workMode]}
              </option>
            ))}
          </select>
        </Field>
        <Field label={f.location} error={error("location")}>
          <input name="location" defaultValue={value("location")} className={INPUT} placeholder={f.locationPlaceholder} />
        </Field>
        <Field label={f.contractType} error={error("contractType")}>
          <input name="contractType" list="contract-options" defaultValue={value("contractType")} className={INPUT} />
        </Field>
        <Field label={f.salary} error={error("salary")}>
          <input name="salary" defaultValue={value("salary")} className={INPUT} placeholder={f.salaryPlaceholder} />
        </Field>
        <Field label={f.url} error={error("url")} className="sm:col-span-2">
          <input name="url" type="url" defaultValue={value("url")} className={INPUT} placeholder="https://…" />
        </Field>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{f.sectionApplication}</legend>
        <Field label={f.appliedAt} required error={error("appliedAt")}>
          <input name="appliedAt" type="date" defaultValue={value("appliedAt")} className={INPUT} />
        </Field>
        {mode === "create" && (
          <Field label={f.initialStatus} required error={error("status")}>
            <select name="status" defaultValue={value("status")} className={INPUT}>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t.statuses[status]}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label={f.source} error={error("source")}>
          <input name="source" list="source-options" defaultValue={value("source")} className={INPUT} />
        </Field>
        <Field label={f.cvVersion} error={error("cvVersion")}>
          <input name="cvVersion" defaultValue={value("cvVersion")} className={INPUT} placeholder={f.cvPlaceholder} />
        </Field>
        <Field label={f.contactName} error={error("contactName")}>
          <input name="contactName" defaultValue={value("contactName")} className={INPUT} />
        </Field>
        <Field label={f.contactEmail} error={error("contactEmail")}>
          <input name="contactEmail" type="email" defaultValue={value("contactEmail")} className={INPUT} />
        </Field>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{f.sectionFollowUp}</legend>
        <Field label={f.nextAction} error={error("nextAction")}>
          <input
            name="nextAction"
            defaultValue={value("nextAction")}
            className={INPUT}
            placeholder={f.nextActionPlaceholder}
          />
        </Field>
        <Field label={f.nextActionDate} error={error("nextActionDate")}>
          <input name="nextActionDate" type="date" defaultValue={value("nextActionDate")} className={INPUT} />
        </Field>
        <Field label={f.notes} error={error("notes")} className="sm:col-span-2">
          <textarea name="notes" rows={4} defaultValue={value("notes")} className={INPUT} />
        </Field>
      </fieldset>

      <datalist id="source-options">
        {t.sourceSuggestions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      <datalist id="contract-options">
        {t.contractSuggestions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {pending ? f.saving : mode === "create" ? f.save : f.saveChanges}
        </button>
        <Link href={cancelHref} className="text-sm text-slate-600 hover:text-slate-900">
          {f.cancel}
        </Link>
      </div>
    </form>
  );
}
