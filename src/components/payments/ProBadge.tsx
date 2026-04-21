// Small badge to mark premium / coming-soon features in the UI.

import { Crown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProBadgeProps {
  variant?: "pro" | "soon" | "lifetime";
  className?: string;
  label?: string;
}

export function ProBadge({ variant = "pro", className, label }: ProBadgeProps) {
  const styles =
    variant === "lifetime"
      ? "bg-gradient-to-r from-amber-500/20 to-amber-300/10 text-amber-500 border-amber-500/40"
      : variant === "soon"
      ? "bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/40"
      : "bg-primary/15 text-primary border-primary/40";

  const Icon = variant === "soon" ? Sparkles : Crown;
  const text = label ?? (variant === "soon" ? "SOON" : variant === "lifetime" ? "LIFETIME" : "PRO");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider",
        styles,
        className,
      )}
    >
      <Icon className="h-2.5 w-2.5" />
      {text}
    </span>
  );
}