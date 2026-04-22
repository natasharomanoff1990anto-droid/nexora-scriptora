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
  { value: 8000, label: "Quick Draft · ~8k words" },
  { value: 15000, label: "Standard Book · ~15k words" },
  { value: 30000, label: "Pro KDP Book · ~30k words" },
  { value: 50000, label: "Deep Bestseller · ~50k words" },
];

const CHAPTER_LENGTH_MODES = [
  { value: "short", label: "Short · safer chapters" },
  { value: "standard", label: "Standard · balanced" },
  { value: "long", label: "Long · rich chapters" },
];

const CHAPTER_STRUCTURES = [
  { value: "simple", label: "Simple chapters" },
  { value: "subchapters", label: "Chapters with subchapters" },
  { value: "professional", label: "Professional book structure" },
];

export function InputPanel({ isRunning, initialInput, autoStart, onGenerateOne, onGenerateBatch }: Props) {
  const [idea, setIdea] = useState(initialInput?.idea ?? "");
  const [genre, setGenre] = useState(initialInput?.genre ?? "self-help");
  const [subcategory, setSubcategory] = useState(initialInput?.subcategory ?? "");
  const [targetAudience, setTargetAudience] = useState(initialInput?.targetAudience ?? "");
  const [tone, setTone] = useState(initialInput?.tone ?? "natural");
  const [language, setLanguage] = useState(initialInput?.language ?? "English");
  const [numberOfChapters, setNumberOfChapters] = useState(initialInput?.numberOfChapters ?? 8);
  const [totalWordTarget, setTotalWordTarget] = useState(initialInput?.totalWordTarget ?? 15000);
  const [chapterLengthMode, setChapterLengthMode] = useState<AutoBestsellerInput["chapterLengthMode"]>(initialInput?.chapterLengthMode ?? "standard");
  const [chapterStructure, setChapterStructure] = useState<AutoBestsellerInput["chapterStructure"]>(initialInput?.chapterStructure ?? "subchapters");

  // Apply external prefill (e.g. from Home or Recent Runs)
  useEffect(() => {
    if (!initialInput) return;
    if (initialInput.idea !== undefined) setIdea(initialInput.idea);
    if (initialInput.genre !== undefined) setGenre(initialInput.genre);
    if (initialInput.subcategory !== undefined) setSubcategory(initialInput.subcategory ?? "");
    if (initialInput.targetAudience !== undefined) setTargetAudience(initialInput.targetAudience);
    if (initialInput.tone !== undefined) setTone(initialInput.tone);
    if (initialInput.language !== undefined) setLanguage(initialInput.language);
    if (initialInput.numberOfChapters !== undefined) setNumberOfChapters(initialInput.numberOfChapters);
    if (initialInput.totalWordTarget !== undefined) setTotalWordTarget(initialInput.totalWordTarget);
    if (initialInput.chapterLengthMode !== undefined) setChapterLengthMode(initialInput.chapterLengthMode);
    if (initialInput.chapterStructure !== undefined) setChapterStructure(initialInput.chapterStructure);
  }, [initialInput]);

  const valid = idea.trim().length > 10 && targetAudience.trim().length > 2;

  const buildInput = (): AutoBestsellerInput => ({
    idea: idea.trim(),
    genre,
    subcategory: subcategory.trim() || undefined,
    targetAudience: targetAudience.trim(),
    tone,
    language,
    numberOfChapters,
    totalWordTarget,
    chapterLengthMode,
    chapterStructure,
  });

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
          Concept Brief
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="idea">Idea / Topic</Label>
          <Textarea
            id="idea"
            placeholder="e.g. A practical guide to overcoming social anxiety using cognitive behavioral techniques"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            rows={4}
            disabled={isRunning}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="genre">Genre</Label>
            <Select value={genre} onValueChange={setGenre} disabled={isRunning}>
              <SelectTrigger id="genre"><SelectValue /></SelectTrigger>
              <SelectContent>
                {GENRES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="subcategory">Subcategory <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input
              id="subcategory"
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              placeholder="e.g. anxiety, productivity"
              disabled={isRunning}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="audience">Target Audience</Label>
          <Input
            id="audience"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            placeholder="e.g. professionals 25-40 dealing with workplace anxiety"
            disabled={isRunning}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label htmlFor="tone">Tone</Label>
            <Select value={tone} onValueChange={setTone} disabled={isRunning}>
              <SelectTrigger id="tone"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="language">Language</Label>
            <Select value={language} onValueChange={setLanguage} disabled={isRunning}>
              <SelectTrigger id="language"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="chapters">Chapters</Label>
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
        </div>

        <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Book Architecture
            </Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Control the real size and structure before generation. For stability, long chapters are written as internal subchapters.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <Label htmlFor="book-length">Book Length</Label>
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
              <Label htmlFor="chapter-length-mode">Chapter Length</Label>
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
              <Label htmlFor="chapter-structure">Structure</Label>
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
            Planned average: <span className="font-semibold text-foreground">
              ~{Math.max(400, Math.round(totalWordTarget / Math.max(1, numberOfChapters))).toLocaleString()} words/chapter
            </span>
            {" · "}
            {chapterStructure === "subchapters"
              ? "Each chapter will use internal subchapters."
              : chapterStructure === "professional"
                ? "Each chapter will use a complete professional book structure."
                : "Simple chapter structure."}
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2 sm:flex-row">
          <Button
            className="flex-1"
            disabled={!valid || isRunning}
            onClick={() => onGenerateOne(buildInput())}
          >
            {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Flame className="mr-2 h-4 w-4" />}
            Generate Bestseller
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            disabled={!valid || isRunning}
            onClick={() => onGenerateBatch(buildInput(), 10)}
          >
            <Bomb className="mr-2 h-4 w-4" />
            Generate 10 Books
          </Button>
        </div>
        {!valid && !isRunning && (
          <p className="text-xs text-muted-foreground">Provide an idea (10+ chars) and target audience to start.</p>
        )}
      </CardContent>
    </Card>
  );
}
