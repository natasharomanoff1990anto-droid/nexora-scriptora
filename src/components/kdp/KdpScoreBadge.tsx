import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, Trophy } from "lucide-react";

interface KdpScoreBadgeProps {
  kind: "profitability" | "bestseller";
  score: number; // 0-10 for profitability, 0-100 for bestseller
  className?: string;
}

const TONE_CLASSES: Record<"low" | "mid" | "high", string> = {
  low:  "bg-muted text-muted-foreground border-border",
  mid:  "bg-secondary text-secondary-foreground border-border",
  high: "bg-primary/15 text-primary border-primary/30",
};

export function KdpScoreBadge({ kind, score, className }: KdpScoreBadgeProps) {
  const isBest = kind === "bestseller";
  const norm = isBest ? score : score * 10; // 0-100
  const tone: "low" | "mid" | "high" = norm >= 80 ? "high" : norm >= 55 ? "mid" : "low";
  const Icon = isBest ? Trophy : TrendingUp;
  const label = isBest ? `Bestseller ${Math.round(score)}/100` : `Profit ${score.toFixed(1)}/10`;
  const tip = isBest
    ? "Estimated bestseller probability based on title, promise, structure and market signals."
    : "Profitability score combines niche demand, competition density and pricing potential.";

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`${TONE_CLASSES[tone]} gap-1 ${className ?? ""}`}>
            <Icon className="h-3 w-3" />
            {label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-[260px] text-xs">{tip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
