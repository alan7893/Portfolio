import Link from "next/link";
import { getI18n } from "@/lib/i18n.server";

export const dynamic = "force-dynamic";

export default async function GuidePage() {
  const { t } = await getI18n();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">{t.guide.title}</h1>
        <p className="mt-2 text-sm text-ink-700/70">{t.guide.subtitle}</p>
      </div>

      <section className="card space-y-3 p-6">
        <h2 className="text-lg font-semibold text-ink-900">{t.guide.p1Title}</h2>
        <p className="text-sm text-ink-700/80">{t.guide.p1Lead}</p>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-ink-800">
          {t.guide.p1Items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="text-sm text-ink-700/70">{t.guide.p1Photos}</p>
      </section>

      <section className="card space-y-3 p-6">
        <h2 className="text-lg font-semibold text-ink-900">{t.guide.s1Title}</h2>
        <p className="text-sm text-ink-700/80">{t.guide.s1Lead}</p>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-ink-800">
          {t.guide.s1Items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="text-sm text-ink-700/70">{t.guide.s1Photos}</p>
      </section>

      <section className="card space-y-3 p-6">
        <h2 className="text-lg font-semibold text-ink-900">{t.guide.jupasTitle}</h2>
        <p className="text-sm text-ink-700/80">{t.guide.jupasLead}</p>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-ink-800">
          {t.guide.jupasItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="text-sm text-ink-700/70">{t.guide.jupasPhotos}</p>
      </section>

      <section className="card space-y-3 p-6">
        <h2 className="text-lg font-semibold text-ink-900">{t.guide.captureTitle}</h2>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-ink-800">
          {t.guide.captureItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="text-xs text-ink-700/60">{t.guide.sources}</p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/events/new" className="btn-primary">
            {t.guide.ctaEvent}
          </Link>
          <Link href="/ai" className="btn-ghost">
            {t.guide.ctaAi}
          </Link>
        </div>
      </section>
    </div>
  );
}
