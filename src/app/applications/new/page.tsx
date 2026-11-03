import { createApplicationAction } from "@/app/actions";
import { ApplicationForm, FormHeading } from "@/components/ApplicationForm";
import { DemoNew } from "@/components/demo/DemoPages";
import { todayISO } from "@/lib/dates";
import { newApplicationValues } from "@/lib/form-values";
import { IS_DEMO } from "@/lib/mode";

export const dynamic = "force-dynamic";

export default function NewApplicationPage() {
  if (IS_DEMO) return <DemoNew />;

  return (
    <div className="mx-auto max-w-3xl">
      <FormHeading mode="create" />
      <ApplicationForm
        mode="create"
        action={createApplicationAction}
        initialValues={newApplicationValues(todayISO())}
        cancelHref="/applications"
      />
    </div>
  );
}
