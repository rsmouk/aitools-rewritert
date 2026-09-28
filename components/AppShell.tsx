"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useI18n } from "@/lib/i18n";

const links = [
  { href: "/", key: "nav.generator" as const },
  { href: "/templates", key: "nav.templates" as const },
  { href: "/articles", key: "nav.articles" as const },
  { href: "/admin", key: "nav.admin" as const },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-zinc-200/80 bg-zinc-50/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-4">
          <Link href="/" className="min-w-0">
            <span className="block text-sm font-semibold tracking-tight">{t("app.name")}</span>
            <span className="block text-xs text-zinc-500 dark:text-zinc-400">{t("app.tagline")}</span>
          </Link>
          <nav className="flex flex-1 flex-wrap items-center gap-1">
            {links.map((link) => {
              const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-1.5 text-sm ${
                    active
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "text-zinc-600 hover:bg-zinc-200/70 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`}
                >
                  {t(link.key)}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
            >
              {mounted && resolvedTheme === "dark" ? t("theme.toLight") : t("theme.toDark")}
            </button>
            <LanguageButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}

function LanguageButton() {
  const { t, toggle } = useI18n();
  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
    >
      {t("lang.switch")}
    </button>
  );
}
