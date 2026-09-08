import type { Dictionary } from "@/lib/i18n";
import { interpolate } from "@/lib/i18n";
import { LIFE_STAGES, type LifeStage } from "@/lib/hk-portfolio";

export function GrowthPath({
  t,
  current,
  counts,
}: {
  t: Dictionary;
  current: LifeStage;
  counts: Record<LifeStage, number>;
}) {
  return (
    <section className="card space-y-3 p-5">
      <div>
        <h2 className="text-lg font-semibold text-ink-900">{t.dashboard.growthTitle}</h2>
        <p className="text-sm text-ink-700/70">{t.dashboard.growthHint}</p>
        <p className="mt-1 text-sm font-medium text-brand-700">
          {interpolate(t.dashboard.currentStage, { stage: t.stages[current] })}
        </p>
      </div>
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {LIFE_STAGES.map((stage, i) => {
          const active = stage === current;
          const filled = counts[stage] > 0;
          return (
            <li
              key={stage}
              className={`rounded-xl border px-3 py-2 text-sm ${
                active
                  ? "border-brand-500 bg-brand-50 text-brand-800"
                  : filled
                    ? "border-black/10 bg-white text-ink-800"
                    : "border-dashed border-black/10 text-ink-700/50"
              }`}
            >
              <p className="text-[11px] uppercase tracking-wide">
                {i + 1}/{LIFE_STAGES.length}
              </p>
              <p className="font-medium">{t.stages[stage]}</p>
              <p className="text-xs">{counts[stage]}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
