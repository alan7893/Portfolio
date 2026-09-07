"use client";

import { useEffect, useMemo, useState } from "react";
import type { Dictionary, Locale } from "@/lib/i18n";
import { interpolate } from "@/lib/i18n";
import type { AiKind, AiProvider } from "@/lib/ai-prompt";

type ChildOption = { id: string; name: string; eventCount: number };

export function AiAnalysisPanel({
  kids,
  defaultChildId,
  providers,
  locale,
  t,
}: {
  kids: ChildOption[];
  defaultChildId: string | null;
  providers: Record<AiProvider, boolean>;
  locale: Locale;
  t: Dictionary;
}) {
  const firstEnabled: AiProvider | null = providers.gemini
    ? "gemini"
    : providers.deepseek
      ? "deepseek"
      : null;

  const [childId, setChildId] = useState(
    defaultChildId ?? kids[0]?.id ?? "",
  );
  const [provider, setProvider] = useState<AiProvider>(firstEnabled ?? "gemini");
  const [kind, setKind] = useState<AiKind>("portfolio");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!childId && kids[0]?.id) {
      setChildId(kids[0].id);
    }
  }, [childId, kids]);

  const selected = useMemo(
    () => kids.find((c) => c.id === childId),
    [kids, childId],
  );

  const anyProvider = providers.gemini || providers.deepseek;

  async function generate() {
    const id = childId || kids[0]?.id || "";
    setError(null);
    setResult("");
    if (!id) {
      setError(t.ai.emptyChild);
      return;
    }
    if (!providers[provider]) {
      setError(provider === "gemini" ? t.ai.missingGemini : t.ai.missingDeepseek);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId: id, provider, kind, locale }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        text?: string;
        error?: string;
      };
      if (!res.ok) {
        setError(interpolate(t.ai.error, { message: json.error ?? res.statusText }));
        return;
      }
      setResult(json.text ?? "");
    } catch (err) {
      setError(
        interpolate(t.ai.error, {
          message: err instanceof Error ? err.message : "network",
        }),
      );
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (kids.length === 0) {
    return (
      <div className="card p-8 text-center text-ink-700/70">
        {t.dashboard.emptyChildren}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="card grid gap-4 p-6 sm:grid-cols-3">
        <div>
          <label className="label">{t.ai.child}</label>
          <select
            className="input"
            value={childId}
            onChange={(e) => setChildId(e.target.value)}
          >
            {kids.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">{t.ai.provider}</label>
          <select
            className="input"
            value={provider}
            onChange={(e) => setProvider(e.target.value as AiProvider)}
          >
            <option value="gemini" disabled={!providers.gemini}>
              {t.ai.gemini}
              {!providers.gemini ? " —" : ""}
            </option>
            <option value="deepseek" disabled={!providers.deepseek}>
              {t.ai.deepseek}
              {!providers.deepseek ? " —" : ""}
            </option>
          </select>
        </div>
        <div>
          <label className="label">{t.ai.kind}</label>
          <select
            className="input"
            value={kind}
            onChange={(e) => setKind(e.target.value as AiKind)}
          >
            <option value="portfolio">{t.ai.kinds.portfolio}</option>
            <option value="testimonial">{t.ai.kinds.testimonial}</option>
            <option value="memory">{t.ai.kinds.memory}</option>
          </select>
        </div>
      </div>

      {!anyProvider && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {t.ai.noProvider}
        </p>
      )}

      {selected && selected.eventCount === 0 && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {t.ai.needEvents}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="btn-primary"
          onClick={generate}
          disabled={loading || !anyProvider}
        >
          {loading ? t.ai.generating : t.ai.generate}
        </button>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {result && (
        <div className="card space-y-3 p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-ink-900">{t.ai.result}</h2>
            <button type="button" className="btn-ghost" onClick={copy}>
              {copied ? t.ai.copied : t.ai.copy}
            </button>
          </div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-ink-800">
            {result}
          </div>
        </div>
      )}
    </div>
  );
}
