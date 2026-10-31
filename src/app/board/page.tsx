import { KanbanBoard } from "@/components/KanbanBoard";
import { listApplications } from "@/lib/applications";

export const dynamic = "force-dynamic";

export default function BoardPage() {
  const applications = listApplications();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Tablero</h1>
      <KanbanBoard applications={applications} />
    </div>
  );
}
