export type SafeGenerateMode =
  | "chapter"
  | "frontMatter"
  | "backMatter"
  | "subchapter"
  | "rewrite"
  | "evaluation"
  | "title"
  | "blueprint"
  | "autoBestseller"
  | "generic";

export interface SafeGenerateAIOptions {
  mode: SafeGenerateMode;
  systemPrompt: string;
  userPrompt: string;
  timeoutMs?: number;
  retries?: number;
  minChars?: number;
  allowPartial?: boolean;
  extractJsonOnly?: boolean;
}

export interface SafeGenerateAIResult {
  content: string;
  status: "completed" | "partial";
  attempts: number;
  error?: string;
}

export class SafeGenerateAIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SafeGenerateAIError";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function cleanText(raw: string): string {
  return String(raw || "")
    .replace(/^```[a-z]*\n?/gi, "")
    .replace(/\n?```$/g, "")
    .trim();
}

function extractBestContent(raw: string, extractJsonOnly: boolean): string {
  const text = cleanText(raw);

  if (!extractJsonOnly) return text;

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1).trim();
  }

  const firstBracket = text.indexOf("[");
  const lastBracket = text.lastIndexOf("]");
  if (firstBracket >= 0 && lastBracket > firstBracket) {
    return text.slice(firstBracket, lastBracket + 1).trim();
  }

  return text;
}

export async function safeGenerateAI(
  runner: () => Promise<string>,
  options: SafeGenerateAIOptions,
): Promise<SafeGenerateAIResult> {
  const {
    retries = 2,
    minChars = 80,
    allowPartial = true,
    extractJsonOnly = false,
  } = options;

  let bestPartial = "";
  let lastError = "Unknown AI generation error.";

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const raw = await runner();
      const content = extractBestContent(raw, extractJsonOnly);

      if (content.length > bestPartial.length) {
        bestPartial = content;
      }

      if (!content || content.trim().length < minChars) {
        throw new SafeGenerateAIError(
          `AI returned too little content for mode "${options.mode}".`,
        );
      }

      return {
        content,
        status: "completed",
        attempts: attempt,
      };
    } catch (error: any) {
      lastError = error?.message || lastError;
      const isLastAttempt = attempt >= retries + 1;

      if (isLastAttempt) {
        if (allowPartial && bestPartial.trim().length >= minChars) {
          return {
            content: bestPartial,
            status: "partial",
            attempts: attempt,
            error: lastError,
          };
        }

        throw new SafeGenerateAIError(lastError);
      }

      await sleep(Math.min(8000, 1200 * attempt));
    }
  }

  throw new SafeGenerateAIError(lastError);
}
