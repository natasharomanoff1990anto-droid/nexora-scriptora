import { PLATINUM_CONSTRAINTS } from "./ai/language-killer-v2";

export interface WritingStylePreset {
  id: string;
  label: string;
  kind: "author" | "tone";
  hint: string;
  promptDirective: string;
}

export const UNIVERSAL_STYLES: WritingStylePreset[] = [
  {
    id: "auth-platinum-ghostwriter",
    label: "Ghostwriter d'Elite (Platino)",
    kind: "author",
    hint: "Brianna Wiest + Mark Manson. Densità materica e verità crude.",
    promptDirective: "Canalizza Brianna Wiest: verità universali, incipit su dettaglio fisico, metafore biologiche. Usa il grassetto per le frasi d'impatto."
  },
  {
    id: "tone-radical-honesty",
    label: "Schiettezza Radicale",
    kind: "tone",
    hint: "Stile Mark Manson: diretto, senza filtri, provocatorio.",
    promptDirective: "Usa un linguaggio diretto, elimina ogni eufemismo, sii provocatorio ma onesto."
  }
];

// 1. Ricerca per ID
export const findStylePresetById = (id: string): WritingStylePreset | undefined => {
  return UNIVERSAL_STYLES.find(s => s.id === id);
};

// 2. Ricerca per Label (Richiesto da generation.ts)
export const findStylePresetByLabel = (label: string): WritingStylePreset | undefined => {
  return UNIVERSAL_STYLES.find(s => s.label === label);
};

// 3. Fornisce gli stili per il menu a tendina
export const getStylesForGenre = (genre: string): WritingStylePreset[] => {
  return UNIVERSAL_STYLES;
};

// 4. Costruttore del blocco prompt
export const buildWritingStyleBlock = (authorStyleIdOrLabel: string, tone: string): string => {
  // Prova a cercare prima per ID, poi per Label
  const preset = findStylePresetById(authorStyleIdOrLabel) || findStylePresetByLabel(authorStyleIdOrLabel);
  const styleDirective = preset ? preset.promptDirective : authorStyleIdOrLabel;
  const isPlatinum = authorStyleIdOrLabel.toLowerCase().includes("platino");
  
  return `
### DIRETTIVA STILISTICA:
${styleDirective}
TONO RICHIESTO: ${tone}

${isPlatinum ? PLATINUM_CONSTRAINTS : ""}

REGOLE AGGIUNTIVE:
- Mostra, non raccontare.
- Evita avverbi inutili.
- Se lo stile è Platino, usa frasi secche e grassetti per le verità brutali.
`.trim();
};
