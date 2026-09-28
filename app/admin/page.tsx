"use client";

import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminGate } from "@/components/AdminGate";
import { api } from "@/lib/client-api";
import { useI18n } from "@/lib/i18n";
import { cardClass, inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "@/lib/styles";
import type { SettingsView } from "@/types";

export default function AdminPage() {
  return (
    <AdminGate>
      <AdminSettings />
    </AdminGate>
  );
}

function AdminSettings() {
  const { t } = useI18n();
  const [settings, setSettings] = useState<SettingsView | null>(null);
  const [openai, setOpenai] = useState("");
  const [gemini, setGemini] = useState("");
  const [openrouter, setOpenrouter] = useState("");
  const [wpUrl, setWpUrl] = useState("");
  const [wpKey, setWpKey] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    api<SettingsView>("/api/settings")
      .then((result) => {
        setSettings(result);
        setWpUrl(result.wp_site_url || "");
      })
      .catch((error: Error) => toast.error(error.message));
  }, []);

  async function saveSettings(event: FormEvent) {
    event.preventDefault();
    setBusy("settings");
    try {
      await api("/api/settings", {
        method: "PUT",
        body: JSON.stringify({
          openai_api_key: openai,
          gemini_api_key: gemini,
          openrouter_api_key: openrouter,
          wp_site_url: wpUrl,
          wp_api_key: wpKey,
        }),
      });
      toast.success(t("admin.settingsSaved"));
      setOpenai("");
      setGemini("");
      setOpenrouter("");
      setWpKey("");
      const next = await api<SettingsView>("/api/settings");
      setSettings(next);
      setWpUrl(next.wp_site_url || "");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Request failed.");
    } finally {
      setBusy("");
    }
  }

  async function testConnection() {
    setBusy("test");
    try {
      await api("/api/settings/test", { method: "POST" });
      toast.success(t("admin.connected"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Request failed.");
    } finally {
      setBusy("");
    }
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    setBusy("password");
    try {
      await api("/api/admin/password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword("");
      setNewPassword("");
      toast.success(t("admin.passwordChanged"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Request failed.");
    } finally {
      setBusy("");
    }
  }

  async function signOut() {
    await api("/api/admin/logout", { method: "POST" });
    window.location.reload();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t("admin.title")}</h1>
        <button type="button" className={secondaryButtonClass} onClick={signOut}>
          {t("admin.signOut")}
        </button>
      </div>

      <form onSubmit={saveSettings} className="space-y-6">
        <section className={`${cardClass} space-y-4`}>
          <h2 className="font-medium">{t("admin.ai")}</h2>
          <SecretField
            label={t("admin.openai")}
            value={openai}
            saved={settings?.openai_api_key_set}
            onChange={setOpenai}
            hint={t("admin.savedHint")}
          />
          <SecretField
            label={t("admin.gemini")}
            value={gemini}
            saved={settings?.gemini_api_key_set}
            onChange={setGemini}
            hint={t("admin.savedHint")}
          />
          <SecretField
            label={t("admin.openrouter")}
            value={openrouter}
            saved={settings?.openrouter_api_key_set}
            onChange={setOpenrouter}
            hint={t("admin.savedHint")}
          />
        </section>

        <section className={`${cardClass} space-y-4`}>
          <h2 className="font-medium">{t("admin.wp")}</h2>
          <label className="block">
            <span className={labelClass}>{t("admin.wpUrl")}</span>
            <input className={inputClass} value={wpUrl} onChange={(event) => setWpUrl(event.target.value)} placeholder="https://example.com" />
          </label>
          <SecretField
            label={t("admin.wpKey")}
            value={wpKey}
            saved={settings?.wp_api_key_set}
            onChange={setWpKey}
            hint={t("admin.savedHint")}
          />
          <div className="flex flex-wrap gap-2">
            <button type="submit" className={primaryButtonClass} disabled={busy !== ""}>
              {busy === "settings" ? t("generator.working") : t("admin.save")}
            </button>
            <button type="button" className={secondaryButtonClass} disabled={busy !== ""} onClick={testConnection}>
              {busy === "test" ? t("generator.working") : t("admin.test")}
            </button>
          </div>
        </section>
      </form>

      <form onSubmit={changePassword} className={`${cardClass} space-y-4`}>
        <h2 className="font-medium">{t("admin.passwordSection")}</h2>
        <label className="block">
          <span className={labelClass}>{t("admin.currentPassword")}</span>
          <input
            type="password"
            className={inputClass}
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
          />
        </label>
        <label className="block">
          <span className={labelClass}>{t("admin.newPassword")}</span>
          <input
            type="password"
            className={inputClass}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
          />
        </label>
        <button type="submit" className={primaryButtonClass} disabled={busy !== ""}>
          {busy === "password" ? t("generator.working") : t("admin.changePassword")}
        </button>
      </form>
    </div>
  );
}

function SecretField({
  label,
  value,
  saved,
  hint,
  onChange,
}: {
  label: string;
  value: string;
  saved?: boolean;
  hint: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <input
        type="password"
        className={inputClass}
        value={value}
        placeholder={saved ? "••••••••" : ""}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="off"
      />
      {saved && <span className="mt-1 block text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}
