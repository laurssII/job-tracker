import type { ListFilters } from "./types";

export const hasActiveFilters = (filters: ListFilters): boolean => Object.keys(filters).length > 0;

/** Filtros -> "q=react&status=entrevista", para el enlace de exportación del servidor. */
export function filtersToQuery(filters: ListFilters): string {
  return new URLSearchParams(Object.entries(filters).map(([key, value]) => [key, String(value)])).toString();
}
