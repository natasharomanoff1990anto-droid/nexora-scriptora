import { useState, useMemo, useEffect, forwardRef } from "react";
import { BookConfig, Language, Genre, ChapterLength, BookLength, CATEGORIES, BOOK_LENGTH_CONFIG } from "@/types/book";
import { BookOpen, X, Sparkles, PenTool } from "lucide-react";
import { t } from "@/lib/i18n";
import { getGenreBlueprint } from "@/lib/genre-intelligence";
import { getStylesForGenre, type WritingStylePreset } from "@/lib/writing-styles";

interface NewBookDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (config: BookConfig) => void;
}

const LANGUAGES: Language[] = ["English", "Italian", "Spanish", "French", "German"];
const GENRES: { value: Genre; label: string; group: string }[] = [
  { value: "self-help", label: "Self-Help", group: "Non-Fiction" },
  { value: "business", label: "Business", group: "Non-Fiction" },
  { value: "philosophy", label: "Philosophy", group: "Non-Fiction" },
  { value: "memoir", label: "Memoir", group: "Non-Fiction" },
  { value: "biography", label: "Biografia", group: "Non-Fiction" },
  { value: "spirituality", label: "Spiritualità", group: "Non-Fiction" },
  { value: "romance", label: "Romance", group: "Fiction" },
  { value: "dark-romance", label: "Dark Romance", group: "Fiction" },
  { value: "thriller", label: "Thriller", group: "Fiction" },
  { value: "fantasy", label: "Fantasy", group: "Fiction" },
  { value: "horror", label: "Horror", group: "Fiction" },
  { value: "sci-fi", label: "Sci-Fi", group: "Fiction" },
  { value: "historical", label: "Storico", group: "Fiction" },
  { value: "children", label: "Libri per Bambini", group: "Creativi" },
  { value: "fairy-tale", label: "Favole", group: "Creativi" },
  { value: "poetry", label: "Poesie", group: "Creativi" },
  { value: "jokes", label: "Barzellette", group: "Creativi" },
  { value: "cookbook", label: "Cookbook", group: "Practical" },
  { value: "manual", label: "Manuale (generico)", group: "Practical" },
  { value: "technical-manual", label: "Manuale Tecnico", group: "Practical" },
  { value: "software-guide", label: "Guida Software", group: "Practical" },
  { value: "ai-tools-guide", label: "Guida AI Tools", group: "Practical" },
  { value: "gardening", label: "Giardinaggio", group: "Practical" },
  { value: "beekeeping", label: "Apicoltura", group: "Practical" },
  { value: "health-medicine", label: "Salute & Medicina", group: "Practical" },
  { value: "diet-nutrition", label: "Dieta & Nutrizione", group: "Practical" },
  { value: "fitness", label: "Fitness", group: "Practical" },
  { value: "productivity", label: "Produttività", group: "Practical" },
  { value: "education", label: "Education", group: "Practical" },
];

