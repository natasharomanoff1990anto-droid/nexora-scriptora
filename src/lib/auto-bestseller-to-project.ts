import { AutoBestsellerResult, AutoBestsellerInput } from "@/services/autoBestsellerService";
import { BookProject, BookConfig, Chapter, BookBlueprint, Genre, Language, FrontMatter, BackMatter, GenerationLock } from "@/types/book";
import { createProjectId } from "@/lib/storage";
import type { LiveBook } from "@/hooks/useAutoBestseller";

const ALLOWED_GENRES: Genre[] = [
  "self-help", "romance", "dark-romance", "thriller", "fantasy", "philosophy", "business", "memoir",
];
const ALLOWED_LANGUAGES: Language[] = ["English", "Italian", "Spanish", "French", "German"];

function normalizeGenre(g?: string): Genre {
  if (!g) return "self-help";
  const slug = g.toLowerCase().replace(/\s+/g, "-");
  return (ALLOWED_GENRES.find((x) => x === slug) ?? "self-help") as Genre;
}
function normalizeLanguage(l?: string): Language {
  if (!l) return "English";

  const raw = l.trim().toLowerCase();

  const aliases: Record<string, Language> = {
    en: "English",
    english: "English",

    it: "Italian",
    italian: "Italian",
    italiano: "Italian",

    es: "Spanish",
    spanish: "Spanish",
    espanol: "Spanish",
    español: "Spanish",

    fr: "French",
    french: "French",
    francais: "French",
    français: "French",

    de: "German",
    german: "German",
    deutsch: "German",
  };

  if (aliases[raw]) return aliases[raw];

  const cap = raw.charAt(0).toUpperCase() + raw.slice(1);
  return (ALLOWED_LANGUAGES.find((x) => x === cap) ?? "English") as Language;
}

function buildFrontMatter(title: string, subtitle: string, authorName = "Antonino Campanella"): FrontMatter {
  return {
    titlePage: [title, subtitle].filter(Boolean).join("\n"),
    copyright: `© ${new Date().getFullYear()} ${authorName}. All rights reserved.`,
    dedication: "",
    aboutAuthor: "",
    howToUse: "Use this workspace to generate, expand, rewrite, and refine each section of the book.",
    letterToReader: "",
  };
}

function buildBackMatter(title: string): BackMatter {
  return {
    conclusion: "",
    authorNote: "",
    callToAction: `Continue refining "${title}" inside Scriptora Studio.`,
    reviewRequest: "If this book helps you, consider leaving an honest review.",
    otherBooks: "",
  };
}

function buildOutlinePlaceholderChapters(
  outlines: Array<{ title: string; summary?: string; subchapters?: { title: string; summary?: string }[] }>
): Chapter[] {
  return outlines.map((o) => ({
    title: o.title || "Untitled Chapter",
    content: "",
    subchapters: (o.subchapters || []).map((s) => ({
      title: s.title || "Untitled Subchapter",
      content: "",
    })),
    status: "idle",
  }));
}

function buildGenerationLock(
  language: Language,
  numberOfChapters: number,
  totalWordTarget?: number,
  source: "manual" | "auto_bestseller_launch" = "auto_bestseller_launch",
): GenerationLock {
  const safeBookWords = Math.max(10000, totalWordTarget || 50000);
  const safeChapters = Math.max(1, numberOfChapters || 8);
  return {
    source,
    lockedLanguage: language,
    targetBookWords: safeBookWords,
    targetChapterWords: Math.max(1200, Math.round(safeBookWords / safeChapters)),
    lengthLocked: source === "auto_bestseller_launch",
  };
}

