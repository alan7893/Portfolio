import Link from "next/link";

export function EmptyState({
  title,
  cta,
  href,
}: {
  title: string;
  cta?: string;
  href?: string;
}) {
  return (
    <div className="card grid place-items-center gap-3 p-10 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-100 text-2xl">
        ✦
      </div>
      <p className="text-ink-700/80">{title}</p>
      {cta && href && (
        <Link href={href} className="btn-primary">
          {cta}
        </Link>
      )}
    </div>
  );
}
