"use client";

import { AI_MODELS, PROVIDER_LABELS, modelValue } from "@/config/models";
import type { ProviderId } from "@/types";
import { useI18n } from "@/lib/i18n";
import { inputClass, labelClass } from "@/lib/styles";

const groups: ProviderId[] = ["openai", "gemini", "openrouter"];

export function ModelSelector({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { t } = useI18n();

  return (
    <label className="block">
      <span className={labelClass}>{t("generator.model")}</span>
      <select className={inputClass} value={value} onChange={(event) => onChange(event.target.value)}>
        {groups.map((provider) => (
          <optgroup key={provider} label={PROVIDER_LABELS[provider]}>
            {AI_MODELS.filter((model) => model.provider === provider).map((model) => (
              <option key={modelValue(model)} value={modelValue(model)}>
                {model.label}
                {model.free ? ` (${t("model.free")})` : ""}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}
