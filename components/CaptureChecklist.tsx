import type { Dictionary } from "@/lib/i18n";
import { interpolate } from "@/lib/i18n";
import {
  evidenceGaps,
  isEvidenceHeavy,
  type EvidenceGap,
  type EvidenceInput,
} from "@/lib/hk-portfolio";

function gapLabel(t: Dictionary, gap: EvidenceGap): string {
  return t.evidenceGaps[gap];
}

export function CaptureChecklist({
  t,
  values,
}: {
  t: Dictionary;
  values: EvidenceInput;
}) {
  const gaps = evidenceGaps(values);
  const gapSet = new Set(gaps);
  const heavy = isEvidenceHeavy(values);
  const checks: Array<{ key: EvidenceGap; ok: boolean }> = [
    { key: "photo", ok: values.hasMedia },
    { key: "photoPurpose", ok: !gapSet.has("photoPurpose") },
    { key: "category", ok: !gapSet.has("category") },
  ];
  if (heavy) {
    checks.push(
      { key: "officialName", ok: !gapSet.has("officialName") },
      { key: "organiser", ok: !gapSet.has("organiser") },
      { key: "role", ok: !gapSet.has("role") },
      { key: "rank", ok: !gapSet.has("rank") },
      { key: "nameOnEvidence", ok: !gapSet.has("nameOnEvidence") },
    );
  } else {
    checks.push({ key: "reflection", ok: !gapSet.has("reflection") });
  }

  return (
    <div className="rounded-xl border border-black/5 bg-brand-50/60 p-4">
      <p className="text-sm font-medium text-ink-900">{t.events.captureTitle}</p>
      <p className="mt-1 text-xs text-ink-700/70">{t.events.captureHint}</p>
      <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
        {checks.map((item) => (
          <li
            key={item.key}
            className={`flex items-center gap-2 text-sm ${
              item.ok ? "text-emerald-800" : "text-ink-700/70"
            }`}
          >
            <span aria-hidden>{item.ok ? "✓" : "○"}</span>
            {gapLabel(t, item.key)}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EvidenceStatus({
  t,
  values,
}: {
  t: Dictionary;
  values: EvidenceInput;
}) {
  const gaps = evidenceGaps(values);
  if (gaps.length === 0) {
    return (
      <p className="text-sm text-emerald-800">{t.events.evidenceReady}</p>
    );
  }
  return (
    <p className="text-sm text-amber-800">
      {interpolate(t.events.evidenceGaps, {
        items: gaps.map((g) => gapLabel(t, g)).join("、"),
      })}
    </p>
  );
}
