export function StatCard({
  label,
  value,
  accent = "brand",
}: {
  label: string;
  value: number | string;
  accent?: "brand" | "sky" | "rose" | "emerald";
}) {
  const accents: Record<string, string> = {
    brand: "from-brand-500 to-brand-600",
    sky: "from-sky-500 to-sky-600",
    rose: "from-rose-500 to-rose-600",
    emerald: "from-emerald-500 to-emerald-600",
  };
  return (
    <div className="card overflow-hidden p-0">
      <div className={`h-1.5 w-full bg-gradient-to-r ${accents[accent]}`} />
      <div className="p-5">
        <p className="text-sm text-ink-700/70">{label}</p>
        <p className="mt-1 text-3xl font-bold text-ink-900">{value}</p>
      </div>
    </div>
  );
}
