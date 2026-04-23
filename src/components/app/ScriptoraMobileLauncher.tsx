import {
  Crown,
  Palette,
  Download,
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
  onOpenAutoBestseller: () => void;
  onOpenCover: () => void;
  onOpenExport: () => void;
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
      className="group flex flex-col items-center justify-center rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.22),rgba(255,255,255,0.08))] p-5 min-h-[132px] text-center shadow-[0_10px_30px_-12px_rgba(0,0,0,0.55)] backdrop-blur-xl transition-all duration-300 hover:scale-[1.03] hover:bg-white/[0.1]"
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
  onOpenAutoBestseller,
  onOpenCover,
  onOpenExport,
}: Props) {
  const items: LauncherItem[] = [
    {
      id: "auto",
      title: "Auto Bestseller",
      subtitle: "Motore principale guidato",
      icon: Crown,
      onClick: onOpenAutoBestseller,
    },
    {
      id: "cover",
      title: "Cover Studio",
      subtitle: "Copertina per progetti finiti",
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
  ];

  return (
    <div className="relative overflow-hidden rounded-[34px] border border-white/12 bg-[#0b1020] p-5 text-white shadow-[0_30px_80px_-25px_rgba(0,0,0,0.75)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.28),transparent_30%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.01))]" />

      <div className="relative z-10">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.35em] text-white/78">
              Scriptora OS
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-[-0.04em]">
              {projectTitle || "Your Writing System"}
            </h2>
            <p className="mt-1 text-sm text-white/55">
              {projectSubtitle || "Workspace pulito e focalizzato"}
            </p>
          </div>

          <div className="rounded-full border border-white/12 bg-white/5 px-3 py-1 text-[11px] text-white/70">
            {generationLabel || "Ready"}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {items.map((item) => (
            <LauncherIcon key={item.id} {...item} />
          ))}
        </div>
      </div>
    </div>
  );
}
