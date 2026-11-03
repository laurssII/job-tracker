"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useLang } from "@/i18n/LanguageProvider";
import { STATUSES, isStatus, type Status } from "@/lib/constants";
import { formatDate, formatShortDate } from "@/lib/format";
import type { Application } from "@/lib/types";

interface Props {
  applications: Application[];
  /** Guarda el cambio de estado: acción del servidor (modo normal) o almacén del navegador (demo). */
  onMove: (id: number, status: Status) => Promise<{ ok: boolean }>;
}

/** Título de la página del tablero. */
export function BoardHeading() {
  const { t } = useLang();
  return <h1 className="text-2xl font-semibold tracking-tight">{t.board.title}</h1>;
}

/**
 * Tablero Kanban.
 *
 * - Pantallas anchas (xl, 1280 px o más): las 9 columnas se reparten todo el ancho de la ventana
 *   (`.board-wide`, en globals.css) con tarjetas compactas, para verlo entero de un vistazo.
 *   Si una columna se llena, se desplaza ella sola por dentro; la página no.
 * - Pantallas pequeñas: columnas de ancho fijo con desplazamiento lateral, y un selector en cada
 *   tarjeta como alternativa al arrastre.
 */
export function KanbanBoard({ applications, onMove }: Props) {
  const { lang, t } = useLang();
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
      const result = await onMove(id, status);
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
    <div className="board-wide">
      {failed && (
        <p className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {t.board.moveFailed}
        </p>
      )}
      <div className="flex gap-3 overflow-x-auto pb-4 xl:grid xl:grid-cols-9 xl:gap-2 xl:overflow-visible xl:pb-0">
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
              className={`flex w-60 shrink-0 flex-col rounded-lg border p-2 xl:w-auto xl:min-w-0 xl:p-1.5 ${
                overColumn === status ? "border-slate-400 bg-slate-100" : "border-slate-200 bg-slate-100/60"
              }`}
            >
              <h2 className="flex items-start justify-between gap-1 px-1 py-1 text-xs font-semibold uppercase leading-tight tracking-wide text-slate-600 xl:min-h-9 xl:text-[11px]">
                <span>{t.statuses[status]}</span>
                <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500 xl:px-1.5 xl:text-[11px]">
                  {column.length}
                </span>
              </h2>
              {/* En pantallas anchas la lista ocupa como mucho el alto libre de la ventana y se desplaza sola. */}
              <div className="mt-2 flex-1 space-y-2 xl:mt-1 xl:max-h-[calc(100vh-17rem)] xl:min-h-24 xl:space-y-1.5 xl:overflow-y-auto xl:[scrollbar-width:thin]">
                {column.length === 0 && (
                  <p className="px-1 py-3 text-xs text-slate-600 xl:py-2 xl:text-[11px]">{t.board.empty}</p>
                )}
                {column.map((item) => (
                  <article
                    key={item.id}
                    draggable
                    title={`${item.company} · ${item.role}`}
                    onDragStart={(event) => {
                      setDraggingId(item.id);
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", String(item.id));
                    }}
                    onDragEnd={endDrag}
                    className={`cursor-grab rounded-md border border-slate-200 bg-white p-3 shadow-sm active:cursor-grabbing xl:p-2 ${
                      draggingId === item.id ? "opacity-50" : ""
                    }`}
                  >
                    <Link
                      href={`/applications/${item.id}`}
                      className="line-clamp-2 break-words text-sm font-medium leading-snug hover:underline xl:text-xs"
                    >
                      {item.company}
                    </Link>
                    <p className="mt-0.5 truncate text-xs text-slate-600 xl:text-[11px]">{item.role}</p>
                    {/* El formato de fecha puede variar entre servidor y navegador. */}
                    <p
                      className="mt-2 flex items-baseline justify-between gap-1 text-xs text-slate-500 xl:mt-1.5 xl:text-[11px]"
                      suppressHydrationWarning
                    >
                      <span className="truncate">{t.workModes[item.workMode]}</span>
                      <span className="shrink-0 xl:hidden">{formatDate(item.appliedAt, lang)}</span>
                      <span className="hidden shrink-0 xl:inline">{formatShortDate(item.appliedAt, lang)}</span>
                    </p>
                    {/* Alternativa al arrastre (móvil y teclado). En pantallas anchas solo aparece al enfocarla con el teclado. */}
                    <select
                      aria-label={t.board.moveAria(item.company)}
                      value={item.status}
                      onChange={(event) => {
                        if (isStatus(event.target.value)) move(item.id, event.target.value);
                      }}
                      className="mt-2 w-full rounded border border-slate-200 bg-white px-1 py-1 text-xs text-slate-600 xl:sr-only xl:focus:not-sr-only"
                    >
                      {STATUSES.map((option) => (
                        <option key={option} value={option}>
                          {t.statuses[option]}
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
      <p className="mt-3 text-xs text-slate-500">
        {t.board.hint}
      </p>
    </div>
  );
}
