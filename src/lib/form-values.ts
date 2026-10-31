import type { Application } from "./types";
import type { FormValues } from "./validation";

/** Valores iniciales del formulario de nueva solicitud. */
export function newApplicationValues(today: string): FormValues {
  return { appliedAt: today, status: "enviada", workMode: "hibrido" };
}

/** Valores iniciales del formulario de edición, a partir de una solicitud existente. */
export function applicationToValues(app: Application): FormValues {
  return {
    company: app.company,
    role: app.role,
    url: app.url ?? "",
    location: app.location ?? "",
    workMode: app.workMode,
    contractType: app.contractType ?? "",
    salary: app.salary ?? "",
    source: app.source ?? "",
    appliedAt: app.appliedAt,
    contactName: app.contactName ?? "",
    contactEmail: app.contactEmail ?? "",
    cvVersion: app.cvVersion ?? "",
    notes: app.notes ?? "",
    nextAction: app.nextAction ?? "",
    nextActionDate: app.nextActionDate ?? "",
  };
}
