import type { LiveBook } from "@/hooks/useAutoBestseller";

/**
 * Estimate of words per chapter when no explicit target is provided.
 * Used only for the per-chapter progress bar, never persisted.
 */
const DEFAULT_WORDS_PER_CHAPTER = 3500;

/** Count words by simple whitespace split — fast and good enough for progress UI. */
export function countWords(text: string | undefined | null): number {
  if (!text) return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export interface ChapterProgressInfo {
  /** 0-100 */
  percent: number;
  words: number;
  targetWords: number;
  phase: "pending" | "writing" | "refining" | "done";
  label: string;
}

/**
 * Per-chapter progress: combines word count and phase.
 *  - done                → 100%
 *  - refining            → at least 85% (refining is the polishing pass)
 *  - writing             → words / target (capped at 80% so refining still shows progress)
 *  - pending / undefined →  0%
 */
export function getChapterProgress(
  chapter: { phase: "writing" | "refining" | "done"; content?: string } | undefined,
  targetWords: number = DEFAULT_WORDS_PER_CHAPTER,
): ChapterProgressInfo {
  if (!chapter) {
    return { percent: 0, words: 0, targetWords, phase: "pending", label: "Pending" };
  }
  const words = countWords(chapter.content);
  if (chapter.phase === "done") {
    return { percent: 100, words, targetWords, phase: "done", label: `${words} words` };
  }
  if (chapter.phase === "refining") {
    const base = Math.min(80, Math.round((words / Math.max(1, targetWords)) * 80));
    const percent = Math.max(85, base + 5);
    return { percent, words, targetWords, phase: "refining", label: `Refining · ${words} words` };
  }
  // writing
  const percent = Math.min(80, Math.round((words / Math.max(1, targetWords)) * 80));
  return { percent, words, targetWords, phase: "writing", label: `Writing · ${words} / ~${targetWords} words` };
}

export interface BookProgressInfo {
  /** 0-100 — overall book completion */
  percent: number;
  chaptersDone: number;
  totalChapters: number;
  /** Words written across ALL chapters so far (done + in progress) */
  wordsWritten: number;
  /** Estimated total words for the whole book */
  wordsTarget: number;
  label: string;
}

/**
 * Overall book progress.
 * Each chapter contributes equally to the total. The current chapter contributes
 * its sub-percentage (from getChapterProgress) so the bar moves smoothly while
 * a chapter is being written, not just when it completes.
 */
export function getBookProgress(
  liveBook: Pick<LiveBook, "chapters" | "outlines">,
  totalChaptersHint?: number,
  wordsPerChapter: number = DEFAULT_WORDS_PER_CHAPTER,
): BookProgressInfo {
  const totalChapters = Math.max(
    1,
    liveBook.outlines?.length ?? totalChaptersHint ?? liveBook.chapters.length ?? 1,
  );

  const chaptersDone = liveBook.chapters.filter((c) => c.phase === "done").length;

  // Sum of fractional progress across all chapters
  let fractionalSum = 0;
  let wordsWritten = 0;
  for (let i = 0; i < totalChapters; i++) {
    const ch = liveBook.chapters.find((c) => c.index === i);
    const info = getChapterProgress(ch, wordsPerChapter);
    fractionalSum += info.percent / 100;
    wordsWritten += info.words;
  }

  const percent = Math.min(100, Math.round((fractionalSum / totalChapters) * 100));
  const wordsTarget = totalChapters * wordsPerChapter;

  return {
    percent,
    chaptersDone,
    totalChapters,
    wordsWritten,
    wordsTarget,
    label: `${chaptersDone}/${totalChapters} chapters · ${percent}%`,
  };
}
