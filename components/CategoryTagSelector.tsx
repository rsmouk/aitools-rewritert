"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/client-api";
import { useI18n } from "@/lib/i18n";
import { inputClass, labelClass } from "@/lib/styles";
import type { WpTerm } from "@/types";

export function CategoryTagSelector({
  label,
  endpoint,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  endpoint: "/api/wp/categories" | "/api/wp/tags";
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}) {
  const { t } = useI18n();
  const [options, setOptions] = useState<WpTerm[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    api<WpTerm[]>(endpoint)
      .then((rows) => {
        if (active) setOptions(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (active) setOptions([]);
      });
    return () => {
      active = false;
    };
  }, [endpoint]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return options.filter((option) => !needle || option.name.toLowerCase().includes(needle)).slice(0, 30);
  }, [options, query]);

  function toggle(name: string) {
    onChange(value.includes(name) ? value.filter((item) => item !== name) : [...value, name]);
  }

  async function addCustom() {
    const name = query.trim();
    if (!name || value.includes(name)) return;
    onChange([...value, name]);
    setQuery("");
    try {
      const created = await api<WpTerm>(endpoint, {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      setOptions((current) => (current.some((item) => item.name === created.name) ? current : [...current, created]));
    } catch {
      // The name stays on the article and is created again when publishing.
    }
  }

  return (
    <div>
      <span className={labelClass}>{label}</span>
      {value.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {value.map((item) => (
            <button
              key={item}
              type="button"
              disabled={disabled}
              onClick={() => toggle(item)}
              className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
            >
              {item}
              {!disabled && <span className="ms-2 text-zinc-500">×</span>}
            </button>
          ))}
        </div>
      )}
      {!disabled && (
        <div className="relative">
          <input
            className={inputClass}
            value={query}
            placeholder={t("fields.searchAdd")}
            onFocus={() => setOpen(true)}
            onBlur={() => window.setTimeout(() => setOpen(false), 150)}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                const exact = options.find((option) => option.name.toLowerCase() === query.trim().toLowerCase());
                if (exact) toggle(exact.name);
                else void addCustom();
              }
            }}
          />
          {open && (
            <div className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
              {filtered.length === 0 ? (
                <p className="px-3 py-2 text-sm text-zinc-500">{t("fields.emptyTerms")}</p>
              ) : (
                filtered.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggle(option.name)}
                    className="block w-full px-3 py-2 text-start text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  >
                    {option.name}
                    {value.includes(option.name) ? " ✓" : ""}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
