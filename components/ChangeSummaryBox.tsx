"use client";

import { useI18n } from "@/lib/i18n";

export function ChangeSummaryBox({ changes }: { changes: string[] }) {
  const { t } = useI18n();

  return (
    <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/30">
      <h3 className="text-sm font-semibold text-amber-950 dark:text-amber-100">{t("changes.title")}</h3>
      {changes.length === 0 ? (
        <p className="mt-2 text-sm text-amber-900/80 dark:text-amber-100/80">{t("changes.empty")}</p>
      ) : (
        <ul className="mt-2 list-disc space-y-1 ps-5 text-sm text-amber-950 dark:text-amber-50">
          {changes.map((change) => (
            <li key={change}>{change}</li>
          ))}
        </ul>
      )}
    </aside>
  );
}
