import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: React.ReactNode;
  unit?: string;
  sub?: string;
  className?: string;
};

export function StatCard({ label, value, unit, sub, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "border-line bg-bg-card rounded-[var(--radius)] border p-4",
        className,
      )}
    >
      <div className="text-text-mute font-sans text-[10px] tracking-[0.18em] uppercase">
        {label}
      </div>
      <div className="text-text mt-2 flex items-baseline gap-1 font-serif">
        <span className="tabular text-3xl font-semibold">{value}</span>
        {unit && <span className="text-text-dim text-sm">{unit}</span>}
      </div>
      {sub && <div className="text-text-dim mt-1 text-xs">{sub}</div>}
    </div>
  );
}
