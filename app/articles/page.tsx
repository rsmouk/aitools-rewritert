"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { DRAFT_STORAGE_KEY, emptyDraft } from "@/lib/draft";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { cardClass, dangerButtonClass, secondaryButtonClass } from "@/lib/styles";
import type { ArticleDraft, ArticleStatus, GeneratedArticle } from "@/types";

const statusKey: Record<ArticleStatus, MessageKey> = {
  draft: "status.draft",
  published: "status.published",
  saved: "status.saved",
};

export default function ArticlesPage() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [articles, setArticles] = useState<GeneratedArticle[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setArticles(await api<GeneratedArticle[]>("/api/articles"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function open(article: GeneratedArticle) {
    const draft: ArticleDraft = {
      ...emptyDraft(),
      id: article.id,
      title: article.title,
      description: article.description,
      slug: article.slug,
      content: article.content,
      categories: article.categories || [],
      tags: article.tags || [],
      featured_image_url: article.featured_image_url,
      wp_post_id: article.wp_post_id,
    };
    sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    router.push("/");
  }

  function askDelete(id: string) {
    toast(t("articles.confirmDelete"), {
      action: {
        label: t("articles.delete"),
        onClick: () => {
          void api(`/api/articles/${id}`, { method: "DELETE" })
            .then(() => {
              toast.success(t("articles.deleted"));
              return load();
            })
            .catch((error: Error) => toast.error(error.message));
        },
      },
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("articles.title")}</h1>
        <p className="mt-1 text-sm text-zinc-500">{t("articles.subtitle")}</p>
      </div>
      {loading ? (
        <p className="text-sm text-zinc-500">{t("common.loading")}</p>
      ) : articles.length === 0 ? (
        <p className="text-sm text-zinc-500">{t("articles.empty")}</p>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <article key={article.id} className={`${cardClass} flex flex-wrap items-start justify-between gap-3`}>
              <div>
                <h2 className="font-medium" dir="auto">
                  {article.title || t("articles.untitled")}
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  {t(statusKey[article.status] || "status.saved")}
                  {" · "}
                  {new Date(article.created_at).toLocaleString(lang === "ar" ? "ar" : "en")}
                  {article.wp_post_id ? ` · #${article.wp_post_id}` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button" className={secondaryButtonClass} onClick={() => open(article)}>
                  {t("articles.load")}
                </button>
                <button type="button" className={dangerButtonClass} onClick={() => askDelete(article.id)}>
                  {t("articles.delete")}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
