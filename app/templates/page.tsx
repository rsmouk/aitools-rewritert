"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArticleForm } from "@/components/ArticleForm";
import { WordPressPostPicker } from "@/components/WordPressPostPicker";
import { api } from "@/lib/client-api";
import { DRAFT_STORAGE_KEY, emptyDraft } from "@/lib/draft";
import { useI18n } from "@/lib/i18n";
import {
  cardClass,
  dangerButtonClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/lib/styles";
import type { ArticleDraft, InstructionTemplate, TemplateType, WpPostSummary } from "@/types";

const blank = { name: "", type: "writing" as TemplateType, content: "" };

export default function TemplatesPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [templates, setTemplates] = useState<InstructionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState<typeof blank | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<WpPostSummary | null>(null);

  async function load() {
    setLoading(true);
    try {
      setTemplates(await api<InstructionTemplate[]>("/api/templates"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function openNew() {
    setEditingId(null);
    setEditor({ ...blank });
  }

  function openEdit(template: InstructionTemplate) {
    setEditingId(template.id);
    setEditor({ name: template.name, type: template.type, content: template.content });
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!editor) return;
    setBusy(true);
    try {
      if (editingId) {
        await api(`/api/templates/${editingId}`, { method: "PATCH", body: JSON.stringify(editor) });
      } else {
        await api("/api/templates", { method: "POST", body: JSON.stringify(editor) });
      }
      toast.success(t("templates.saved"));
      setEditor(null);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }

  function askDelete(id: string) {
    toast(t("templates.confirmDelete"), {
      action: {
        label: t("templates.delete"),
        onClick: () => {
          void api(`/api/templates/${id}`, { method: "DELETE" })
            .then(() => {
              toast.success(t("templates.deleted"));
              return load();
            })
            .catch((error: Error) => toast.error(error.message));
        },
      },
    });
  }

  function loadIntoGenerator() {
    if (!selected) return;
    const draft: ArticleDraft = {
      ...emptyDraft(),
      title: selected.title,
      description: selected.excerpt,
      slug: selected.slug,
      content: selected.content,
      categories: selected.categories || [],
      tags: selected.tags || [],
      wp_post_id: selected.id,
    };
    sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    router.push("/");
  }

  const preview: ArticleDraft | null = selected
    ? {
        ...emptyDraft(),
        title: selected.title,
        description: selected.excerpt,
        slug: selected.slug,
        content: selected.content,
        categories: selected.categories || [],
        tags: selected.tags || [],
      }
    : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t("templates.title")}</h1>
          <p className="mt-1 text-sm text-zinc-500">{t("templates.subtitle")}</p>
        </div>
        <button type="button" className={primaryButtonClass} onClick={openNew}>
          {t("templates.new")}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">{t("common.loading")}</p>
      ) : templates.length === 0 ? (
        <p className="text-sm text-zinc-500">{t("templates.empty")}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((template) => (
            <article key={template.id} className={cardClass}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-medium">{template.name}</h2>
                  <p className="mt-1 text-xs uppercase tracking-wide text-zinc-500">
                    {template.type === "writing" ? t("templates.writing") : t("templates.checking")}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button type="button" className={secondaryButtonClass} onClick={() => openEdit(template)}>
                    {t("templates.edit")}
                  </button>
                  <button type="button" className={dangerButtonClass} onClick={() => askDelete(template.id)}>
                    {t("templates.delete")}
                  </button>
                </div>
              </div>
              <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-300" dir="auto">
                {template.content}
              </p>
            </article>
          ))}
        </div>
      )}

      <section className={`${cardClass} space-y-4`}>
        <div>
          <h2 className="text-lg font-semibold">{t("templates.import")}</h2>
          <p className="mt-1 text-sm text-zinc-500">{t("templates.importHint")}</p>
        </div>
        <WordPressPostPicker selectedId={selected?.id ?? null} onSelect={setSelected} />
        {preview ? (
          <div className="space-y-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <h3 className="text-sm font-medium">{t("templates.preview")}</h3>
            <ArticleForm value={preview} onChange={() => undefined} readOnly />
            <button type="button" className={primaryButtonClass} onClick={loadIntoGenerator}>
              {t("templates.load")}
            </button>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">{t("templates.pick")}</p>
        )}
      </section>

      {editor && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-zinc-950/40 p-4 sm:items-center">
          <form onSubmit={save} className={`${cardClass} max-h-[90vh] w-full max-w-2xl space-y-4 overflow-auto`}>
            <h2 className="text-lg font-semibold">{editingId ? t("templates.edit") : t("templates.new")}</h2>
            <label className="block">
              <span className={labelClass}>{t("templates.name")}</span>
              <input
                className={inputClass}
                value={editor.name}
                onChange={(event) => setEditor({ ...editor, name: event.target.value })}
                required
              />
            </label>
            <fieldset>
              <legend className={labelClass}>{t("templates.type")}</legend>
              <div className="flex gap-4 text-sm">
                {(["writing", "checking"] as const).map((type) => (
                  <label key={type} className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="template-type"
                      checked={editor.type === type}
                      onChange={() => setEditor({ ...editor, type })}
                    />
                    {type === "writing" ? t("templates.writing") : t("templates.checking")}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="block">
              <span className={labelClass}>{t("templates.content")}</span>
              <textarea
                className={`${inputClass} min-h-48`}
                dir="auto"
                value={editor.content}
                onChange={(event) => setEditor({ ...editor, content: event.target.value })}
                required
              />
            </label>
            <div className="flex gap-2">
              <button type="submit" className={primaryButtonClass} disabled={busy}>
                {busy ? t("generator.working") : t("templates.save")}
              </button>
              <button type="button" className={secondaryButtonClass} onClick={() => setEditor(null)}>
                {t("templates.cancel")}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
