import { moveApplicationAction } from "@/app/actions";
import { DemoBoard } from "@/components/demo/DemoPages";
import { KanbanBoard } from "@/components/KanbanBoard";
import { listApplications } from "@/lib/applications";
import { IS_DEMO } from "@/lib/mode";

export const dynamic = "force-dynamic";

export default function BoardPage() {
  if (IS_DEMO) return <DemoBoard />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Tablero</h1>
      <KanbanBoard applications={listApplications()} onMove={moveApplicationAction} />
    </div>
  );
}
