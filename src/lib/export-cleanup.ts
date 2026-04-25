type AnyBookProject = any;

const DEFAULT_AUTHOR = "Antonino Campanella";

function stripCodeFence(value: string): string {
  return value
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function normalizeSmartJson(value: string): string {
  return value
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\u0000/g, "")
    .trim();
}

function tryParseObject(value: unknown): Record<string, any> | null {
  if (typeof value !== "string") return null;

  const cleaned = normalizeSmartJson(stripCodeFence(value));

  if (!cleaned.startsWith("{") || !cleaned.endsWith("}")) return null;

  try {
    const parsed = JSON.parse(cleaned);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function looksLikeRawMatterJson(value: string): boolean {
  const text = normalizeSmartJson(value);
  return (
    text.includes('"titlePage"') ||
    text.includes('"letterToReader"') ||
    text.includes('"aboutAuthor"') ||
    text.includes('"howToUse"') ||
    text.includes('"dedication"')
  );
}

export function cleanExportText(value: unknown): string {
  if (value === null || value === undefined) return "";
  let text = String(value);

  const parsed = tryParseObject(text);
  if (parsed) {
    return Object.values(parsed)
      .filter((v) => typeof v === "string" && v.trim().length > 0)
      .map((v) => cleanExportText(v))
      .join("\n\n");
  }

  if (looksLikeRawMatterJson(text)) {
    // Fallback for malformed JSON-like blocks: remove braces/keys instead of printing code.
    text = normalizeSmartJson(text)
      .replace(/^\s*\{/, "")
      .replace(/\}\s*$/, "")
      .replace(/"titlePage"\s*:\s*"/g, "")
      .replace(/"copyright"\s*:\s*"/g, "")
      .replace(/"dedication"\s*:\s*"/g, "")
      .replace(/"aboutAuthor"\s*:\s*"/g, "")
      .replace(/"howToUse"\s*:\s*"/g, "")
      .replace(/"letterToReader"\s*:\s*"/g, "")
      .replace(/",\s*"/g, "\n\n")
      .replace(/"\s*,?\s*$/g, "");
  }

  return text
    .replace(/\r\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\t/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\bAUTH-[A-Z0-9-]+\b/g, "")
    .replace(/\bauth-[a-z0-9-]+\b/g, "")
    .replace(/\[da inserire\]/gi, "")
    .replace(/\[Nome dell.?Autore o Editore\]/gi, "")
    .replace(/\[Nome dell.?Autore\]/gi, "")
    .replace(/\[da assegnare\]/gi, "")
    .replace(/Autore:\s*$/gim, `Autore: ${DEFAULT_AUTHOR}`)
    .replace(/©\s*2025\s*\.\s*/g, `© ${new Date().getFullYear()} ${DEFAULT_AUTHOR}. `)
    .replace(/©\s*2026\s*\.\s*/g, `© ${new Date().getFullYear()} ${DEFAULT_AUTHOR}. `)
    .replace(/Czes.?aw Mi.?osz/g, "Czesław Miłosz")
    .replace(/Czes[\u0000-\u001F]?Baw Mi[\u0000-\u001F]?Bosz/g, "Czesław Miłosz")
    .trim();
}

function mergeMatterFromEmbeddedJson(matter: any): any {
  if (!matter || typeof matter !== "object") return matter || {};

  let merged = { ...matter };

  for (const value of Object.values(matter)) {
    const parsed = tryParseObject(value);
    if (parsed) {
      merged = { ...merged, ...parsed };
    }
  }

  for (const key of Object.keys(merged)) {
    merged[key] = cleanExportText(merged[key]);
  }

  // If letterToReader accidentally contains the whole front matter JSON, extract the real field.
  const parsedLetter = tryParseObject(matter.letterToReader);
  if (parsedLetter?.letterToReader) {
    merged.letterToReader = cleanExportText(parsedLetter.letterToReader);
  }

  return merged;
}

function cleanAuthorSlug(value: unknown): string {
  const text = cleanExportText(value);
  if (!text) return "";
  if (/^auth-[a-z0-9-]+$/i.test(text)) return "";
  if (/^AUTH-[A-Z0-9-]+$/i.test(text)) return "";
  return text;
}

export function normalizeExportProject(project: AnyBookProject): AnyBookProject {
  const config = { ...(project?.config || {}) };
  const frontMatter = mergeMatterFromEmbeddedJson(project?.frontMatter || {});
  const backMatter = mergeMatterFromEmbeddedJson(project?.backMatter || {});

  const author =
    cleanAuthorSlug(config.author) ||
    cleanAuthorSlug(config.authorName) ||
    cleanAuthorSlug(config.writerName) ||
    DEFAULT_AUTHOR;

  config.author = author;
  config.authorName = author;
  config.writerName = author;
  config.title = cleanExportText(config.title || project?.title || "Senza titolo");

  frontMatter.titlePage = cleanExportText(frontMatter.titlePage || `${config.title}\n\nAutore: ${author}`);
  frontMatter.copyright = cleanExportText(
    frontMatter.copyright || `© ${new Date().getFullYear()} ${author}. Tutti i diritti riservati.`
  );

  const chapters = Array.isArray(project?.chapters)
    ? project.chapters.map((chapter: any) => ({
        ...chapter,
        title: cleanExportText(chapter?.title || ""),
        content: cleanExportText(chapter?.content || ""),
        subchapters: Array.isArray(chapter?.subchapters)
          ? chapter.subchapters.map((sub: any) => ({
              ...sub,
              title: cleanExportText(sub?.title || ""),
              content: cleanExportText(sub?.content || ""),
            }))
          : [],
      }))
    : [];

  return {
    ...project,
    config,
    frontMatter,
    chapters,
    backMatter,
  };
}

export function exportLabel(key: string, language?: string): string {
  const isItalian = String(language || "").toLowerCase().startsWith("it");

  const it: Record<string, string> = {
    contents: "Indice",
    chapter: "Capitolo",
    copyright: "Copyright",
    dedication: "Dedica",
    aboutAuthor: "Nota sull’autore",
    howToUse: "Come usare questo libro",
    letterToReader: "Lettera al lettore",
    conclusion: "Conclusione",
    authorNote: "Nota dell’autore",
    whatsNext: "Prossimo passo",
    smallRequest: "Una piccola richiesta",
    otherBooks: "Letture consigliate",
  };

  const en: Record<string, string> = {
    contents: "Contents",
    chapter: "Chapter",
    copyright: "Copyright",
    dedication: "Dedication",
    aboutAuthor: "About the Author",
    howToUse: "How to Use This Book",
    letterToReader: "Letter to the Reader",
    conclusion: "Conclusion",
    authorNote: "Author's Note",
    whatsNext: "What's Next",
    smallRequest: "A Small Request",
    otherBooks: "Other Books",
  };

  return (isItalian ? it : en)[key] || key;
}
