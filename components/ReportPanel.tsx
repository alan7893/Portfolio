"use client";

import type { Person, PortfolioReport } from "@/lib/types";

type Props = {
  person: Person;
  report: PortfolioReport | null;
  onGenerate: () => void;
  busy: boolean;
  photoCount: number;
  recordCount: number;
};

export function ReportPanel({
  person,
  report,
  onGenerate,
  busy,
  photoCount,
  recordCount,
}: Props) {
  return (
    <section className="space-y-6">
      <div className="panel flex flex-col gap-5 rounded-[1.75rem] p-6 sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-foam/45">Portfolio report</p>
          <h2 className="font-display mt-2 text-3xl text-foam">Portrait of {person.name}</h2>
          <p className="mt-3 max-w-xl text-foam/65">
            Weave {photoCount} photo{photoCount === 1 ? "" : "s"} and {recordCount} track record
            {recordCount === 1 ? "" : "s"} into a 4–8 page AI portfolio with activity, positive
            feedback, and sparkling hours.
          </p>
        </div>
        <button
          type="button"
          onClick={onGenerate}
          disabled={busy}
          className="rounded-full bg-sea px-5 py-3 text-sm font-medium text-ink hover:bg-sea/90 disabled:opacity-60"
        >
          {busy ? "Composing…" : report ? "Regenerate report" : "Generate report"}
        </button>
      </div>

      {!report ? (
        <div className="panel rounded-[1.75rem] px-6 py-12 text-center text-foam/55">
          Generate a report to see the portfolio view.
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          <article className="panel rounded-[1.5rem] p-5 lg:col-span-1">
            <p className="text-xs uppercase tracking-[0.18em] text-sea">Activity</p>
            <h3 className="font-display mt-2 text-2xl text-foam">{report.activity.headline}</h3>
            <p className="mt-3 text-sm text-foam/70">{report.activity.summary}</p>
            <p className="mt-4 text-sm text-ember-soft">{report.activity.cadence}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {report.activity.themes.map((theme) => (
                <span
                  key={theme}
                  className="rounded-full border border-[var(--line)] px-2.5 py-1 text-xs text-foam/65"
                >
                  {theme}
                </span>
              ))}
            </div>
          </article>

          <article className="panel rounded-[1.5rem] p-5 lg:col-span-1">
            <p className="text-xs uppercase tracking-[0.18em] text-ember">Positive feedback</p>
            <h3 className="font-display mt-2 text-2xl text-foam">
              {report.positiveFeedback.headline}
            </h3>
            <ul className="mt-4 space-y-3">
              {report.positiveFeedback.strengths.map((item) => (
                <li key={item} className="text-sm text-foam/75">
                  <span className="mr-2 text-ember">✦</span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-foam/60">{report.positiveFeedback.encouragement}</p>
          </article>

          <article className="panel glow-ember rounded-[1.5rem] p-5 lg:col-span-1">
            <p className="text-xs uppercase tracking-[0.18em] text-ember-soft">Sparkling hours</p>
            <h3 className="font-display mt-2 text-2xl text-foam">
              {report.sparklingHours.headline}
            </h3>
            <div className="mt-4 space-y-4">
              {report.sparklingHours.moments.map((moment) => (
                <div key={`${moment.title}-${moment.when}`} className="border-l border-ember/40 pl-3">
                  <p className="text-sm font-medium text-foam">{moment.title}</p>
                  <p className="text-xs text-foam/40">
                    {moment.when} · {moment.source}
                  </p>
                  <p className="mt-1 text-sm text-foam/70">{moment.why}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="panel rounded-[1.5rem] p-6 lg:col-span-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.18em] text-foam/45">Narrative</p>
              <p className="text-xs text-foam/40">
                {(report.source || "local") === "gemini"
                  ? `Gemini · ${report.model || "gemini-2.5-flash"}`
                  : "Local draft"}{" "}
                · ~{report.pagesEstimate || 1} page
                {(report.pagesEstimate || 1) === 1 ? "" : "s"}
              </p>
            </div>
            <div className="mt-4 max-w-4xl space-y-4 text-base leading-relaxed text-foam/80 whitespace-pre-wrap">
              {report.narrative}
            </div>
            <p className="mt-4 text-xs text-foam/35">
              Generated {new Date(report.generatedAt).toLocaleString()}
            </p>
          </article>
        </div>
      )}
    </section>
  );
}
