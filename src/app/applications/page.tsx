import { DemoApplications } from "@/components/demo/DemoPages";
import {
  ApplicationsListView,
  exportLabel,
  filtersToQuery,
} from "@/components/views/ApplicationsListView";
import { listApplications, listSources } from "@/lib/applications";
import { IS_DEMO } from "@/lib/mode";
import { parseFilters } from "@/lib/validation";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ApplicationsPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = parseFilters(await searchParams);
  if (IS_DEMO) return <DemoApplications filters={filters} />;

  const query = filtersToQuery(filters);
  return (
    <ApplicationsListView
      applications={listApplications(filters)}
      sources={listSources()}
      filters={filters}
      exportControl={
        <a
          href={`/api/export${query ? `?${query}` : ""}`}
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          {exportLabel(filters)}
        </a>
      }
    />
  );
}
