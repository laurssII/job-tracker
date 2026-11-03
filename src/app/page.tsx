import { DemoDashboard } from "@/components/demo/DemoPages";
import { DashboardView } from "@/components/views/DashboardView";
import { listAllHistory, listApplications } from "@/lib/applications";
import { todayISO } from "@/lib/dates";
import { IS_DEMO } from "@/lib/mode";

// Lee la base de datos en cada visita (no se genera de forma estática en el build).
export const dynamic = "force-dynamic";

export default function DashboardPage() {
  if (IS_DEMO) return <DemoDashboard />;
  return <DashboardView applications={listApplications()} history={listAllHistory()} today={todayISO()} />;
}
