import type { Application, StatusChange } from "../src/lib/types";

export function makeApp(id: number, overrides: Partial<Application> = {}): Application {
  return {
    id,
    company: `Empresa ${id}`,
    role: "Desarrollador/a",
    url: null,
    location: null,
    workMode: "remoto",
    contractType: null,
    salary: null,
    source: "LinkedIn",
    appliedAt: "2026-10-01",
    status: "enviada",
    contactName: null,
    contactEmail: null,
    cvVersion: null,
    notes: null,
    nextAction: null,
    nextActionDate: null,
    createdAt: "",
    updatedAt: "",
    ...overrides,
  };
}

let nextHistoryId = 0;

export function makeChange(
  applicationId: number,
  status: StatusChange["status"],
  changedAt: string,
  note: string | null = null,
): StatusChange {
  nextHistoryId += 1;
  return { id: nextHistoryId, applicationId, status, changedAt, note };
}
