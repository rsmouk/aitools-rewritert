"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client-api";
import { useI18n } from "@/lib/i18n";
import { inputClass, labelClass } from "@/lib/styles";
import type { InstructionTemplate, TemplateType } from "@/types";

export function TemplateSelector({
  type,
  value,
  onChange,
}: {
  type: TemplateType;
  value: string;
  onChange: (id: string) => void;
}) {
  const { t } = useI18n();
  const [templates, setTemplates] = useState<InstructionTemplate[]>([]);

  useEffect(() => {
    let active = true;
    api<InstructionTemplate[]>(`/api/templates?type=${type}`)
      .then((rows) => {
        if (active) setTemplates(rows);
      })
      .catch(() => {
        if (active) setTemplates([]);
      });
    return () => {
      active = false;
    };
  }, [type]);

  return (
    <label className="block">
      <span className={labelClass}>
        {type === "writing" ? t("generator.writingTemplate") : t("generator.checkingTemplate")}
      </span>
      <select className={inputClass} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{t("generator.none")}</option>
        {templates.map((template) => (
          <option key={template.id} value={template.id}>
            {template.name}
          </option>
        ))}
      </select>
    </label>
  );
}