export function autoBestsellerToProject(
  result: AutoBestsellerResult,
  input?: Partial<AutoBestsellerInput>,
): BookProject {
  const now = new Date().toISOString();
  const genre = normalizeGenre(input?.genre);
  const language = normalizeLanguage(input?.language);

  const blueprint: BookBlueprint | null = result.blueprint
    ? {
        overview: result.blueprint.overview || input?.readerPromise || "",
        themes: result.blueprint.themes || [],
        emotionalArc: result.blueprint.emotionalArc || "",
        chapterOutlines:
          result.blueprint.chapterOutlines?.map((c: any) => ({
            title: c.title || "",
            summary: c.summary || "",
            subchapters: c.subchapters || [],
          })) || [],
      }
    : null;

  const fallbackOutlineChapters = blueprint?.chapterOutlines?.length
    ? buildOutlinePlaceholderChapters(blueprint.chapterOutlines)
    : [];

  const generatedChapters: Chapter[] = (result.chapters || []).map((c) => ({
    title: c.title || "Untitled Chapter",
    content: c.content || "",
    subchapters: [],
    status: "completed",
    qualityRating: typeof c.finalScore === "number" ? c.finalScore : undefined,
  }));

  const chapters: Chapter[] = generatedChapters.length > 0 ? generatedChapters : fallbackOutlineChapters;

  const config: BookConfig = {
    title: result.title || "Untitled Bestseller",
    subtitle: result.subtitle || "",
    tone: input?.tone || "Engaging, authoritative, accessible",
    authorStyle: "",
    language,
    genre,
    category: "Self Help",
    subcategory: input?.subcategory || "",
    chapterLength: "medium",
    bookLength: "medium",
    customTotalWords: input?.totalWordTarget,
    numberOfChapters: chapters.length || input?.numberOfChapters || 8,
    subchaptersEnabled: chapters.some((c) => c.subchapters.length > 0),
  };

  const generationLock = buildGenerationLock(
    language,
    config.numberOfChapters,
    input?.totalWordTarget,
    "auto_bestseller_launch",
  );

  return {
    id: createProjectId(),
    config,
    blueprint,
    frontMatter: buildFrontMatter(config.title, config.subtitle),
    chapters,
    backMatter: buildBackMatter(config.title),
    phase: chapters.length > 0 ? "chapters" : "blueprint",
    frontMatterStatus: "idle",
    backMatterStatus: "idle",
    generationLock,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Convert in-progress live state to a partial BookProject (auto-save during generation).
 * Reuses existing projectId if provided so we update the same row.
 */
export function liveBookToPartialProject(
  liveBook: LiveBook,
  input?: Partial<AutoBestsellerInput>,
  existingId?: string,
): BookProject {
  const now = new Date().toISOString();
  const genre = normalizeGenre(input?.genre);
  const language = normalizeLanguage(input?.language);

  const blueprint: BookBlueprint | null = liveBook.outlines
    ? {
        overview: input?.readerPromise || "",
        themes: [],
        emotionalArc: "",
        chapterOutlines: liveBook.outlines.map((o) => ({
          title: o.title,
          summary: o.summary || "",
          subchapters: [],
        })),
      }
    : null;

  const completedChapters: Chapter[] = liveBook.chapters
    .filter((c) => c.phase === "done" && c.content)
    .map((c) => ({
      title: c.title || "Untitled Chapter",
      content: c.content || "",
      subchapters: [],
      status: "completed" as const,
      qualityRating: typeof c.score === "number" ? c.score : undefined,
    }));

  const placeholderChapters =
    completedChapters.length === 0 && blueprint?.chapterOutlines?.length
      ? buildOutlinePlaceholderChapters(blueprint.chapterOutlines)
      : [];

  const chapters: Chapter[] = completedChapters.length > 0 ? completedChapters : placeholderChapters;

  const config: BookConfig = {
    title: liveBook.title || input?.prefilledTitle || "Generating…",
    subtitle: liveBook.subtitle || input?.prefilledSubtitle || "",
    tone: input?.tone || "Engaging, authoritative, accessible",
    authorStyle: "",
    language,
    genre,
    category: "Self Help",
    subcategory: input?.subcategory || "",
    chapterLength: "medium",
    bookLength: "medium",
    customTotalWords: input?.totalWordTarget,
    numberOfChapters: chapters.length || input?.numberOfChapters || liveBook.outlines?.length || 8,
    subchaptersEnabled: chapters.some((c) => c.subchapters.length > 0),
  };

  const generationLock = buildGenerationLock(
    language,
    config.numberOfChapters,
    input?.totalWordTarget,
    "auto_bestseller_launch",
  );

  return {
    id: existingId || createProjectId(),
    config,
    blueprint,
    frontMatter: buildFrontMatter(config.title, config.subtitle),
    chapters,
    backMatter: buildBackMatter(config.title),
    phase: chapters.length > 0 ? "chapters" : "blueprint",
    frontMatterStatus: "idle",
    backMatterStatus: "idle",
    generationLock,
    createdAt: now,
    updatedAt: now,
  };
}
