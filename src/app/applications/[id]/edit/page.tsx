import { notFound } from "next/navigation";
import { updateApplicationAction } from "@/app/actions";
import { ApplicationForm } from "@/components/ApplicationForm";
import { getApplication } from "@/lib/applications";
import { applicationToValues } from "@/lib/form-values";

export const dynamic = "force-dynamic";

export default async function EditApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  const application = Number.isInteger(id) && id > 0 ? getApplication(id) : null;
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
