"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  CONTRACT_SUGGESTIONS,
  SOURCE_SUGGESTIONS,
  STATUSES,
  STATUS_LABELS,
  WORK_MODES,
  WORK_MODE_LABELS,
} from "@/lib/constants";
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
      {required && <span className="text-rose-600"> *</span>}
      {children}
      {error && <span className="mt-1 block text-xs font-normal text-rose-600">{error}</span>}
    </label>
  );
}

export function ApplicationForm({ mode, action, initialValues, cancelHref }: Props) {
  const [state, formAction, pending] = useActionState(action, INITIAL_FORM_STATE);
  const { errors } = state;

  // Tras un error se vuelve a mostrar lo que escribió el usuario; si no, los valores iniciales.
  const value = (name: string): string => state.values[name] ?? initialValues[name] ?? "";

  return (
    <form action={formAction} className="space-y-6">
      {Object.keys(errors).length > 0 && (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          Revisa los campos marcados en rojo.
        </p>
      )}

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">La oferta</legend>
        <Field label="Empresa" required error={errors.company}>
          <input name="company" defaultValue={value("company")} className={INPUT} autoFocus />
        </Field>
        <Field label="Rol / puesto" required error={errors.role}>
          <input name="role" defaultValue={value("role")} className={INPUT} />
        </Field>
        <Field label="Modalidad" required error={errors.workMode}>
          <select name="workMode" defaultValue={value("workMode")} className={INPUT}>
            {WORK_MODES.map((workMode) => (
              <option key={workMode} value={workMode}>
                {WORK_MODE_LABELS[workMode]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Ubicación" error={errors.location}>
          <input name="location" defaultValue={value("location")} className={INPUT} placeholder="Ciudad o «Remoto»" />
        </Field>
        <Field label="Tipo de contrato" error={errors.contractType}>
          <input name="contractType" list="contract-options" defaultValue={value("contractType")} className={INPUT} />
        </Field>
        <Field label="Salario" error={errors.salary}>
          <input name="salary" defaultValue={value("salary")} className={INPUT} placeholder="Ej. 32-38k €" />
        </Field>
        <Field label="Enlace a la oferta" error={errors.url} className="sm:col-span-2">
          <input name="url" type="url" defaultValue={value("url")} className={INPUT} placeholder="https://…" />
        </Field>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">La solicitud</legend>
        <Field label="Fecha de solicitud" required error={errors.appliedAt}>
          <input name="appliedAt" type="date" defaultValue={value("appliedAt")} className={INPUT} />
        </Field>
        {mode === "create" && (
          <Field label="Estado inicial" required error={errors.status}>
            <select name="status" defaultValue={value("status")} className={INPUT}>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Dónde la encontraste" error={errors.source}>
          <input name="source" list="source-options" defaultValue={value("source")} className={INPUT} />
        </Field>
        <Field label="Versión de CV enviada" error={errors.cvVersion}>
          <input name="cvVersion" defaultValue={value("cvVersion")} className={INPUT} placeholder="Ej. CV Frontend v2" />
        </Field>
        <Field label="Persona de contacto" error={errors.contactName}>
          <input name="contactName" defaultValue={value("contactName")} className={INPUT} />
        </Field>
        <Field label="Email de contacto" error={errors.contactEmail}>
          <input name="contactEmail" type="email" defaultValue={value("contactEmail")} className={INPUT} />
        </Field>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Seguimiento</legend>
        <Field label="Próxima acción" error={errors.nextAction}>
          <input
            name="nextAction"
            defaultValue={value("nextAction")}
            className={INPUT}
            placeholder="Ej. Enviar email de seguimiento"
          />
        </Field>
        <Field label="Fecha de la próxima acción" error={errors.nextActionDate}>
          <input name="nextActionDate" type="date" defaultValue={value("nextActionDate")} className={INPUT} />
        </Field>
        <Field label="Notas" error={errors.notes} className="sm:col-span-2">
          <textarea name="notes" rows={4} defaultValue={value("notes")} className={INPUT} />
        </Field>
      </fieldset>

      <datalist id="source-options">
        {SOURCE_SUGGESTIONS.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      <datalist id="contract-options">
        {CONTRACT_SUGGESTIONS.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {pending ? "Guardando…" : mode === "create" ? "Guardar solicitud" : "Guardar cambios"}
        </button>
        <Link href={cancelHref} className="text-sm text-slate-600 hover:text-slate-900">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
