import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getEditorialTier, type EditorialTier } from "@/lib/editorial-mastery";

interface Props {
  genre: string;
  subcategory?: string;
  size?: "xs" | "sm" | "md";
  className?: string;
  showLabel?: boolean;
}

const TIER_STYLES: Record<EditorialTier, string> = {
  standard:
    "bg-muted/60 text-muted-foreground border-border/60",
  advanced:
    "bg-primary/10 text-primary border-primary/30",
  mastery:
    "bg-gradient-to-r from-orange-500/15 via-rose-500/15 to-fuchsia-500/15 text-rose-600 dark:text-rose-300 border-rose-500/40 shadow-sm",
};

const SIZE_STYLES: Record<NonNullable<Props["size"]>, string> = {
  xs: "h-4 px-1.5 text-[9px] gap-1",
  sm: "h-5 px-2 text-[10px] gap-1",
  md: "h-6 px-2.5 text-[11px] gap-1.5",
};

/**
 * Visual badge for the Editorial Mastery tier of a project.
 * Renders a compact pill with tooltip explaining the active layer.
 */
export function EditorialMasteryBadge({ genre, subcategory, size = "sm", className, showLabel = true }: Props) {
  if (!genre) return null;
  const info = getEditorialTier(genre, subcategory);

  const pill = (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-bold uppercase tracking-wider whitespace-nowrap",
        SIZE_STYLES[size],
        TIER_STYLES[info.tier],
        className,
      )}
    >
      <span>{info.emoji}</span>
      {showLabel && <span>{info.label}</span>}
    </span>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{pill}</TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[260px] text-xs leading-snug">
          <p className="font-semibold mb-1">{info.emoji} {info.label}</p>
          <p className="text-muted-foreground">{info.description}</p>
          <p className="text-[10px] text-muted-foreground/70 italic mt-1">Family: {info.family}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
