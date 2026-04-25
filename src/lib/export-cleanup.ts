type AnyBookProject = any;

function stripCodeFence(value: string): string {
  return value
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function tryParseObject(value: unknown): Record<string, any> | null {
  if (typeof value !== "string") return null;
  const cleaned = stripCodeFence(value);
  if (!cleaned.startsWith("{") || !cleaned.endsWith("}")) return null;

  try {
    const parsed = JSON.parse(cleaned);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function cleanExportText(value: unknown): string {
  if (value === null || value === undefined) return "";
  let text = String(value);

  const parsed = tryParseObject(text);
  if (parsed) {
    // If raw JSON reached the exporter, turn it into readable prose instead of printing JSON.
    return Object.values(parsed)
      .filter((v) => typeof v === "string" && v.trim().length > 0)
      .map((v) => cleanExportText(v))
      .join("\n\n");
  }

  return text
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\bAUTH-[A-Z0-9-]+\b/g, "")
    .replace(/\bauth-[a-z0-9-]+\b/g, "")
    .replace(/\[da inserire\]/gi, "")
    .replace(/\[Nome dell.?Autore o Editore\]/gi, "")
    .replace(/\[Nome dell.?Autore\]/gi, "")
    .replace(/\[da assegnare\]/gi, "")
    .replace(/Czes.?aw Mi.?osz/g, "Czesław Miłosz")
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

  return merged;
}

function cleanAuthorSlug(value: unknown): string {
  const text = cleanExportText(value);
  if (!text) return "";
  if (/^auth-[a-z0-9-]+$/i.test(text)) return "";
  return text;
}

export function normalizeExportProject(project: AnyBookProject): AnyBookProject {
  const config = { ...(project?.config || {}) };
  const frontMatter = mergeMatterFromEmbeddedJson(project?.frontMatter || {});
  const backMatter = mergeMatterFromEmbeddedJson(project?.backMatter || {});

  const author =
    cleanAuthorSlug(config.author) ||
    cleanAuthorSlug(config.authorName) ||
    "Autore";

  config.author = author;
  config.authorName = author;
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
