import Link from "next/link";

export function Pagination({
  page,
  totalPages,
  baseQuery,
  labels,
}: {
  page: number;
  totalPages: number;
  baseQuery: Record<string, string | undefined>;
  labels: { prev: string; next: string; pageOf: string };
}) {
  if (totalPages <= 1) return null;

  function href(target: number) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(baseQuery)) {
      if (v) params.set(k, v);
    }
    params.set("page", String(target));
    return `/events?${params.toString()}`;
  }

  return (
    <div className="flex items-center justify-center gap-3 pt-2">
      {page > 1 ? (
        <Link href={href(page - 1)} className="btn-ghost">
          ← {labels.prev}
        </Link>
      ) : (
        <span className="btn-ghost pointer-events-none opacity-40">
          ← {labels.prev}
        </span>
      )}
      <span className="text-sm text-ink-700/70">
        {labels.pageOf
          .replace("{page}", String(page))
          .replace("{total}", String(totalPages))}
      </span>
      {page < totalPages ? (
        <Link href={href(page + 1)} className="btn-ghost">
          {labels.next} →
        </Link>
      ) : (
        <span className="btn-ghost pointer-events-none opacity-40">
          {labels.next} →
        </span>
      )}
    </div>
  );
}
