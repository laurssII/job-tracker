import { notFound } from "next/navigation";
import { updateApplicationAction } from "@/app/actions";
import { DemoEdit } from "@/components/demo/DemoPages";
import { ApplicationForm } from "@/components/ApplicationForm";
import { getApplication } from "@/lib/applications";
import { applicationToValues } from "@/lib/form-values";
import { IS_DEMO } from "@/lib/mode";

export const dynamic = "force-dynamic";

export default async function EditApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  if (IS_DEMO) return <DemoEdit id={id} />;

  const application = getApplication(id);
  if (!application) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">
        Editar: {application.company} <span className="font-normal text-slate-500">· {application.role}</span>
      </h1>
      <ApplicationForm
        mode="edit"
        action={updateApplicationAction.bind(null, application.id)}
        initialValues={applicationToValues(application)}
        cancelHref={`/applications/${application.id}`}
      />
    </div>
  );
}
