import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bomb, Flame, Loader2 } from "lucide-react";
import { AutoBestsellerInput } from "@/services/autoBestsellerService";

interface Props {
  isRunning: boolean;
  initialInput?: Partial<AutoBestsellerInput> | null;
  autoStart?: boolean;
  onGenerateOne: (input: AutoBestsellerInput) => void;
  onGenerateBatch: (input: AutoBestsellerInput, count: number) => void;
}

const GENRES = [
  "self-help", "romance", "dark-romance", "thriller", "horror", "fantasy",
  "sci-fi", "historical", "memoir", "philosophy", "business", "spirituality",
  "children", "poetry",
];

const TONES = [
  "natural", "intense", "warm", "ironic", "poetic", "minimalist",
  "academic", "conversational", "dark", "uplifting",
];

const LANGUAGES = ["English", "Italian", "Spanish", "French", "German", "Portuguese"];

const BOOK_LENGTH_PRESETS = [
  { value: 8000, label: "Bozza Rapida · ~8k parole" },
  { value: 15000, label: "Libro Standard · ~15k parole" },
  { value: 30000, label: "Libro Pro KDP · ~30k parole" },
  { value: 50000, label: "Bestseller Profondo · ~50k parole" },
];

const CHAPTER_LENGTH_MODES = [
  { value: "short", label: "Breve · più stabile" },
  { value: "standard", label: "Standard · bilanciato" },
  { value: "long", label: "Lungo · più ricco" },
];

const CHAPTER_STRUCTURES = [
  { value: "simple", label: "Simple chapters" },
  { value: "subchapters", label: "Capitoli with subchapters" },
  { value: "professional", label: "Professional book structure" },
];

