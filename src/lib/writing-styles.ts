import { PLATINUM_CONSTRAINTS } from "./ai/language-killer-v2";

export interface WritingStylePreset {
  id: string;
  label: string;
  kind: "author" | "tone";
  hint: string;
  promptDirective: string;
}

export const buildWritingStyleBlock = (authorStyle: string, tone: string): string => {
  const isPlatinum = authorStyle.toLowerCase().includes("platino");
  
  return `
### DIRETTIVA STILISTICA:
${authorStyle}
TONO RICHIESTO: ${tone}

${isPlatinum ? PLATINUM_CONSTRAINTS : ""}

REGOLE AGGIUNTIVE:
- Mostra, non raccontare.
- Evita avverbi inutili.
- Se lo stile è Platino, usa frasi secche e grassetti per le verità brutali.
`.trim();
};

export const UNIVERSAL_STYLES: WritingStylePreset[] = [
  {
    id: "auth-platinum-ghostwriter",
    label: "Ghostwriter d'Elite (Platino)",
    kind: "author",
    hint: "Brianna Wiest + Mark Manson. Densità materica e verità crude.",
    promptDirective: "Canalizza Brianna Wiest: verità universali, incipit su dettaglio fisico, metafore biologiche. Usa il grassetto per le frasi d'impatto."
  }
];
