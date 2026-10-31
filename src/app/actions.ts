"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  changeStatus,
  createApplication,
  deleteApplication,
  updateApplication,
} from "@/lib/applications";
import { isStatus } from "@/lib/constants";
import { todayISO } from "@/lib/dates";
import {
  parseApplicationForm,
  parseStatusChangeForm,
  type FormState,
} from "@/lib/validation";

function refreshAll() {
  revalidatePath("/", "layout");
}

export async function createApplicationAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseApplicationForm(formData);
  if (!parsed.ok) return { errors: parsed.errors, values: parsed.values };

  const id = createApplication(parsed.data);
  refreshAll();
  redirect(`/applications/${id}`);
}

export async function updateApplicationAction(
  id: number,
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseApplicationForm(formData);
  if (!parsed.ok) return { errors: parsed.errors, values: parsed.values };

  // El estado no se edita aquí: tiene su propio formulario para que quede en el historial.
  const { status: _status, ...update } = parsed.data;
  updateApplication(id, update);
  refreshAll();
  redirect(`/applications/${id}`);
}

/** Formulario de la página de detalle: cambia el estado con fecha y nota opcional. */
export async function changeStatusAction(id: number, formData: FormData): Promise<void> {
  const parsed = parseStatusChangeForm(formData, todayISO());
  if (!parsed) return;
  changeStatus(id, parsed.status, parsed.date, parsed.note);
  refreshAll();
}

/** Arrastrar una tarjeta en el tablero (o usar su selector). Devuelve si se aplicó el cambio. */
export async function moveApplicationAction(id: number, status: string): Promise<{ ok: boolean }> {
  if (!Number.isInteger(id) || !isStatus(status)) return { ok: false };
  const ok = changeStatus(id, status, todayISO(), null);
  refreshAll();
  return { ok };
}

export async function deleteApplicationAction(id: number): Promise<void> {
  deleteApplication(id);
  refreshAll();
  redirect("/applications");
}
