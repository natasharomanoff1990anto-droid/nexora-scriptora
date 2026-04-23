import { useState } from "react";
import { BookConfig, Language, ChapterLength } from "@/types/book";

interface BookConfigFormProps {
  onSubmit: (config: BookConfig) => void;
}

const LANGUAGES: Language[] = ["English", "Italian", "Spanish", "French", "German"];
const LENGTHS: { value: ChapterLength; label: string }[] = [
  { value: "short", label: "Short (~10,000 words)" },
  { value: "medium", label: "Medium (~50,000 words)" },
  { value: "long", label: "Long (~100,000 words)" },
];

export function BookConfigForm({ onSubmit }: BookConfigFormProps) {
  const [config, setConfig] = useState<BookConfig>({
    genre: "self-help",
    category: "Self Help",
    subcategory: "Mindset",
    title: "",
    subtitle: "",
    tone: "introspective, emotional, philosophical",
    authorStyle: "Brianna Wiest-inspired: poetic, deeply personal, universally relatable",
    language: "Italian",
    chapterLength: "medium",
    bookLength: "medium",
    numberOfChapters: 10,
    subchaptersEnabled: true,
  });

  const update = (key: keyof BookConfig, value: any) => setConfig(prev => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-lg font-semibold text-foreground">Create Your Book</h2>
      
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Title *</label>
          <input
            className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="The Mountain Is You"
            value={config.title}
            onChange={e => update("title", e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Subtitle</label>
          <input
            className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Transforming Self-Sabotage Into Self-Mastery"
            value={config.subtitle}
            onChange={e => update("subtitle", e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Tone</label>
          <input
            className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            value={config.tone}
            onChange={e => update("tone", e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Author Style DNA</label>
          <input
            className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            value={config.authorStyle}
            onChange={e => update("authorStyle", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Language</label>
            <select
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              value={config.language}
              onChange={e => update("language", e.target.value)}
            >
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Chapter Length</label>
            <select
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              value={config.chapterLength}
              onChange={e => update("chapterLength", e.target.value as ChapterLength)}
            >
              {LENGTHS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Chapters</label>
            <input
              type="number"
              min={3}
              max={30}
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              value={config.numberOfChapters}
              onChange={e => update("numberOfChapters", parseInt(e.target.value) || 10)}
            />
          </div>

          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.subchaptersEnabled}
                onChange={e => update("subchaptersEnabled", e.target.checked)}
                className="rounded border-border accent-primary"
              />
              <span className="text-sm text-foreground">Subchapters</span>
            </label>
          </div>
        </div>
      </div>

      <button
        onClick={() => config.title && onSubmit(config)}
        disabled={!config.title}
        className="w-full py-2.5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Generate Book
      </button>
    </div>
  );
}
