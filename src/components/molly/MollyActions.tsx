import { useMolly } from "@/molly/MollyProvider";
import { Beef, Droplet, Moon, Gamepad2 } from "lucide-react";

export function MollyActions() {
  const { feed, drink, sleep, play } = useMolly();
  return (
    <div className="grid grid-cols-4 gap-2 px-3 py-3 border-t border-border/40 bg-card/50">
      <ActionBtn label="Feed" icon={<Beef className="h-4 w-4" />} onClick={feed} />
      <ActionBtn label="Drink" icon={<Droplet className="h-4 w-4" />} onClick={drink} />
      <ActionBtn label="Sleep" icon={<Moon className="h-4 w-4" />} onClick={sleep} />
      <ActionBtn label="Play" icon={<Gamepad2 className="h-4 w-4" />} onClick={play} />
    </div>
  );
}

function ActionBtn({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg bg-muted/40 hover:bg-muted/70 active:scale-[0.97] text-foreground transition-all"
    >
      {icon}
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );
}
