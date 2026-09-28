"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client-api";
import { useI18n } from "@/lib/i18n";
import { inputClass, labelClass, secondaryButtonClass } from "@/lib/styles";
import type { WpPostList, WpPostSummary } from "@/types";

export function WordPressPostPicker({
  selectedId,
  onSelect,
}: {
  selectedId: number | null;
  onSelect: (post: WpPostSummary) => void;
}) {
  const { t, lang } = useI18n();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<WpPostList | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api<WpPostList>(`/api/wp/posts?page=${page}`)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((reason: Error) => {
        if (active) setError(reason.message || t("picker.error"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, t]);

  const totalPages = Math.max(1, data?.total_pages || 1);

  return (
    <div>
      {loading && <p className="text-sm text-zinc-500">{t("common.loading")}</p>}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {!loading && !error && (data?.posts.length ?? 0) === 0 && (
        <p className="text-sm text-zinc-500">{t("picker.empty")}</p>
      )}
      <div className="space-y-2">
        {data?.posts.map((post) => (
          <button
            key={post.id}
            type="button"
            onClick={() => onSelect(post)}
            className={`block w-full rounded-xl border px-3 py-3 text-start ${
              selectedId === post.id
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            }`}
          >
            <span className="block text-sm font-medium">{post.title || t("articles.untitled")}</span>
            <span className={`mt-1 block text-xs ${selectedId === post.id ? "opacity-80" : "text-zinc-500"}`}>
              {new Date(post.date).toLocaleDateString(lang === "ar" ? "ar" : "en")}
            </span>
          </button>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          className={secondaryButtonClass}
          disabled={page <= 1 || loading}
          onClick={() => setPage((current) => Math.max(1, current - 1))}
        >
          {t("common.prev")}
        </button>
        <span className="text-sm text-zinc-500">
          {t("common.page")} {page} / {totalPages}
        </span>
        <button
          type="button"
          className={secondaryButtonClass}
          disabled={page >= totalPages || loading}
          onClick={() => setPage((current) => current + 1)}
        >
          {t("common.next")}
        </button>
      </div>
    </div>
  );
}
