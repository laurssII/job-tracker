"use client";

import { useLang } from "@/i18n/LanguageProvider";

export function DeleteButton({ action, company }: { action: () => Promise<void>; company: string }) {
  const { t } = useLang();
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(t.detail.deleteConfirm(company))) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="rounded-md border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50"
      >
        {t.detail.delete}
      </button>
    </form>
  );
}
