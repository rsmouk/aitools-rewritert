"use client";

import { useI18n } from "@/lib/i18n";
import { labelClass } from "@/lib/styles";
import type { FeaturedImage } from "@/types";

export function ImageUpload({
  value,
  onChange,
  disabled = false,
}: {
  value: FeaturedImage | null;
  onChange: (image: FeaturedImage | null) => void;
  disabled?: boolean;
}) {
  const { t } = useI18n();

  function onFile(file: File | undefined) {
    if (!file) return;
    const extension = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
      onChange({
        base64,
        filename: `featured.${extension || "jpg"}`,
        alt: "",
        description: "",
        previewUrl: dataUrl,
      });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <span className={labelClass}>{t("fields.image")}</span>
      <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">{t("fields.imageHint")}</p>
      {!disabled && (
        <input
          type="file"
          accept="image/*"
          onChange={(event) => onFile(event.target.files?.[0])}
          className="block w-full text-sm text-zinc-600 file:me-3 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-3 file:py-2 file:text-sm file:text-white dark:text-zinc-300 dark:file:bg-zinc-100 dark:file:text-zinc-900"
        />
      )}
      {value?.previewUrl && (
        <div className="mt-3 flex items-start gap-3">
          {/* Local preview of a file the user just chose. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value.previewUrl} alt={value.alt} className="h-24 w-36 rounded-lg object-cover" />
          {!disabled && (
            <button type="button" onClick={() => onChange(null)} className="text-sm text-red-600 dark:text-red-400">
              {t("fields.remove")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
