"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArticleForm } from "@/components/ArticleForm";
import { ChangeSummaryBox } from "@/components/ChangeSummaryBox";
import { ModelSelector } from "@/components/ModelSelector";
import { TemplateSelector } from "@/components/TemplateSelector";
import { AI_MODELS, modelValue } from "@/config/models";
import { api } from "@/lib/client-api";
import { DRAFT_STORAGE_KEY, emptyDraft } from "@/lib/draft";
import { useI18n } from "@/lib/i18n";
import { cardClass, inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "@/lib/styles";
import type { ArticleDraft } from "@/types";

type Busy = "" | "generate" | "verify" | "publish" | "draft" | "local";

type PublishResult = {
  post_id: number;
  post_url: string;
  slug?: string;
  featured_image_url?: string;
  image_error?: string;
};

export default function HomePage() {
  const { t } = useI18n();
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState(modelValue(AI_MODELS[0]));
  const [writingTemplate, setWritingTemplate] = useState("");
  const [checkingTemplate, setCheckingTemplate] = useState("");
  const [tab, setTab] = useState<"original" | "corrected">("original");
  const [original, setOriginal] = useState<ArticleDraft>(emptyDraft());
  const [corrected, setCorrected] = useState<ArticleDraft | null>(null);
  const [hasArticle, setHasArticle] = useState(false);
  const [busy, setBusy] = useState<Busy>("");

  useEffect(() => {
    const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return;
    sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    try {
      const draft = JSON.parse(raw) as ArticleDraft;
      setOriginal({
        ...emptyDraft(),
        ...draft,
        categories: draft.categories || [],
        tags: draft.tags || [],
        featuredImage: null,
      });
      setHasArticle(true);
      toast.success(t("common.loaded"));
    } catch {
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  }, [t]);

  const article = tab === "corrected" && corrected ? corrected : original;

  function setArticle(next: ArticleDraft) {
    if (tab === "corrected" && corrected) setCorrected(next);
    else setOriginal(next);
  }

  async function generate() {
    setBusy("generate");
    try {
      const result = await api<{
        title: string;
        description: string;
        slug: string;
        content: string;
        suggested_categories: string[];
        suggested_tags: string[];
      }>("/api/generate", {
        method: "POST",
        body: JSON.stringify({
          prompt,
          model,
          templateId: writingTemplate || undefined,
        }),
      });
      setOriginal({
        ...emptyDraft(),
        title: result.title,
        description: result.description,
        slug: result.slug,
        content: result.content,
        categories: result.suggested_categories,
        tags: result.suggested_tags,
      });
      setCorrected(null);
      setTab("original");
      setHasArticle(true);
      toast.success(t("common.generated"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Request failed.");
    } finally {
      setBusy("");
    }
  }

  async function verify() {
    if (!checkingTemplate) {
      toast.error(t("generator.needChecking"));
      return;
    }
    setBusy("verify");
    try {
      const result = await api<{
        title: string;
        description: string;
        slug: string;
        content: string;
        categories: string[];
        tags: string[];
        changes_summary: string[];
      }>("/api/rewrite", {
        method: "POST",
        body: JSON.stringify({
          model,
          templateId: checkingTemplate,
          article: {
            title: original.title,
            description: original.description,
            slug: original.slug,
            content: original.content,
            categories: original.categories,
            tags: original.tags,
          },
        }),
      });
      setCorrected({
        ...emptyDraft(),
        title: result.title,
        description: result.description,
        slug: result.slug,
        content: result.content,
        categories: result.categories,
        tags: result.tags,
        changes_summary: result.changes_summary,
        featuredImage: original.featuredImage,
        featured_image_url: original.featured_image_url,
        wp_post_id: original.wp_post_id,
      });
      setTab("corrected");
      toast.success(t("common.verified"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Request failed.");
    } finally {
      setBusy("");
    }
  }

  async function publish(status: "publish" | "draft") {
    const current = tab === "corrected" && corrected ? corrected : original;
    setBusy(status === "draft" ? "draft" : "publish");
    try {
      const result = await api<PublishResult>("/api/wp/publish", {
        method: "POST",
        body: JSON.stringify({
          title: current.title,
          description: current.description,
          slug: current.slug,
          content: current.content,
          categories: current.categories,
          tags: current.tags,
          status,
          featured_image_base64: current.featuredImage?.base64 || "",
          featured_image_filename: current.featuredImage?.filename || "",
          featured_image_alt: current.title,
          featured_image_description: current.title,
        }),
      });
      const next = {
        ...current,
        slug: result.slug || current.slug,
        wp_post_id: result.post_id,
        featured_image_url: result.featured_image_url || current.featured_image_url,
      };
      if (tab === "corrected") setCorrected(next);
      else setOriginal(next);
      if (result.image_error) toast.warning(result.image_error);
      toast.success(
        status === "draft" ? t("common.draftSaved") : `${t("common.published")}: ${result.post_url}`
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Request failed.");
    } finally {
      setBusy("");
    }
  }

  async function saveLocally() {
    const current = tab === "corrected" && corrected ? corrected : original;
    setBusy("local");
    try {
      const payload = {
        title: current.title,
        description: current.description,
        slug: current.slug,
        content: current.content,
        categories: current.categories,
        tags: current.tags,
        featured_image_url: current.featured_image_url || null,
        wp_post_id: current.wp_post_id || null,
        status: "saved",
      };
      const saved = await api<{ id: string }>(current.id ? `/api/articles/${current.id}` : "/api/articles", {
        method: current.id ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      const next = { ...current, id: saved.id };
      if (tab === "corrected") setCorrected(next);
      else setOriginal(next);
      toast.success(t("common.saved"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Request failed.");
    } finally {
      setBusy("");
    }
  }

  function updateOriginal() {
    if (!corrected) return;
    setOriginal({ ...corrected, id: original.id, changes_summary: [] });
    setTab("original");
    toast.success(t("common.updated"));
  }

  return (
    <div className="space-y-6">
      <section className={`${cardClass} space-y-4`}>
        <label className="block">
          <span className={labelClass}>{t("generator.prompt")}</span>
          <textarea
            className={`${inputClass} min-h-36`}
            dir="auto"
            placeholder={t("generator.promptPlaceholder")}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
          />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <ModelSelector value={model} onChange={setModel} />
          <TemplateSelector type="writing" value={writingTemplate} onChange={setWritingTemplate} />
        </div>
        <button type="button" className={primaryButtonClass} disabled={busy !== ""} onClick={generate}>
          {busy === "generate" ? t("generator.working") : t("generator.generate")}
        </button>
      </section>

      {!hasArticle ? (
        <p className="text-sm text-zinc-500">{t("generator.empty")}</p>
      ) : (
        <section className={`${cardClass} space-y-5`}>
          <div className="flex gap-2">
            {(["original", "corrected"] as const).map((item) => (
              <button
                key={item}
                type="button"
                disabled={item === "corrected" && !corrected}
                onClick={() => setTab(item)}
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  tab === item
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-600 dark:text-zinc-300"
                } disabled:opacity-40`}
              >
                {item === "original" ? t("tabs.original") : t("tabs.corrected")}
              </button>
            ))}
          </div>

          {tab === "corrected" && corrected && (
            <ChangeSummaryBox changes={corrected.changes_summary || []} />
          )}

          <ArticleForm value={article} onChange={setArticle} />

          {tab === "original" && (
            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <TemplateSelector type="checking" value={checkingTemplate} onChange={setCheckingTemplate} />
              <button type="button" className={secondaryButtonClass} disabled={busy !== ""} onClick={verify}>
                {busy === "verify" ? t("generator.working") : t("generator.verify")}
              </button>
            </div>
          )}

          {tab === "corrected" && (
            <button type="button" className={secondaryButtonClass} onClick={updateOriginal}>
              {t("actions.updateOriginal")}
            </button>
          )}

          <div className="flex flex-wrap gap-2">
            <button type="button" className={primaryButtonClass} disabled={busy !== ""} onClick={() => publish("publish")}>
              {busy === "publish" ? t("generator.working") : t("actions.publish")}
            </button>
            <button type="button" className={secondaryButtonClass} disabled={busy !== ""} onClick={() => publish("draft")}>
              {busy === "draft" ? t("generator.working") : t("actions.draft")}
            </button>
            <button type="button" className={secondaryButtonClass} disabled={busy !== ""} onClick={saveLocally}>
              {busy === "local" ? t("generator.working") : t("actions.saveLocal")}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
