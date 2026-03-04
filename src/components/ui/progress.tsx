import * as React from "react";
import { cn } from "@/lib/utils";

type ProgressProps = {
  value: number;
  max?: number;
  className?: string;
  indicatorClassName?: string;
};

export function Progress({ value, max = 100, className, indicatorClassName }: ProgressProps) {
  const clamped = Math.min(Math.max(value, 0), max);
  const percent = max === 0 ? 0 : (clamped / max) * 100;

  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-zinc-200", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={clamped}
    >
      <div
        className={cn(
          "h-full rounded-full bg-gradient-to-r from-[var(--brand)] to-[var(--brand-dark)] transition-all duration-500",
          indicatorClassName,
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
