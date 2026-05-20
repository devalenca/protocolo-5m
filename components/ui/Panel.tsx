import { cn } from "@/lib/utils";

type PanelProps = {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function Panel({ title, action, children, className }: PanelProps) {
  return (
    <section
      className={cn(
        "border-line bg-bg-card rounded-[var(--radius-lg)] border p-4 shadow-[var(--shadow-sm)]",
        className,
      )}
    >
      {(title || action) && (
        <header className="mb-3 flex items-center justify-between">
          {title && (
            <h2 className="font-serif text-base font-semibold tracking-tight">{title}</h2>
          )}
          {action && <div className="text-text-dim text-xs">{action}</div>}
        </header>
      )}
      {children}
    </section>
  );
}
