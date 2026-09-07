"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { Locale } from "@/lib/i18n";

export function LangSwitcher({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setLocale(next: Locale) {
    if (next === locale) return;
    fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: next }),
    }).then(() => startTransition(() => router.refresh()));
  }

  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-black/10 bg-white text-xs">
      <button
        type="button"
        disabled={pending}
        onClick={() => setLocale("zh-HK")}
        className={`px-2.5 py-1 font-medium transition ${
          locale === "zh-HK"
            ? "bg-brand-600 text-white"
            : "text-ink-700 hover:bg-black/5"
        }`}
      >
        廣東話
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => setLocale("en")}
        className={`px-2.5 py-1 font-medium transition ${
          locale === "en"
            ? "bg-brand-600 text-white"
            : "text-ink-700 hover:bg-black/5"
        }`}
      >
        EN
      </button>
    </div>
  );
}
