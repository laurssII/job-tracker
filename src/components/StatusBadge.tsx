"use client";

import { useLang } from "@/i18n/LanguageProvider";
import { STATUS_STYLES, type Status } from "@/lib/constants";

export function StatusBadge({ status }: { status: Status }) {
  const { t } = useLang();
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[status]}`}
    >
      {t.statuses[status]}
    </span>
  );
}
