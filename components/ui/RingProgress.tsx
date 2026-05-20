import { cn } from "@/lib/utils";

type RingProgressProps = {
  /** 0–100 */
  pct: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: React.ReactNode;
};

const CIRCUMFERENCE = (r: number) => 2 * Math.PI * r;

export function RingProgress({
  pct,
  size = 96,
  strokeWidth = 7,
  className,
  children,
}: RingProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const c = CIRCUMFERENCE(radius);
  const offset = c - (Math.min(100, Math.max(0, pct)) / 100) * c;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id={`ring-grad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--brand-bright)" />
            <stop offset="100%" stopColor="var(--brand-deep)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--line)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#ring-grad-${size})`}
          strokeWidth={strokeWidth}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
