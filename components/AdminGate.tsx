"use client";

import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { useI18n } from "@/lib/i18n";
import { cardClass, inputClass, labelClass, primaryButtonClass } from "@/lib/styles";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const [state, setState] = useState<"loading" | "locked" | "open">("loading");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ authenticated: boolean }>("/api/admin/session")
      .then((result) => setState(result.authenticated ? "open" : "locked"))
      .catch((error: Error) => {
        toast.error(error.message);
        setState("locked");
      });
  }, []);

  async function unlock(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await api("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      setPassword("");
      setState("open");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }

  if (state === "loading") {
    return <p className="text-sm text-zinc-500">{t("common.loading")}</p>;
  }

  if (state === "locked") {
    return (
      <form onSubmit={unlock} className={`${cardClass} mx-auto max-w-md space-y-4`}>
        <div>
          <h1 className="text-xl font-semibold">{t("admin.title")}</h1>
          <p className="mt-1 text-sm text-zinc-500">{t("admin.locked")}</p>
        </div>
        <label className="block">
          <span className={labelClass}>{t("admin.password")}</span>
          <input
            type="password"
            className={inputClass}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
        </label>
        <button type="submit" className={primaryButtonClass} disabled={busy}>
          {busy ? t("generator.working") : t("admin.unlock")}
        </button>
      </form>
    );
  }

  return <>{children}</>;
}
