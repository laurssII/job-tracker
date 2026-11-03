import { notFound } from "next/navigation";
import { changeStatusAction, deleteApplicationAction } from "@/app/actions";
import { DemoDetail } from "@/components/demo/DemoPages";
import { ApplicationDetailView } from "@/components/views/ApplicationDetailView";
import { getApplication, getHistory } from "@/lib/applications";
import { todayISO } from "@/lib/dates";
import { IS_DEMO } from "@/lib/mode";

export const dynamic = "force-dynamic";

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  if (IS_DEMO) return <DemoDetail id={id} />;

  const application = getApplication(id);
  if (!application) notFound();

  return (
    <ApplicationDetailView
      application={application}
      history={getHistory(id)}
      today={todayISO()}
      changeStatus={changeStatusAction.bind(null, id)}
      deleteAction={deleteApplicationAction.bind(null, id)}
    />
  );
}
