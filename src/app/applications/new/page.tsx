import { createApplicationAction } from "@/app/actions";
import { ApplicationForm } from "@/components/ApplicationForm";
import { todayISO } from "@/lib/dates";
import { newApplicationValues } from "@/lib/form-values";

export const dynamic = "force-dynamic";

export default function NewApplicationPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Nueva solicitud</h1>
      <ApplicationForm
        mode="create"
        action={createApplicationAction}
        initialValues={newApplicationValues(todayISO())}
        cancelHref="/applications"
      />
    </div>
  );
}
