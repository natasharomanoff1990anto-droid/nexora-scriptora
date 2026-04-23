import {
  BookOpen,
  Wand2,
  Sparkles,
  Brain,
  Rocket,
  Palette,
  Download,
  Settings,
  PenSquare,
  PlayCircle,
  Crown,
  ChevronRight,
} from "lucide-react";

type LauncherItem = {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
};

type Props = {
  projectTitle?: string;
  projectSubtitle?: string;
  generationLabel?: string;
  onOpenBlueprint: () => void;
  onOpenChapters: () => void;
  onOpenRewrite: () => void;
  onOpenQuality: () => void;
  onOpenAutoBestseller: () => void;
  onOpenCover: () => void;
  onOpenExport: () => void;
  onOpenSettings: () => void;
  onContinueWriting: () => void;
  onGenerateFullBook: () => void;
};

function LauncherIcon({
  icon: Icon,
  title,
  subtitle,
  onClick,
}: LauncherItem) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center justify-start rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.07))] p-5 text-center shadow-[0_10px_30px_-12px_rgba(0,0,0,0.55)] backdrop-blur-xl transition-all duration-300 hover:scale-[1.03] hover:bg-white/[0.1]"
    >
      <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-[22px] bg-gradient-to-br from-fuchsia-500 via-violet-500 to-cyan-400 shadow-[0_10px_25px_-10px_rgba(168,85,247,0.75)]">
        <Icon className="h-7 w-7 text-white" />
      </div>
      <div className="text-sm font-semibold text-white">{title}</div>
      <div className="mt-1 text-[11px] leading-4 text-white/55">{subtitle}</div>
    </button>
  );
}

export function ScriptoraMobileLauncher({
  projectTitle,
  projectSubtitle,
  generationLabel,
  onOpenBlueprint,
  onOpenChapters,
  onOpenRewrite,
  onOpenQuality,
  onOpenAutoBestseller,
  onOpenCover,
  onOpenExport,
  onOpenSettings,
  onContinueWriting,
  onGenerateFullBook,
}: Props) {
  const items: LauncherItem[] = [
    {
      id: "blueprint",
      title: "Blueprint",
      subtitle: "Book architecture",
      icon: BookOpen,
      onClick: onOpenBlueprint,
    },
    {
      id: "chapters",
      title: "Chapters",
      subtitle: "Write and expand",
      icon: PenSquare,
      onClick: onOpenChapters,
    },
    {
      id: "rewrite",
      title: "Rewrite Pro",
      subtitle: "Upgrade prose",
      icon: Wand2,
      onClick: onOpenRewrite,
    },
    {
      id: "quality",
      title: "AI Quality",
      subtitle: "Rate the chapter",
      icon: Brain,
      onClick: onOpenQuality,
    },
    {
      id: "auto",
      title: "Auto Bestseller",
      subtitle: "Full power mode",
      icon: Crown,
      onClick: onOpenAutoBestseller,
    },
    {
      id: "cover",
      title: "Cover Studio",
      subtitle: "Visual packaging",
      icon: Palette,
      onClick: onOpenCover,
    },
    {
      id: "export",
      title: "Export",
      subtitle: "EPUB · DOCX · PDF",
      icon: Download,
      onClick: onOpenExport,
    },
    {
      id: "settings",
      title: "Settings",
      subtitle: "Voice and system",
      icon: Settings,
      onClick: onOpenSettings,
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-[34px] border border-white/12 bg-[#0b1020] p-5 text-white shadow-[0_30px_80px_-25px_rgba(0,0,0,0.75)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.28),transparent_30%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.01))]" />

      <div className="relative z-10">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.35em] text-white/72">
              Scriptora OS
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-[-0.04em]">
              {projectTitle || "Your Writing System"}
            </h2>
            <p className="mt-1 text-sm text-white/55">
              {projectSubtitle || "Premium AI writing workspace"}
            </p>
          </div>

          <div className="rounded-full border border-white/12 bg-white/5 px-3 py-1 text-[11px] text-white/70">
            {generationLabel || "Ready"}
          </div>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3">
          <button
            onClick={onContinueWriting}
            className="flex items-center justify-between rounded-[22px] bg-gradient-to-r from-fuchsia-500 to-violet-500 px-4 py-4 text-left shadow-[0_14px_28px_-14px_rgba(168,85,247,0.95)]"
          >
            <div>
              <div className="text-sm font-semibold">Continue Writing</div>
              <div className="mt-1 text-[11px] text-white/75">
                Jump back into the manuscript
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-white" />
          </button>

          <button
            onClick={onGenerateFullBook}
            className="flex items-center justify-between rounded-[22px] border border-white/12 bg-white/[0.07] px-4 py-4 text-left"
          >
            <div>
              <div className="text-sm font-semibold">Generate Full Book</div>
              <div className="mt-1 text-[11px] text-white/55">
                Run the full engine
              </div>
            </div>
            <PlayCircle className="h-5 w-5 text-white" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
          {items.map((item) => (
            <LauncherIcon key={item.id} {...item} />
          ))}
        </div>

        <div className="mt-5 rounded-[30px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.07))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className="flex items-center gap-2 text-sm font-semibold tracking-[0.01em]">
            <Rocket className="h-4 w-4 text-cyan-300" />
            SCRIPTORA OS
          </div>
          <p className="mt-2 text-sm leading-6 text-white/64">
            All core functions remain intact. What changes now is the visual impact: stronger icons, clearer hierarchy, premium mobile presence.
          </p>
        </div>
      </div>
    </div>
  );
}