export function InputPanel({ isRunning, initialInput, autoStart, onGenerateOne, onGenerateBatch }: Props) {
  const [mode, setMode] = useState<"guided" | "manual">("guided");
  const [idea, setIdea] = useState(initialInput?.idea ?? "");
  const [genre, setGenere] = useState(initialInput?.genre ?? "self-help");
  const [subcategory, setSottocategoria] = useState(initialInput?.subcategory ?? "");
  const [targetAudience, setTargetAudience] = useState(initialInput?.targetAudience ?? "");
  const [tone, setTono] = useState(initialInput?.tone ?? "natural");
  const [language, setLingua] = useState(initialInput?.language ?? "Italian");
  const [numberOfChapters, setNumberOfChapters] = useState(initialInput?.numberOfChapters ?? 8);
  const [totalWordTarget, setTotalWordTarget] = useState(initialInput?.totalWordTarget ?? 15000);
  const [chapterLengthMode, setChapterLengthMode] = useState<AutoBestsellerInput["chapterLengthMode"]>(initialInput?.chapterLengthMode ?? "standard");
  const [chapterStructure, setChapterStructure] = useState<AutoBestsellerInput["chapterStructure"]>(initialInput?.chapterStructure ?? "subchapters");

  // Apply external prefill (e.g. from Home or Recent Runs)
  useEffect(() => {
    if (!initialInput) return;
    if (initialInput.idea !== undefined) setIdea(initialInput.idea);
    if (initialInput.genre !== undefined) setGenere(initialInput.genre);
    if (initialInput.subcategory !== undefined) setSottocategoria(initialInput.subcategory ?? "");
    if (initialInput.targetAudience !== undefined) setTargetAudience(initialInput.targetAudience);
    if (initialInput.tone !== undefined) setTono(initialInput.tone);
    if (initialInput.language !== undefined) setLingua(initialInput.language);
    if (initialInput.numberOfChapters !== undefined) setNumberOfChapters(initialInput.numberOfChapters);
    if (initialInput.totalWordTarget !== undefined) setTotalWordTarget(initialInput.totalWordTarget);
    if (initialInput.chapterLengthMode !== undefined) setChapterLengthMode(initialInput.chapterLengthMode);
    if (initialInput.chapterStructure !== undefined) setChapterStructure(initialInput.chapterStructure);
  }, [initialInput]);

  const valid = idea.trim().length > 10 && targetAudience.trim().length > 2;

  const buildInput = (): AutoBestsellerInput => {
    const guidedGenre = genre || "self-help";
    const guidedTone = tone || "natural";

    return {
      idea: idea.trim(),
      genre: mode === "guided" ? guidedGenre : genre,
      subcategory: mode === "guided" ? undefined : (subcategory.trim() || undefined),
      targetAudience: targetAudience.trim(),
      tone: mode === "guided" ? guidedTone : tone,
      language,
      numberOfChapters,
      totalWordTarget,
      chapterLengthMode,
      chapterStructure,
    };
  };

  // Auto-start once when conditions met (e.g. coming from Home with prefilled brief)
  useEffect(() => {
    if (autoStart && valid && !isRunning) {
      onGenerateOne(buildInput());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-primary" />
          Brief Strategico
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-border/60 bg-muted/20 p-1">
          <button
            type="button"
            onClick={() => setMode("guided")}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${mode === "guided" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            disabled={isRunning}
          >
            Guidata
          </button>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${mode === "manual" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            disabled={isRunning}
          >
            Manuale Pro
          </button>
        </div>
        <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
          <p className="text-sm font-semibold text-foreground">
            {mode === "guided" ? "Modalità Guidata" : "Modalità Manuale Pro"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {mode === "guided"
              ? "Inserisci idea, pubblico e tono. Scriptora costruirà una configurazione solida e stabile per iniziare subito."
              : "Controlla struttura, lunghezza libro e lunghezza capitoli con parametri editoriali più precisi."}
          </p>
        </div>

        <div>
          <Label htmlFor="idea">Idea / Argomento</Label>
          <Textarea
            id="idea"
            placeholder="Es. Una guida pratica per superare l’ansia sociale con tecniche cognitive e comportamentali"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            rows={4}
            disabled={isRunning}
          />
        </div>

        {mode === "manual" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="genre">Genere</Label>
              <Select value={genre} onValueChange={setGenere} disabled={isRunning}>
                <SelectTrigger id="genre"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GENRES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="subcategory">Sottocategoria <span className="text-muted-foreground text-xs">(opzionale)</span></Label>
              <Input
                id="subcategory"
                value={subcategory}
                onChange={(e) => setSottocategoria(e.target.value)}
                placeholder="Es. ansia, produttività, relazioni, business"
                disabled={isRunning}
              />
            </div>
          </div>
        </>
        )}

        <div>
          <Label htmlFor="audience">Pubblico di riferimento</Label>
          <Input
            id="audience"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            placeholder="Es. professionisti 25-40 anni che vivono ansia sul lavoro"
            disabled={isRunning}
          />
        </div>

        <div className={mode === "manual" ? "grid grid-cols-3 gap-3" : "grid grid-cols-1 gap-3"}>
          <div>
            <Label htmlFor="tone">Tono</Label>
            <Select value={tone} onValueChange={setTono} disabled={isRunning}>
              <SelectTrigger id="tone"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {mode === "manual" && (
            <>
              <div>
                <Label htmlFor="language">Lingua</Label>
                <Select value={language} onValueChange={setLingua} disabled={isRunning}>
                  <SelectTrigger id="language"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="chapters">Capitoli</Label>
                <Input
                  id="chapters"
                  type="number"
                  min={3}
                  max={20}
                  value={numberOfChapters}
                  onChange={(e) => setNumberOfChapters(Math.max(3, Math.min(20, Number(e.target.value) || 8)))}
                  disabled={isRunning}
                />
              </div>
            </>
          )}
        </div>

        {mode === "manual" && (
        <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Architettura del Libro
            </Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Controlla dimensione reale, ritmo e struttura prima della generazione. Per maggiore stabilità, i capitoli lunghi vengono costruiti come sottocapitoli interni.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <Label htmlFor="book-length">Lunghezza Libro</Label>
              <Select
                value={String(totalWordTarget)}
                onValueChange={(v) => setTotalWordTarget(Number(v))}
                disabled={isRunning}
              >
                <SelectTrigger id="book-length"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BOOK_LENGTH_PRESETS.map((p) => (
                    <SelectItem key={p.value} value={String(p.value)}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="chapter-length-mode">Lunghezza Capitolo</Label>
              <Select
                value={chapterLengthMode}
                onValueChange={(v) => setChapterLengthMode(v as AutoBestsellerInput["chapterLengthMode"])}
                disabled={isRunning}
              >
                <SelectTrigger id="chapter-length-mode"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CHAPTER_LENGTH_MODES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="chapter-structure">Struttura</Label>
              <Select
                value={chapterStructure}
                onValueChange={(v) => setChapterStructure(v as AutoBestsellerInput["chapterStructure"])}
                disabled={isRunning}
              >
                <SelectTrigger id="chapter-structure"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CHAPTER_STRUCTURES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg bg-background/60 px-3 py-2 text-xs text-muted-foreground">
            Media prevista: <span className="font-semibold text-foreground">
              ~{Math.max(400, Math.round(totalWordTarget / Math.max(1, numberOfChapters))).toLocaleString()} parole/capitolo
            </span>
            {" · "}
            {chapterStructure === "subchapters"
              ? "Ogni capitolo userà sottocapitoli interni."
              : chapterStructure === "professional"
                ? "Each chapter will use a complete professional book structure."
                : "Simple chapter structure."}
          </div>
        </div>
        )}

        <div className="flex flex-col gap-2 pt-2 sm:flex-row">
          <Button
            className="flex-1"
            disabled={!valid || isRunning}
            onClick={() => onGenerateOne(buildInput())}
          >
            {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Flame className="mr-2 h-4 w-4" />}
            {mode === "guided" ? "Inizia con Scriptora" : "Genera Bestseller"}
          </Button>
          {mode === "manual" && (
            <Button
              variant="secondary"
              className="flex-1"
              disabled={!valid || isRunning}
              onClick={() => onGenerateBatch(buildInput(), 10)}
            >
              <Bomb className="mr-2 h-4 w-4" />
              Genera 10 Libri
            </Button>
          )}
        </div>
        {!valid && !isRunning && (
          <p className="text-xs text-muted-foreground">Inserisci un’idea valida e un pubblico di riferimento per iniziare.</p>
        )}
      </CardContent>
    </Card>
  );
}