export function NewBookDialog({ open, onClose, onSubmit }: NewBookDialogProps) {
  const [config, setConfig] = useState<BookConfig>({
    title: "",
    subtitle: "",
    tone: "warm, insightful, transformative",
    authorStyle: "Brianna Wiest",
    language: "Italian",
    genre: "self-help",
    category: "Self Help",
    subcategory: "Mindset",
    chapterLength: "medium",
    bookLength: "medium",
    numberOfChapters: 10,
    subchaptersEnabled: true,
  });

  if (!open) return null;

  const update = (key: keyof BookConfig, value: any) => setConfig(prev => ({ ...prev, [key]: value }));
  const categories = Object.keys(CATEGORIES);
  const subcategories = CATEGORIES[config.category] || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card rounded-xl border border-border shadow-2xl w-full max-w-lg">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">{t("create_new_book")}</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin">
          <Field label={t("title")}>
            <input value={config.title} onChange={e => update("title", e.target.value)}
              className="w-full h-9 bg-muted/50 border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="The Art of Living" />
          </Field>

          <Field label={t("subtitle")}>
            <input value={config.subtitle} onChange={e => update("subtitle", e.target.value)}
              className="w-full h-9 bg-muted/50 border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="A guide to inner peace" />
          </Field>

          <Field label={t("book_length")}>
            <div className="grid grid-cols-4 gap-2">
              {(Object.entries(BOOK_LENGTH_CONFIG) as [BookLength, typeof BOOK_LENGTH_CONFIG[BookLength]][]).map(([key, val]) => (
                <button key={key} type="button"
                  onClick={() => update("bookLength", key)}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    config.bookLength === key
                      ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                      : "border-border bg-muted/30 hover:bg-muted/50"
                  }`}>
                  <p className={`text-xs font-semibold ${config.bookLength === key ? "text-primary" : "text-foreground"}`}>{val.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {key === "custom" ? "Choose words" : `~${(val.totalWords / 1000).toFixed(0)}k words`}
                  </p>
                </button>
              ))}
            </div>
            {config.bookLength === "custom" && (
              <div className="mt-3 p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total Words</span>
                  <span className="text-sm font-semibold text-primary">
                    {(config.customTotalWords ?? 30000).toLocaleString()} words
                  </span>
                </div>
                <input
                  type="range"
                  min={5000}
                  max={200000}
                  step={1000}
                  value={config.customTotalWords ?? 30000}
                  onChange={e => update("customTotalWords", parseInt(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1000}
                    max={500000}
                    step={500}
                    value={config.customTotalWords ?? 30000}
                    onChange={e => update("customTotalWords", Math.max(1000, parseInt(e.target.value) || 30000))}
                    className="flex-1 h-8 bg-muted/50 border border-border rounded-md px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <span className="text-[10px] text-muted-foreground">
                    ≈ {Math.round((config.customTotalWords ?? 30000) / config.numberOfChapters).toLocaleString()} words/chapter
                  </span>
                </div>
              </div>
            )}
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label={t("language")}>
              <select value={config.language} onChange={e => update("language", e.target.value)}
                className="w-full h-9 bg-muted/50 border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </Field>
            <Field label={t("genre")}>
              <select value={config.genre} onChange={e => update("genre", e.target.value)}
                className="w-full h-9 bg-muted/50 border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                {["Non-Fiction", "Fiction", "Creativi", "Practical"].map(group => (
                  <optgroup key={group} label={group}>
                    {GENRES.filter(g => g.group === group).map(g => (
                      <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </Field>
          </div>

          <GenreStructurePreview genre={config.genre} subcategory={config.subcategory} />

          <div className="grid grid-cols-2 gap-4">
            <Field label={t("category")}>
              <select value={config.category} onChange={e => { update("category", e.target.value); update("subcategory", CATEGORIES[e.target.value]?.[0] || ""); }}
                className="w-full h-9 bg-muted/50 border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="">
              <select value={config.subcategory} onChange={e => update("subcategory", e.target.value)}
                className="w-full h-9 bg-muted/50 border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                {subcategories.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label={t("tone")}>
              <input value={config.tone} onChange={e => update("tone", e.target.value)}
                className="w-full h-9 bg-muted/50 border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="warm, direct" />
            </Field>
            <Field label={t("writing_style")}>
              <WritingStyleSelector
                genre={config.genre}
                subcategory={config.subcategory}
                value={config.authorStyle}
                onChange={(v) => update("authorStyle", v)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label={t("num_chapters")}>
              <input type="number" min={3} max={30} value={config.numberOfChapters}
                onChange={e => update("numberOfChapters", parseInt(e.target.value) || 10)}
                className="w-full h-9 bg-muted/50 border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </Field>
            <Field label={t("default_length")}>
              <select value={config.chapterLength} onChange={e => update("chapterLength", e.target.value)}
                className="w-full h-9 bg-muted/50 border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                <option value="short">{t("short")}</option>
                <option value="medium">{t("medium")}</option>
                <option value="long">{t("long")}</option>
              </select>
            </Field>
            <Field label={t("subchapters")}>
              <label className="flex items-center gap-2 h-9 cursor-pointer">
                <input type="checkbox" checked={config.subchaptersEnabled}
                  onChange={e => update("subchaptersEnabled", e.target.checked)}
                  className="rounded border-border" />
                <span className="text-xs text-foreground">{t("enabled")}</span>
              </label>
            </Field>
          </div>
        </div>

        <div className="p-5 border-t border-border flex justify-end gap-2">
          <button onClick={onClose}
            className="h-9 px-4 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {t("cancel")}
          </button>
          <button onClick={() => { if (config.title) onSubmit(config); }} disabled={!config.title}
            className="h-9 px-6 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors">
            {t("create_book")}
          </button>
        </div>
      </div>
    </div>
  );
}

const Field = forwardRef<HTMLDivElement, { label: string; children: React.ReactNode }>(
  function Field({ label, children }, ref) {
    return (
      <div ref={ref}>
        {label && <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">{label}</label>}
        {children}
      </div>
    );
  }
);

function GenreStructurePreview({ genre, subcategory }: { genre: string; subcategory?: string }) {
  const bp = useMemo(() => getGenreBlueprint(genre, subcategory), [genre, subcategory]);
  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">Genre Engine — Editorial Blueprint</span>
      </div>
      <div className="text-[11px] text-muted-foreground">
        <span className="font-medium text-foreground/80">Style:</span> {bp.chapterStyle.replace(/_/g, " ")}
        {" · "}
        <span className="font-medium text-foreground/80">Tone:</span> {bp.tone}
      </div>
      <div className="flex flex-wrap gap-1">
        {bp.structure.slice(0, 8).map((s, i) => (
          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted/60 border border-border/40 text-foreground/80">
            {i + 1}. {s}
          </span>
        ))}
      </div>
      {bp.contentRules.length > 0 && (
        <ul className="text-[10px] text-muted-foreground space-y-0.5 pt-1 border-t border-border/30">
          {bp.contentRules.slice(0, 3).map((r, i) => (
            <li key={i} className="leading-snug">• {r}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function WritingStyleSelector({
  genre,
  subcategory,
  value,
  onChange,
}: {
  genre: string;
  subcategory?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const presets = useMemo(() => getStylesForGenre(genre, subcategory), [genre, subcategory]);
  const authors = presets.filter(p => p.kind === "author");
  const styles = presets.filter(p => p.kind === "style");

  const matched: WritingStylePreset | undefined = useMemo(() => {
    return presets.find(p => p.id === value || p.label.toLowerCase() === value.toLowerCase());
  }, [presets, value]);

  const [mode, setMode] = useState<"preset" | "custom">(matched || !value ? "preset" : "custom");

  // Quando cambia genere, se lo stile attuale non è più nella lista, ripiega sul primo
  useEffect(() => {
    if (mode === "preset" && value && !matched) {
      const fallback = authors[0] ?? styles[0];
      if (fallback) onChange(fallback.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genre, subcategory]);

  const selectedPreset = matched ?? (mode === "preset" ? authors[0] ?? styles[0] : null);

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => { setMode("preset"); if (!matched) onChange((authors[0] ?? styles[0])?.id ?? ""); }}
          className={`flex-1 h-7 text-[10px] font-medium rounded-md border transition-colors ${
            mode === "preset" ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50"
          }`}
        >
          Preset
        </button>
        <button
          type="button"
          onClick={() => { setMode("custom"); onChange(""); }}
          className={`flex-1 h-7 text-[10px] font-medium rounded-md border transition-colors ${
            mode === "custom" ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50"
          }`}
        >
          Custom
        </button>
      </div>

      {mode === "preset" ? (
        <>
          <select
            value={selectedPreset?.id ?? ""}
            onChange={e => onChange(e.target.value)}
            className="w-full h-9 bg-muted/50 border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {authors.length > 0 && (
              <optgroup label="✍ Autori del genere">
                {authors.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </optgroup>
            )}
            {styles.length > 0 && (
              <optgroup label="🎨 Stili tecnici">
                {styles.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </optgroup>
            )}
          </select>
          {selectedPreset && (
            <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground leading-snug pt-0.5">
              <PenTool className="h-3 w-3 text-primary shrink-0 mt-0.5" />
              <span>{selectedPreset.hint}</span>
            </div>
          )}
        </>
      ) : (
        <>
          <input
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full h-9 bg-muted/50 border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="Es. Italo Calvino, lirico-fiabesco..."
          />
          <p className="text-[10px] text-muted-foreground leading-snug">
            Lo stile custom verrà interpretato letteralmente dall'AI.
          </p>
        </>
      )}
    </div>
  );
}
