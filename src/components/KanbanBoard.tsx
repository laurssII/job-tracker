"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { moveApplicationAction } from "@/app/actions";
import { STATUSES, STATUS_LABELS, WORK_MODE_LABELS, isStatus, type Status } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { Application } from "@/lib/types";

export function KanbanBoard({ applications }: { applications: Application[] }) {
  const [items, setItems] = useState(applications);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [overColumn, setOverColumn] = useState<Status | null>(null);
  const [failed, setFailed] = useState(false);
  const [, startTransition] = useTransition();

  // Cuando el servidor devuelve datos nuevos (tras revalidar), se vuelven a mostrar.
  useEffect(() => setItems(applications), [applications]);

  function move(id: number, status: Status) {
    const current = items.find((item) => item.id === id);
    if (!current || current.status === status) return;

    const previous = items;
    setFailed(false);
    setItems(items.map((item) => (item.id === id ? { ...item, status } : item)));
    startTransition(async () => {
      const result = await moveApplicationAction(id, status);
      if (!result.ok) {
        setItems(previous);
        setFailed(true);
      }
    });
  }

  function endDrag() {
    setDraggingId(null);
    setOverColumn(null);
  }

  return (
    <div>
      {failed && (
        <p className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          No se pudo mover la solicitud. Inténtalo de nuevo.
        </p>
      )}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {STATUSES.map((status) => {
          const column = items.filter((item) => item.status === status);
          return (
            <section
              key={status}
              onDragOver={(event) => {
                event.preventDefault();
                setOverColumn(status);
              }}
              onDragLeave={() => setOverColumn((current) => (current === status ? null : current))}
              onDrop={(event) => {
                event.preventDefault();
                if (draggingId !== null) move(draggingId, status);
                endDrag();
              }}
              className={`w-60 shrink-0 rounded-lg border p-2 ${
                overColumn === status ? "border-slate-400 bg-slate-100" : "border-slate-200 bg-slate-100/60"
              }`}
            >
              <h2 className="flex items-center justify-between px-1 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                {STATUS_LABELS[status]}
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500">
                  {column.length}
                </span>
              </h2>
              <div className="mt-2 space-y-2">
                {column.length === 0 && <p className="px-1 py-3 text-xs text-slate-400">Sin solicitudes</p>}
                {column.map((item) => (
                  <article
                    key={item.id}
                    draggable
                    onDragStart={(event) => {
                      setDraggingId(item.id);
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", String(item.id));
                    }}
                    onDragEnd={endDrag}
                    className={`cursor-grab rounded-md border border-slate-200 bg-white p-3 shadow-sm active:cursor-grabbing ${
                      draggingId === item.id ? "opacity-50" : ""
                    }`}
                  >
                    <Link href={`/applications/${item.id}`} className="block text-sm font-medium hover:underline">
                      {item.company}
                    </Link>
                    <p className="mt-0.5 text-xs text-slate-600">{item.role}</p>
                    {/* El formato de fecha puede variar entre servidor y navegador. */}
                    <p className="mt-2 text-xs text-slate-400" suppressHydrationWarning>
                      {WORK_MODE_LABELS[item.workMode]} · {formatDate(item.appliedAt)}
                    </p>
                    {/* Alternativa al arrastre (móvil y teclado). */}
                    <select
                      aria-label={`Mover ${item.company} a otro estado`}
                      value={item.status}
                      onChange={(event) => {
                        if (isStatus(event.target.value)) move(item.id, event.target.value);
                      }}
                      className="mt-2 w-full rounded border border-slate-200 bg-white px-1 py-1 text-xs text-slate-600"
                    >
                      {STATUSES.map((option) => (
                        <option key={option} value={option}>
                          {STATUS_LABELS[option]}
                        </option>
                      ))}
                    </select>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      <p className="text-xs text-slate-500">
        Arrastra las tarjetas entre columnas o usa el selector de cada una. Cada movimiento queda en el historial con
        la fecha de hoy.
      </p>
    </div>
  );
}
