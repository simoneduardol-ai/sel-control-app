export function StatCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="border border-border rounded-xl bg-surface px-5 py-4">
      <p className="text-text-dim text-xs uppercase tracking-wide mb-1.5">
        {label}
      </p>
      <p
        className={`font-display text-2xl ${
          accent ? "text-accent" : "text-text"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
