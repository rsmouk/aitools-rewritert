"use client";

import { CategoryTagSelector } from "@/components/CategoryTagSelector";
import { ImageUpload } from "@/components/ImageUpload";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import { toSlug } from "@/lib/slugify";
import { useI18n } from "@/lib/i18n";
import { inputClass, labelClass } from "@/lib/styles";
import type { ArticleDraft, FeaturedImage } from "@/types";

export function ArticleForm({
  value,
  onChange,
  readOnly = false,
}: {
  value: ArticleDraft;
  onChange: (value: ArticleDraft) => void;
  readOnly?: boolean;
}) {
  const { t } = useI18n();

  function commit(partial: Partial<ArticleDraft>) {
    const next: ArticleDraft = { ...value, ...partial };
    if (next.featuredImage && (partial.title !== undefined || partial.slug !== undefined)) {
      const extension = next.featuredImage.filename.split(".").pop() || "jpg";
      next.featuredImage = {
        ...next.featuredImage,
        filename: `${next.slug || "featured"}.${extension}`,
        alt: next.title,
        description: next.title,
      };
    }
    onChange(next);
  }

  function onTitle(title: string) {
    const previousAuto = toSlug(value.title);
    const slug = !value.slug || value.slug === previousAuto ? toSlug(title) : value.slug;
    commit({ title, slug });
  }

  function onImage(image: FeaturedImage | null) {
    if (!image) {
      onChange({ ...value, featuredImage: null });
      return;
    }
    const extension = image.filename.split(".").pop() || "jpg";
    onChange({
      ...value,
      featuredImage: {
        ...image,
        filename: `${value.slug || "featured"}.${extension}`,
        alt: value.title,
        description: value.title,
      },
    });
  }

  return (
    <div className="space-y-4">
      <label className="block">
        <span className={labelClass}>{t("fields.title")}</span>
        <input
          className={inputClass}
          value={value.title}
          disabled={readOnly}
          dir="auto"
          onChange={(event) => onTitle(event.target.value)}
        />
      </label>
      <label className="block">
        <span className={labelClass}>{t("fields.description")}</span>
        <textarea
          className={`${inputClass} min-h-24`}
          value={value.description}
          disabled={readOnly}
          dir="auto"
          onChange={(event) => commit({ description: event.target.value })}
        />
      </label>
      <label className="block">
        <span className={labelClass}>{t("fields.slug")}</span>
        <input
          className={inputClass}
          value={value.slug}
          disabled={readOnly}
          onChange={(event) => onChange({ ...value, slug: event.target.value })}
          onBlur={(event) => commit({ slug: toSlug(event.target.value) })}
        />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <CategoryTagSelector
          label={t("fields.categories")}
          endpoint="/api/wp/categories"
          value={value.categories}
          disabled={readOnly}
          onChange={(categories) => commit({ categories })}
        />
        <CategoryTagSelector
          label={t("fields.tags")}
          endpoint="/api/wp/tags"
          value={value.tags}
          disabled={readOnly}
          onChange={(tags) => commit({ tags })}
        />
      </div>
      {!readOnly && <ImageUpload value={value.featuredImage} onChange={onImage} />}
      {value.featured_image_url && !value.featuredImage && (
        <div>
          <span className={labelClass}>{t("fields.existingImage")}</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value.featured_image_url} alt={value.title} className="h-24 w-36 rounded-lg object-cover" />
        </div>
      )}
      <div>
        <span className={labelClass}>{t("fields.content")}</span>
        <MarkdownEditor
          value={value.content}
          readOnly={readOnly}
          onChange={(content) => commit({ content })}
        />
      </div>
    </div>
  );
}
