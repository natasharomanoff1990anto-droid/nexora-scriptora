import { cn } from "@/lib/utils";

interface Props {
  /** 0-100 */
  percent: number;
  /** Visual variant: primary (writing), success (done), warning (refining) */
  variant?: "primary" | "success" | "warning" | "muted";
  /** Show subtle pulsing animation (in-progress hint) */
  animated?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function ProgressBar({
  percent,
  variant = "primary",
  animated = false,
  size = "md",
  className,
}: Props) {
  const safePct = Math.max(0, Math.min(100, percent));
  const colorClass =
    variant === "success"
      ? "bg-emerald-500"
      : variant === "warning"
        ? "bg-amber-500"
        : variant === "muted"
          ? "bg-muted-foreground/40"
          : "bg-primary";
  const heightClass = size === "sm" ? "h-1" : "h-1.5";

  return (
    <div
      className={cn("w-full overflow-hidden rounded-full bg-muted", heightClass, className)}
      role="progressbar"
      aria-valuenow={safePct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500 ease-out",
          colorClass,
          animated && "animate-pulse",
        )}
        style={{ width: `${safePct}%` }}
      />
    </div>
  );
}
